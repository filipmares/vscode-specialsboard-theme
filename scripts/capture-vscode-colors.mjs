import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// This explicit maintenance command is never called by generation, tests or packaging.
const root = fileURLToPath(new URL('../', import.meta.url));
const version = '1.101.0';
const commit = 'dfaf44141ea9deb3b4096f7cd6d24e00c147a4b1';
const docsCommit = '14f745e318ef4adb978f17dd8aff7f94591fccb4';
const docsHash = '72e254ccc477fa699a7e8c91046d77c7d8ee660ecf7016fa3da44c88710db21a';
const [reportPath, ...extra] = process.argv.slice(2);
assert.ok(reportPath && extra.length === 0, 'Usage: node scripts/capture-vscode-colors.mjs <floor-live-report.json>');
const report = JSON.parse(readFileSync(resolve(reportPath), 'utf8'));
assert.equal(report.success, true);
assert.equal(report.vscode, version, 'Capture must come from the exact engine floor, not a newer runtime');
const mapping = JSON.parse(readFileSync(resolve(root, 'adapters', 'vscode.json'), 'utf8'));
const ids = [...new Set([
  ...Object.keys(mapping.workbench), ...Object.keys(mapping.legacyWorkbench),
  ...Object.keys(mapping.ansi).map(slot => `terminal.ansi${slot[0].toUpperCase()}${slot.slice(1)}`)
])].sort();
const observed = report.variants.find(variant => variant.id === 'specials-board');
assert.ok(observed, 'Missing flagship runtime observation');
assert.deepEqual(observed.unregisteredColors, []);
assert.deepEqual(observed.colorIds, ids, 'The runtime report is stale or used a different mapping');
const url = `https://raw.githubusercontent.com/microsoft/vscode-docs/${docsCommit}/api/references/theme-color.md`;
const response = await fetch(url);
assert.ok(response.ok, `Documentation fetch failed: ${response.status}`);
const bytes = Buffer.from(await response.arrayBuffer());
assert.equal(createHash('sha256').update(bytes).digest('hex'), docsHash, 'Pinned documentation bytes changed');
const documented = new Set([...bytes.toString('utf8').matchAll(/^- `([\w.]+)`:/gm)].map(match => match[1]));
assert.deepEqual(ids.filter(id => !documented.has(id)), [], 'Only explicitly documented public IDs may be selected');
const schema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: 'https://specialsboard.local/schemas/vscode-colors',
  $comment: `Reviewed public subset, not the entire upstream registry. VS Code ${version} (${commit}); exact runtime registry/color smoke plus production-source audit. Docs ${docsCommit}, api/references/theme-color.md, SHA256 ${docsHash}. Regenerate explicitly with scripts/capture-vscode-colors.mjs and a fresh floor report; do not infer IDs from namespaces.`,
  type: 'string',
  enum: ids
};
writeFileSync(resolve(root, 'schemas', 'vscode-colors.schema.json'), `${JSON.stringify(schema, null, 2)}\n`);
console.log(`Captured ${ids.length} documented color IDs verified by VS Code ${version}.`);
