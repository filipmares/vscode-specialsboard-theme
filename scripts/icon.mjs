import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { deflateSync, inflateSync } from 'node:zlib';
import { colorToHex, flattenTokens, loadSources, resolveTokens, root } from './tokens.mjs';

// C2 "Line Break": four code-block rows on an 8-multiple module, drawn only from palette tokens.
export const geometry = {
  size: 256,
  origin: 24,
  cell: 40,
  gap: 16,
  pitch: 56,
  radius: 12,
  plateRadius: 44,
  plateHairline: { inset: 0.75, width: 1.5, opacity: 0.6 },
  wellHairline: { inset: 1, width: 1.5, opacity: 0.22 },
  wells: [[3, 0], [0, 1], [0, 2], [3, 2], [3, 3]],
  bars: [
    { row: 0, column: 0, columns: 2, token: 'palette.phase2.copper' },
    { row: 0, column: 2, columns: 1, token: 'palette.phase2.honey' },
    { row: 1, column: 1, columns: 3, token: 'palette.phase2.olive' },
    { row: 2, column: 1, columns: 1, token: 'palette.phase2.blue' },
    { row: 2, column: 2, columns: 1, token: 'palette.phase2.terracotta' },
    { row: 3, column: 0, columns: 2, token: 'palette.phase2.lavender' },
    { row: 3, column: 2, columns: 1, token: 'palette.phase2.purple' }
  ],
  plateToken: 'palette.phase3.ambient',
  wellToken: 'palette.phase4.ambient',
  hairlineToken: 'palette.phase3.border',
  bannerToken: 'palette.phase2.charcoal',
  // 16 px siblings need every value on a 16 px grid, so they use their own hand-snapped module.
  favicon: {
    height: 32,
    radius: 8,
    plateToken: 'palette.phase4.canvas',
    bars: [
      { x: 32, y: 16, width: 96, token: 'palette.phase2.copper' },
      { x: 144, y: 16, width: 48, token: 'palette.phase2.honey' },
      { x: 80, y: 80, width: 144, token: 'palette.phase2.olive' },
      { x: 80, y: 144, width: 48, token: 'palette.phase2.blue' },
      { x: 144, y: 144, width: 48, token: 'palette.phase2.terracotta' },
      { x: 32, y: 208, width: 96, token: 'palette.phase2.lavender' },
      { x: 144, y: 208, width: 48, token: 'palette.phase2.purple' }
    ]
  },
  // A circular crop clips the master's corners, so the avatar scales the artwork about the centre.
  avatar: { scale: 0.8 }
};

const track = index => geometry.origin + geometry.pitch * index;
const span = columns => geometry.pitch * columns - geometry.gap;

export function paletteColors(sources = loadSources()) {
  const resolved = resolveTokens(flattenTokens(sources.palette, sources.provenance, 'palette'));
  return new Map([...resolved].map(([path, color]) => [path, colorToHex(color)]));
}

function swatch(color) {
  // An 8-digit token would silently paint opaque in the raster and translucent in the SVG.
  if (!/^#[0-9a-f]{6}$/.test(color)) throw new Error(`The icon needs an opaque palette color, got ${color}`);
  return color;
}

function fill(x, y, width, height, rx, color) {
  return { kind: 'fill', x, y, width, height, rx, color: swatch(color) };
}

function hairline(x, y, width, height, rx, color, { inset, width: strokeWidth, opacity }) {
  return {
    kind: 'stroke',
    x: x + inset,
    y: y + inset,
    width: width - inset * 2,
    height: height - inset * 2,
    rx: rx - inset,
    color: swatch(color),
    opacity,
    strokeWidth
  };
}

// The plate and its keyline, then the five recessed wells, then the seven token bars.
export function masterShapes(colors) {
  const { size, cell, radius, plateRadius, plateHairline, wellHairline } = geometry;
  const plate = colors.get(geometry.plateToken);
  const well = colors.get(geometry.wellToken);
  const line = colors.get(geometry.hairlineToken);
  const shapes = [
    fill(0, 0, size, size, plateRadius, plate),
    hairline(0, 0, size, size, plateRadius, line, plateHairline)
  ];
  for (const [column, row] of geometry.wells) {
    const [x, y] = [track(column), track(row)];
    shapes.push(fill(x, y, cell, cell, radius, well), hairline(x, y, cell, cell, radius, line, wellHairline));
  }
  for (const bar of geometry.bars) {
    shapes.push(fill(track(bar.column), track(bar.row), span(bar.columns), cell, radius, colors.get(bar.token)));
  }
  return shapes;
}

// Favicon sibling: the same rhythm snapped to a 16 px grid, opaque plate, wells dropped.
export function faviconShapes(colors) {
  const { height, radius, plateToken, bars } = geometry.favicon;
  return [
    fill(0, 0, geometry.size, geometry.size, 0, colors.get(plateToken)),
    ...bars.map(bar => fill(bar.x, bar.y, bar.width, height, radius, colors.get(bar.token)))
  ];
}

// Avatar sibling: master artwork without the plate keyline, scaled about the centre
// so the whole composition clears a circular crop, on an opaque square plate.
export function avatarShapes(colors) {
  const { size, avatar } = geometry;
  const [plate, , ...artwork] = masterShapes(colors);
  const centre = size / 2;
  return [
    fill(0, 0, size, size, 0, plate.color),
    {
      kind: 'group',
      transform: `translate(${centre} ${centre}) scale(${avatar.scale}) translate(${-centre} ${-centre})`,
      children: artwork
    }
  ];
}

function serializeShape(shape) {
  if (shape.kind === 'group') {
    return `<g transform="${shape.transform}">${shape.children.map(serializeShape).join('')}</g>`;
  }
  const box = `x="${shape.x}" y="${shape.y}" width="${shape.width}" height="${shape.height}" rx="${shape.rx}"`;
  return shape.kind === 'fill'
    ? `<rect ${box} fill="${shape.color}"/>`
    : `<rect ${box} fill="none" stroke="${shape.color}" stroke-opacity="${shape.opacity}" stroke-width="${shape.strokeWidth}"/>`;
}

export function renderSVG(shapes) {
  const { size } = geometry;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" `
    + `viewBox="0 0 ${size} ${size}" role="img">${shapes.map(serializeShape).join('')}</svg>\n`;
}

const channels = color => [1, 3, 5].map(index => parseInt(color.slice(index, index + 2), 16) / 255);

// Exact rounded-rectangle signed distance; negative inside, positive outside.
function distance(shape, x, y) {
  const halfWidth = shape.width / 2;
  const halfHeight = shape.height / 2;
  const rx = Math.min(shape.rx, halfWidth, halfHeight);
  const dx = Math.abs(x - (shape.x + halfWidth)) - (halfWidth - rx);
  const dy = Math.abs(y - (shape.y + halfHeight)) - (halfHeight - rx);
  const outside = Math.hypot(Math.max(dx, 0), Math.max(dy, 0));
  return outside + Math.min(Math.max(dx, dy), 0) - rx;
}

/**
 * Deterministic software rasterizer. Every subsample composites the whole scene
 * source-over in encoded sRGB, then a box filter averages premultiplied samples —
 * the same "render large, downsample" path the approved master was exported with.
 */
export function rasterize(shapes, size = geometry.size, samples = 8) {
  for (const shape of shapes) {
    if (shape.kind === 'group') throw new Error('Transformed groups are vector-only sources');
  }
  const scale = size / geometry.size;
  const painted = shapes.map(shape => {
    const half = shape.kind === 'stroke' ? shape.strokeWidth / 2 : 0;
    return {
      shape,
      half,
      alpha: shape.kind === 'stroke' ? shape.opacity : 1,
      channels: channels(shape.color),
      left: shape.x - half,
      top: shape.y - half,
      right: shape.x + shape.width + half,
      bottom: shape.y + shape.height + half
    };
  });
  const data = Buffer.alloc(size * size * 4);
  const step = 1 / samples;
  const offset = step / 2;
  const total = samples * samples;
  for (let py = 0; py < size; py += 1) {
    for (let px = 0; px < size; px += 1) {
      let [red, green, blue, opacity] = [0, 0, 0, 0];
      for (let sy = 0; sy < samples; sy += 1) {
        const y = (py + offset + sy * step) / scale;
        for (let sx = 0; sx < samples; sx += 1) {
          const x = (px + offset + sx * step) / scale;
          let [sampleRed, sampleGreen, sampleBlue, sampleAlpha] = [0, 0, 0, 0];
          for (const layer of painted) {
            if (x < layer.left || x > layer.right || y < layer.top || y > layer.bottom) continue;
            const signed = distance(layer.shape, x, y);
            if (layer.shape.kind === 'stroke' ? Math.abs(signed) > layer.half : signed > 0) continue;
            const source = layer.alpha;
            const keep = sampleAlpha * (1 - source);
            sampleRed = layer.channels[0] * source + sampleRed * keep;
            sampleGreen = layer.channels[1] * source + sampleGreen * keep;
            sampleBlue = layer.channels[2] * source + sampleBlue * keep;
            sampleAlpha = source + keep;
          }
          red += sampleRed;
          green += sampleGreen;
          blue += sampleBlue;
          opacity += sampleAlpha;
        }
      }
      const index = (py * size + px) * 4;
      data[index] = opacity === 0 ? 0 : Math.round((red / opacity) * 255);
      data[index + 1] = opacity === 0 ? 0 : Math.round((green / opacity) * 255);
      data[index + 2] = opacity === 0 ? 0 : Math.round((blue / opacity) * 255);
      data[index + 3] = Math.round((opacity / total) * 255);
    }
  }
  return { width: size, height: size, data };
}

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});

function crc32(buffer) {
  let value = 0xffffffff;
  for (const byte of buffer) value = crcTable[(value ^ byte) & 0xff] ^ (value >>> 8);
  return (value ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

export const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** 8-bit RGBA, non-interlaced, filter 0, and no ancillary chunks at all. */
export function encodePNG({ width, height, data }) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let row = 0; row < height; row += 1) {
    data.copy(raw, row * (stride + 1) + 1, row * stride, (row + 1) * stride);
  }
  return Buffer.concat([
    PNG_SIGNATURE,
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

export function readChunks(buffer) {
  if (!buffer.subarray(0, 8).equals(PNG_SIGNATURE)) throw new Error('Not a PNG file');
  const chunks = [];
  let cursor = 8;
  while (cursor < buffer.length) {
    const length = buffer.readUInt32BE(cursor);
    const type = buffer.toString('latin1', cursor + 4, cursor + 8);
    const data = buffer.subarray(cursor + 8, cursor + 8 + length);
    if (buffer.readUInt32BE(cursor + 8 + length) !== crc32(buffer.subarray(cursor + 4, cursor + 8 + length))) {
      throw new Error(`Corrupt ${type} chunk`);
    }
    chunks.push({ type, data });
    cursor += length + 12;
  }
  return chunks;
}

export function decodePNG(buffer) {
  const chunks = readChunks(buffer);
  const header = chunks.find(entry => entry.type === 'IHDR')?.data;
  if (!header) throw new Error('Missing IHDR');
  const width = header.readUInt32BE(0);
  const height = header.readUInt32BE(4);
  const [depth, colorType, compression, filter, interlace] = [...header.subarray(8, 13)];
  if (depth !== 8 || colorType !== 6 || compression !== 0 || filter !== 0 || interlace !== 0) {
    throw new Error(`Unsupported PNG format: depth ${depth}, color type ${colorType}, interlace ${interlace}`);
  }
  const raw = inflateSync(Buffer.concat(chunks.filter(entry => entry.type === 'IDAT').map(entry => entry.data)));
  const stride = width * 4;
  const data = Buffer.alloc(stride * height);
  for (let row = 0; row < height; row += 1) {
    const type = raw[row * (stride + 1)];
    for (let index = 0; index < stride; index += 1) {
      const value = raw[row * (stride + 1) + 1 + index];
      const left = index >= 4 ? data[row * stride + index - 4] : 0;
      const up = row > 0 ? data[(row - 1) * stride + index] : 0;
      const corner = row > 0 && index >= 4 ? data[(row - 1) * stride + index - 4] : 0;
      let predicted = 0;
      if (type === 1) predicted = left;
      else if (type === 2) predicted = up;
      else if (type === 3) predicted = (left + up) >> 1;
      else if (type === 4) {
        const estimate = left + up - corner;
        const [dl, du, dc] = [Math.abs(estimate - left), Math.abs(estimate - up), Math.abs(estimate - corner)];
        predicted = dl <= du && dl <= dc ? left : du <= dc ? up : corner;
      } else if (type !== 0) throw new Error(`Unknown filter type ${type}`);
      data[row * stride + index] = (value + predicted) & 0xff;
    }
  }
  return { width, height, data, chunks: chunks.map(entry => entry.type) };
}

export function buildIcon(sources = loadSources()) {
  const colors = paletteColors(sources);
  return new Map([
    ['icon.png', encodePNG(rasterize(masterShapes(colors)))],
    ['assets/icon.svg', Buffer.from(renderSVG(masterShapes(colors)), 'utf8')],
    ['assets/icon-favicon.svg', Buffer.from(renderSVG(faviconShapes(colors)), 'utf8')],
    ['assets/icon-avatar.svg', Buffer.from(renderSVG(avatarShapes(colors)), 'utf8')]
  ]);
}

/**
 * Compares decoded pixels and PNG structure rather than compressed bytes, so the gate
 * survives zlib implementation differences without letting artwork or format drift through.
 */
export function syncIcon(outputs, directory = root, check = false) {
  const drift = [];
  for (const [file, expected] of outputs) {
    const path = resolve(directory, file);
    if (!check) {
      writeFileSync(path, expected);
      continue;
    }
    let actual;
    try {
      actual = readFileSync(path);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      drift.push(file);
      continue;
    }
    if (!file.endsWith('.png')) {
      if (!actual.equals(expected)) drift.push(file);
      continue;
    }
    try {
      const rendered = decodePNG(expected);
      const shipped = decodePNG(actual);
      const structural = shipped.width !== rendered.width || shipped.height !== rendered.height
        || shipped.chunks.join() !== 'IHDR,IDAT,IEND';
      if (structural || !shipped.data.equals(rendered.data)) drift.push(file);
    } catch {
      drift.push(file);
    }
  }
  if (drift.length) {
    throw new Error(`Generated icon drift: ${drift.join(', ')}. Run npm run icon and commit the outputs.`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  if (args.length > 1 || (args.length === 1 && args[0] !== '--check')) {
    throw new Error('Usage: node scripts/icon.mjs [--check]');
  }
  const outputs = buildIcon();
  const check = args[0] === '--check';
  syncIcon(outputs, root, check);
  console.log(`${check ? 'Checked' : 'Generated'} ${outputs.size} icon files.`);
}
