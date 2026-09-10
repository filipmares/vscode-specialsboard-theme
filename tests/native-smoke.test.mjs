import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { root } from '../scripts/tokens.mjs';

const require = createRequire(import.meta.url);
const helpers = {};
vm.runInNewContext(`${readFileSync(resolve(root, 'scripts', 'vscode-smoke.cjs'), 'utf8')}
exports.parseJsonc = parseJsonc;
exports.assertTokenRules = assertTokenRules;
exports.themeIds = themeIds;`, {
  require: id => id === 'vscode' ? {} : require(id),
  exports: helpers
});

test('native smoke visits every shipped variant, including the light contribution', () => {
  const manifest = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
  assert.deepEqual([...helpers.themeIds].sort(), manifest.contributes.themes.map(theme => theme.id).sort());
  assert.ok(helpers.themeIds.includes('specials-board-light'));
});

test('native JSONC export parser preserves strings while removing comments and trailing commas', () => {
  const actual = helpers.parseJsonc(`{
    // inherited default
    "url": "https://example.com/*literal*/",
    "text": "quoted \\"value\\"",
    /* metadata */ "tokens": [{"scope":"source",},],
  }`);
  assert.equal(actual.url, 'https://example.com/*literal*/');
  assert.equal(actual.text, 'quoted "value"');
  assert.equal(actual.tokens[0].scope, 'source');
  assert.throws(() => helpers.parseJsonc('{invalid}'), /JSON/);
});

test('native rule comparison accepts uppercase hex but never drops scopes or font styles', () => {
  const expected = [{ scope: ['source', 'text'], settings: { foreground: '#e6e1dc', fontStyle: '' } }];
  helpers.assertTokenRules(expected, [{ scope: ['source', 'text'], settings: { foreground: '#E6E1DC', fontStyle: '' } }]);
  assert.throws(() => helpers.assertTokenRules(expected, [{ scope: 'source', settings: expected[0].settings }]), /Missing exported/);
  assert.throws(() => helpers.assertTokenRules(expected, [{ scope: expected[0].scope, settings: { foreground: '#E6E1DC' } }]), /Missing exported/);
});

test('Windows native report UTC conversion preserves JSON DateTime kind and subsecond precision', {
  skip: process.platform !== 'win32'
}, () => {
  const script = `
    $ErrorActionPreference = 'Stop'
    $source = Get-Content -LiteralPath '${resolve(root, 'scripts', 'run-vscode-smoke.ps1').replaceAll("'", "''")}' -Raw
    $ast = [Management.Automation.Language.Parser]::ParseInput($source, [ref]$null, [ref]$null)
    $function = $ast.Find({param($node) $node -is [Management.Automation.Language.FunctionDefinitionAst] -and $node.Name -eq 'Convert-ToUtc'}, $true)
    . ([scriptblock]::Create($function.Extent.Text))
    $expected = '2026-09-09T01:31:17.2620000Z'
    $date = [DateTime]::Parse('2026-09-09T01:31:17.262Z', [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::RoundtripKind)
    if ((Convert-ToUtc $date).ToString('o') -ne $expected) { throw 'DateTime UTC precision drift' }
    if ((Convert-ToUtc '2026-09-09T01:31:17.262Z').ToString('o') -ne $expected) { throw 'String UTC precision drift' }
  `;
  const result = spawnSync('pwsh', ['-NoProfile', '-NonInteractive', '-Command', script], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
});
