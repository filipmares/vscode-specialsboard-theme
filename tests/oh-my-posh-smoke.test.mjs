import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { assertColoredText, assertPrintableAscii, isolatedEnvironment, parseAnsi, supportedVersion } from '../scripts/oh-my-posh-smoke.mjs';
import { poshVersion } from '../scripts/oh-my-posh.mjs';

test('native smoke helpers do not run or download OMP when imported by npm test', () => {
  assert.equal(supportedVersion, poshVersion);
});

test('native smoke environment excludes inherited accounts, Git overrides, and prompt settings', () => {
  const scratch = mkdtempSync(resolve('.oh-my-posh-environment-test-'));
  try {
    const env = isolatedEnvironment(scratch, [process.execPath], {
      PATH: 'untrusted-path', HOME: 'real-home', USERPROFILE: 'real-profile',
      AWS_ACCESS_KEY_ID: 'must-not-inherit', GITHUB_TOKEN: 'must-not-inherit',
      GIT_DIR: 'real-repository', GIT_CONFIG_COUNT: '99', POSH_THEME: 'real-theme',
      NODE_OPTIONS: 'must-not-inherit', NO_COLOR: '1'
    });
    for (const key of ['AWS_ACCESS_KEY_ID', 'GITHUB_TOKEN', 'GIT_DIR', 'POSH_THEME', 'NODE_OPTIONS', 'NO_COLOR']) {
      assert.equal(env[key], undefined);
    }
    for (const key of ['HOME', 'USERPROFILE', 'APPDATA', 'LOCALAPPDATA', 'XDG_CONFIG_HOME',
      'XDG_CACHE_HOME', 'XDG_DATA_HOME', 'XDG_STATE_HOME', 'XDG_RUNTIME_DIR', 'POSH_CACHE_DIR', 'TEMP', 'TMP', 'TMPDIR']) {
      assert.ok(env[key].startsWith(`${scratch}${process.platform === 'win32' ? '\\' : '/'}`), key);
      assert.ok(existsSync(env[key]), key);
    }
    assert.equal(env.HOME, env.USERPROFILE);
    assert.equal(env.GIT_CONFIG_GLOBAL, join(scratch, 'empty.gitconfig'));
    assert.equal(env.GIT_CONFIG_SYSTEM, env.GIT_CONFIG_GLOBAL);
    assert.equal(env.GIT_CONFIG_NOSYSTEM, '1');
    assert.equal(env.GIT_CONFIG_COUNT, '0');
    assert.equal(env.GIT_ALLOW_PROTOCOL, 'file');
    assert.equal(env.GIT_CEILING_DIRECTORIES, scratch);
    assert.equal(env.COLORTERM, 'truecolor');
    assert.ok(!env.PATH.includes('untrusted-path'));
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
});

test('native ANSI assertions track resolved foreground, background, inline colors, and reset', () => {
  const rendered = parseAnsi('\x1b[48;2;48;46;44m\x1b[38;2;178;200;121mgit:main'
    + '\x1b[38;2;186;176;165m|\x1b[38;2;178;200;121mok >\x1b[0m plain');
  assert.equal(rendered.text, 'git:main|ok > plain');
  assertColoredText(rendered, 'git:main', '#b2c879', '#302e2c');
  assertColoredText(rendered, '|', '#bab0a5', '#302e2c');
  assertColoredText(rendered, 'ok >', '#b2c879', '#302e2c');
  assert.throws(() => assertColoredText(rendered, 'git:main', '#ed746b', '#302e2c'), /foreground/);
  assert.throws(() => assertColoredText(rendered, 'git:main', '#b2c879', '#000000'), /background/);
  assert.throws(() => assertColoredText(rendered, 'plain', '#b2c879', '#302e2c'), /foreground/);
  assert.throws(() => assertColoredText(rendered, 'absent', '#b2c879', '#302e2c'), /Missing/);
});

test('native ANSI assertions reject indexed-color fallback and strip terminal control sequences', () => {
  const rendered = parseAnsi('\x1b]0;title\x07\x1b[1G\x1b[38;2;178;200;121mtruecolor'
    + '\x1b[38;5;2mindexed\x1b[32mstandard\x1b[39mdefault');
  assert.equal(rendered.text, 'truecolorindexedstandarddefault');
  for (const token of ['indexed', 'standard', 'default']) {
    assert.throws(() => assertColoredText(rendered, token, '#b2c879', '#302e2c'), /foreground/);
  }
});

test('native prompt rejects Nerd Font glyphs including supplementary private-use characters', () => {
  assertPrintableAscii('git:detached at commit:0123456 clean | time:500ms | exit:-7 >');
  for (const glyph of ['\ue0a0', '\uf417', '\uf412', '\u{f0095}', '\x07']) {
    assert.throws(() => assertPrintableAscii(`git:${glyph}main clean | ok >`), /printable ASCII/);
  }
});
