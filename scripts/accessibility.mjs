import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { buildThemes } from './generate.mjs';
import { colorToHex, compileSources, loadSources, root } from './tokens.mjs';
import { composite, contrast, difference, hex, rgba, visionModes } from './color.mjs';
import { adjacentPairs, differentiationFloor } from './accessibility-pairs.mjs';
import { syntaxStates, workbenchCases } from './accessibility-cases.mjs';

export function resolveBackground(colors, ids) {
  assert.ok(ids.length, 'A rendering context must have a background');
  let result = [0, 0, 0, 0];
  for (const id of ids) {
    assert.ok(Object.hasOwn(colors, id), `Missing background color: ${id}`);
    result = composite(rgba(colors[id]), result);
  }
  assert.equal(result[3], 1, `Unresolved transparency: ${ids.join(' -> ')}`);
  return result;
}

export function evaluateTheme(theme, model) {
  const c = theme.colors;
  const rows = [];
  const syntax = [
    ...theme.tokenColors.filter(rule => rule.settings.foreground).map((rule, i) =>
      [`TextMate/${i}:${rule.name ?? rule.scope}`, rule.settings.foreground]),
    ...Object.entries(theme.semanticTokenColors ?? {}).map(([id, style]) =>
      [`semantic/${id}`, typeof style === 'string' ? style : style.foreground]).filter(([, value]) => value),
    ...Object.entries(c).filter(([id]) => /^editorBracketHighlight\.foreground[1-6]$/.test(id))
  ];
  const stateIndicators = [
    'editor.lineHighlightBorder', 'editorUnnecessaryCode.border', 'editorError.foreground',
    'editorWarning.foreground', 'editorInfo.foreground', 'editor.findMatchBorder',
    'editor.findMatchHighlightBorder', 'editor.wordHighlightBorder', 'editor.wordHighlightStrongBorder',
    'editor.wordHighlightTextBorder', 'editor.selectionHighlightBorder', 'editorBracketMatch.border',
    'diffEditor.insertedTextBorder', 'diffEditor.removedTextBorder',
    'inlineEdit.originalBorder', 'inlineEdit.modifiedBorder', 'inlineEdit.tabWillAcceptModifiedBorder',
    'inlineEdit.tabWillAcceptOriginalBorder', 'merge.border'
  ].filter(id => Object.hasOwn(c, id));
  const states = syntaxStates(c, model.variant.key !== 'legacy');
  for (const state of states) {
    const background = resolveBackground(c, state.backgrounds);
    for (const [foreground, color] of syntax) {
      rows.push({
        group: state.name, foreground, backgrounds: state.backgrounds,
        color, background: hex(background), ratio: contrast(rgba(color), background),
        minimum: state.minimum, kind: 'syntax'
      });
    }
    for (const id of stateIndicators) {
      rows.push({
        group: `state-indicator/${id}`, foreground: id, backgrounds: state.backgrounds,
        color: c[id], background: hex(background), ratio: contrast(rgba(c[id]), background),
        minimum: 3, kind: 'indicator'
      });
    }
  }
  const { records, excluded } = workbenchCases(c);
  for (const record of records) {
    const background = resolveBackground(c, record.backgrounds);
    rows.push({
      group: `ui/${record.foreground}`, ...record, color: c[record.foreground],
      background: hex(background), ratio: contrast(rgba(c[record.foreground]), background)
    });
    if (record.kind === 'text' && /^(input|settings|inlineChatInput)\./.test(record.foreground) && c['selection.background']) {
      const backgrounds = [...record.backgrounds, 'selection.background'];
      const selected = resolveBackground(c, backgrounds);
      rows.push({
        group: `input-selection/${record.foreground}`, foreground: record.foreground,
        backgrounds, color: c[record.foreground], background: hex(selected),
        ratio: contrast(rgba(c[record.foreground]), selected),
        minimum: record.minimum, kind: 'text'
      });
    }
  }
  for (const state of ['selectionBackground', 'inactiveSelectionBackground', 'findMatchBackground', 'findMatchHighlightBackground']) {
    if (!c[`terminal.${state}`] || !c['terminal.background']) continue;
    const backgrounds = ['terminal.background', `terminal.${state}`];
    const background = resolveBackground(c, backgrounds);
    for (const [foreground, color] of Object.entries(c).filter(([id]) => /^terminal\.(ansi|foreground)/.test(id))) {
      rows.push({
        group: `terminal/${state}`, foreground, backgrounds, color, background: hex(background),
        ratio: contrast(rgba(color), background), minimum: 4.5, kind: 'text'
      });
    }
  }
  if (c['editorUnnecessaryCode.opacity']) {
    const opacity = rgba(c['editorUnnecessaryCode.opacity'])[3];
    for (const state of states.filter(state => state.name.startsWith('editor/'))) {
      const background = resolveBackground(c, state.backgrounds);
      for (const [foreground, color] of syntax) {
        const value = rgba(color);
        value[3] *= opacity;
        rows.push({
          group: `unnecessary/${state.name}`, foreground, color, backgrounds: state.backgrounds,
          background: hex(background), ratio: contrast(value, background), minimum: 4.5, kind: 'syntax'
        });
      }
    }
  }
  const cvd = adjacentPairs.map(([left, right, context]) => {
    const leftColor = colorToHex(model.tokens.get(`semantic.syntax.${left}`));
    const rightColor = colorToHex(model.tokens.get(`semantic.syntax.${right}`));
    const modes = Object.fromEntries(visionModes.map(mode =>
      [mode, difference(rgba(leftColor), rgba(rightColor), mode)]));
    return { left, right, context, leftColor, rightColor, modes };
  });
  return { key: model.variant.key, name: theme.name, rows, cvd, excluded };
}

export function failures(result) {
  return [
    ...result.rows.filter(row => row.ratio < row.minimum).map(row =>
      `${row.group}: ${row.foreground} on ${row.backgrounds.join(' + ')} = ${row.ratio.toFixed(5)} < ${row.minimum}`),
    ...result.cvd.flatMap(pair => Object.entries(pair.modes).filter(([, value]) =>
      value.distance < differentiationFloor).map(([mode, value]) =>
      `${pair.left}/${pair.right} (${mode}) = ${value.distance.toFixed(6)} < ${differentiationFloor}`))
  ];
}

function summarize(rows) {
  const groups = new Map();
  for (const row of rows) {
    const current = groups.get(row.group) ?? { count: 0, underTarget: 0, belowMinimum: 0, worst: row };
    current.count++;
    current.underTarget += Number(row.kind !== 'indicator' && row.ratio < 7);
    current.belowMinimum += Number(row.ratio < row.minimum);
    if (row.ratio < current.worst.ratio) current.worst = row;
    groups.set(row.group, current);
  }
  return groups;
}

export function renderReport(results, outputs) {
  const lines = [
    '# Generated color-accessibility evidence', '',
    'Generated by `npm run accessibility:generate`; verified read-only by `npm run accessibility`.',
    'Method, contexts, exclusions and limits: [accessibility contract](accessibility.md).',
    'Ratios are calculated without rounding; displayed rounding never determines a pass.',
    'This report is color-model evidence, not whole-application WCAG conformance or a CVD user study.', '',
    '## Variant results', '',
    '| Variant | Text/state/indicator measurements | Below assigned minimum | CVD pairs below 0.05 (any mode) | Enforcement |',
    '|---|---:|---:|---:|---|'
  ];
  for (const result of results) {
    const failedPairs = result.cvd.filter(pair => Object.values(pair.modes).some(value => value.distance < differentiationFloor)).length;
    lines.push(`| ${result.name} | ${result.rows.length} | ${result.rows.filter(row => row.ratio < row.minimum).length} | ${failedPairs} | ${result.key === 'contrast' ? 'All assigned floors block release' : 'v3.1.0 bytes frozen; historical shortfalls explicitly retained'} |`);
  }
  lines.push('', 'The 7:1 base/current-line syntax and primary UI targets are blocking. Other meaningful text has a blocking 4.5:1 floor; meaningful indicators have 3:1. The below-7 column exposes transient/secondary text that meets its floor but misses the enhanced target.', '');
  for (const result of results) {
    lines.push(`## ${result.name}`, '',
      '| Rendering state / foreground | Samples | Minimum ratio | Required | Below 7 text | Below required | Limiting foreground | Limiting background stack |',
      '|---|---:|---:|---:|---:|---:|---|---|');
    for (const [group, value] of summarize(result.rows)) {
      const row = value.worst;
      lines.push(`| ${group} | ${value.count} | ${row.ratio.toFixed(3)} | ${row.minimum} | ${value.underTarget} | ${value.belowMinimum} | ${row.foreground} \`${row.color}\` | ${row.backgrounds.join(' + ')} = \`${row.background}\` |`);
    }
    lines.push('', '### Selected semantic pairs', '',
      '| Pair | Normal | Deuteranopia | Protanopia | Tritanopia | Gamut clipping | Under 0.04 / 0.05 / 0.06 | Context |',
      '|---|---:|---:|---:|---:|---|---|---|');
    for (const pair of result.cvd) {
      const values = visionModes.map(mode => pair.modes[mode].distance);
      lines.push(`| ${pair.left} / ${pair.right} | ${values.map(value => value.toFixed(5)).join(' | ')} | ${visionModes.filter(mode => pair.modes[mode].clipped).join(', ') || 'none'} | ${[0.04, 0.05, 0.06].map(floor => values.filter(value => value < floor).length).join(' / ')} | ${pair.context.replaceAll('|', '\\|')} |`);
    }
  }
  lines.push('', '## Classification and exclusions (Contrast)', '',
    'Background rows are measured through the syntax stacks and associated foreground/boundary pairs; they are not independently required to differ 3:1 from another fill. Low-opacity selections rely on host selection geometry and accessible selected-state information. Their fill alone is not a 3:1 focus indicator.', '',
    '| Color ID | Treatment / reason |', '|---|---|');
  for (const item of results.find(result => result.key === 'contrast').excluded) lines.push(`| ${item.id} | ${item.reason} |`);
  lines.push('', '## Generated theme fingerprints', '', '| File | SHA-256 |', '|---|---|');
  for (const [file, bytes] of outputs) lines.push(`| ${file} | \`${createHash('sha256').update(bytes).digest('hex')}\` |`);
  lines.push('', 'Legacy has only its frozen authored contexts; absent modern contexts are not fabricated from Dark+ defaults. Its unsupported TextMate backgrounds are not treated as rendered text backgrounds. No historical variant is represented as passing the Contrast contract.', '');
  return lines.join('\n');
}

export function buildEvidence(sources = loadSources()) {
  const outputs = buildThemes(sources);
  const results = compileSources(sources).map(model =>
    evaluateTheme(JSON.parse(outputs.get(model.variant.output)), model));
  return { results, report: renderReport(results, outputs) };
}

export function checkEvidence(report, path) {
  assert.equal(readFileSync(path, 'utf8'), report, 'Accessibility evidence drift: run npm run accessibility:generate and review the changes');
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [argument, ...extra] = process.argv.slice(2);
  assert.ok(extra.length === 0 && [undefined, '--generate'].includes(argument),
    'Usage: node scripts/accessibility.mjs [--generate]');
  const { results, report } = buildEvidence();
  const path = resolve(root, 'docs', 'accessibility-report.md');
  if (argument === '--generate') writeFileSync(path, report);
  const errors = failures(results.find(result => result.key === 'contrast'));
  if (errors.length) {
    const first = errors.slice(0, 30).join('\n');
    throw new Error(`Contrast accessibility failures (${errors.length}):\n${first}\nSee docs/accessibility-report.md for every state summary.`);
  }
  if (argument !== '--generate') checkEvidence(report, path);
  console.log(`Accessibility: ${results.find(result => result.key === 'contrast').rows.length} Contrast measurements and ${adjacentPairs.length * visionModes.length} CVD pair/modes passed; four variants reported.`);
}
