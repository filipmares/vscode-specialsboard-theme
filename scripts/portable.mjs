import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { aliasTarget, colorToHex, validateSchema } from './tokens.mjs';
import { composite, hex, luminance, rgba } from './color.mjs';

export const portableVariants = ['flagship', 'classic', 'contrast'];
export const ansiSlots = [
  'black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white',
  'brightBlack', 'brightRed', 'brightGreen', 'brightYellow',
  'brightBlue', 'brightMagenta', 'brightCyan', 'brightWhite'
];

export function portableColor(expression, model) {
  validateSchema('portable-color', expression);
  function role(reference) {
    const path = aliasTarget(reference);
    const value = model.tokens.get(path);
    if (!value) throw new Error(`Unresolved portable role: ${path}`);
    return rgba(colorToHex(value));
  }
  if (typeof expression === 'string') {
    const value = role(expression);
    if (value[3] !== 1) throw new Error(`Translucent role requires an explicit over stack: ${expression}`);
    return hex(value);
  }
  const layers = expression.over.map(role);
  if (layers[0][3] !== 1) throw new Error('Portable over stack must begin with an opaque role');
  return hex(layers.slice(1).reduce((back, front) => composite(front, back), layers[0]));
}

export function renderAnsi(mapping, model) {
  validateSchema('ansi-mapping', mapping);
  const colors = Object.fromEntries(ansiSlots.map(slot => [slot, portableColor(mapping[slot], model)]));
  if (new Set(Object.values(colors)).size !== 16) throw new Error('Portable ANSI requires sixteen unique colors');
  for (let i = 0; i < 8; i++) {
    const normal = luminance(rgba(colors[ansiSlots[i]]));
    const bright = luminance(rgba(colors[ansiSlots[i + 8]]));
    if (bright - normal <= 0.1) throw new Error(`ANSI bright partner must be meaningfully lighter: ${ansiSlots[i]}`);
  }
  return colors;
}

export function syncPorts(outputs, directory, check) {
  for (const file of outputs.keys()) {
    if (!/^[a-z0-9-]+\/(?:colors\/)?[a-z0-9-]+\.(json|lua)$/.test(file)) {
      throw new Error(`Unsafe portable output path: ${file}`);
    }
  }
  const existing = [];
  function walk(path, prefix = '') {
    let entries;
    try {
      entries = readdirSync(path, { withFileTypes: true });
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      return;
    }
    for (const entry of entries) {
      const file = `${prefix}${entry.name}`;
      if (entry.isSymbolicLink()) throw new Error(`Unmanaged portable symbolic link: ${file}`);
      if (entry.isDirectory()) walk(resolve(path, entry.name), `${file}/`);
      else existing.push(file);
    }
  }
  walk(directory);
  const extra = existing.filter(file => !outputs.has(file));
  if (extra.length) throw new Error(`Unmanaged portable files: ${extra.sort().join(', ')}`);
  const drift = [];
  for (const [file, expected] of outputs) {
    const path = resolve(directory, ...file.split('/'));
    if (check) {
      let actual;
      try {
        actual = readFileSync(path, 'utf8');
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
      if (actual !== expected) drift.push(file);
    } else {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, expected, 'utf8');
    }
  }
  if (drift.length) throw new Error(`Generated portable drift: ${drift.join(', ')}. Run npm run generate.`);
}
