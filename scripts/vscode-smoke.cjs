const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vscode = require('vscode');

// Run only via --extensionTestsPath in an isolated VS Code profile, never node --test.
exports.run = async function () {
  const output = process.env.SPECIALSBOARD_SMOKE_OUTPUT;
  assert.ok(output, 'Set SPECIALSBOARD_SMOKE_OUTPUT to an artifact directory');
  const extension = vscode.extensions.getExtension('filipmares.theme-specialsboard');
  assert.ok(extension, 'The candidate theme extension must be installed');
  const manifest = extension.packageJSON;
  const report = { vscode: vscode.version, extension: manifest.version, variants: [], providers: {}, workflows: [] };
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  const config = vscode.workspace.getConfiguration();
  await vscode.extensions.getExtension('vscode.json-language-features').activate();
  await config.update('workbench.startupEditor', 'none', vscode.ConfigurationTarget.Global);
  await config.update('window.restoreWindows', 'none', vscode.ConfigurationTarget.Global);
  await config.update('telemetry.telemetryLevel', 'off', vscode.ConfigurationTarget.Global);
  await config.update('editor.minimap.enabled', true, vscode.ConfigurationTarget.Global);
  await config.update('editor.stickyScroll.enabled', true, vscode.ConfigurationTarget.Global);
  await config.update('editor.bracketPairColorization.enabled', true, vscode.ConfigurationTarget.Global);
  await config.update('editor.guides.bracketPairs', true, vscode.ConfigurationTarget.Global);
  await config.update('update.mode', 'none', vscode.ConfigurationTarget.Global);
  await config.update('extensions.autoUpdate', false, vscode.ConfigurationTarget.Global);
  const document = await vscode.workspace.openTextDocument({
    language: 'typescript',
    content: [
      '/** A local, provider-backed semantic and workbench sample. */',
      'interface Special { readonly name: string; price: number }',
      'const menu: Special = { name: "Soup", price: 12.5 };',
      'function label(item: Special, count: number): string {',
      '  return `${item.name}: ${item.price * count}`;',
      '}',
      'console.log(label(menu, 2));',
      'const broken: number = "Intentional diagnostic";',
      ''
    ].join('\n')
  });
  await vscode.window.showTextDocument(document);
  for (const theme of manifest.contributes.themes) {
    await config.update('workbench.colorTheme', theme.id, vscode.ConfigurationTarget.Global);
    await delay(500);
    assert.equal(vscode.workspace.getConfiguration('workbench').get('colorTheme'), theme.id);
    assert.equal(vscode.window.activeColorTheme.kind, vscode.ColorThemeKind.Dark);
    const expected = JSON.parse(fs.readFileSync(path.join(extension.extensionPath, theme.path), 'utf8'));
    const themeDocument = await vscode.workspace.openTextDocument(vscode.Uri.file(path.join(extension.extensionPath, theme.path)));
    await vscode.window.showTextDocument(themeDocument);
    await delay(1500);
    const schemaErrors = vscode.languages.getDiagnostics(themeDocument.uri).filter(diagnostic => diagnostic.severity <= vscode.DiagnosticSeverity.Warning);
    const legacyWarnings = theme.id === 'specials-board-legacy' ? schemaErrors.filter(diagnostic =>
      diagnostic.severity === vscode.DiagnosticSeverity.Warning
      && diagnostic.message === 'Token background colors are currently not supported.'
      && themeDocument.lineAt(diagnostic.range.start.line).text.includes('"background": "#a71e17"')
    ) : [];
    if (theme.id === 'specials-board-legacy') {
      assert.equal(legacyWarnings.length, 5, 'Only the five frozen Legacy token-background warnings are expected');
    }
    assert.deepEqual(schemaErrors.filter(diagnostic => !legacyWarnings.includes(diagnostic)).map(diagnostic => ({
      line: diagnostic.range.start.line + 1, message: diagnostic.message
    })), [], `${theme.id}: upstream color-theme schema`);
    await vscode.commands.executeCommand('workbench.action.generateColorTheme');
    const exported = vscode.window.activeTextEditor.document;
    const colorSection = exported.getText().split('"tokenColors"')[0];
    const rendered = Object.fromEntries([...colorSection.matchAll(/"([^"]+)"\s*:\s*"(#[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?)"/g)]
      .map(match => [match[1], match[2].toLowerCase()]));
    const unknown = Object.keys(expected.colors).filter(id => !Object.hasOwn(rendered, id));
    for (const [id, value] of Object.entries(expected.colors)) {
      if (Object.hasOwn(rendered, id)) assert.equal(rendered[id], value, `${theme.id}: resolved ${id}`);
    }
    report.variants.push({
      id: theme.id, kind: vscode.window.activeColorTheme.kind,
      colors: Object.keys(expected.colors).length, colorIds: Object.keys(expected.colors).sort(), unregisteredColors: unknown,
      legacyTokenBackgroundWarnings: legacyWarnings.length
    });
    await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor');
    await vscode.window.showTextDocument(document);
  }
  await config.update('workbench.colorTheme', 'specials-board', vscode.ConfigurationTarget.Global);
  await config.update('editor.semanticHighlighting.enabled', true, vscode.ConfigurationTarget.Global);
  await delay(1500);
  const legend = await vscode.commands.executeCommand('vscode.provideDocumentSemanticTokensLegend', document.uri);
  let semantic;
  for (let attempt = 0; attempt < 20; attempt++) {
    semantic = await vscode.commands.executeCommand('vscode.provideDocumentSemanticTokens', document.uri);
    if (semantic?.data?.length) break;
    await delay(500);
  }
  assert.ok(legend?.tokenTypes?.length && semantic?.data?.length, 'TypeScript semantic provider must produce tokens');
  const classifications = [];
  let line = 0;
  let character = 0;
  for (let i = 0; i < semantic.data.length; i += 5) {
    const [deltaLine, deltaCharacter, length, type, modifiers] = semantic.data.slice(i, i + 5);
    line += deltaLine;
    character = deltaLine ? deltaCharacter : character + deltaCharacter;
    classifications.push({
      text: document.getText(new vscode.Range(line, character, line, character + length)),
      type: legend.tokenTypes[type],
      modifiers: legend.tokenModifiers.filter((_, index) => modifiers & (1 << index))
    });
  }
  assert.ok(classifications.some(token => token.text === 'label' && token.type === 'function'));
  assert.ok(classifications.some(token => token.text === 'price' && token.type === 'property'));
  assert.ok(classifications.some(token => token.text === 'item' && token.type === 'parameter'));
  report.providers.semantic = classifications;
  report.providers.hover = (await vscode.commands.executeCommand('vscode.executeHoverProvider', document.uri, new vscode.Position(3, 10))).length;
  assert.ok(report.providers.hover, 'TypeScript hover must resolve');
  report.providers.completion = (await vscode.commands.executeCommand('vscode.executeCompletionItemProvider', document.uri, new vscode.Position(6, 8))).items.length;
  assert.ok(report.providers.completion, 'TypeScript completions must resolve');
  const signature = await vscode.commands.executeCommand('vscode.executeSignatureHelpProvider', document.uri, new vscode.Position(6, 23));
  report.providers.signatureHelp = signature?.signatures?.length ?? 0;
  assert.ok(report.providers.signatureHelp, 'TypeScript signature help must resolve');

  const diagnostics = vscode.languages.createDiagnosticCollection('specialsboard-smoke');
  diagnostics.set(document.uri, [
    new vscode.Diagnostic(new vscode.Range(7, 6, 7, 12), 'Intentional error state', vscode.DiagnosticSeverity.Error),
    new vscode.Diagnostic(new vscode.Range(2, 6, 2, 10), 'Intentional warning state', vscode.DiagnosticSeverity.Warning),
    new vscode.Diagnostic(new vscode.Range(3, 9, 3, 14), 'Intentional information state', vscode.DiagnosticSeverity.Information)
  ]);
  const controller = vscode.tests.createTestController('specialsboard-smoke', 'Theme state samples');
  const run = controller.createTestRun(new vscode.TestRunRequest());
  for (const [index, state] of ['passed', 'failed', 'skipped', 'errored', 'enqueued'].entries()) {
    const item = controller.createTestItem(state, `Example ${state}`, document.uri);
    item.range = new vscode.Range(index, 0, index, 1);
    controller.items.add(item);
    if (state === 'failed' || state === 'errored') run[state](item, new vscode.TestMessage(`Intentional ${state}`));
    else run[state](item);
  }
  run.end();
  report.workflows.push('testing: passed, failed, skipped, errored, queued');
  const comments = vscode.comments.createCommentController('specialsboard-smoke', 'Theme review');
  comments.createCommentThread(document.uri, new vscode.Range(3, 0, 3, 10), [{
    body: 'Review sample: keep semantic roles consistent.',
    mode: vscode.CommentMode.Preview,
    author: { name: 'Theme review fixture' }
  }]);
  report.workflows.push('review: comment thread', 'diagnostics: error, warning, information');
  const before = await vscode.workspace.openTextDocument({ language: 'typescript', content: 'const price = 10;\nconst label = "Soup";\n' });
  const after = await vscode.workspace.openTextDocument({ language: 'typescript', content: 'const price = 12;\nconst label = "Bread";\n' });
  await vscode.commands.executeCommand('vscode.diff', before.uri, after.uri, 'Specials Board diff fixture');
  await delay(500);
  report.workflows.push('diff: side-by-side line and word changes');
  const notebook = await vscode.workspace.openNotebookDocument(
    vscode.Uri.file(path.join(__dirname, '..', 'test files', 'modern', 'menu.ipynb'))
  );
  await vscode.window.showNotebookDocument(notebook);
  await delay(500);
  assert.equal(vscode.window.activeNotebookEditor.notebook.uri.toString(), notebook.uri.toString());
  report.workflows.push('notebook: markdown and code cell editor');
  const writer = new vscode.EventEmitter();
  const paletteTerminal = vscode.window.createTerminal({
    name: 'Specials Board ANSI',
    pty: {
      onDidWrite: writer.event,
      open() {
        writer.fire('Normal and bright ANSI slots\r\n');
        for (const start of [30, 90]) {
          writer.fire(Array.from({ length: 8 }, (_, i) => `\x1b[${start + i}m ${start + i} Sample \x1b[0m`).join('') + '\r\n');
        }
      },
      close() {}
    }
  });
  paletteTerminal.show(true);
  report.workflows.push('terminal: sixteen ANSI slots');
  await config.update('editor.semanticHighlighting.enabled', false, vscode.ConfigurationTarget.Global);
  await delay(500);
  report.semanticOff = vscode.workspace.getConfiguration('editor').get('semanticHighlighting.enabled') === false;
  await config.update('editor.semanticHighlighting.enabled', true, vscode.ConfigurationTarget.Global);
  await vscode.commands.executeCommand('workbench.action.problems.focus');
  fs.mkdirSync(output, { recursive: true });
  assert.ok(report.variants.every(variant => variant.unregisteredColors.length === 0),
    `Unregistered theme colors: ${JSON.stringify(report.variants.map(({ id, unregisteredColors }) => ({ id, unregisteredColors })))}`);
  report.success = true;
  fs.writeFileSync(path.join(output, 'live-report.json'), JSON.stringify(report, null, 2) + '\n');
  if (process.env.SPECIALSBOARD_SMOKE_HOLD === '1') {
    await vscode.window.showTextDocument(document);
    await new Promise(resolve => {
      const timer = setInterval(() => {
        if (fs.existsSync(path.join(output, 'finish'))) { clearInterval(timer); resolve(); }
      }, 500);
    });
  }
  diagnostics.dispose();
  controller.dispose();
  comments.dispose();
  paletteTerminal.dispose();
  writer.dispose();
};
