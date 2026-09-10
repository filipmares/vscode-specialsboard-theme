import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import test from 'node:test';
import { compileSources, loadSources, root } from '../scripts/tokens.mjs';
import { buildPorts, loadPortMappings } from '../scripts/ports.mjs';
import { portableColor, syncPorts } from '../scripts/portable.mjs';
import { poshMeasurements, renderOhMyPosh, validatePosh } from '../scripts/oh-my-posh.mjs';
import { renderPoshReport } from '../scripts/oh-my-posh-accessibility.mjs';

const sources = loadSources();
const mappings = loadPortMappings();
const models = compileSources(sources).filter(model => model.variant.key !== 'legacy');
const outputs = buildPorts(sources, mappings);
const prompt = model => renderOhMyPosh(mappings['oh-my-posh'], model);

test('Oh My Posh exports only three role-resolved native RGB palettes and original plain layouts', () => {
  assert.equal([...outputs.keys()].filter(file => file.startsWith('oh-my-posh/')).length, 3);
  for (const model of models) {
    const theme = prompt(model);
    validatePosh(theme);
    for (const [name, role] of Object.entries(mappings['oh-my-posh'])) {
      assert.equal(theme.palette[name], portableColor(role, model));
      assert.match(role, /^\{semantic\.prompt\./);
    }
    const { palette, ...layout } = theme;
    assert.doesNotMatch(JSON.stringify(layout), /#[0-9a-f]{6}|[\u0080-\uffff]/i);
    for (const segment of theme.blocks[0].segments) {
      assert.equal(segment.background, 'p:background');
      assert.equal(segment.style, 'plain');
    }
    const [, git, duration, status] = theme.blocks[0].segments;
    for (const cue of ['git:', 'clean', 'modified:', 'staged:', 'ahead:', 'behind:', 'diverged']) {
      assert.ok(git.template.includes(cue), cue);
    }
    assert.deepEqual(git.foreground_templates.map(value => value.match(/p:([a-z-]+)/)[1]),
      ['git-diverged', 'git-modified', 'git-staged', 'git-ahead', 'git-behind']);
    assert.equal(duration.options.threshold, 500);
    assert.equal(status.options.always_enabled, true);
    assert.match(status.template, /ne \.Code 0.*exit:.*ok.*>/);
  }
});

test('prompt mappings reject raw colors, syntax/ANSI shortcuts, missing and unresolved roles', () => {
  for (const value of ['#ffffff', 'red', '{palette.phase2.olive}', '{semantic.syntax.string}',
    '{semantic.terminal.green}', '{semantic.prompt.missing}', { over: ['{semantic.prompt.path}'] }]) {
    const mapping = { ...mappings['oh-my-posh'], path: value };
    assert.throws(() => renderOhMyPosh(mapping, models[0]), /oh-my-posh-mapping:|Unresolved portable role/);
  }
  const missing = { ...mappings['oh-my-posh'] };
  delete missing.failure;
  assert.throws(() => renderOhMyPosh(missing, models[0]), /required/);
  assert.throws(() => renderOhMyPosh({ ...missing, unknown: '{semantic.prompt.path}' }, models[0]));
});

test('prompt format rejects unmanaged fields, unresolved references, raw colors and transparent backgrounds', () => {
  for (const mutate of [
    t => { t.blocks[0].segments[0].foreground = 'p:missing'; },
    t => { t.blocks[0].segments[1].foreground_templates[0] = '{{ if true }}p:missing{{ end }}'; },
    t => { t.blocks[0].segments[0].template = '<p:missing>text</>'; },
    t => { t.blocks[0].segments[0].template = '<#ffffff>text</>'; },
    t => { t.blocks[0].segments[0].template = '<p:path,p:failure>text</>'; },
    t => { t.blocks[0].segments[0].foreground = '#ffffff'; },
    t => { t.blocks[0].segments[0].background = 'transparent'; },
    t => { t.blocks[0].segments[0].options.typo = true; },
    t => { t.palette.background += '80'; },
    t => { t.extends = 'https://example.invalid/preset'; },
    t => { t.blocks[0].segments.reverse(); }
  ]) {
    const theme = prompt(models[0]);
    mutate(theme);
    assert.throws(() => validatePosh(theme));
  }
});

test('prompt-specific overrides inherit without modifying sibling or existing target bytes', () => {
  const changed = structuredClone(sources);
  changed.overrides.flagship.semantic.prompt = {
    path: { $type: 'color', $value: '{semantic.workbench.warning}' }
  };
  changed.overrides.contrast.semantic.prompt = {
    path: { $type: 'color', $value: '{semantic.text.primary}' }
  };
  const compiled = compileSources(changed).filter(model => model.variant.key !== 'legacy');
  const next = buildPorts(changed, mappings);
  for (const model of compiled) {
    const original = models.find(item => item.variant.key === model.variant.key);
    assert.equal(prompt(model).palette.path, portableColor(model.variant.key === 'contrast'
      ? '{semantic.text.primary}' : '{semantic.workbench.warning}', model));
    assert.equal(prompt(model).palette.failure, prompt(original).palette.failure);
  }
  for (const [file, bytes] of outputs) if (!file.startsWith('oh-my-posh/')) {
    assert.equal(next.get(file), bytes, file);
  }
  const isolated = structuredClone(sources);
  isolated.overrides.classic.semantic.prompt = {
    duration: { $type: 'color', $value: '{semantic.workbench.warning}' }
  };
  const siblings = buildPorts(isolated, mappings);
  for (const [file, bytes] of outputs) if (!file.includes('classic.omp.json')) assert.equal(siblings.get(file), bytes);
});

test('all normal and conditional prompt colors and separators are measured, with blocking Contrast floors', () => {
  for (const model of models) {
    const rows = poshMeasurements(prompt(model));
    assert.equal(rows.length, 11);
    assert.deepEqual(rows.map(row => row.role).sort(), Object.keys(mappings['oh-my-posh']).filter(key => key !== 'background').sort());
    if (model.variant.key === 'contrast') for (const row of rows) assert.ok(row.ratio >= row.minimum);
  }
  const low = { ...mappings['oh-my-posh'], failure: '{semantic.prompt.background}' };
  assert.throws(() => renderOhMyPosh(low, models.find(model => model.variant.key === 'contrast')), /Contrast failure/);
  const translucent = structuredClone(sources);
  translucent.semantic.semantic.prompt.background.$value = '{semantic.workbench.selection}';
  assert.throws(() => buildPorts(translucent, mappings), /explicit over stack/);
  assert.equal(renderPoshReport(), readFileSync(resolve(root, 'docs', 'oh-my-posh-accessibility.md'), 'utf8'));
});

test('native .omp.json byte drift, missing files and CRLF fail without repair', t => {
  const directory = mkdtempSync(resolve(tmpdir(), 'specialsboard-posh-drift-'));
  t.after(() => rmSync(directory, { recursive: true }));
  const subset = new Map([...outputs].filter(([file]) => file.startsWith('oh-my-posh/')));
  syncPorts(subset, directory, false);
  syncPorts(subset, directory, true);
  const [file, bytes] = subset.entries().next().value;
  const path = resolve(directory, ...file.split('/'));
  writeFileSync(path, bytes.replaceAll('\n', '\r\n'));
  assert.throws(() => syncPorts(subset, directory, true), /portable drift/);
  assert.ok(readFileSync(path, 'utf8').includes('\r'));
  rmSync(path);
  assert.throws(() => syncPorts(subset, directory, true), /portable drift/);
});

test('existing portable output hashes stay frozen when adding the prompt adapter', () => {
  const hashes = {
    'neovim/colors/specials-board-classic.lua': 'c0b39954aa4a30d4fab822f294439d423772d16aa5b7c9231e0296d362646c55',
    'neovim/colors/specials-board-contrast.lua': 'af7cc536f830be9c4615c0656a825f156b7b2575575253705a6cd2f270909e61',
    'neovim/colors/specials-board.lua': 'e76414ae314689b2932bf68084a4302d60de25860a65a268f0d9b9cc9f9a201a',
    'windows-terminal/specials-board-classic.json': '37772a0e396fb49ed62d5a55527925eb41c2388b9f95e0edc9f36c231572480e',
    'windows-terminal/specials-board-contrast.json': '1f0338d61156c1e7b25a123ba8078c60cfd2bb9ccd8818279d9ac9e1725c0b5f',
    'windows-terminal/specials-board.json': 'c15998250e13c236531eabd1daad26ccb3cbc31af53376c882cde4fcb9eb1590'
  };
  assert.equal(Object.keys(hashes).length, 6);
  for (const [file, hash] of Object.entries(hashes)) {
    assert.equal(createHash('sha256').update(outputs.get(file)).digest('hex'), hash, file);
  }
});
