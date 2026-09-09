import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { createHighlighter } from 'shiki';
import { buildThemes } from '../scripts/generate.mjs';
import { colorToHex, compileSources, loadSources, root } from '../scripts/tokens.mjs';

const sources = loadSources();
const models = compileSources(sources);
const outputs = buildThemes(sources);
const variants = ['flagship', 'classic', 'contrast'].map(key => {
  const model = models.find(entry => entry.variant.key === key);
  const generated = JSON.parse(outputs.get(model.variant.output));
  // Shiki runs TextMate, not a language server. Remove semantic rules explicitly
  // so these tests cannot mistake fallback rendering for semantic-token coverage.
  const { semanticTokenColors, ...textMateTheme } = generated;
  return {
    key,
    model,
    theme: { ...textMateTheme, semanticHighlighting: false },
  };
});

const readFixture = file =>
  readFileSync(resolve(root, 'test files', 'modern', file), 'utf8').replaceAll('\r\n', '\n');

// Each sample is [unique context, text, role, optional real grammar scope, style].
// Cases document observed grammar limits rather than inferring semantic meaning.
const fixtureCases = [
  ['source.ts', 'typescript', [
    ['export namespace Menu', 'namespace', 'syntax.keyword'],
    ['export namespace Menu', 'Menu', 'syntax.type', 'entity.name.type.module.ts'],
    ['export enum Course', 'Course', 'syntax.type'],
    ['Starter = "starter"', 'Starter', 'syntax.constant', 'variable.other.enummember.ts'],
    ['Starter = "starter"', 'starter', 'syntax.string'],
    ['readonly id: string', 'readonly', 'syntax.keyword', 'storage.modifier.ts'],
    ['readonly id: string', 'id', 'syntax.property'],
    ['readonly id: string', 'string', 'syntax.type'],
    ['export type Lookup', 'Lookup', 'syntax.type'],
    ['Readonly<Record<string, Entry>>', 'Readonly', 'syntax.type'],
    ['describe(entry: Menu.Entry', 'describe', 'syntax.function'],
    ['describe(entry: Menu.Entry', 'entry', 'syntax.parameter', 'variable.parameter.ts'],
    ['describe(entry: Menu.Entry', 'Menu', 'syntax.type'],
    ['describe(entry: Menu.Entry', 'Entry', 'syntax.type'],
    ['quantity: number = 1', 'quantity', 'syntax.parameter'],
    ['quantity: number = 1', 'number', 'syntax.type'],
    ['quantity: number = 1', '1', 'syntax.number'],
    // A const declaration has a constant scope, not semantic variable.readonly.
    ['const total = entry.price', 'total', 'syntax.constant', 'variable.other.constant.ts'],
    ['const total = entry.price', 'price', 'syntax.property'],
    ['let selected: Menu.Entry', 'selected', 'syntax.variable', 'variable.other.readwrite.ts'],
    // The same enum member is only a property at this use site in TextMate.
    ['course: Menu.Course.Starter', 'Starter', 'syntax.property', 'variable.other.property.ts'],
    ['${entry.title}:', 'title', 'syntax.property'],
    ['total.toFixed(2)', 'toFixed', 'syntax.function'],
    ['total.toFixed(2)}\\n', '\\n', 'syntax.escape'],
    ['{ available: true }', 'available', 'syntax.property'],
    ['{ available: true }', 'true', 'syntax.constant'],
    ['describe(nested[0].entries[0], 2)', '[', 'syntax.punctuation'],
    ['describe(nested[0].entries[0], 2)', '0', 'syntax.number'],
    ['/** Format a menu entry.', 'Format a menu entry.', 'syntax.comment', undefined, 1],
  ]],
  ['board.tsx', 'tsx', [
    ['declare global {', 'declare', 'syntax.keyword'],
    ['namespace JSX {', 'JSX', 'syntax.type'],
    ['interface Element {}', 'Element', 'syntax.type'],
    ['interface BoardProps', 'BoardProps', 'syntax.type'],
    ['readonly entries: readonly Menu.Entry[]', 'readonly', 'syntax.keyword'],
    ['readonly entries: readonly Menu.Entry[]', 'entries', 'syntax.property'],
    ['function Board({ entries, heading', 'Board', 'syntax.function'],
    ['function Board({ entries, heading', 'entries', 'syntax.parameter'],
    ['heading = "Today\'s specials"', "Today's specials", 'syntax.string'],
    ['<section aria-label={heading}>', 'section', 'syntax.tag'],
    ['<section aria-label={heading}>', 'aria-label', 'syntax.property'],
    ['<section aria-label={heading}>', 'heading', 'syntax.variable'],
    ['entries.map((entry) =>', 'map', 'syntax.function'],
    ['entries.map((entry) =>', 'entry', 'syntax.parameter'],
    ['<li key={entry.id} title=', 'key', 'syntax.property'],
    ['<li key={entry.id} title=', 'id', 'syntax.property'],
    ['title={describe(entry, 1)}', 'describe', 'syntax.function'],
    ['title={describe(entry, 1)}', '1', 'syntax.number'],
    ['{entry.price.toFixed(2)}', 'price', 'syntax.property'],
    ['{entry.price.toFixed(2)}', 'toFixed', 'syntax.function'],
    ['{entry.price.toFixed(2)}', '{', 'syntax.punctuation'],
    ['{entry.price.toFixed(2)}', '(', 'syntax.punctuation'],
    ['{entry.price.toFixed(2)}', ')', 'syntax.punctuation'],
    ['{entry.price.toFixed(2)}', '}', 'syntax.punctuation'],
  ]],
  ['menu.json', 'json', [
    ['"name": "Garden menu"', 'name', 'syntax.property'],
    ['"name": "Garden menu"', 'Garden menu', 'syntax.string'],
    ['"enabled": true', 'true', 'syntax.constant'],
    ['"fallback": null', 'null', 'syntax.constant'],
    ['"revision": 3', '3', 'syntax.number'],
    ['"price": 12.5', '12.5', 'syntax.number'],
    ['"note": "Soup\\nBread"', '\\n', 'syntax.escape'],
    ['"path": "menus\\\\daily"', '\\\\', 'syntax.escape'],
    ['"layout": { "columns": [{ "width": 2 }] }', 'width', 'syntax.property'],
    ['"layout": { "columns": [{ "width": 2 }] }', '[', 'syntax.punctuation'],
    ['"layout": { "columns": [{ "width": 2 }] }', '}', 'syntax.punctuation'],
  ]],
  ['settings.jsonc', 'jsonc', [
    ['// Keep the grammar fallback visible', 'Keep the grammar fallback visible', 'syntax.comment', undefined, 1],
    ['/* Quoted keys, a block comment', 'Quoted keys, a block comment', 'syntax.comment', undefined, 1],
    ['"editor.semanticHighlighting.enabled": false', 'editor.semanticHighlighting.enabled', 'syntax.property'],
    ['"editor.semanticHighlighting.enabled": false', 'false', 'syntax.constant'],
    ['"editor.guides.bracketPairs": "active"', 'active', 'syntax.string'],
    ['"count": 3', '3', 'syntax.number'],
    ['"note": "Soup\\nBread"', '\\n', 'syntax.escape'],
    ['"groups": [{ "entries": ["soup", "salad"] }],', 'entries', 'syntax.property'],
    ['"groups": [{ "entries": ["soup", "salad"] }],', 'soup', 'syntax.string'],
    ['"groups": [{ "entries": ["soup", "salad"] }],', ',', 'syntax.punctuation'],
  ]],
  ['menu.yaml', 'yaml', [
    ['# Plain keys are properties', 'Plain keys are properties', 'syntax.comment', undefined, 1],
    ['defaults: &defaults', 'defaults', 'syntax.property'],
    ['&defaults', 'defaults', 'syntax.type', 'entity.name.type.anchor.yaml'],
    ['*defaults', 'defaults', 'syntax.variable', 'variable.other.alias.yaml'],
    // This grammar does not distinguish quoted keys from quoted string values.
    ['"course": "starter"', 'course', 'syntax.string', 'string.quoted.double.yaml'],
    ['"course": "starter"', 'starter', 'syntax.string'],
    ['enabled: true', 'true', 'syntax.constant'],
    ['price: 12.5', '12.5', 'syntax.number'],
    ['note: "Soup\\nBread"', '\\n', 'syntax.escape'],
    ['id: soup', 'id', 'syntax.property'],
    ['id: soup', 'soup', 'syntax.string'],
    ['detail: { portions: [1, 2], fresh: true }', 'portions', 'syntax.property'],
    ['detail: { portions: [1, 2], fresh: true }', '[', 'syntax.punctuation'],
    ['fallback: null', 'null', 'syntax.constant'],
    ['message: |', '|', 'syntax.keyword'],
    ['  Garden soup', 'Garden soup', 'syntax.string'],
  ]],
  ['menu.sh', 'shellscript', [
    ['# Hover and shell diagnostics', 'Hover and shell diagnostics', 'syntax.comment', undefined, 1],
    ['readonly BOARD_NAME=', 'readonly', 'syntax.keyword'],
    // readonly changes the command's behavior, not its variable TextMate scope.
    ['readonly BOARD_NAME=', 'BOARD_NAME', 'syntax.variable', 'variable.other.assignment.shell'],
    ['BOARD_NAME="Garden menu"', 'Garden menu', 'syntax.string'],
    ['portions=2', 'portions', 'syntax.variable'],
    // Bare assignment values are shell strings, even when the text is numeric.
    ['portions=2', '2', 'syntax.string', 'string.unquoted.shell'],
    ['format_special() {', 'format_special', 'syntax.function'],
    ['local item="$1"', 'local', 'syntax.keyword'],
    ['local item="$1"', 'item', 'syntax.variable'],
    ['local item="$1"', '$1', 'syntax.parameter', 'variable.parameter.positional.shell'],
    ['local count="${2:-1}"', '2', 'syntax.parameter'],
    ['printf \'%s: %s x %s\\n\'', 'printf', 'syntax.function'],
    ['for item in "${items[@]}"; do', 'for', 'syntax.keyword'],
    ['for item in "${items[@]}"; do', 'item', 'syntax.variable'],
    ['for item in "${items[@]}"; do', 'items', 'syntax.variable'],
    ['if [[ "$item" == soup*', 'if', 'syntax.keyword'],
    ['message="$(format_special', 'format_special', 'syntax.function'],
  ]],
  ['menu.rs', 'rust', [
    ['const BOARD_NAME: &str', 'const', 'syntax.keyword'],
    ['const BOARD_NAME: &str', 'BOARD_NAME', 'syntax.constant'],
    ['const BOARD_NAME: &str', 'str', 'syntax.type'],
    ['enum Course {', 'Course', 'syntax.type'],
    // Rust's grammar marks these enum variants as types, not enum members.
    ['    Starter,', 'Starter', 'syntax.type', 'entity.name.type.rust'],
    ['struct Entry {', 'Entry', 'syntax.type'],
    ['price: f64,', 'f64', 'syntax.type'],
    ['fn describe(entry: &Entry', 'fn', 'syntax.keyword'],
    ['fn describe(entry: &Entry', 'describe', 'syntax.function'],
    // The grammar shares variable.other for fields, parameters and local values.
    ['fn describe(entry: &Entry', 'entry', 'syntax.variable', 'variable.other.rust'],
    ["title: &'static str", 'title', 'syntax.variable', 'variable.other.rust'],
    ['quantity: u32', 'u32', 'syntax.type'],
    ['-> String {', 'String', 'syntax.type'],
    ['let total = entry.price', 'total', 'syntax.variable'],
    ['let total = entry.price', 'price', 'text.primary'],
    ['f64::from(quantity)', 'from', 'syntax.function'],
    ['format!("{}: {:.2}"', 'format!', 'syntax.function'],
    ['let mut entries', 'mut', 'syntax.keyword'],
    ['let mut entries', 'entries', 'syntax.variable'],
    ['title: "Soup", price: 12.5', 'Soup', 'syntax.string'],
    // Decimal punctuation currently takes the neutral punctuation fallback.
    ['title: "Soup", price: 12.5', '12', 'syntax.number'],
    ['title: "Soup", price: 12.5', '.', 'syntax.punctuation', 'punctuation.separator.dot.decimal.rust'],
    ['title: "Soup", price: 12.5', '5', 'syntax.number'],
    ['course: Course::Starter', 'Starter', 'syntax.type'],
    ['[(entries.as_slice(), [1, 2])]', '[', 'syntax.punctuation'],
    ['[(entries.as_slice(), [1, 2])]', '(', 'syntax.punctuation'],
    ['/// Format an entry', 'Format an entry', 'syntax.comment', undefined, 1],
  ]],
  ['menu.go', 'go', [
    ['package main', 'package', 'syntax.keyword'],
    ['package main', 'main', 'syntax.type'],
    ['import "fmt"', 'import', 'syntax.keyword'],
    ['import "fmt"', 'fmt', 'syntax.string'],
    ['const boardName', 'boardName', 'syntax.constant'],
    ['type Course string', 'Course', 'syntax.type'],
    // Go builtins use storage.type, so the existing storage fallback is orange.
    ['type Course string', 'string', 'syntax.keyword', 'storage.type.string.go'],
    ['Starter Course = "starter"', 'Starter', 'syntax.constant'],
    ['Title  string', 'Title', 'syntax.property'],
    ['Price  float64', 'float64', 'syntax.keyword', 'storage.type.numeric.go'],
    ['func Describe(entry Entry, quantity int)', 'Describe', 'syntax.function'],
    ['func Describe(entry Entry, quantity int)', 'entry', 'syntax.parameter'],
    ['func Describe(entry Entry, quantity int)', 'quantity', 'syntax.parameter'],
    ['func Describe(entry Entry, quantity int)', 'int', 'syntax.keyword'],
    ['total := entry.Price', 'total', 'syntax.variable'],
    // Selector properties and package receivers both get variable.other.go.
    ['total := entry.Price', 'Price', 'syntax.variable', 'variable.other.go'],
    ['fmt.Sprintf', 'fmt', 'syntax.variable', 'variable.other.go'],
    ['fmt.Sprintf', 'Sprintf', 'syntax.function'],
    ['Entry{Title: "Soup", Price: 12.5', 'Title', 'syntax.property'],
    ['Entry{Title: "Soup", Price: 12.5', 'Soup', 'syntax.string'],
    ['Entry{Title: "Soup", Price: 12.5', '12.5', 'syntax.number'],
    ['map[string][]Entry{"lunch": {soup}}', 'lunch', 'syntax.string'],
    ['map[string][]Entry{"lunch": {soup}}', '[', 'syntax.punctuation'],
    ['Describe(items[0], 2)', 'Describe', 'syntax.function'],
    ['Describe(items[0], 2)', '2', 'syntax.number'],
    ['// Describe formats an entry', 'Describe formats an entry', 'syntax.comment', undefined, 1],
  ]],
  ['menu.diff', 'diff', [
    ['--- a/menu.json', 'a/menu.json', 'diff.header'],
    ['+++ b/menu.json', 'b/menu.json', 'diff.header'],
    ['-  "name": "Winter menu"', 'Winter menu', 'diff.deleted'],
    ['-  "price": 11.5', '11.5', 'diff.deleted'],
    ['+  "name": "Garden menu"', 'Garden menu', 'diff.inserted'],
    ['+  "price": 12.5', '12.5', 'diff.inserted'],
  ]],
];

function assertSamples(highlighter, variant, file, lang, source, cases) {
  const { tokens } = highlighter.codeToTokens(source, {
    lang,
    theme: variant.theme.name,
    includeExplanation: true,
  });
  const flattened = tokens.flat();
  for (const [context, text, role, scope, fontStyle] of cases) {
    const contextStart = source.indexOf(context);
    assert.notEqual(contextStart, -1, `${file}: missing context ${JSON.stringify(context)}`);
    assert.notEqual(context.indexOf(text), -1, `${file}: missing sample ${JSON.stringify(text)}`);
    const start = contextStart + context.indexOf(text);
    const end = start + text.length;
    const matches = flattened.filter(token => token.offset < end && token.offset + token.content.length > start);
    assert.ok(matches.length, `${file}: no tokens for ${text}`);
    const scopes = matches.flatMap(token => token.explanation.flatMap(entry => entry.scopes.map(entry => entry.scopeName)));
    const message = `${variant.key}: ${file}: ${JSON.stringify(text)} -> ${role}\n${[...new Set(scopes)].join(' > ')}`;
    const expected = colorToHex(variant.model.tokens.get(`semantic.${role}`));
    for (const token of matches) {
      assert.equal(token.color.toLowerCase(), expected, message);
      if (fontStyle !== undefined) assert.equal(token.fontStyle, fontStyle, message);
    }
    if (scope) assert.ok(scopes.includes(scope), `${message}\nExpected grammar scope: ${scope}`);
  }
}

test('modern language fixtures retain real TextMate colors with semantic highlighting off', async t => {
  const highlighter = await createHighlighter({
    themes: variants.map(variant => variant.theme),
    langs: [...fixtureCases.map(([, lang]) => lang), 'python', 'markdown'],
  });
  t.after(() => highlighter.dispose());
  for (const variant of variants) {
    assert.equal(variant.theme.semanticHighlighting, false);
    assert.equal(Object.hasOwn(variant.theme, 'semanticTokenColors'), false);
    for (const [file, lang, cases] of fixtureCases) {
      await t.test(`${variant.key}: ${file}`, () => {
        assertSamples(highlighter, variant, file, lang, readFixture(file), cases);
      });
    }
    await t.test(`${variant.key}: notebook cell languages (not notebook UI)`, () => {
      const notebook = JSON.parse(readFixture('menu.ipynb'));
      const markdown = notebook.cells.find(cell => cell.cell_type === 'markdown').source.join('');
      const python = notebook.cells.find(cell => cell.cell_type === 'code').source.join('');
      assertSamples(highlighter, variant, 'menu.ipynb:markdown', 'markdown', markdown, [
        ['# Garden menu', 'Garden menu', 'markup.heading', undefined, 2],
        ['**emphasis**', 'emphasis', 'markup.strong', undefined, 2],
        ['`inline code`', 'inline code', 'markup.code', undefined, 0],
      ]);
      assertSamples(highlighter, variant, 'menu.ipynb:python', 'python', python, [
        ['def describe(title: str', 'def', 'syntax.keyword'],
        ['def describe(title: str', 'describe', 'syntax.function'],
        ['def describe(title: str', 'title', 'syntax.parameter'],
        ['def describe(title: str', 'str', 'syntax.type'],
        ['quantity: int = 1', '1', 'syntax.number'],
        ['"price": 12.5', '12.5', 'syntax.number'],
      ]);
    });
  }
});

test('data and notebook fixtures are valid and the text merge sample has all four markers', () => {
  const menu = JSON.parse(readFixture('menu.json'));
  assert.equal(menu.specials[0].note, 'Soup\nBread');
  assert.equal(menu.layout.columns[0].width, 2);
  const notebook = JSON.parse(readFixture('menu.ipynb'));
  assert.equal(notebook.nbformat, 4);
  assert.equal(notebook.nbformat_minor, 5);
  assert.equal(notebook.metadata.language_info.name, 'python');
  assert.equal(new Set(notebook.cells.map(cell => cell.id)).size, notebook.cells.length);
  for (const cell of notebook.cells) {
    assert.ok(Array.isArray(cell.source));
    assert.ok(cell.source.every(line => typeof line === 'string'));
    if (cell.cell_type === 'code') {
      assert.equal(cell.execution_count, null);
      assert.deepEqual(cell.outputs, []);
    }
  }
  const conflict = readFixture('menu.merge.txt');
  for (const marker of ['<<<<<<< current', '||||||| base', '=======', '>>>>>>> incoming']) {
    assert.ok(conflict.includes(marker), `Missing merge inspection marker: ${marker}`);
  }
});
