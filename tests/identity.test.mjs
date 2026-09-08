import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { createHighlighter } from 'shiki';
import { buildThemes } from '../scripts/generate.mjs';
import { aliasTarget, colorToHex, compileSources, flattenTokens, loadSources, root } from '../scripts/tokens.mjs';

const sources = loadSources();
const models = compileSources(sources);
const themes = [...buildThemes(sources).values()].map(JSON.parse);
const model = key => models.find(entry => entry.variant.key === key);
const color = (key, role) => colorToHex(model(key).tokens.get(`semantic.${role}`));

test('Classic native swatches and flagship judgments define the role families', () => {
  const expected = {
    'surface.canvas': ['#302e2c', '#2b2b2b'],
    'text.primary': ['#e6e1dc', '#e6e1dc'],
    'syntax.keyword': ['#d99559', '#cc762e'],
    'syntax.string': ['#b2c879', '#a0c25f'],
    'syntax.number': ['#8aafcb', '#6c99bb'],
    'syntax.function': ['#e08066', '#da4632'],
    'syntax.variable': ['#cec8e8', '#e6e1dc'],
    'syntax.type': ['#efc17b', '#ffc05c'],
    'syntax.attribute': ['#dfab73', '#cc7832'],
    'syntax.regexp': ['#b18adb', '#8856d2'],
    'syntax.escape': ['#cca5ed', '#be73fd'],
    'syntax.comment': ['#a39a90', '#8a847d'],
    'feedback.error': ['#ed746b', '#ed746b'],
    'feedback.invalid-text': ['#ed746b', '#ed746b']
  };
  for (const [role, values] of Object.entries(expected)) {
    for (const [index, key] of ['flagship', 'classic'].entries()) {
      assert.equal(color(key, role), values[index], `${key}: ${role}`);
    }
  }
});

test('restored role aliases remove old language-specific color exceptions', () => {
  const families = {
    keyword: ['storage', 'control', 'class-declaration', 'import', 'module-keyword', 'operator-word'],
    variable: ['parameter', 'parameter-accent', 'parameter-secondary', 'variable-language', 'variable-platform'],
    function: ['function-builtin', 'method-special', 'decorator'],
    type: ['tag', 'component', 'type-primitive', 'type-builtin', 'type-inherited', 'selector'],
    attribute: ['property', 'property-accent', 'property-platform'],
    number: ['constant', 'constant-builtin', 'constant-special', 'color-literal', 'unit'],
    string: ['template-text', 'template-delimiter'],
    regexp: ['regexp-quantifier'],
    escape: ['regexp-character-class'],
    comment: ['comment-link']
  };
  for (const key of ['flagship', 'classic', 'contrast']) {
    for (const [parent, roles] of Object.entries(families)) {
      for (const role of roles) assert.equal(color(key, `syntax.${role}`), color(key, `syntax.${parent}`), `${key}: ${role}`);
    }
  }
});

function contrastRatio(foreground, background) {
  const luminance = value => {
    const channels = value.components.map(channel =>
      channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
    );
    return channels.reduce((sum, channel, i) => sum + channel * [0.2126, 0.7152, 0.0722][i], 0);
  };
  const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

test('deliberate flagship readability lifts improve on Classic, without claiming a broad accessibility gate', () => {
  for (const role of ['keyword', 'function', 'regexp', 'comment']) {
    const ratio = key => contrastRatio(model(key).tokens.get(`semantic.syntax.${role}`), model(key).tokens.get('semantic.surface.canvas'));
    assert.ok(ratio('flagship') > ratio('classic'), `${role} no longer improves on Classic`);
  }
  for (const key of ['flagship', 'classic']) {
    const tokens = model(key).tokens;
    assert.ok(contrastRatio(tokens.get('semantic.feedback.invalid-text'), tokens.get('semantic.surface.canvas')) > 4.5);
  }
});

test('all restored syntax, markup, feedback and diff roles terminate in cited Coda or judgment colors', () => {
  const base = new Map();
  for (const file of ['palette', 'semantic', 'components']) {
    for (const entry of flattenTokens(sources[file], sources.provenance, file)) base.set(...entry);
  }
  for (const key of ['flagship', 'classic', 'contrast']) {
    const tokens = new Map(base);
    for (const variant of key === 'flagship' ? ['flagship'] : ['flagship', key]) {
      for (const entry of flattenTokens(sources.overrides[variant], sources.provenance, variant)) tokens.set(...entry);
    }
    for (const path of tokens.keys()) {
      if (!/^semantic\.(syntax|markup|feedback|diff)\./.test(path)) continue;
      let target = path;
      while (typeof tokens.get(target).$value === 'string') target = aliasTarget(tokens.get(target).$value);
      assert.match(target, /^palette\.(coda1|phase2)\./, `${key}: ${path} still depends on ${target}`);
    }
  }
  assert.equal(sources.provenance.coda1.authority, 'authoritative-coda');
  assert.equal(sources.provenance['phase2-interpretation'].authority, 'judgment');
  assert.equal(sources.provenance['coda2-atom'].authority, 'reconstruction');
  for (const swatch of ['honey', 'orange', 'lavender']) {
    assert.match(sources.palette.palette.coda1[swatch].$extensions['org.specialsboard.provenance'].evidence, /seestyle/);
  }
});

test('Contrast stays a flagship preview; Legacy chrome, ANSI and selection stay isolated', () => {
  const [flagship, classic, contrast, legacy] = themes;
  assert.deepEqual({ ...contrast, name: flagship.name }, flagship);
  assert.notDeepEqual(classic.tokenColors, flagship.tokenColors);
  for (const theme of themes) {
    assert.deepEqual(Object.keys(theme.colors), Object.keys(legacy.colors));
    assert.equal(theme.colors['editor.selectionBackground'], '#6c99bb33');
    assert.equal(Object.hasOwn(theme, 'semanticHighlighting'), false);
    assert.equal(Object.hasOwn(theme, 'semanticTokenColors'), false);
    for (const [id, value] of Object.entries(legacy.colors)) {
      if (id.startsWith('terminal.')) assert.equal(theme.colors[id], value);
    }
  }
  assert.equal(sources.mapping.legacyTextMate.length, 156);
  const noOneDark = ['#abb2bf', '#e06c75', '#c678dd', '#98c379', '#61afef', '#56b6c2', '#d19a66', '#e5c07b'];
  for (const theme of [flagship, classic]) {
    for (const rule of theme.tokenColors) {
      assert.ok(!noOneDark.includes(rule.settings.foreground), rule.name);
    }
    const invalid = theme.tokenColors.find(rule => rule.scope === 'invalid');
    assert.deepEqual(invalid.settings, { foreground: '#ed746b', fontStyle: 'underline' });
  }
});

const fixtureCases = [
  ['index.html', 'html', [
    ['<html lang="en">', 'html', 'syntax.tag'],
    ['<html lang="en">', 'lang', 'syntax.property'],
    ['<html lang="en">', 'en', 'syntax.string'],
    ['Soup &amp; bread', '&amp;', 'syntax.constant'],
    ['<!-- A quiet comment,', 'A quiet comment,', 'syntax.comment', 1],
    ['const count = 3;', 'const', 'syntax.keyword'],
    ['const count = 3;', '3', 'syntax.number'],
    ['function label(item)', 'label', 'syntax.function'],
    ['class=nope "oops"', 'oops', 'feedback.invalid-text', 4]
  ]],
  ['stylesheet.css', 'css', [
    ['.special:hover::before', 'special', 'syntax.selector'],
    ['.special:hover::before', 'hover', 'syntax.selector'],
    ['background-color: olive', 'background-color', 'syntax.property'],
    ['background-color: olive', 'olive', 'syntax.constant'],
    ['color: #a0c25f', '#a0c25f', 'syntax.constant'],
    ['opacity: 0.75', '0.75', 'syntax.number'],
    ['--gap: 12px', '12', 'syntax.number'],
    ['--gap: 12px', 'px', 'syntax.number'],
    ['calc(2 * var', 'calc', 'syntax.function'],
    ['"Menu Serif"', 'Menu Serif', 'syntax.string']
  ]],
  ['source.ts', 'typescript', [
    ['export interface Special', 'export', 'syntax.keyword'],
    ['export interface Special', 'interface', 'syntax.keyword'],
    ['export interface Special', 'Special', 'syntax.type'],
    ['name: string', 'string', 'syntax.type'],
    ['name: string', 'name', 'syntax.property'],
    ['price: number', 'number', 'syntax.type'],
    ['export class Menu', 'class', 'syntax.keyword'],
    ['export class Menu', 'Menu', 'syntax.type'],
    ['format(item: Special, index', 'format', 'syntax.function'],
    ['format(item: Special, index', 'item', 'syntax.parameter'],
    ['index = 2', '2', 'syntax.number'],
    ['const available = true', 'true', 'syntax.constant'],
    ['${item.name}', 'name', 'syntax.property'],
    ['Math.round(item.price)', 'round', 'syntax.function'],
    ['\\n`', '\\n', 'syntax.escape'],
    ['{ name: "Soup", price: 12.5 }', 'name', 'syntax.property'],
    ['{ name: "Soup", price: 12.5 }', 'Soup', 'syntax.string']
  ]],
  ['source.js', 'javascript', [
    ['function format(item, count', 'format', 'syntax.function'],
    ['function format(item, count', 'item', 'syntax.parameter'],
    ['typeof item', 'typeof', 'syntax.keyword'],
    ['typeof item', 'item', 'syntax.variable'],
    ['${item.name}', 'name', 'syntax.property'],
    ['console.log(format', 'log', 'syntax.function'],
    ['Math.PI', 'PI', 'syntax.constant'],
    ['document.querySelector', 'querySelector', 'syntax.function'],
    ['.textContent = menu.name', 'textContent', 'syntax.property']
  ]],
  ['python.py', 'python', [
    ['from dataclasses import dataclass', 'from', 'syntax.keyword'],
    ['@dataclass', 'dataclass', 'syntax.function'],
    ['class Special', 'Special', 'syntax.type'],
    ['"""A docstring is documentation,', 'A docstring is documentation,', 'syntax.comment', 1],
    ['name: str', 'str', 'syntax.type'],
    ['def label(self, count: int', 'def', 'syntax.keyword'],
    ['def label(self, count: int', 'label', 'syntax.function'],
    ['def label(self, count: int', 'self', 'syntax.parameter'],
    ['def label(self, count: int', 'count', 'syntax.parameter'],
    ['available = True', 'True', 'syntax.constant'],
    ['{self.name}', 'name', 'syntax.property'],
    ['\\n"', '\\n', 'syntax.escape'],
    ['available and count', 'and', 'syntax.keyword'],
    ['print(special.label()', 'print', 'syntax.function'],
    ['print(special.label()', 'label', 'syntax.function'],
    ['(?P<name>[A-Z]\\w+)', '?P<name>', 'syntax.regexp'],
    ['(?P<name>[A-Z]\\w+)', '[A-Z]', 'syntax.escape'],
    ['(?P<name>[A-Z]\\w+)', '\\w', 'syntax.escape'],
    ['len(special.name)', 'len', 'syntax.function']
  ]],
  ['markdown.md', 'markdown', [
    ['# Daily specials', 'Daily specials', 'markup.heading', 2],
    ['Underlined heading', 'Underlined heading', 'text.primary'],
    ['------------------', '------------------', 'markup.heading', 2],
    ['Plain text stays', 'Plain text stays', 'text.primary'],
    ['**strong**', 'strong', 'markup.strong', 2],
    ['*emphasis*', 'emphasis', 'markup.emphasis', 1],
    ['***both***', 'both', 'markup.strong', 3],
    ['`inline code`', 'inline code', 'markup.code', 0],
    ['https://example.com/menu', 'https://example.com/menu', 'markup.link', 4],
    ['const price = 12.5;', 'const', 'syntax.keyword'],
    ['const price = 12.5;', '12.5', 'syntax.number'],
    ['function label(item: string)', 'label', 'syntax.function']
  ]],
  ['config.json', 'json', [
    ['"name": "Daily specials"', 'name', 'syntax.property'],
    ['"name": "Daily specials"', 'Daily specials', 'syntax.string'],
    ['"count": 3', '3', 'syntax.number'],
    ['"available": true', 'true', 'syntax.constant'],
    ['"fallback": null', 'null', 'syntax.constant'],
    ['"Soup\\nBread"', '\\n', 'syntax.escape'],
    ['"pattern": "\\\\b[A-Z]\\\\w+"', '[A-Z]', 'syntax.string']
  ]],
  ['config.yaml', 'yaml', [
    ['name: "Daily specials"', 'name', 'syntax.property'],
    ['name: "Daily specials"', 'Daily specials', 'syntax.string'],
    ['"count": 3', 'count', 'syntax.string'],
    ['"count": 3', '3', 'syntax.number'],
    ['available: true', 'true', 'syntax.constant'],
    ['"Soup\\nBread"', '\\n', 'syntax.escape']
  ]],
  ['regex.js', 'javascript', [
    ['(?<name>[A-Z]\\w+)', '[A-Z]', 'syntax.escape'],
    ['(?<name>[A-Z]\\w+)', '\\w', 'syntax.escape'],
    ['(?<price>\\d{2,4})', '\\d', 'syntax.escape'],
    ['(?<price>\\d{2,4})', '{2,4}', 'syntax.regexp'],
    ['const quoted = "\\\\b[A-Z]\\\\w+"', '[A-Z]', 'syntax.string'],
    ['const message = `Soup\\n${quoted}`', 'Soup', 'syntax.string'],
    ['const message = `Soup\\n${quoted}`', '\\n', 'syntax.escape'],
    ['const message = `Soup\\n${quoted}`', 'quoted', 'syntax.variable'],
    ['/soup|bread/i', 'soup', 'syntax.regexp'],
    ['/soup|bread/i', '/', 'syntax.regexp'],
    ['/soup|bread/i', '|', 'syntax.regexp']
  ]]
];

test('real TextMate grammars render language fixtures using the intended roles', async t => {
  const highlighter = await createHighlighter({
    themes: themes.filter(theme => theme.name !== 'Specials Board Legacy'),
    langs: [...new Set(fixtureCases.map(([, lang]) => lang))]
  });
  t.after(() => highlighter.dispose());
  for (const key of ['flagship', 'classic', 'contrast']) {
    for (const [file, lang, cases] of fixtureCases) {
      await t.test(`${key}: ${file}`, () => {
        const source = readFileSync(resolve(root, 'test files', 'identity', file), 'utf8').replaceAll('\r\n', '\n');
        const { tokens } = highlighter.codeToTokens(source, {
          lang, theme: model(key).variant.label, includeExplanation: true
        });
        for (const token of tokens.flat()) {
          if (token.explanation.some(entry => entry.scopes.some(scope => scope.scopeName.startsWith('string.regexp')))) {
            assert.ok(
              [color(key, 'syntax.regexp'), color(key, 'syntax.escape')].includes(token.color.toLowerCase()),
              `${file}: regex token ${JSON.stringify(token.content)} escaped the purple family`
            );
          }
        }
        for (const [context, text, role, fontStyle] of cases) {
          const contextStart = source.indexOf(context);
          assert.notEqual(contextStart, -1, `Missing fixture context: ${context}`);
          assert.notEqual(context.indexOf(text), -1, `Missing sample: ${text}`);
          const start = contextStart + context.indexOf(text);
          const end = start + text.length;
          const matches = tokens.flat().filter(token => token.offset < end && token.offset + token.content.length > start);
          assert.ok(matches.length, `No tokens for ${text}`);
          for (const token of matches) {
            const scopes = token.explanation.map(entry => entry.scopes.map(scope => scope.scopeName).join(' > '));
            const message = `${file}: ${JSON.stringify(text)} -> ${role}\n${scopes.join('\n')}`;
            assert.equal(token.color.toLowerCase(), color(key, role), message);
            if (fontStyle !== undefined) assert.equal(token.fontStyle, fontStyle, message);
            if (role === 'feedback.invalid-text') {
              const invalidScopes = token.explanation.flatMap(entry => entry.scopes).filter(scope => scope.scopeName.startsWith('invalid.'));
              assert.ok(invalidScopes.length, `Invalid sample lost its grammar scope: ${message}`);
              assert.ok(invalidScopes.every(scope => scope.themeMatches.some(match =>
                match.settings.foreground?.toLowerCase() === color(key, 'feedback.invalid-text') && match.settings.fontStyle === 'underline'
              )), `Invalid scope lost its red underlined treatment: ${message}`);
            }
          }
        }
      });
    }
  }
});
