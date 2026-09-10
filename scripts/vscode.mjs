import { aliasTarget, colorToHex, stableJson, validateSchema } from './tokens.mjs';

export function validateContributions(manifest, variants) {
  if (manifest.engines?.vscode !== '^1.101.0') {
    throw new Error('VS Code engine must match the public color snapshot floor: ^1.101.0');
  }
  const expected = variants.map(variant => ({
    id: variant.vscodeId,
    label: variant.label,
    uiTheme: variant.appearance === 'light' ? 'vs' : 'vs-dark',
    path: `./themes/${variant.output}`
  }));
  if (stableJson(manifest.contributes?.themes) !== stableJson(expected)) {
    throw new Error('package.json theme contributions do not match tokens/variants.json');
  }
  const legacy = variants.find(variant => variant.key === 'legacy');
  if (legacy.vscodeId !== 'specials-board-legacy'
    || legacy.label !== 'Specials Board VS Code Legacy [Deprecated]'
    || legacy.output !== 'specialsboard.json'
    || legacy.appearance !== 'dark') {
    throw new Error('Legacy must use the normalized deprecated identity and preserve its output path');
  }
}

export function renderVSCode(mapping, model) {
  validateSchema('vscode-mapping', mapping);
  const legacy = model.variant.key === 'legacy';
  function color(reference) {
    const target = aliasTarget(reference);
    if (!/^(semantic|component)\./.test(target)) {
      throw new Error(`VS Code mappings must reference roles, not palette values: ${target}`);
    }
    const resolved = model.tokens.get(target);
    if (!resolved) throw new Error(`Unresolved mapping token: ${target}`);
    return colorToHex(resolved);
  }
  const workbench = legacy ? mapping.legacyWorkbench : {
    ...mapping.workbench,
    ...(model.variant.key === 'contrast' ? mapping.contrastWorkbench : {}),
    ...(model.variant.appearance === 'light' ? mapping.lightWorkbench : {})
  };
  const colors = Object.fromEntries(Object.entries(workbench).map(([key, value]) => {
    if (key.startsWith('terminal.ansi')) throw new Error(`ANSI slot belongs in mapping.ansi: ${key}`);
    return [key, color(value)];
  }));
  for (const [slot, value] of Object.entries(mapping.ansi)) {
    colors[`terminal.ansi${slot[0].toUpperCase()}${slot.slice(1)}`] = color(value);
  }
  // Legacy's ordered compatibility profile must never inherit restored scope semantics.
  const tokenColors = (legacy ? mapping.legacyTextMate : mapping.textMate).map(rule => ({
    ...rule,
    settings: Object.fromEntries(Object.entries(rule.settings).map(([key, value]) => [
      key, key === 'fontStyle' ? value : color(value)
    ]))
  }));
  const theme = {
    $schema: 'vscode://schemas/color-theme',
    name: model.variant.label,
    author: 'Filip Mares',
    type: model.variant.appearance,
    colors,
    tokenColors
  };
  if (!legacy && Object.keys(mapping.semanticTokens).length > 0) {
    theme.semanticHighlighting = true;
    theme.semanticTokenColors = Object.fromEntries(Object.entries(mapping.semanticTokens).map(([selector, style]) => [
      selector,
      typeof style === 'string' ? color(style) : Object.fromEntries(
        Object.entries(style).map(([key, value]) => [key, key === 'foreground' ? color(value) : value])
      )
    ]));
  }
  validateSchema('vscode-theme', theme, model.variant.output);
  return theme;
}
