const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vscode = require('vscode');

const themeIds = ['specials-board', 'specials-board-classic', 'specials-board-contrast', 'specials-board-legacy', 'specials-board-light'];
const contrastId = 'specials-board-contrast';
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const sha256 = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const samePath = (a, b) => {
  const normalize = value => process.platform === 'win32' ? value.toLowerCase() : value;
  return normalize(fs.realpathSync(a)) === normalize(fs.realpathSync(b));
};

// The native exporter comments out inherited defaults and can leave trailing commas.
function parseJsonc(text) {
  const tokens = text.match(/"(?:\\.|[^"\\])*"|\/\/[^\r\n]*|\/\*[\s\S]*?\*\/|[^"/]+|[/"*]/g) ?? [];
  const uncommented = tokens.filter(token => !token.startsWith('//') && !token.startsWith('/*')).join('');
  const parts = uncommented.match(/"(?:\\.|[^"\\])*"|[^"]+/g) ?? [];
  return JSON.parse(parts.map(part => part.startsWith('"') ? part : part.replace(/,\s*(?=[}\]])/g, '')).join(''));
}

async function waitFor(read, message, timeout = 15000) {
  const deadline = Date.now() + timeout;
  do {
    const result = await read();
    if (result) return result;
    await delay(200);
  } while (Date.now() < deadline);
  assert.fail(message);
}

function packageFiles(root) {
  const files = [];
  function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      assert.ok(!entry.isSymbolicLink(), `Unexpected package symlink: ${file}`);
      if (entry.isDirectory()) visit(file);
      else files.push({ path: path.relative(root, file).split(path.sep).join('/'), sha256: sha256(file) });
    }
  }
  visit(root);
  return files.sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
}

function assertTokenRules(expected, exported) {
  const scopes = rule => (Array.isArray(rule.scope) ? rule.scope : [rule.scope]).join(',');
  const normalized = value => typeof value === 'string' && value.startsWith('#') ? value.toLowerCase() : value;
  for (const rule of expected) {
    assert.ok(exported.some(actual => scopes(actual) === scopes(rule)
      && Object.entries(rule.settings).every(([key, value]) => normalized(actual.settings?.[key]) === normalized(value))),
    `Missing exported TextMate rule: ${scopes(rule)}`);
  }
}

// Run via --extensionTestsPath, using the extracted VSIX as --extensionDevelopmentPath.
exports.run = async function () {
  const output = process.env.SPECIALSBOARD_SMOKE_OUTPUT;
  const contextFile = process.env.SPECIALSBOARD_SMOKE_CONTEXT;
  assert.ok(output && contextFile, 'Use run-vscode-smoke.ps1 or supply equivalent isolated run context');
  const context = JSON.parse(fs.readFileSync(contextFile, 'utf8'));
  const reportFile = path.join(output, 'live-report.json');
  assert.ok(samePath(output, context.output), 'Output must be the fresh runner-owned directory');
  assert.ok(!fs.existsSync(reportFile), 'Refusing to reuse a smoke report');
  const report = {
    runId: context.runId, startedAt: new Date().toISOString(), completedAt: null,
    vscode: vscode.version, expectedVSCode: context.version,
    candidateSha256: context.candidateSha256, harnessSha256: sha256(__filename),
    extensionPath: context.extensionPath, variants: [], providers: {}, workflows: [],
    semanticStates: [], commands: [], phase: 'running', success: false,
    observationBoundary: 'Extension-host API, provider responses, generated theme data and command requests only. No pixels, widget visibility, contrast perception or native visual review are certified by this report.',
    visualReview: { performedByHarness: false, required: true }
  };
  const disposables = [];
  const save = async () => {
    report.updatedAt = new Date().toISOString();
    const pending = `${reportFile}.pending`;
    fs.writeFileSync(pending, `${JSON.stringify(report, null, 2)}\n`);
    for (let attempt = 0; ; attempt++) {
      try {
        fs.renameSync(pending, reportFile);
        return;
      } catch (error) {
        if (!['EPERM', 'EBUSY', 'EACCES'].includes(error.code) || attempt === 19) throw error;
        if (attempt === 0) console.warn(`Report replacement temporarily locked (${error.code}); retrying for at most one second.`);
        await delay(50);
      }
    }
  };
  const config = vscode.workspace.getConfiguration();
  async function command(id, ...args) {
    // Public API aliases are extension-host-local and absent from getCommands().
    const result = await vscode.commands.executeCommand(id, ...args);
    report.commands.push({ id, at: new Date().toISOString() });
    return result;
  }
  function contrast() {
    assert.equal(vscode.workspace.getConfiguration('workbench').get('colorTheme'), contrastId);
    assert.equal(vscode.window.activeColorTheme.kind, vscode.ColorThemeKind.Dark);
  }
  async function record(state, evidence) {
    contrast();
    const entry = { state, theme: contrastId, at: new Date().toISOString(), evidence, visuallyInspected: false };
    report.workflows.push(entry);
    report.currentState = state;
    await save();
    return entry;
  }
  async function exportTheme(name) {
    await command('workbench.action.generateColorTheme');
    const editor = await waitFor(() => vscode.window.activeTextEditor?.document.languageId === 'jsonc'
      && vscode.window.activeTextEditor, 'Native generated color-theme editor did not open');
    const text = editor.document.getText();
    const data = parseJsonc(text);
    assert.ok(data.colors && Array.isArray(data.tokenColors), 'Invalid native theme export');
    const file = path.join(output, `${name}.jsonc`);
    fs.writeFileSync(file, text);
    await command('workbench.action.revertAndCloseActiveEditor');
    return { file: path.basename(file), sha256: sha256(file), data };
  }

  try {
    assert.ok(['1.101.0', '1.136.2'].includes(context.version), 'Only the two pinned native hosts are supported');
    assert.equal(vscode.version, context.version, 'Wrong native VS Code version');
    assert.ok(Date.now() - Date.parse(context.startedAt) < 10 * 60 * 1000, 'Stale launch context');
    assert.ok(Date.parse(context.startedAt) <= Date.now(), 'Launch context is in the future');
    assert.equal(sha256(context.candidateVSIX), context.candidateSha256, 'Candidate VSIX changed');
    assert.equal(report.harnessSha256, context.harnessSha256, 'Harness changed after runner preparation');
    const extension = vscode.extensions.getExtension('filipmares.theme-specialsboard');
    assert.ok(extension, 'The exact extracted candidate must be loaded as a development extension');
    assert.ok(samePath(extension.extensionPath, context.extensionPath), 'Not running the extracted candidate');
    assert.deepEqual(packageFiles(extension.extensionPath), context.packageFiles, 'Extracted candidate files changed');
    const manifest = extension.packageJSON;
    report.extension = manifest.version;
    assert.equal(manifest.version, context.extensionVersion);
    assert.deepEqual(manifest.contributes.themes.map(theme => theme.id).sort(), [...themeIds].sort());
    const hostPackage = JSON.parse(fs.readFileSync(path.join(vscode.env.appRoot, 'package.json'), 'utf8'));
    const hostProduct = JSON.parse(fs.readFileSync(path.join(vscode.env.appRoot, 'product.json'), 'utf8'));
    assert.equal(hostPackage.version, context.version);
    assert.equal(hostProduct.commit, context.commit, 'Wrong native VS Code build commit');
    assert.ok(samePath(vscode.env.appRoot, context.appRoot), 'Host is outside the isolated portable build');
    assert.equal(config.get('update.mode'), 'none', 'Host updates must be disabled before launch');
    assert.equal(config.get('extensions.autoUpdate'), false, 'Extension updates must be disabled before launch');
    assert.equal(config.get('extensions.autoCheckUpdates'), false);
    report.isolation = { appRoot: vscode.env.appRoot, commit: hostProduct.commit, profile: context.profile,
      userData: context.userData, extensions: context.extensions, prelaunchSettingsSha256: context.settingsSha256 };

    await vscode.extensions.getExtension('vscode.json-language-features').activate();
    await vscode.extensions.getExtension('vscode.typescript-language-features').activate();
    for (const [key, value] of Object.entries({
      'editor.minimap.enabled': true, 'editor.stickyScroll.enabled': true,
      'editor.bracketPairColorization.enabled': true, 'editor.guides.bracketPairs': true,
      'editor.renderLineHighlight': 'all', 'editor.renderLineHighlightOnlyWhenFocus': false,
      'editor.occurrencesHighlight': 'singleFile', 'editor.selectionHighlight': true,
      'editor.showUnused': true, 'editor.showDeprecated': true, 'editor.glyphMargin': true,
      'editor.quickSuggestions': false, 'editor.inlineSuggest.enabled': true,
      'diffEditor.renderSideBySide': true, 'diffEditor.renderIndicators': true,
      'diffEditor.hideUnchangedRegions.enabled': false, 'mergeEditor.showDeletionMarkers': true,
      'workbench.colorCustomizations': {}, 'editor.tokenColorCustomizations': {},
      'editor.semanticTokenColorCustomizations': {}, 'workbench.editor.enablePreview': false
    })) await config.update(key, value, vscode.ConfigurationTarget.Global);

    const fixtureRoot = path.join(output, 'fixtures');
    fs.mkdirSync(fixtureRoot);
    async function fixture(name, text) {
      const file = path.join(fixtureRoot, name);
      if (name.endsWith('.ts') && !/^export \{\};$/m.test(text)) text += '\nexport {};\n';
      fs.writeFileSync(file, text);
      return vscode.workspace.openTextDocument(vscode.Uri.file(file));
    }
    const document = await fixture('menu.ts', [
      '/** A local, provider-backed semantic and workbench sample. */',
      'interface Special { readonly name: string; price: number }',
      'const menu: Special = { name: "Soup", price: 12.5 };',
      'function label(item: Special, count: number): string {',
      '  return `${item.name}: ${item.price * count}`;',
      '}',
      'console.log(label(menu, 2));',
      'const broken: number = "Intentional diagnostic";',
      'const unused = "Unnecessary code fixture";',
      '/** @deprecated Use label instead. */',
      'function oldLabel(): string { return "Deprecated"; }',
      'oldLabel();',
      ''
    ].join('\n'));
    await vscode.window.showTextDocument(document);
    for (const theme of manifest.contributes.themes) {
      await config.update('workbench.colorTheme', theme.id, vscode.ConfigurationTarget.Global);
      await delay(700);
      assert.equal(vscode.workspace.getConfiguration('workbench').get('colorTheme'), theme.id);
      assert.equal(vscode.window.activeColorTheme.kind,
        theme.uiTheme === 'vs' ? vscode.ColorThemeKind.Light : vscode.ColorThemeKind.Dark);
      const themePath = path.resolve(extension.extensionPath, theme.path);
      const expected = JSON.parse(fs.readFileSync(themePath, 'utf8'));
      const themeDocument = await vscode.workspace.openTextDocument(vscode.Uri.file(themePath));
      await vscode.window.showTextDocument(themeDocument);
      await delay(2000);
      const schemaErrors = vscode.languages.getDiagnostics(themeDocument.uri)
        .filter(diagnostic => diagnostic.severity <= vscode.DiagnosticSeverity.Warning);
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
      const exported = await exportTheme(theme.id);
      const rendered = exported.data.colors;
      const unknown = Object.keys(expected.colors).filter(id => !Object.hasOwn(rendered, id));
      for (const [id, value] of Object.entries(expected.colors)) {
        if (Object.hasOwn(rendered, id)) assert.equal(rendered[id].toLowerCase(), value.toLowerCase(),
          `${theme.id}: resolved ${id}`);
      }
      report.variants.push({
        id: theme.id, kind: vscode.window.activeColorTheme.kind, themeSha256: sha256(themePath),
        colors: Object.keys(expected.colors).length, colorIds: Object.keys(expected.colors).sort(),
        unregisteredColors: unknown, legacyTokenBackgroundWarnings: legacyWarnings.length,
        export: { file: exported.file, sha256: exported.sha256 }
      });
      await vscode.window.showTextDocument(document);
    }
    assert.ok(report.variants.every(variant => variant.unregisteredColors.length === 0),
      `Unregistered theme colors: ${JSON.stringify(report.variants.map(({ id, unregisteredColors }) => ({ id, unregisteredColors })))}`);

    await config.update('workbench.colorTheme', contrastId, vscode.ConfigurationTarget.Global);
    await delay(700);
    const contrastTheme = JSON.parse(fs.readFileSync(path.resolve(extension.extensionPath,
      manifest.contributes.themes.find(theme => theme.id === contrastId).path), 'utf8'));
    const candidateSemanticRules = contrastTheme.semanticTokenColors;
    assert.equal(contrastTheme.semanticHighlighting, true);
    assert.ok(candidateSemanticRules && Object.keys(candidateSemanticRules).length, 'Contrast must supply semantic rules');
    const textRules = [];
    async function semanticState(enabled) {
      contrast();
      await config.update('editor.semanticHighlighting.enabled', enabled, vscode.ConfigurationTarget.Global);
      await vscode.window.showTextDocument(document);
      await delay(800);
      assert.equal(vscode.workspace.getConfiguration('editor', document.uri).get('semanticHighlighting.enabled'), enabled);
      const legend = await waitFor(async () => {
        const value = await command('vscode.provideDocumentSemanticTokensLegend', document.uri);
        return value?.tokenTypes?.length && value;
      }, 'TypeScript semantic legend unavailable');
      const semantic = await waitFor(async () => {
        const value = await command('vscode.provideDocumentSemanticTokens', document.uri);
        return value?.data?.length && value;
      }, `TypeScript semantic provider unavailable with semantic highlighting ${enabled}`);
      const classifications = [];
      let line = 0;
      let character = 0;
      assert.equal(semantic.data.length % 5, 0);
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
      for (const [text, type] of [['label', 'function'], ['price', 'property'], ['item', 'parameter']]) {
        assert.ok(classifications.some(token => token.text === text && token.type === type), `Missing ${type} token`);
        assert.ok(candidateSemanticRules[type], `Missing candidate semantic rule: ${type}`);
      }
      const exported = await exportTheme(`contrast-semantic-${enabled ? 'on' : 'off'}-${report.semanticStates.length}`);
      assertTokenRules(contrastTheme.tokenColors, exported.data.tokenColors);
      textRules.push(exported.data.tokenColors);
      if (textRules.length > 1) assert.deepEqual(textRules.at(-1), textRules[0], 'TextMate fallback rules changed across semantic toggles');
      const evidence = {
        enabled, providerAvailable: true, classifications, candidateSemanticRules,
        exportedTextMateRules: exported.data.tokenColors,
        exportedSemanticRules: exported.data.semanticTokenColors ?? null,
        export: { file: exported.file, sha256: exported.sha256 },
        boundary: 'Provider output is explicitly requested in BOTH modes; it remains available when display is disabled. Exported TextMate rules prove fallback data availability, not tokenization or painted colors. The native exporter may omit semantic rules; candidate rules are source data, not resolved semantic pixels.'
      };
      report.semanticStates.push(evidence);
      report.providers.semantic = classifications;
      await vscode.window.showTextDocument(document);
      return evidence;
    }

    const diagnostics = vscode.languages.createDiagnosticCollection('specialsboard-smoke');
    disposables.push(diagnostics);
    const diagnosticFixtures = [
      [7, 6, 12, 'Intentional error state', 'SB-ERROR', vscode.DiagnosticSeverity.Error],
      [2, 6, 10, 'Intentional warning state', 'SB-WARNING', vscode.DiagnosticSeverity.Warning],
      [3, 9, 14, 'Intentional information state', 'SB-INFO', vscode.DiagnosticSeverity.Information],
      [8, 6, 12, 'Unnecessary code state', 'SB-UNUSED', vscode.DiagnosticSeverity.Hint, vscode.DiagnosticTag.Unnecessary],
      [11, 0, 8, 'Deprecated API state', 'SB-DEPRECATED', vscode.DiagnosticSeverity.Hint, vscode.DiagnosticTag.Deprecated]
    ].map(([line, start, end, message, code, severity, tag]) => {
      const diagnostic = new vscode.Diagnostic(new vscode.Range(line, start, line, end), message, severity);
      diagnostic.source = 'Specials Board fixture';
      diagnostic.code = code;
      if (tag !== undefined) diagnostic.tags = [tag];
      return diagnostic;
    });
    diagnostics.set(document.uri, diagnosticFixtures);
    assert.equal(diagnostics.get(document.uri).length, diagnosticFixtures.length);
    report.nonColorMechanisms = {
      diagnostics: diagnosticFixtures.map(({ message, code, severity, tags }) => ({ message, code, severity, tags })),
      boundary: 'Diagnostic severity, explicit labels/codes and Unnecessary/Deprecated tags are registered API data. Native squiggles, severity icons, strike-through and border visibility require direct visual inspection.'
    };
    const controller = vscode.tests.createTestController('specialsboard-smoke', 'Theme state samples');
    disposables.push(controller);
    const testRun = controller.createTestRun(new vscode.TestRunRequest());
    for (const [index, state] of ['passed', 'failed', 'skipped', 'errored', 'enqueued'].entries()) {
      const item = controller.createTestItem(state, `Example ${state}`, document.uri);
      item.range = new vscode.Range(index, 0, index, 1);
      controller.items.add(item);
      if (state === 'failed' || state === 'errored') testRun[state](item, new vscode.TestMessage(`Intentional ${state}`));
      else testRun[state](item);
    }
    testRun.end();
    const comments = vscode.comments.createCommentController('specialsboard-smoke', 'Theme review');
    disposables.push(comments);
    const thread = comments.createCommentThread(document.uri, new vscode.Range(3, 0, 3, 10), [{
      body: 'Review fixture: keep semantic roles consistent; this comment is unresolved.',
      mode: vscode.CommentMode.Preview, author: { name: 'Theme review fixture' }
    }]);
    thread.label = 'Unresolved theme review';
    thread.state = vscode.CommentThreadState.Unresolved;
    thread.collapsibleState = vscode.CommentThreadCollapsibleState.Expanded;

    const before = await fixture('diff-before.ts', 'const price = 10;\nconst label = "Soup";\nconst removed = true;\n');
    const after = await fixture('diff-after.ts', 'const price = 12;\nconst label = "Bread";\nconst added = "New dish";\n');
    const base = await fixture('merge-base.ts', 'const price = 10;\nconst label = "Soup";\n');
    const input1 = await fixture('merge-current.ts', 'const price = 12;\nconst label = "Soup";\n');
    const input2 = await fixture('merge-incoming.ts', 'const price = 14;\nconst label = "Soup";\n');
    const result = await fixture('merge-result.ts', base.getText());
    const scm = vscode.scm.createSourceControl('specialsboard-smoke', 'Theme SCM states', vscode.Uri.file(fixtureRoot));
    disposables.push(scm);
    scm.inputBox.visible = false;
    const changes = scm.createResourceGroup('changes', 'Labeled change states');
    changes.resourceStates = await Promise.all([
      ['added', 'A', 'diff-added', 'addedResourceForeground'],
      ['deleted', 'D', 'diff-removed', 'deletedResourceForeground'],
      ['modified', 'M', 'diff-modified', 'modifiedResourceForeground'],
      ['conflicting', 'U', 'warning', 'conflictingResourceForeground']
    ].map(async ([state, label, icon, color]) => {
      const file = await fixture(`scm-${label}-${state}.ts`, `// ${label}: ${state} fixture\n`);
      return { resourceUri: file.uri, decorations: {
        tooltip: `${label}: ${state}`, strikeThrough: state === 'deleted',
        iconPath: new vscode.ThemeIcon(icon, new vscode.ThemeColor(`gitDecoration.${color}`))
      } };
    }));
    const notebookPath = path.join(fixtureRoot, 'menu.ipynb');
    fs.writeFileSync(notebookPath, JSON.stringify({
      cells: [
        { cell_type: 'markdown', id: 'menu-title', metadata: {}, source: ['# Garden menu\n', '**Notebook markdown** and `inline code`.\n'] },
        { cell_type: 'code', id: 'menu-code', metadata: {}, execution_count: null, outputs: [],
          source: ['const menu = { name: "Soup", price: 12.5 };\n', 'menu.price;\n'] }
      ], metadata: { language_info: { name: 'typescript' } }, nbformat: 4, nbformat_minor: 5
    }, null, 2));
    const notebook = await vscode.workspace.openNotebookDocument(vscode.Uri.file(notebookPath));
    assert.deepEqual(notebook.getCells().map(cell => cell.kind), [vscode.NotebookCellKind.Markup, vscode.NotebookCellKind.Code]);
    const writer = new vscode.EventEmitter();
    disposables.push(writer);
    const ansi = ['Normal and bright ANSI slots; each has its numeric label\r\n',
      ...[30, 90].map(start => Array.from({ length: 8 }, (_, i) => `\x1b[${start + i}m ${start + i} Sample \x1b[0m`).join('') + '\r\n')].join('');
    let terminalOpened = false;
    const terminal = vscode.window.createTerminal({
      name: 'Specials Board ANSI',
      pty: { onDidWrite: writer.event, open() { terminalOpened = true; writer.fire(ansi); }, close() {} }
    });
    disposables.push(terminal);
    const ghost = await fixture('ghost.txt', 'Deterministic local inline completion\nOffer: ');
    const ghostText = 'Garden soup - local fixture';
    const inlineRequests = [];
    disposables.push(vscode.languages.registerInlineCompletionItemProvider({ language: 'plaintext', scheme: 'file' }, {
      provideInlineCompletionItems(doc, position, inlineContext, cancellation) {
        if (doc.uri.toString() !== ghost.uri.toString() || cancellation.isCancellationRequested
          || position.line !== 1 || doc.lineAt(1).text !== 'Offer: ' || position.character !== 7) return [];
        inlineRequests.push({ uri: doc.uri.toString(), position, triggerKind: inlineContext.triggerKind,
          text: ghostText, at: new Date().toISOString() });
        return [new vscode.InlineCompletionItem(ghostText, new vscode.Range(position, position))];
      }
    }));
    report.providers.inline = { implementation: 'Public registerInlineCompletionItemProvider; deterministic local text; no external service',
      requests: inlineRequests, acceptedThroughEditor: false, pixelsInspected: false };

    async function sourceAt(line, start, end = start) {
      terminal.hide();
      await command('closeFindWidget');
      await command('hideSuggestWidget');
      await command('editor.action.inlineSuggest.hide');
      const editor = await vscode.window.showTextDocument(document, { preview: false });
      editor.selection = new vscode.Selection(line, start, line, end);
      editor.revealRange(editor.selection, vscode.TextEditorRevealType.InCenterIfOutsideViewport);
      return editor;
    }
    const rangeData = range => ({ start: [range.start.line, range.start.character], end: [range.end.line, range.end.character] });
    const states = {
      'semantic-on': () => semanticState(true),
      'semantic-off': () => semanticState(false),
      selection: async () => {
        const editor = await sourceAt(2, 6, 10);
        return { selection: rangeData(editor.selection), selectedText: document.getText(editor.selection),
          boundary: 'Selection read back from editor API; selection paint requires visual review.' };
      },
      'inactive-selection': async () => {
        const evidence = await states.selection();
        await command('workbench.action.problems.focus');
        return { ...evidence, focusRequested: 'Problems panel', boundary: 'Editor selection retained; panel focus requested, inactive-selection pixels not observed.' };
      },
      find: async () => {
        await sourceAt(2, 0);
        const matches = [...document.getText().matchAll(/price/g)].map(match => rangeData(new vscode.Range(
          document.positionAt(match.index), document.positionAt(match.index + 5))));
        assert.ok(matches.length >= 3);
        await command('editor.actions.findWithArgs', { searchString: 'price', isRegex: false, isCaseSensitive: true, matchWholeWord: true });
        return { searchString: 'price', sourceMatches: matches, boundary: 'Native find command requested; source matches are not find-widget or highlight observations.' };
      },
      line: async () => {
        const editor = await sourceAt(4, 2);
        assert.ok(editor.selection.isEmpty);
        return { cursor: rangeData(editor.selection), renderLineHighlight: config.get('editor.renderLineHighlight'),
          boundary: 'Cursor and highlight configuration observed, not the painted line border.' };
      },
      word: async () => {
        await sourceAt(2, 7);
        const highlights = await waitFor(async () => {
          const value = await command('vscode.executeDocumentHighlights', document.uri, new vscode.Position(2, 7));
          return value?.length >= 2 && value;
        }, 'TypeScript document highlight provider must resolve repeated menu references');
        return { highlights: highlights.map(item => ({ range: rangeData(item.range), kind: item.kind })),
          boundary: 'Provider highlight ranges/kinds observed; editor occurrence paint not inspected.' };
      },
      suggestion: async () => {
        await sourceAt(6, 8);
        const completion = await command('vscode.executeCompletionItemProvider', document.uri, new vscode.Position(6, 8));
        assert.ok(completion?.items?.length, 'TypeScript completions must resolve');
        report.providers.completion = completion.items.length;
        await command('editor.action.triggerSuggest');
        return { count: completion.items.length, samples: completion.items.slice(0, 12).map(item => ({
          label: item.label, kind: item.kind, detail: item.detail
        })), boundary: 'Completion labels, details and kinds (native type/icon inputs) observed; suggest widget rendering requires review.' };
      },
      hover: async () => {
        await sourceAt(3, 10);
        const hovers = await command('vscode.executeHoverProvider', document.uri, new vscode.Position(3, 10));
        assert.ok(hovers?.length, 'TypeScript hover must resolve');
        report.providers.hover = hovers.length;
        await command('editor.action.showHover');
        return { count: hovers.length, contents: hovers.map(hover => hover.contents),
          boundary: 'Hover provider content observed and native hover requested; visibility and text styling not inspected.' };
      },
      signature: async () => {
        await sourceAt(6, 23);
        const signature = await command('vscode.executeSignatureHelpProvider', document.uri, new vscode.Position(6, 23));
        assert.ok(signature?.signatures?.length, 'TypeScript signature help must resolve');
        report.providers.signatureHelp = signature.signatures.length;
        await command('editor.action.triggerParameterHints');
        return { signatures: signature.signatures, boundary: 'Provider signature/type text observed; parameter-hints widget requested, not visually inspected.' };
      },
      ghost: async () => {
        await sourceAt(0, 0);
        const editor = await vscode.window.showTextDocument(ghost, { preview: false });
        if (ghost.lineAt(1).text !== 'Offer: ') {
          assert.ok(await editor.edit(edit => edit.replace(ghost.lineAt(1).range, 'Offer: ')));
        }
        editor.selection = new vscode.Selection(1, 7, 1, 7);
        const requestsBefore = inlineRequests.length;
        await command('editor.action.inlineSuggest.trigger');
        await waitFor(() => inlineRequests.length > requestsBefore, 'Native inline trigger did not call the fixture provider');
        await delay(700);
        return { request: inlineRequests.at(-1), boundary: 'Native editor invoked the public local provider. Ghost-text paint still requires visual inspection.' };
      },
      'ghost-accepted': async () => {
        await states.ghost();
        await command('editor.action.inlineSuggest.commit');
        await waitFor(() => ghost.lineAt(1).text === `Offer: ${ghostText}`, 'Native inline completion was not accepted into the editor');
        report.providers.inline.acceptedThroughEditor = true;
        return { text: ghost.lineAt(1).text, boundary: 'Real editor acceptance verified from document content; not a pixel-color assertion.' };
      },
      diagnostics: async () => {
        await sourceAt(7, 6, 12);
        await command('workbench.action.problems.focus');
        return report.nonColorMechanisms;
      },
      testing: async () => {
        await sourceAt(0, 0);
        await command('workbench.view.testing.focus');
        return { states: ['passed', 'failed', 'skipped', 'errored', 'enqueued'],
          boundary: 'Test-controller states and explicit labels supplied; native state icons require visual review.' };
      },
      scm: async () => {
        await sourceAt(0, 0);
        await command('workbench.view.scm');
        return {
          states: changes.resourceStates.map(resource => ({ uri: resource.resourceUri.toString(), tooltip: resource.decorations.tooltip })),
          boundary: 'Public SCM resource states include textual A/D/M/U labels and distinct native icons; this synthetic provider does not alter a Git repository. Visual inspection is separate.'
        };
      },
      review: async () => {
        await sourceAt(3, 0, 10);
        thread.collapsibleState = vscode.CommentThreadCollapsibleState.Expanded;
        return { range: rangeData(thread.range), label: thread.label, state: thread.state, comments: thread.comments.length,
          boundary: 'Expanded unresolved comment model registered; actual thread/glyph visibility requires visual review.' };
      },
      diff: async () => {
        await sourceAt(0, 0);
        await command('vscode.diff', before.uri, after.uri, 'Specials Board Contrast diff fixture');
        const tab = await waitFor(() => vscode.window.tabGroups.all.flatMap(group => group.tabs)
          .find(tab => tab.isActive && tab.input instanceof vscode.TabInputTextDiff
            && tab.input.original.toString() === before.uri.toString() && tab.input.modified.toString() === after.uri.toString()),
        'Native diff tab did not open the exact fixture pair');
        return { tab: tab.label, before: before.getText(), after: after.getText(), renderSideBySide: true,
          boundary: 'Native diff tab and line/word input changes verified. Diff decorations and added/deleted indicator shapes not inspected.' };
      },
      merge: async () => {
        await sourceAt(0, 0);
        await command('_open.mergeEditor', {
          base: base.uri, input1: { uri: input1.uri, title: 'Current: 12', description: 'Current input' },
          input2: { uri: input2.uri, title: 'Incoming: 14', description: 'Incoming input' }, output: result.uri
        });
        await waitFor(() => vscode.window.tabGroups.all.flatMap(group => group.tabs)
          .some(tab => tab.isActive && tab.label.includes('merge-result')), 'Native merge result tab did not open');
        await delay(1000);
        return { command: '_open.mergeEditor', base: base.uri.toString(), current: input1.uri.toString(),
          incoming: input2.uri.toString(), output: result.uri.toString(),
          visibleEditorUris: vscode.window.visibleTextEditors.map(editor => editor.document.uri.toString()),
          boundary: 'Version-specific internal native merge command and result tab observed. VS Code 1.101 has no public merge-tab model; conflict controls, selected/current/incoming paint and resolution behavior require visual review.' };
      },
      notebook: async () => {
        await sourceAt(0, 0);
        const editor = await vscode.window.showNotebookDocument(notebook);
        editor.selections = [new vscode.NotebookRange(1, 2)];
        await waitFor(() => vscode.window.activeNotebookEditor?.notebook.uri.toString() === notebook.uri.toString(),
          'Native notebook editor did not activate');
        return { uri: notebook.uri.toString(), cells: notebook.getCells().map(cell => ({
          kind: cell.kind, language: cell.document.languageId, text: cell.document.getText()
        })), selectedCell: 1, boundary: 'Active notebook, cell kinds and selection observed; cell rendering uninspected. No kernel execution or output claim.' };
      },
      terminal: async () => {
        await sourceAt(0, 0);
        terminal.show(false);
        await waitFor(() => terminalOpened, 'Native pseudo-terminal did not open');
        return { name: terminal.name, ansiPayload: ansi, slots: [...Array(8).keys()].flatMap(i => [30 + i, 90 + i]).sort((a, b) => a - b),
          boundary: 'PTY opened and sixteen labeled ANSI escape sequences emitted; terminal pixels not inspected.' };
      }
    };
    async function showState(state) {
      assert.ok(Object.hasOwn(states, state), `Unknown smoke state: ${state}`);
      contrast();
      const evidence = await states[state]();
      await delay(400);
      return record(state, evidence);
    }
    for (const state of ['semantic-on', 'semantic-off', 'semantic-on', 'selection', 'inactive-selection', 'find',
      'line', 'word', 'suggestion', 'hover', 'signature', 'ghost-accepted', 'ghost', 'diagnostics',
      'testing', 'scm', 'review', 'diff', 'merge', 'notebook', 'terminal']) await showState(state);
    assert.ok(report.semanticStates.some(state => !state.enabled && state.providerAvailable));
    report.semanticOff = true;
    assert.deepEqual(packageFiles(extension.extensionPath), context.packageFiles, 'Candidate package mutated during workflows');
    report.success = true;

    if (process.env.SPECIALSBOARD_SMOKE_HOLD === '1') {
      await showState('diagnostics');
      report.phase = 'holding';
      report.hold = {
        commands: [...Object.keys(states), 'finish'], commandFile: path.join(output, 'command.json'),
        resultFile: path.join(output, 'command-result.json'), finishFile: path.join(output, 'finish'),
        protocol: 'Write {runId,id,state} atomically to command.json; use a new id each time. Await matching command-result.json. Alternatively write the runId as the entire finish file. State preparation is not a visual-review attestation.'
      };
      await save();
      const holdSeconds = Number(process.env.SPECIALSBOARD_SMOKE_HOLD_SECONDS || 3600);
      assert.ok(Number.isInteger(holdSeconds) && holdSeconds >= 60 && holdSeconds <= 14400, 'Hold must be bounded to 60-14400 seconds');
      const deadline = Date.now() + holdSeconds * 1000;
      const processed = new Set();
      let finished = false;
      while (Date.now() < deadline) {
        if (fs.existsSync(report.hold.finishFile)
          && fs.readFileSync(report.hold.finishFile, 'utf8').trim() === context.runId) { finished = true; break; }
        if (fs.existsSync(report.hold.commandFile)) {
          const request = JSON.parse(fs.readFileSync(report.hold.commandFile, 'utf8'));
          if (request && typeof request.id === 'string' && !processed.has(request.id)) {
            processed.add(request.id);
            const response = { runId: context.runId, id: request.id, state: request.state, success: false };
            try {
              assert.equal(request.runId, context.runId, 'Command belongs to another run');
              assert.match(request.id, /^[\w-]{1,80}$/);
              if (request.state === 'finish') finished = true;
              else response.observation = await showState(request.state);
              response.success = true;
            } catch (error) { response.error = error.stack ?? String(error); }
            response.at = new Date().toISOString();
            fs.writeFileSync(`${report.hold.resultFile}.pending`, `${JSON.stringify(response, null, 2)}\n`);
            fs.renameSync(`${report.hold.resultFile}.pending`, report.hold.resultFile);
            if (finished) break;
          }
        }
        await delay(250);
      }
      assert.ok(finished, 'Hold deadline elapsed without a finish request; no completed review is inferred');
    }
    assert.equal(sha256(context.candidateVSIX), context.candidateSha256);
    assert.deepEqual(packageFiles(extension.extensionPath), context.packageFiles, 'Candidate package changed while held');
    report.phase = 'complete';
    report.completedAt = new Date().toISOString();
    await save();
  } catch (error) {
    report.success = false;
    report.phase = 'failed';
    report.completedAt = new Date().toISOString();
    report.error = error.stack ?? String(error);
    await save();
    throw error;
  } finally {
    for (const disposable of disposables.reverse()) disposable.dispose();
  }
};
