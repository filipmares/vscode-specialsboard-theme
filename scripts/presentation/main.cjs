const vscode = require('vscode');
const path = require('node:path');
const fs = require('node:fs');

const scenes = [
  'flagship-workbench', 'flagship-tsx', 'flagship-web', 'classic-python',
  'contrast-systems', 'flagship-content', 'contrast-review', 'contrast-merge', 'legacy-code',
  'light-workbench', 'light-web', 'light-python', 'light-content'
];

exports.activate = function (context) {
  let terminal;
  let comments;
  let status;
  const root = vscode.workspace.workspaceFolders[0].uri;
  const uri = name => vscode.Uri.joinPath(root, name);
  const command = (id, ...args) => vscode.commands.executeCommand(id, ...args);
  const config = vscode.workspace.getConfiguration();
  async function open(name, column = vscode.ViewColumn.One) {
    const document = await vscode.workspace.openTextDocument(uri(name));
    return vscode.window.showTextDocument(document, { viewColumn: column, preview: false });
  }
  context.subscriptions.push(vscode.commands.registerCommand('specialsboard.capture', async () => {
    if (path.basename(root.fsPath) !== 'Garden menu'
      || !fs.existsSync(path.join(root.fsPath, '..', 'capture-context.json'))) {
      throw new Error('Use prepare-presentation.ps1 and its isolated Garden menu workspace; never run this in a normal editor profile.');
    }
    const scene = await vscode.window.showQuickPick(scenes, { title: 'Reproducible visual fixture' });
    if (!scene) return;
    for (const previous of vscode.window.terminals) previous.dispose();
    comments?.dispose();
    status?.dispose();
    await command('workbench.action.closeAllEditors');
    await command('workbench.action.closePanel');
    await command('workbench.action.closeSidebar');
    await command('workbench.action.closeAuxiliaryBar');
    await command('workbench.action.editorLayoutSingle');
    const variant = scene.split('-')[0];
    const id = variant === 'flagship' ? 'specials-board' : `specials-board-${variant}`;
    await config.update('terminal.integrated.enablePersistentSessions', false, vscode.ConfigurationTarget.Global);
    await config.update('workbench.colorTheme', id, vscode.ConfigurationTarget.Global);
    const split = ['flagship-web', 'classic-python', 'contrast-systems', 'flagship-content', 'contrast-review', 'contrast-merge',
      'light-web', 'light-python', 'light-content'].includes(scene);
    await config.update('editor.fontSize', split ? 18 : 20, vscode.ConfigurationTarget.Global);
    await config.update('editor.lineHeight', split ? 27 : 29, vscode.ConfigurationTarget.Global);
    await config.update('editor.wordWrap', split ? 'on' : 'off', vscode.ConfigurationTarget.Global);
    if (scene === 'flagship-workbench' || scene === 'light-workbench') {
      await open('menu.ts');
      await command('workbench.view.explorer');
      const write = new vscode.EventEmitter();
      context.subscriptions.push(write);
      terminal = vscode.window.createTerminal({
        name: 'ANSI color fixture',
        pty: {
          onDidWrite: write.event,
          open() {
            write.fire('Integrated terminal - deterministic ANSI sample (not a build log)\r\n\r\n');
            for (const [start, label] of [[30, 'Normal'], [90, 'Bright']]) {
              write.fire(`${label}  `);
              for (let slot = 0; slot < 8; slot++) {
                write.fire(`\x1b[${start + slot}m${['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'][slot].padEnd(10)}\x1b[0m`);
              }
              write.fire('\r\n');
            }
            write.fire('\r\nGarden menu  |  Soup 12.50  |  Salad 10.00\r\n');
          },
          close() {}
        }
      });
      terminal.show(true);
    } else if (scene === 'flagship-tsx') {
      await open('board.tsx');
    } else if (scene === 'flagship-web' || scene === 'light-web') {
      await open('index.html');
      await open('menu.css', vscode.ViewColumn.Beside);
    } else if (scene === 'classic-python' || scene === 'light-python') {
      await open('python.py');
      await open('regex.js', vscode.ViewColumn.Beside);
    } else if (scene === 'contrast-systems') {
      await open('menu.rs');
      await open('menu.go', vscode.ViewColumn.Beside);
    } else if (scene === 'flagship-content' || scene === 'light-content') {
      await open('menu.md');
      await open('menu.jsonc', vscode.ViewColumn.Beside);
    } else if (scene === 'contrast-review') {
      await command('vscode.diff', uri('menu.before.json'), uri('menu.after.json'), 'Menu review - original / modified');
      comments = vscode.comments.createCommentController('specialsboard-fixture', 'Local review fixture');
      const thread = comments.createCommentThread(uri('menu.after.json'), new vscode.Range(3, 0, 3, 20), [{
        body: 'Keep the seasonal label and price together. This is a local review fixture, not a hosted pull request.',
        mode: vscode.CommentMode.Preview,
        author: { name: 'Fixture reviewer' }
      }]);
      thread.collapsibleState = vscode.CommentThreadCollapsibleState.Expanded;
    } else if (scene === 'contrast-merge') {
      // Version-pinned developer tooling; this internal command is not a runtime dependency.
      await command('_open.mergeEditor', {
        base: uri('menu.base.json'),
        input1: { uri: uri('menu.before.json'), title: 'Current', description: 'Garden menu' },
        input2: { uri: uri('menu.after.json'), title: 'Incoming', description: 'Seasonal menu' },
        output: uri('menu.result.json')
      });
    } else {
      await open('menu.ts');
    }
    status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1000);
    status.text = `${variant === 'legacy' ? 'Specials Board VS Code Legacy [Deprecated]' : variant === 'flagship' ? 'Specials Board' : `Specials Board ${variant[0].toUpperCase()}${variant.slice(1)}`} | Visual fixture`;
    status.show();
    context.subscriptions.push(status);
    await context.workspaceState.update('captureScene', scene);
    console.log(`Specials Board capture ready: ${scene}; root=${path.basename(root.fsPath)}`);
  }));
};
