import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import test from 'node:test';
import { root } from '../../scripts/tokens.mjs';

test('native platform archives are repeatable with canonical ZIP host metadata and LF documentation', t => {
  const directory = mkdtempSync(resolve(tmpdir(), 'specialsboard-archives-'));
  t.after(() => rmSync(directory, { recursive: true }));
  for (const output of ['first', 'second']) {
    const result = spawnSync('pwsh', [
      '-NoProfile', '-File', resolve(root, 'scripts', 'package-ports.ps1'),
      '-OutputDirectory', resolve(directory, output)
    ], { encoding: 'utf8', timeout: 60000 });
    assert.equal(result.status, 0, result.stderr || result.stdout);
  }
  const { version } = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
  for (const target of ['windows-terminal', 'neovim']) {
    const name = `specials-board-${target}-${version}.zip`;
    const bytes = readFileSync(resolve(directory, 'first', name));
    assert.deepEqual(bytes, readFileSync(resolve(directory, 'second', name)));
    const end = bytes.length - 22;
    assert.equal(bytes.readUInt32LE(end), 0x06054b50);
    assert.equal(bytes.readUInt16LE(end + 10), 5);
    let offset = bytes.readUInt32LE(end + 16);
    const names = [];
    for (let i = 0; i < 5; i++) {
      assert.equal(bytes.readUInt32LE(offset), 0x02014b50);
      assert.equal(bytes[offset + 5], 0, 'Host OS must be canonical on Windows and Unix');
      assert.equal(bytes.readUInt32LE(offset + 38), 0, 'No host-specific attributes');
      assert.equal(bytes.readUInt16LE(offset + 10), 0, 'Store without compressor variation');
      const nameLength = bytes.readUInt16LE(offset + 28);
      const entryName = bytes.subarray(offset + 46, offset + 46 + nameLength).toString('utf8');
      names.push(entryName);
      if (entryName === 'README.md') {
        const local = bytes.readUInt32LE(offset + 42);
        const start = local + 30 + bytes.readUInt16LE(local + 26) + bytes.readUInt16LE(local + 28);
        const content = bytes.subarray(start, start + bytes.readUInt32LE(offset + 24)).toString('utf8');
        assert.equal(content, readFileSync(resolve(root, 'docs', 'ports.md'), 'utf8').replaceAll('\r\n', '\n'));
        assert.equal(content.includes('\r'), false);
      }
      offset += 46 + nameLength + bytes.readUInt16LE(offset + 30) + bytes.readUInt16LE(offset + 32);
    }
    assert.equal(offset, end);
    assert.deepEqual(names, [...names].sort());
  }
});
