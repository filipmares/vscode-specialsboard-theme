// sRGB source-over composition uses encoded channels, as in the editor's CSS
// renderer. Luminance and CVD transforms then operate on linear-light channels.
export function rgba(hex) {
  if (!/^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(hex)) throw new Error(`Invalid color: ${hex}`);
  return [...hex.slice(1, 7).match(/../g).map(byte => parseInt(byte, 16) / 255),
    hex.length === 9 ? parseInt(hex.slice(7), 16) / 255 : 1];
}

export function composite(front, back) {
  const alpha = front[3] + back[3] * (1 - front[3]);
  if (alpha === 0) return [0, 0, 0, 0];
  return [0, 1, 2].map(i =>
    (front[i] * front[3] + back[i] * back[3] * (1 - front[3])) / alpha
  ).concat(alpha);
}

export const linear = channel =>
  channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
const multiply = (matrix, vector) => matrix.map(row =>
  row.reduce((sum, value, i) => sum + value * vector[i], 0));
export const luminance = color =>
  color.slice(0, 3).map(linear).reduce((sum, value, i) => sum + value * [0.2126, 0.7152, 0.0722][i], 0);

export function contrast(foreground, background) {
  if (background[3] !== 1) throw new Error('Contrast requires an opaque resolved background');
  const values = [luminance(composite(foreground, background)), luminance(background)];
  return (Math.max(...values) + 0.05) / (Math.min(...values) + 0.05);
}

export function hex(color) {
  return `#${color.slice(0, 3).map(c => Math.round(c * 255).toString(16).padStart(2, '0')).join('')}`;
}

// Machado authors' supplementary severity-1 matrices; Brettel's two-plane
// tritanopia parameterization from libDaltonLens (pins in docs/accessibility.md).
const matrices = {
  protanopia: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998]
  ],
  deuteranopia: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.011820, 0.042940, 0.968881]
  ]
};
const tritan = [
  [[1.01277, 0.13548, -0.14826], [-0.01243, 0.86812, 0.14431], [0.07589, 0.805, 0.11911]],
  [[0.93678, 0.18979, -0.12657], [0.06154, 0.81526, 0.12320], [-0.37562, 1.12767, 0.24796]]
];
export const visionModes = ['normal', 'deuteranopia', 'protanopia', 'tritanopia'];

export function simulate(color, mode) {
  if (color[3] !== 1) throw new Error('CVD requires an opaque composited color');
  if (!visionModes.includes(mode)) throw new Error(`Unknown vision mode: ${mode}`);
  const rgb = color.slice(0, 3).map(linear);
  let transformed = rgb;
  if (mode === 'tritanopia') {
    const side = multiply([[0.03901, -0.02788, -0.01113]], rgb)[0];
    transformed = multiply(tritan[side >= 0 ? 0 : 1], rgb);
  } else if (mode !== 'normal') transformed = multiply(matrices[mode], rgb);
  return {
    rgb: transformed.map(c => Math.max(0, Math.min(1, c))),
    clipped: transformed.some(c => c < 0 || c > 1)
  };
}

// D65 linear sRGB -> XYZ -> OKLab, using the CSS Color 4 reference matrices.
export function oklab(rgb) {
  const xyz = multiply([
    [506752 / 1228815, 87881 / 245763, 12673 / 70218],
    [87098 / 409605, 175762 / 245763, 12673 / 175545],
    [7918 / 409605, 87881 / 737289, 1001167 / 1053270]
  ], rgb);
  const lms = multiply([
    [0.8190224379967030, 0.3619062600528904, -0.1288737815209879],
    [0.0329836539323885, 0.9292868615863434, 0.0361446663506424],
    [0.0481771893596242, 0.2642395317527308, 0.6335478284694309]
  ], xyz).map(Math.cbrt);
  return multiply([
    [0.2104542683093140, 0.7936177747023054, -0.0040720430116193],
    [1.9779985324311684, -2.4285922420485799, 0.4505937096174110],
    [0.0259040424655478, 0.7827717124575296, -0.8086757549230774]
  ], lms);
}

export function difference(left, right, mode) {
  const a = simulate(left, mode);
  const b = simulate(right, mode);
  const labA = oklab(a.rgb);
  const labB = oklab(b.rgb);
  return {
    distance: Math.hypot(...labA.map((value, i) => value - labB[i])),
    clipped: a.clipped || b.clipped
  };
}
