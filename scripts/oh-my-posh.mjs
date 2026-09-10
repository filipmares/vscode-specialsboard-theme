import assert from 'node:assert/strict';
import { portableColor } from './portable.mjs';
import { validateSchema } from './tokens.mjs';
import { contrast, rgba } from './color.mjs';

export const poshVersion = '31.2.1';
export const poshSchemaUrl = 'https://raw.githubusercontent.com/JanDeDobbeleer/oh-my-posh/fc19b6fccaac637600151d0c383cd86bc949f290/themes/schema.json';
export const poshSchemaHash = '6620237cb6b837880b9d2721a6a6a71d0cc57b7fc7b1b5b7d50d133abd8dcd82';

export function validatePosh(theme) {
  validateSchema('oh-my-posh-theme', theme);
  assert.equal(theme.$schema, poshSchemaUrl);
  assert.deepEqual(theme.blocks[0].segments.map(segment => segment.type), ['path', 'git', 'executiontime', 'status']);
  const { palette, ...layout } = theme;
  const text = JSON.stringify(layout);
  assert.doesNotMatch(text, /#[0-9a-f]{3,8}\b/i, 'Colors belong only in the generated palette');
  for (const [, name] of text.matchAll(/p:([a-z][a-z-]*)/g)) {
    assert.ok(Object.hasOwn(palette, name), `Unresolved Oh My Posh palette reference: ${name}`);
  }
  for (const segment of theme.blocks[0].segments) {
    assert.doesNotMatch(segment.template.replaceAll('<p:separator>|</>', ''), /<[^>]*>/,
      'New inline styles require explicit prompt measurement coverage');
  }
}

export function poshMeasurements(theme) {
  validatePosh(theme);
  // Every segment and inline separator uses this opaque background, including
  // combined Git states. No powerline wedge or transparent color is implicit.
  return Object.entries(theme.palette).filter(([role]) => role !== 'background').map(([role, color]) => ({
    role, color, background: theme.palette.background,
    ratio: contrast(rgba(color), rgba(theme.palette.background)),
    minimum: role === 'path' ? 7 : 4.5
  }));
}

export function renderOhMyPosh(mapping, model) {
  validateSchema('oh-my-posh-mapping', mapping);
  const palette = Object.fromEntries(Object.entries(mapping).map(([name, role]) => [name, portableColor(role, model)]));
  const separator = ' <p:separator>|</> ';
  const segment = (type, foreground, template, options, extra = {}) => ({
    type, style: 'plain', foreground: `p:${foreground}`, background: 'p:background',
    template, options, ...extra
  });
  const theme = {
    $schema: poshSchemaUrl,
    version: 4,
    final_space: true,
    palette,
    blocks: [{
      type: 'prompt',
      alignment: 'left',
      segments: [
        segment('path', 'path', ' {{ .Path }}', { style: 'full' }),
        segment('git', 'git-clean',
          `${separator}git:{{ .HEAD }}{{ if not (or .Working.Changed .Staging.Changed) }} clean{{ end }}{{ if .Working.Changed }} modified:{{ .Working.String }}{{ end }}{{ if .Staging.Changed }} staged:{{ .Staging.String }}{{ end }}{{ if gt .Ahead 0 }} ahead:{{ .Ahead }}{{ end }}{{ if gt .Behind 0 }} behind:{{ .Behind }}{{ end }}{{ if and (gt .Ahead 0) (gt .Behind 0) }} diverged{{ end }}`,
          {
            native_status: false, branch_icon: '', commit_icon: 'commit:',
            tag_icon: 'tag:', rebase_icon: 'rebase:', cherry_pick_icon: 'cherry-pick:',
            revert_icon: 'revert:', merge_icon: 'merge:', no_commits_icon: 'new:'
          }, {
            foreground_templates: [
              '{{ if and (gt .Ahead 0) (gt .Behind 0) }}p:git-diverged{{ end }}',
              '{{ if .Working.Changed }}p:git-modified{{ end }}',
              '{{ if .Staging.Changed }}p:git-staged{{ end }}',
              '{{ if gt .Ahead 0 }}p:git-ahead{{ end }}',
              '{{ if gt .Behind 0 }}p:git-behind{{ end }}'
            ]
          }),
        segment('executiontime', 'duration', `${separator}time:{{ .FormattedMs }}`, { threshold: 500, style: 'austin' }),
        segment('status', 'success', `${separator}{{ if ne .Code 0 }}exit:{{ .Code }}{{ else }}ok{{ end }} >`, { always_enabled: true }, {
          foreground_templates: ['{{ if ne .Code 0 }}p:failure{{ end }}']
        })
      ]
    }]
  };
  const measurements = poshMeasurements(theme);
  if (model.variant.key === 'contrast') {
    for (const row of measurements) assert.ok(row.ratio >= row.minimum,
      `Oh My Posh Contrast ${row.role}: ${row.ratio} < ${row.minimum}`);
  }
  return theme;
}
