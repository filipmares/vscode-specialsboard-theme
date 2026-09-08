import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';

export const root = fileURLToPath(new URL('../', import.meta.url));
const schemaNames = ['tokens', 'vscode-mapping', 'variants', 'provenance', 'vscode-theme'];
const ajv = new Ajv({ strict: true, allErrors: true });
for (const name of schemaNames) {
  ajv.addSchema(JSON.parse(readFileSync(resolve(root, 'schemas', `${name}.schema.json`), 'utf8')));
}

export function validateSchema(name, data, location = name) {
  const validate = ajv.getSchema(`https://specialsboard.local/schemas/${name}`);
  if (!validate) throw new Error(`Unknown schema: ${name}`);
  if (!validate(data)) throw new Error(`${location}: ${ajv.errorsText(validate.errors, { separator: '; ' })}`);
}

function readJson(directory, ...parts) {
  const path = resolve(directory, ...parts);
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function loadSources(directory = root) {
  const variants = readJson(directory, 'tokens', 'variants.json');
  validateSchema('variants', variants);
  return {
    palette: readJson(directory, 'tokens', 'palette.json'),
    semantic: readJson(directory, 'tokens', 'semantic.json'),
    components: readJson(directory, 'tokens', 'components.json'),
    provenance: readJson(directory, 'tokens', 'provenance.json'),
    mapping: readJson(directory, 'adapters', 'vscode.json'),
    variants,
    overrides: Object.fromEntries(variants.map(variant => [
      variant.key, readJson(directory, 'tokens', 'variants', `${variant.key}.json`)
    ])),
    manifest: readJson(directory, 'package.json')
  };
}

export function aliasTarget(value) {
  if (typeof value !== 'string' || !/^\{[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*)+\}$/.test(value)) {
    throw new Error(`Expected a token alias, got ${JSON.stringify(value)}`);
  }
  return value.slice(1, -1);
}

export function flattenTokens(document, provenance, location) {
  validateSchema('tokens', document, location);
  const tokens = new Map();
  function walk(group, path, inheritedProvenance) {
    const evidence = group.$extensions?.['org.specialsboard.provenance'] ?? inheritedProvenance;
    if (evidence && !Object.hasOwn(provenance, evidence.source)) {
      throw new Error(`${location}: unknown provenance source ${evidence.source}`);
    }
    if (Object.hasOwn(group, '$value')) {
      if (!evidence) throw new Error(`${location}: missing provenance for ${path}`);
      tokens.set(path, group);
      return;
    }
    for (const [name, child] of Object.entries(group)) {
      if (!name.startsWith('$')) walk(child, path ? `${path}.${name}` : name, evidence);
    }
  }
  walk(document, '', undefined);
  return tokens;
}

function validateLayers(tokens) {
  const allowed = {
    palette: ['palette'],
    semantic: ['palette', 'semantic'],
    component: ['semantic', 'component']
  };
  for (const [path, token] of tokens) {
    const layer = path.split('.')[0];
    if (!allowed[layer]) throw new Error(`Unknown token layer: ${path}`);
    if (typeof token.$value === 'string') {
      const target = aliasTarget(token.$value);
      if (!allowed[layer].includes(target.split('.')[0])) {
        throw new Error(`Invalid layer dependency: ${path} -> ${target}`);
      }
    } else if (layer !== 'palette') {
      throw new Error(`Raw colors belong only in the palette: ${path}`);
    }
  }
}

export function colorToHex(color) {
  const byte = value => Math.round(value * 255).toString(16).padStart(2, '0');
  const rgb = `#${color.components.map(byte).join('')}`;
  if (color.hex !== undefined && color.hex !== rgb) {
    throw new Error(`Color fallback ${color.hex} does not match sRGB components ${rgb}`);
  }
  // Preserve an explicit alpha channel whenever it is not fully opaque.
  return (color.alpha ?? 1) === 1 ? rgb : `${rgb}${byte(color.alpha)}`;
}

export function resolveTokens(tokens) {
  validateLayers(tokens);
  const resolved = new Map();
  const visiting = new Set();
  function visit(path) {
    if (resolved.has(path)) return resolved.get(path);
    if (visiting.has(path)) throw new Error(`Token alias cycle: ${[...visiting, path].join(' -> ')}`);
    const token = tokens.get(path);
    if (!token) throw new Error(`Unresolved token: ${path}`);
    visiting.add(path);
    const value = typeof token.$value === 'string' ? visit(aliasTarget(token.$value)) : token.$value;
    colorToHex(value);
    visiting.delete(path);
    resolved.set(path, value);
    return value;
  }
  for (const path of tokens.keys()) visit(path);
  return resolved;
}

function assertUnique(items, key) {
  const values = items.map(item => item[key]);
  if (new Set(values).size !== values.length) throw new Error(`Duplicate variant ${key}`);
}

export function compileSources(sources) {
  validateSchema('variants', sources.variants);
  validateSchema('provenance', sources.provenance);
  for (const field of ['key', 'id', 'label', 'vscodeId', 'output']) assertUnique(sources.variants, field);

  const base = new Map();
  for (const [file, namespace] of [['palette', 'palette'], ['semantic', 'semantic'], ['components', 'component']]) {
    const layer = flattenTokens(sources[file], sources.provenance, file);
    if (layer.size === 0) throw new Error(`Empty ${file} layer`);
    for (const [path, token] of layer) {
      if (!path.startsWith(`${namespace}.`)) throw new Error(`Wrong namespace in ${file}: ${path}`);
      base.set(path, token);
    }
  }
  resolveTokens(base);
  const registry = new Map(sources.variants.map(variant => [variant.key, variant]));
  const merged = new Map();
  const visiting = new Set();
  function variantTokens(key) {
    if (merged.has(key)) return merged.get(key);
    if (visiting.has(key)) throw new Error(`Variant inheritance cycle: ${[...visiting, key].join(' -> ')}`);
    const variant = registry.get(key);
    if (!variant) throw new Error(`Unknown inherited variant: ${key}`);
    visiting.add(key);
    const tokens = new Map(variant.inherits === 'base' ? base : variantTokens(variant.inherits));
    const overrides = flattenTokens(sources.overrides[key], sources.provenance, `variants/${key}`);
    for (const [path, token] of overrides) {
      if (path.startsWith('palette.')) throw new Error(`Variant ${key} cannot override palette token ${path}`);
      if (!base.has(path)) throw new Error(`Unknown override in ${key}: ${path}`);
      if (typeof token.$value !== 'string') throw new Error(`Variant overrides must be aliases: ${path}`);
      tokens.set(path, token);
    }
    visiting.delete(key);
    merged.set(key, tokens);
    return tokens;
  }
  return sources.variants.map(variant => ({
    variant,
    tokens: resolveTokens(variantTokens(variant.key))
  }));
}

export function stableJson(value) {
  function sort(item) {
    if (Array.isArray(item)) return item.map(sort);
    if (item && typeof item === 'object') {
      return Object.fromEntries(Object.keys(item).sort().map(key => [key, sort(item[key])]));
    }
    return item;
  }
  return `${JSON.stringify(sort(value), null, 2)}\n`;
}
