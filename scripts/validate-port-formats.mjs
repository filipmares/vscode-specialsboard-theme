import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import { buildPorts, loadPortMappings } from './ports.mjs';
import { root, validateSchema } from './tokens.mjs';

const terminalPin = '5a830b2bf7c053d5c7ac22208fe5a346cb5dd3dc';
const neovimPin = 'cec0ecabd8f47ff81dcb52e8fc9003e365563a84';
async function officialText(url, expectedHash) {
  const response = await fetch(url, { signal: AbortSignal.timeout(60000) });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  assert.equal(createHash('sha256').update(bytes).digest('hex'), expectedHash, `Official source bytes changed: ${url}`);
  return bytes.toString('utf8');
}

const upstream = JSON.parse(await officialText(
  `https://raw.githubusercontent.com/microsoft/terminal/${terminalPin}/doc/cascadia/profiles.schema.json`,
  '57ef7816e2c941f14351cefbdf5a5ee4ffcdc9199470296cf5f4eb56720e65e7'
));
const ajv = new Ajv2020({ strict: true, allErrors: true });
ajv.addFormat('color', /^#[a-fA-F0-9]{3}(?:[a-fA-F0-9]{3})?$/);
const validate = ajv.compile({
  $schema: upstream.$schema,
  $defs: { Color: upstream.$defs.Color },
  ...upstream.$defs.SchemeList
});
const terminal = [];
for (const [file, expected] of buildPorts()) {
  const actual = readFileSync(resolve(root, 'ports', ...file.split('/')), 'utf8');
  assert.equal(actual, expected, `Portable drift: ${file}`);
  if (file.startsWith('windows-terminal/')) {
    const scheme = JSON.parse(actual);
    validateSchema('windows-terminal-theme', scheme);
    terminal.push(scheme);
  }
}
assert.ok(validate(terminal), ajv.errorsText(validate.errors));
const document = await officialText(
  `https://raw.githubusercontent.com/neovim/neovim/${neovimPin}/runtime/doc/treesitter.txt`,
  '458dce1cf257bffa5d2122c6c3bb0a93ae3f6d45672f5a574362df695a1506ef'
);
const captures = [...document.matchAll(/^(@[a-z][\w.]*)\s+/gm)].map(match => match[1]).sort();
const snapshot = JSON.parse(readFileSync(resolve(root, 'schemas', 'neovim-captures.schema.json'), 'utf8'));
assert.deepEqual([...snapshot.enum].sort(), captures, 'Offline native capture vocabulary drift');
const mapped = Object.keys(loadPortMappings().neovim.highlights).filter(name => name.startsWith('@') && !name.startsWith('@lsp.'));
assert.deepEqual(mapped.sort(), captures, 'All declared standard captures must have an intentional role mapping');
console.log(`Official formats: ${terminal.length} complete Windows Terminal schemes; ${captures.length} pinned native Neovim captures. No user profile imported.`);
