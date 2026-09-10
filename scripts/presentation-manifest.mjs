import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { root, stableJson } from './tokens.mjs';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');

export function presentationManifest() {
  const manifest = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
  const images = readdirSync(resolve(root, 'screenshots')).filter(file => file.endsWith('.png')).sort();
  return {
    host: { version: '1.136.2', commit: '88e44fa0e00b08f7758b4f6d05632e4fd5e4df6f', surface: 'serve-web', platform: 'Windows', scale: 1 },
    darkThemeBaseline: '3.2.0',
    lightCapture: {
      date: '2026-09-09',
      extensionVersion: '3.5.0',
      vsixSha256: '481678b26be23ad5a1bd78d6774b9fabbade9ecd505d55627954b86814902be7',
      themeId: 'specials-board-light',
      themeSha256: 'de97e30675d06d9dfbfeb7d460cc9b461ea7373afa46f43063a9c1c88f297547'
    },
    themes: manifest.contributes.themes.map(theme => ({
      id: theme.id,
      sha256: hash(readFileSync(resolve(root, theme.path)))
    })),
    images: images.map(file => {
      const bytes = readFileSync(resolve(root, 'screenshots', file));
      if (bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') throw new Error(`Not a PNG: ${file}`);
      return { file, width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), bytes: bytes.length, sha256: hash(bytes) };
    })
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  writeFileSync(resolve(root, 'screenshots', 'manifest.json'), stableJson(presentationManifest()));
  console.log('Recorded screenshot dimensions, byte lengths and exact theme/image hashes.');
}
