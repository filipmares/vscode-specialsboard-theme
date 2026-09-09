import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { compileSources, loadSources, root, stableJson } from './tokens.mjs';
import { renderVSCode, validateContributions } from './vscode.mjs';
import { buildPorts } from './ports.mjs';
import { syncPorts } from './portable.mjs';

export function buildThemes(sources = loadSources()) {
  const models = compileSources(sources);
  validateContributions(sources.manifest, sources.variants);
  return new Map(models.map(model => [
    model.variant.output, stableJson(renderVSCode(sources.mapping, model))
  ]));
}

export function syncThemes(outputs, directory, check) {
  const unexpected = readdirSync(directory).filter(file => file.endsWith('.json') && !outputs.has(file));
  if (unexpected.length) throw new Error(`Unmanaged theme files: ${unexpected.join(', ')}`);
  const drift = [];
  for (const [file, expected] of outputs) {
    const path = resolve(directory, file);
    if (check) {
      let actual;
      try {
        actual = readFileSync(path, 'utf8');
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
      if (actual !== expected) drift.push(file);
    } else {
      writeFileSync(path, expected, 'utf8');
    }
  }
  if (drift.length) throw new Error(`Generated theme drift: ${drift.join(', ')}. Run npm run generate and commit the outputs.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  if (args.length > 1 || (args.length === 1 && args[0] !== '--check')) {
    throw new Error('Usage: node scripts/generate.mjs [--check]');
  }
  const outputs = buildThemes();
  const ports = buildPorts();
  const check = args[0] === '--check';
  syncThemes(outputs, resolve(root, 'themes'), check);
  syncPorts(ports, resolve(root, 'ports'), check);
  console.log(`${check ? 'Checked' : 'Generated'} ${outputs.size} themes and ${ports.size} portable files.`);
}
