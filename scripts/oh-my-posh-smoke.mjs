import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { accessSync, constants, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { delimiter, dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { poshVersion as supportedVersion } from './oh-my-posh.mjs';

export { supportedVersion };
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const variants = ['specials-board', 'specials-board-classic', 'specials-board-contrast'];

export function findExecutable(command, environment = process.env) {
  const directories = isAbsolute(command) || /[/\\]/.test(command)
    ? ['']
    : (environment.PATH ?? environment.Path ?? '').split(delimiter).filter(Boolean);
  const extensions = process.platform === 'win32' && !command.toLowerCase().endsWith('.exe')
    ? ['', '.exe']
    : [''];
  for (const directory of directories) {
    for (const extension of extensions) {
      const candidate = resolve(directory, `${command}${extension}`);
      try {
        accessSync(candidate, process.platform === 'win32' ? constants.F_OK : constants.X_OK);
        return candidate;
      } catch (error) {
        if (!['ENOENT', 'ENOTDIR', 'EACCES'].includes(error.code)) throw error;
      }
    }
  }
  throw new Error(`Executable not found: ${command}. Install Oh My Posh ${supportedVersion} separately; this runner never downloads binaries.`);
}

export function isolatedEnvironment(scratch, executables, inherited = process.env) {
  const environment = {};
  for (const key of ['SystemRoot', 'WINDIR', 'COMSPEC']) {
    if (inherited[key]) environment[key] = inherited[key];
  }
  const directories = executables.map(dirname);
  if (inherited.SystemRoot) directories.push(join(inherited.SystemRoot, 'System32'));
  if (process.platform !== 'win32') directories.push('/usr/bin', '/bin');
  environment.PATH = [...new Set(directories)].join(delimiter);
  const home = join(scratch, 'home');
  mkdirSync(home);
  environment.HOME = home;
  environment.USERPROFILE = home;
  for (const key of ['APPDATA', 'LOCALAPPDATA', 'XDG_CONFIG_HOME', 'XDG_CACHE_HOME',
    'XDG_DATA_HOME', 'XDG_STATE_HOME', 'XDG_RUNTIME_DIR', 'POSH_CACHE_DIR', 'TEMP', 'TMP', 'TMPDIR']) {
    environment[key] = join(scratch, key.toLowerCase());
    mkdirSync(environment[key]);
  }
  const config = join(scratch, 'empty.gitconfig');
  writeFileSync(config, '');
  const templates = join(scratch, 'empty-git-template');
  mkdirSync(templates);
  return {
    ...environment,
    XDG_CONFIG_DIRS: environment.XDG_CONFIG_HOME,
    XDG_DATA_DIRS: environment.XDG_DATA_HOME,
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_CONFIG_SYSTEM: config,
    GIT_CONFIG_GLOBAL: config,
    GIT_CONFIG_COUNT: '0',
    GIT_TEMPLATE_DIR: templates,
    GIT_CEILING_DIRECTORIES: scratch,
    GIT_TERMINAL_PROMPT: '0',
    GCM_INTERACTIVE: 'never',
    GIT_ALLOW_PROTOCOL: 'file',
    GIT_AUTHOR_NAME: 'Native smoke',
    GIT_AUTHOR_EMAIL: 'native-smoke@example.invalid',
    GIT_COMMITTER_NAME: 'Native smoke',
    GIT_COMMITTER_EMAIL: 'native-smoke@example.invalid',
    TERM: 'xterm-256color',
    COLORTERM: 'truecolor',
    LANG: 'C.UTF-8',
    LC_ALL: 'C.UTF-8',
    HTTP_PROXY: 'http://127.0.0.1:9',
    HTTPS_PROXY: 'http://127.0.0.1:9',
    ALL_PROXY: 'http://127.0.0.1:9',
    NO_PROXY: ''
  };
}

export function parseAnsi(output) {
  let foreground = null;
  let background = null;
  let text = '';
  const styles = [];
  const escape = /(\x1b\[[0-?]*[ -/]*[@-~]|\x1b\][^\x07\x1b]*(?:\x07|\x1b\\))/g;
  for (const part of output.split(escape)) {
    if (part.startsWith('\x1b')) {
      if (!part.endsWith('m') || !part.startsWith('\x1b[')) continue;
      const codes = part.slice(2, -1).split(';').map(Number);
      for (let i = 0; i < codes.length; i++) {
        const code = codes[i];
        if (code === 0) foreground = background = null;
        else if (code === 39) foreground = null;
        else if (code === 49) background = null;
        else if ((code === 38 || code === 48) && codes[i + 1] === 2) {
          const rgb = codes.slice(i + 2, i + 5);
          assert.equal(rgb.length, 3, 'Incomplete truecolor ANSI');
          assert.ok(rgb.every(value => Number.isInteger(value) && value >= 0 && value <= 255));
          const color = `#${rgb.map(value => value.toString(16).padStart(2, '0')).join('')}`;
          if (code === 38) foreground = color;
          else background = color;
          i += 4;
        } else if ((code >= 30 && code <= 37) || (code >= 90 && code <= 97)) foreground = null;
        else if ((code >= 40 && code <= 47) || (code >= 100 && code <= 107)) background = null;
        else if ((code === 38 || code === 48) && codes[i + 1] === 5) {
          if (code === 38) foreground = null;
          else background = null;
          i += 2;
        }
      }
    } else if (part) {
      styles.push({ start: text.length, end: text.length + part.length, foreground, background });
      text += part;
    }
  }
  return { text, styles };
}

export function assertColoredText(rendered, token, foreground, background) {
  const start = rendered.text.indexOf(token);
  assert.notEqual(start, -1, `Missing ${JSON.stringify(token)} in ${JSON.stringify(rendered.text)}`);
  const spans = rendered.styles.filter(style => style.end > start && style.start < start + token.length);
  assert.ok(spans.length > 0, `No native ANSI spans for ${token}`);
  for (const span of spans) {
    assert.equal(span.foreground, foreground.toLowerCase(), `Native foreground for ${token}`);
    assert.equal(span.background, background.toLowerCase(), `Native background for ${token}`);
  }
}

export function assertPrintableAscii(text) {
  assert.doesNotMatch(text, /[\x00-\x1f\x7f-\uffff]/, `Expected printable ASCII prompt: ${JSON.stringify(text)}`);
}

function execute(executable, args, cwd, env) {
  const result = spawnSync(executable, args, {
    cwd, env, encoding: 'utf8', timeout: 30_000, maxBuffer: 4 * 1024 * 1024,
    windowsHide: true
  });
  if (result.error) throw new Error(`${executable} ${args.join(' ')}: ${result.error.message}`, { cause: result.error });
  assert.equal(result.status, 0, `${executable} ${args.join(' ')} failed (${result.signal ?? result.status})\n${result.stderr}\n${result.stdout}`);
  return result.stdout;
}

function verifyPrompt(output, config, cwd, state, status, duration) {
  const rendered = parseAnsi(output);
  const { text } = rendered;
  assertPrintableAscii(text);
  assert.doesNotMatch(text, /<no value>|invalid template|error rendering|CONFIG NOT FOUND|p:/i);
  const palette = config.palette;
  const colored = (token, key) => assertColoredText(rendered, token, palette[key], palette.background);
  const pathToken = text.includes(cwd) ? cwd : cwd.replaceAll('\\', '/');
  colored(pathToken, 'path');
  const headToken = `git:${state.head ?? 'main'}`;
  if (state.git) {
    colored(headToken, state.color);
    assert.equal(text.includes(' clean'), !state.modified && !state.staged, `Clean state: ${text}`);
    if (!state.modified && !state.staged) colored('clean', state.color);
    for (const [name, expected] of [['modified', state.modified], ['staged', state.staged]]) {
      assert.equal(text.includes(`${name}:`), Boolean(expected), `${name} state: ${text}`);
      if (expected) {
        const token = text.match(new RegExp(`${name}:[^\\s|]+`))?.[0];
        assert.equal(token, `${name}:~1`, `Native ${name} summary for one changed tracked file: ${text}`);
        colored(token, state.color);
      }
    }
    for (const name of ['ahead', 'behind']) {
      assert.equal(text.includes(`${name}:`), Boolean(state[name]), `${name} state: ${text}`);
      if (state[name]) colored(`${name}:1`, state.color);
    }
    assert.equal(text.includes(' diverged'), Boolean(state.ahead && state.behind), `Divergence state: ${text}`);
    if (state.ahead && state.behind) colored('diverged', state.color);
    assert.ok(text.indexOf(headToken) > text.indexOf(pathToken), 'Path must precede git');
  } else {
    assert.doesNotMatch(text, /git:|clean|modified:|staged:|ahead:|behind:|diverged/);
  }
  assert.equal(text.includes('time:'), duration >= 500, `Duration threshold: ${text}`);
  if (duration >= 500) {
    const token = text.match(/time:[^|]+/)?.[0].trimEnd();
    assert.equal(token, duration < 1000 ? `time:${duration}ms` : `time:${duration / 1000}s`, `Formatted native duration: ${text}`);
    colored(token, 'duration');
    assert.ok(text.indexOf('time:') > (state.git ? text.indexOf(headToken) : text.indexOf(pathToken)));
  }
  const statusToken = status === 0 ? 'ok >' : `exit:${status} >`;
  colored(statusToken, status === 0 ? 'success' : 'failure');
  assert.ok(text.trimEnd().endsWith(statusToken), `Status must end the prompt: ${text}`);
  assert.equal(text.includes('ok >'), status === 0);
  assert.equal(text.includes('exit:'), status !== 0);
  const separators = [...text.matchAll(/\|/g)];
  assert.equal(separators.length, 1 + Number(Boolean(state.git)) + Number(duration >= 500));
  for (const match of separators) {
    const span = rendered.styles.find(style => style.start <= match.index && style.end > match.index);
    assert.equal(span?.foreground, palette.separator.toLowerCase(), 'Native separator foreground');
    assert.equal(span?.background, palette.background.toLowerCase(), 'Native separator background');
  }
}

export function runSmoke({ executable = process.env.OH_MY_POSH_EXECUTABLE || 'oh-my-posh', scratchRoot = root } = {}) {
  const posh = findExecutable(executable);
  const git = findExecutable('git');
  mkdirSync(scratchRoot, { recursive: true });
  const scratch = mkdtempSync(join(resolve(scratchRoot), '.oh-my-posh-smoke-'));
  let renders = 0;
  try {
    // OMP's own parent-marker walk ignores GIT_CEILING_DIRECTORIES. An inert
    // marker prevents it from discovering this worktree above the owned fixtures.
    writeFileSync(join(scratch, '.git'), '');
    const env = isolatedEnvironment(scratch, [posh, git]);
    assert.equal(execute(posh, ['version'], scratch, env).trim(), supportedVersion, `Only Oh My Posh ${supportedVersion} is supported`);
    const configs = variants.map(id => {
      const path = join(root, 'ports', 'oh-my-posh', `${id}.omp.json`);
      const config = JSON.parse(readFileSync(path, 'utf8'));
      assert.deepEqual(config.blocks.flatMap(block => block.segments.map(segment => segment.type)), ['path', 'git', 'executiontime', 'status']);
      for (const key of ['git-clean', 'git-modified', 'git-staged', 'git-ahead', 'git-behind',
        'git-diverged', 'success', 'failure', 'path', 'duration', 'separator', 'background']) {
        assert.match(config.palette[key] ?? '', /^#[0-9a-f]{6}$/i, `Explicit RGB palette: ${id}/${key}`);
      }
      const exported = JSON.parse(execute(posh, ['config', 'export', '--config', path, '--format', 'json'], scratch, env));
      assert.deepEqual(exported.palette, config.palette, `Native export palette: ${id}`);
      const exportedSegments = exported.blocks.flatMap(block => block.segments);
      const sourceSegments = config.blocks.flatMap(block => block.segments);
      assert.equal(exportedSegments.length, sourceSegments.length);
      for (const [index, segment] of sourceSegments.entries()) {
        for (const field of ['type', 'style', 'template', 'foreground', 'background', 'foreground_templates', 'options']) {
          assert.deepEqual(exportedSegments[index][field], segment[field], `Native export ${id}/${segment.type}/${field}`);
        }
      }
      return { id, path, config };
    });
    const gitRun = (cwd, ...args) => execute(git, [
      '-c', 'core.autocrlf=false', '-c', 'core.hooksPath=', '-c', 'commit.gpgsign=false',
      '-c', 'tag.gpgsign=false', '-c', 'credential.helper=', ...args
    ], cwd, env);
    const origin = join(scratch, 'origin.git');
    const local = join(scratch, 'local');
    const peer = join(scratch, 'peer');
    const nonRepo = join(scratch, 'non-repo');
    mkdirSync(nonRepo);
    gitRun(scratch, 'init', '--bare', '--initial-branch=main', origin);
    gitRun(scratch, 'clone', origin, local);
    writeFileSync(join(local, 'tracked.txt'), 'base\n');
    gitRun(local, 'add', 'tracked.txt');
    gitRun(local, 'commit', '-m', 'Synthetic base');
    gitRun(local, 'push', '-u', 'origin', 'main');
    gitRun(scratch, 'clone', origin, peer);
    const render = (name, cwd, state) => {
      for (const { id, path, config } of configs) {
        for (const status of [0, 7, -7]) {
          for (const duration of [499, 500, 1500]) {
            const output = execute(posh, ['print', 'primary', '--config', path, '--shell', 'pwsh',
              '--escape=false', '--pwd', cwd, '--status', String(status), '--execution-time', String(duration),
              '--terminal-width', '1000'], cwd, env);
            try {
              verifyPrompt(output, config, cwd, state, status, duration);
            } catch (error) {
              throw new Error(`${id}/${name}/status=${status}/duration=${duration}: ${error.message}`, { cause: error });
            }
            renders++;
          }
        }
      }
    };
    render('non-repo', nonRepo, {});
    const dirtyStates = (name, upstream = {}, combinedOnly = false) => {
      const baseColor = upstream.ahead && upstream.behind ? 'git-diverged'
        : upstream.ahead ? 'git-ahead' : upstream.behind ? 'git-behind' : 'git-clean';
      render(name, local, { git: true, ...upstream, color: baseColor });
      writeFileSync(join(local, 'tracked.txt'), 'changed\n');
      if (!combinedOnly) render(`${name}-modified`, local, {
        git: true, ...upstream, modified: true, color: 'git-modified'
      });
      gitRun(local, 'add', 'tracked.txt');
      if (!combinedOnly) render(`${name}-staged`, local, {
        git: true, ...upstream, staged: true, color: 'git-staged'
      });
      writeFileSync(join(local, 'tracked.txt'), 'changed again\n');
      render(`${name}-combined`, local, {
        git: true, ...upstream, modified: true, staged: true,
        color: combinedOnly ? 'git-diverged' : 'git-modified'
      });
      gitRun(local, 'reset', '--hard', 'HEAD');
    };
    dirtyStates('clean');
    writeFileSync(join(local, 'local.txt'), 'local\n');
    gitRun(local, 'add', 'local.txt');
    gitRun(local, 'commit', '-m', 'Synthetic local change');
    dirtyStates('ahead', { ahead: true });
    gitRun(local, 'reset', '--hard', 'origin/main');
    writeFileSync(join(peer, 'peer.txt'), 'peer\n');
    gitRun(peer, 'add', 'peer.txt');
    gitRun(peer, 'commit', '-m', 'Synthetic peer change');
    gitRun(peer, 'push', 'origin', 'main');
    gitRun(local, 'fetch', 'origin');
    dirtyStates('behind', { behind: true });
    writeFileSync(join(local, 'diverged.txt'), 'local divergence\n');
    gitRun(local, 'add', 'diverged.txt');
    gitRun(local, 'commit', '-m', 'Synthetic divergent change');
    dirtyStates('diverged', { ahead: true, behind: true }, true);
    gitRun(local, 'checkout', '--detach', 'HEAD');
    const hash = gitRun(local, 'rev-parse', 'HEAD').trim().slice(0, 7);
    render('detached-commit', local, {
      git: true, head: `detached at commit:${hash}`, color: 'git-clean'
    });
    gitRun(local, 'tag', 'smoke-v1');
    render('detached-tag', local, {
      git: true, head: 'detached at tag:smoke-v1', color: 'git-clean'
    });
    return { version: supportedVersion, variants: variants.length, renders };
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  const options = {};
  for (let i = 0; i < args.length; i++) {
    const key = args[i] === '--executable' ? 'executable' : args[i] === '--scratch-root' ? 'scratchRoot' : null;
    if (!key || !args[i + 1] || args[i + 1].startsWith('--')) {
      throw new Error('Usage: node scripts/oh-my-posh-smoke.mjs [--executable PATH] [--scratch-root DIRECTORY]');
    }
    options[key] = args[++i];
  }
  const report = runSmoke(options);
  console.log(`PASS Oh My Posh ${report.version}: ${report.renders} native renders across ${report.variants} variants; isolated scratch removed.`);
}
