import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { createHighlighter } from 'shiki';
import { presentationManifest } from '../scripts/presentation-manifest.mjs';
import { root, stableJson } from '../scripts/tokens.mjs';

const read = file => readFileSync(resolve(root, file), 'utf8');
const manifest = JSON.parse(read('package.json'));
const scenes = [
  'classic-python', 'contrast-merge', 'contrast-review', 'contrast-systems',
  'flagship-content', 'flagship-tsx', 'flagship-web', 'flagship-workbench', 'legacy-code'
];

test('presentation preserves every shipped 3.2.0 theme byte and contribution contract', () => {
  const hashes = [
    'fdee4d1b84ec6c0edf0d57d800c66353b7cfacf5c2506d8a9f44f5e87c5fb361',
    '0b2711e4f39bda94aaa638724fd745f4dea9afe54a25e439c7c7323fdaf35cd4',
    'f5489903fa820f0a1fe85678b8352e45c36eb0b8413c6be5492e3287e456f7ff',
    'fee187b5cac5c7f04ee4ca00a5bbb56ced8453c22487ccaeccf67950eb9ba5dc'
  ];
  assert.equal(manifest.engines.vscode, '^1.101.0');
  assert.equal(manifest.publisher, 'filipmares');
  assert.equal(manifest.name, 'theme-specialsboard');
  assert.equal(manifest.main, undefined);
  assert.equal(manifest.activationEvents, undefined);
  assert.equal(manifest.dependencies, undefined);
  manifest.contributes.themes.forEach((theme, index) => {
    assert.equal(createHash('sha256').update(readFileSync(resolve(root, theme.path))).digest('hex'), hashes[index]);
  });
});

test('nine lossless, bounded screenshots match their recorded hashes and sources', () => {
  const data = presentationManifest();
  assert.equal(read('screenshots/manifest.json'), stableJson(data));
  assert.deepEqual(data.images.map(image => image.file), scenes.map(scene => `${scene}.png`));
  assert.ok(data.images.reduce((size, image) => size + image.bytes, 0) < 3 * 1024 * 1024);
  for (const image of data.images) {
    assert.equal(image.width, 1440);
    assert.equal(image.height, 1000);
    assert.ok(image.bytes < 400 * 1024, `${image.file}: exceeds the lossless image budget`);
    assert.ok(read('docs/gallery.md').includes(image.file), `${image.file}: no gallery description`);
  }
});

test('public Markdown uses described images, valid local/tagged links and parseable JSON examples', () => {
  const files = [
    'README.md', 'CHANGELOG.md', 'vsc-extension-quickstart.md',
    ...readdirSync(resolve(root, 'docs')).filter(file => file.endsWith('.md')).map(file => `docs/${file}`)
  ];
  for (const file of files) {
    const text = read(file);
    for (const [, json] of text.matchAll(/```json\r?\n([\s\S]*?)```/g)) assert.doesNotThrow(() => JSON.parse(json), file);
    for (const [, image, label, target] of text.matchAll(/(!?)\[([^\]\n]*)\]\(([^)\s]+)\)/g)) {
      if (image) assert.ok(label.length >= 24, `${file}: image needs meaningful alt text`);
      let local;
      const ownTag = `https://github.com/filipmares/vscode-specialsboard-theme/blob/v${manifest.version}/`;
      const ownRaw = `https://raw.githubusercontent.com/filipmares/vscode-specialsboard-theme/v${manifest.version}/`;
      if (target.startsWith(ownTag)) local = resolve(root, decodeURIComponent(target.slice(ownTag.length).split('#')[0]));
      else if (target.startsWith(ownRaw)) local = resolve(root, decodeURIComponent(target.slice(ownRaw.length).split('#')[0]));
      else if (!/^[a-z]+:/.test(target)) local = target.startsWith('#')
        ? resolve(root, file)
        : resolve(root, dirname(file), decodeURIComponent(target.split('#')[0]));
      if (local) assert.ok(existsSync(local), `${file}: missing ${target}`);
      const fragment = target.split('#')[1];
      if (local?.endsWith('.md') && fragment) {
        const headings = [...readFileSync(local, 'utf8').matchAll(/^#{1,6} (.+)$/gm)]
          .map(([, heading]) => heading.trim().toLowerCase().replace(/[^\p{L}\p{N}_\-\s]/gu, '').replace(/\s/g, '-'));
        assert.ok(headings.includes(decodeURIComponent(fragment)), `${file}: missing heading ${target}`);
      }
      if (file === 'README.md') assert.match(target, /^https:\/\//, 'Marketplace links must be explicit HTTPS URLs');
    }
    if (file === 'README.md') {
      assert.doesNotMatch(text, /<(?:script|iframe|style|details|video)\b/i);
      assert.ok(text.includes('not a claim that this theme makes'));
      for (const theme of manifest.contributes.themes) {
        assert.ok(text.includes(theme.label));
        assert.ok(text.includes(theme.id));
      }
    }
  }
  assert.equal(JSON.parse(read('package-lock.json')).version, manifest.version);
  assert.equal(JSON.parse(read('package-lock.json')).packages[''].version, manifest.version);
  assert.ok(manifest.keywords.length <= 30);
});

test('presentation fixtures tokenize with shipped themes without losing source text', async () => {
  const cases = [
    ['menu.ts', 'typescript'], ['board.tsx', 'tsx'], ['python.py', 'python'],
    ['regex.js', 'javascript'], ['menu.rs', 'rust'], ['menu.go', 'go'],
    ['index.html', 'html'], ['menu.css', 'css'], ['menu.md', 'markdown'],
    ['menu.jsonc', 'jsonc'], ['menu.before.json', 'json'], ['menu.after.json', 'json']
  ];
  const themes = manifest.contributes.themes.map(({ path }) => {
    const { semanticTokenColors, ...theme } = JSON.parse(read(path));
    return { ...theme, semanticHighlighting: false };
  });
  const highlighter = await createHighlighter({ themes, langs: [...new Set(cases.map(([, lang]) => lang))] });
  try {
    for (const [file, lang] of cases) {
      const source = read(`test files/presentation/${file}`).replaceAll('\r\n', '\n');
      for (const theme of themes) {
        const tokens = highlighter.codeToTokensBase(source, { lang, theme: theme.name });
        assert.equal(tokens.map(line => line.map(token => token.content).join('')).join('\n'), source, `${theme.name}: ${file}`);
        assert.ok(new Set(tokens.flat().map(token => token.color)).size >= 3, `${theme.name}: ${file} has no meaningful tokenization`);
      }
    }
    for (const file of readdirSync(resolve(root, 'test files', 'presentation')).filter(file => file.endsWith('.json'))) {
      assert.doesNotThrow(() => JSON.parse(read(`test files/presentation/${file}`)), file);
    }
  } finally {
    highlighter.dispose();
  }
});
