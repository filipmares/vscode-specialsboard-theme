import { createHash, randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { buildPorts, loadPortMappings, neovimHighlights } from './ports.mjs';
import { ansiSlots, portableColor, portableVariants, renderAnsi } from './portable.mjs';
import { compileSources, loadSources, root } from './tokens.mjs';

export const nativeVersions = ['0.11.4', '0.12.5'];
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

export function buildSmokeData({ version, runId = randomUUID() }) {
  if (!nativeVersions.includes(version)) throw new Error(`Unsupported pinned Neovim version: ${version}`);
  if (!/^(?:[a-f0-9]{32}|[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12})$/i.test(runId)) {
    throw new Error('A GUID runId is required');
  }
  const sources = loadSources();
  const mappings = loadPortMappings();
  const models = compileSources(sources);
  const outputs = buildPorts(sources, mappings);
  const themes = portableVariants.map(key => {
    const model = models.find(item => item.variant.key === key);
    const file = `neovim/colors/${model.variant.id}.lua`;
    const path = resolve(root, 'ports', ...file.split('/'));
    const bytes = readFileSync(path);
    if (!bytes.equals(Buffer.from(outputs.get(file), 'utf8'))) {
      throw new Error(`Generated portable drift: ${file}. Run npm run generate before native smoke.`);
    }
    const ansi = renderAnsi(mappings.ansi, model);
    const intentRoles = {
      property: 'semantic.syntax.property', variable: 'semantic.syntax.variable',
      regexp: 'semantic.syntax.regexp', constant: 'semantic.syntax.constant',
      comment: 'semantic.syntax.comment', escape: 'semantic.syntax.escape',
      string: 'semantic.syntax.string'
    };
    return {
      id: model.variant.id, path, sha256: sha256(bytes),
      highlights: neovimHighlights(mappings.neovim, model),
      terminal: ansiSlots.map(slot => ansi[slot]),
      intents: Object.fromEntries(Object.entries(intentRoles).map(([name, role]) => [
        name, portableColor(`{${role}}`, model)
      ]))
    };
  });
  return {
    schemaVersion: 1, runId, version, generatedAt: new Date().toISOString(),
    repository: root, themeRuntime: resolve(root, 'ports', 'neovim'), themes
  };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const [output, runId, version, ...extra] = process.argv.slice(2);
  if (!output || !runId || !version || extra.length) {
    throw new Error('Usage: node scripts/port-smoke-data.mjs <new-output.json> <run-guid> <0.11.4|0.12.5>');
  }
  const data = buildSmokeData({ version, runId });
  writeFileSync(resolve(output), `${JSON.stringify(data, null, 2)}\n`, { flag: 'wx' });
  console.log(`Prepared ${data.themes.length} current generated themes for Neovim ${version}.`);
}
