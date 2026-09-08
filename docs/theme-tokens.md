# Theme tokens and Coda identity

Phase 1 ([#5](https://github.com/filipmares/vscode-specialsboard-theme/issues/5))
introduced the portable architecture. Phase 2
([#8](https://github.com/filipmares/vscode-specialsboard-theme/issues/8)) restores
the flagship and Classic syntax identities within that architecture. Legacy's
appearance remains frozen, with an intentional breaking identity rename and
deprecation label; Contrast remains an undifferentiated preview.

This guide describes the checkout's [unreleased changes](../CHANGELOG.md#unreleased),
not a newly published release. The manifest version remains 2.2.0. For local
installation and development-host instructions, use the
[contributor quickstart](../vsc-extension-quickstart.md).

## Source model

| Layer | File | Responsibility |
|---|---|---|
| Reference palette | `tokens/palette.json` | The only authored raw colors. Separate `legacy`, `coda1`, `phase2` judgments, `coda2-atom`, and `repository-textmate` groups. |
| Semantic roles | `tokens/semantic.json` | Editor-independent syntax, markup, feedback, diff, surfaces, text, accents, and terminal colors. |
| Component/state roles | `tokens/components.json` | Editor, tabs, navigation, sidebar, list, status, badges, and console states. |
| Variant registry | `tokens/variants.json` | Stable portable IDs, labels, VS Code IDs, output filenames, inheritance, and readiness. |
| Variant overrides | `tokens/variants/*.json` | Sparse semantic/component alias replacements, applied after inheritance. |
| Platform adapter | `adapters/vscode.json` | Workbench IDs, restored `textMate`, frozen `legacyTextMate`, semantic-token selectors, and ANSI slots in separate sections. |
| Provenance | `tokens/provenance.json` | Source authority classifications and immutable historical anchors. |

The dependency direction is palette -> semantic -> component -> adapter.
Semantic roles can alias other semantic roles; component roles can alias other
components. Palette tokens may alias palette tokens only. Neither semantic nor
component source files contain VS Code IDs or TextMate selectors. Adapters may
reference semantic or component roles, never palette entries or raw colors.
Every emitted theme color comes through a validated role reference. Raw color
definitions belong in the palette, not in the adapter or variant overrides.

The shared base roles describe the post-Phase-0 appearance. Colors shared by
unrelated concepts do not force shared roles: for example, keywords, terminal red,
and error feedback remain independent. Extracted role names such as
`parameter-accent` and `operator-secondary` remain for compatibility, not as Coda
semantic authority. The flagship overrides normalize **every** syntax, markup,
feedback and diff role onto the restored families. Classic inherits these
relationships and changes a small set of family colors. No restored syntax role
resolves through Legacy, One Dark, or reconstruction palette groups, including
roles not currently consumed by the VS Code adapter.

## DTCG profile

The token documents use the [DTCG 2025.10 format](https://www.designtokens.org/tr/2025.10/format/)
and [color representation](https://www.designtokens.org/tr/2025.10/color/):

```json
{
  "palette": {
    "example": {
      "$type": "color",
      "$value": {
        "colorSpace": "srgb",
        "components": [0.5, 0.5, 0.5],
        "alpha": 1,
        "hex": "#808080"
      },
      "$extensions": {
        "org.specialsboard.provenance": {
          "source": "phase1-role-extraction",
          "evidence": "Documentation example only; not a shipped color."
        }
      }
    }
  }
}
```

Supported subset: explicit `$type: "color"` on every token; sRGB numerical
components in [0, 1]; optional alpha (defaults to 1); optional six-digit lowercase
hex fallback; full-token `{group.token}` aliases; groups, descriptions, and the
namespaced provenance extension. Hex fallbacks must agree with rounded sRGB bytes.
The adapter rounds each component/alpha to the nearest 8-bit channel and emits
lowercase six-digit hex, or eight digits when source alpha is not 1.

This is a **documented subset**, not a general DTCG implementation. Other color
spaces, `none` components, composite tokens, `$root`, `$extends`, `$ref`, inherited
types, and partial-value references are rejected rather than silently interpreted.
The registry and adapter are project configuration, not DTCG token documents.
Variant composition uses the registry, not DTCG group extension semantics.
TextMate `fontStyle` strings and semantic-token boolean style properties are
non-color adapter values; extracting portable typography is outside this phase.

The project provenance extension is inherited from groups during validation.
Every token must have an effective `source` and nonempty `evidence`; sources must
exist in the provenance registry. Alias tokens record the role-mapping judgment,
while palette tokens record the underlying color evidence.

## Stable variants and compatibility

| Key / portable ID | Picker label | VS Code stored ID | Parent | State |
|---|---|---|---|---|
| `flagship` / `specials-board` | Specials Board | `specials-board` | base | Restored modern interpretation |
| `classic` / `specials-board-classic` | Specials Board Classic | `specials-board-classic` | flagship | Restored Coda 1-grounded interpretation |
| `contrast` / `specials-board-contrast` | Specials Board Contrast | `specials-board-contrast` | flagship | Undifferentiated foundation preview |
| `legacy` / `specials-board-legacy` | Specials Board VS Code Legacy [Deprecated] | `specials-board-legacy` | base | Deprecated compatibility appearance |

All four are generated and contributed to the extension. Contrast intentionally
inherits the restored flagship without overrides: keeping its old appearance
would break the declared inheritance model or introduce a second Legacy.
Its unchanged stable label has no temporary suffix, but it has **no accessibility
guarantee or independent differentiation**. That work belongs to Phase 4.

Legacy retains `themes/specialsboard.json`, but intentionally replaces the
historical stored ID `"Specials Board "` (including the final space) with
`specials-board-legacy`, matching its portable ID and the other variants.
The picker label and generated theme name are
**Specials Board VS Code Legacy [Deprecated]**, distinguishing this old VS Code
port from Classic's Coda 1 identity.

This is an explicit **breaking migration decision**, superseding the earlier
frozen-ID guarantee. No old-ID alias, automatic migration, or selector-opening
runtime code is supplied. Existing users may fall back to a default theme on
update/reload and must open **Preferences: Color Theme** to choose a variant.
Selecting the deprecated Legacy entry restores the same appearance. Profiles,
workspace settings, and preferred-theme settings using the retired ID also
need updating. The rename changes selection behavior, not the palette.

The other three saved IDs are unchanged. Users who selected the 2.2.0
flagship/Classic/Contrast previews therefore receive their restored palettes
without having to reselect them. Deprecation does not remove Legacy from this
package; its frozen appearance is still available under the new ID.

The baseline fixture preserves all 47 workbench/ANSI entries, all 156 TextMate
rules in order, exact scope strings/arrays, and font styles. Comparisons permit
only equivalent hex casing/short-form expansion and the new display name.
No semantic-token settings are emitted for any shipped variant. The renderer
also excludes Legacy from future semantic-token mappings, even when those
mappings are populated for other variants.

Keep the shared base and Legacy independent of flagship restoration. The
renderer selects `legacyTextMate` only for Legacy; the original 156 rules remain
unchanged, in order, with their exact scope strings and font styles. Restored
variants use `textMate` instead. Recoloring the shared base or editing the
compatibility profile intentionally fails the frozen fixture. Never update
that fixture to hide a compatibility change.

## Phase 2 palette decisions

The Classic column uses native Coda 1 swatches where the evidence supports them.
It is a historically grounded **translation**, not an exact Coda emulator.
The flagship keeps the same semantic relationships with authored lightness,
saturation, and warmth adjustments. Its palette is not a Coda 2 reconstruction.

| Role | Classic | Flagship | Evidence or deliberate judgment |
|---|---|---|---|
| Editor canvas | `#2b2b2b` | `#302e2c` | Native JavaScript `_Default` background; flagship is slightly lighter and warmer. |
| Default text / punctuation | `#e6e1dc` | `#e6e1dc` | Native HTML inline CSS/JavaScript and CSS inside-curly-brackets foreground. Generalizing this to default text is a judgment: many native `_Default` foreground rows are black. |
| Keywords / declarations / word operators | `#cc762e` | `#d99559` | Native JavaScript/Python keywords and Ruby definitions; flagship lifts copper for small text. |
| Strings | `#a0c25f` | `#b2c879` | Native JavaScript/CSS/Python strings; flagship softens olive. |
| Numbers / constants / units | `#6c99bb` | `#8aafcb` | Native numbers and Ruby literals; generalizing all literal constants to dusty blue is a judgment. |
| Functions / methods / decorators | `#da4632` | `#e08066` | Native Python builtins/special methods; JavaScript's row named `FunctionRegex` also uses this swatch, separately from its `Regular Expressions` row. Flagship lifts red-orange into terracotta, not later-port mauve. |
| Variables / parameters | `#e6e1dc` | `#cec8e8` | Neutral Classic is a cross-language default judgment. Flagship's subdued lavender is inspired by native Ruby instance variables (`#c9d0ff`) and later ports, not an asserted universal native default. |
| Tags / types / selectors | `#ffc05c` | `#efc17b` | Native HTML tags and Ruby builtin classes; universal types and CSS selector treatment are judgments. |
| Attributes / properties / config keys | `#cc7832` | `#dfab73` | Native HTML attributes and Python special attributes; universal property treatment is a judgment. |
| Regex body / operators / anchors / flags | `#8856d2` | `#b18adb` | Native standalone JavaScript and Ruby regex; some embedded native modes use `#8857d2`. One selected family is deliberate. |
| Escapes / regex character classes | `#be73fd` | `#cca5ed` | Native JavaScript/Ruby escapes; treating classes as the lighter purple is a judgment. |
| Italic comments / docstrings | `#8a847d` | `#a39a90` | **Both are readability departures** from native `#666666`. Classic remains quieter; the native swatch is retained as evidence, not shipped for comments. |
| Error feedback | `#ed746b` | `#ed746b` | Modern visible-red judgment, not an invented native error row. |
| Invalid text | `#ed746b`, underlined | Same | Modern visible-red treatment; do not infer invalid meaning from native SGML/CDATA red rows. |

Native Coda is language-specific: Python builtin constants/types were orange,
CSS attributes/colors were often olive, Ruby variables had several hues, and
Ruby comment/string styles differed from JavaScript. Classic deliberately
normalizes those exceptions to the documented roles rather than pretending
that one universal Coda palette existed. Strings and parameters are not
universally italic; comments and documentation are. Attributes no longer inherit
Legacy's blanket italic styling.

For the authored readability decisions, sRGB relative-luminance ratios against
each variant's editor canvas are:

| Sample | Classic | Flagship |
|---|---:|---:|
| Keywords | 4.18:1 | 5.41:1 |
| Functions | 3.31:1 | 4.80:1 |
| Regex | 2.91:1 | 4.85:1 |
| Comments | 3.83:1 | 4.88:1 |
| Invalid text against editor canvas | 4.93:1 | 4.71:1 |

These are specific opaque editor samples, not a WCAG-conformance claim. The
focused regression test protects the four relative improvements and readable
invalid treatment. Selection compositing, every workbench pair, color-vision
simulation, and differentiation thresholds belong to Phase 4. Classic deliberately
retains some historically low-contrast colors.

## Ordered TextMate classification

The restored profile is a reviewed role mapping, not the old 156 rules with new
colors. Broad defaults precede meaningful specialized selectors; TextMate also
uses scope specificity and parent context, so order alone cannot fix a
more-specific conflicting selector. Real grammar tests protect that behavior.

| Mapping family | Retained or corrected coverage and rationale |
|---|---|
| Default / punctuation | Warm neutral `source`, `text`, punctuation, and embedded-expression reset. No blanket lavender `source.python` or orange `meta.property.object` container. |
| Declarations vs types | `keyword`, `storage`, and word operators are copper; named/primitive types are honey. `class` is a declaration word, not a class-name color. Symbolic operators are neutral. |
| Variables vs properties | Parameters share variable colors. Object keys, field declarations, member properties, JSON keys, YAML plain keys, and Python `meta.attribute.python` use orange. Readonly/enum constants use blue where the grammar identifies them. |
| Calls / methods | Function names, builtin functions, decorators, and Python's identifier-only `meta.function-call.generic.python` share terracotta. Whole call arguments are not painted as functions. |
| Strings / interpolation | Quoted strings and template text stay olive. Embedded expressions reset string inheritance; scoped variables, properties, calls, and numbers keep their own roles. |
| HTML / CSS | Tags, selector classes/IDs/pseudo-selectors use honey; attribute/property names use orange. Entities and complete hex colors, including their delimiter, use blue. CSS custom variables retain variable meaning. |
| Regex / escapes | Context-qualified selectors override ordinary keyword, variable, tag, punctuation, and string-delimiter rules inside regex. Groups, anchors, flags, alternation, and quantifiers stay purple; escapes/classes use lighter purple in both JavaScript and Python grammars. Quoted pattern text is not automatically regex. |
| Comments | Comments/docstrings are quiet italic; nested documentation tokens do not acquire vivid keyword/variable colors. |
| Markdown / diff / messages | Markdown uses honey headings, warm-white emphasis differentiated by style, olive inline code, blue links, and quiet quotes. Typed fences retain embedded-language colors. Diff and message tokens use the restored families, not One Dark accents. These are modern judgments with no native Markdown authority. |
| Invalid | A final broad `invalid` rule covers illegal/broken/deprecated/unimplemented subscopes with red underlined text. A theme can only mark invalid text when the grammar emits an invalid scope. |

Live VS Code inspection showed that TextMate `settings.background` is not painted
behind editor tokens. Restored invalid styling therefore relies on **foreground
and underline**, not white text on an invisible red background. The portable
invalid-background role aliases the canvas in restored variants and is not
emitted by this adapter. Legacy retains its historical white/red settings
unchanged as compatibility data, without a new claim about their rendering.

Compatibility-only duplicates, malformed selectors, obsolete `rgb-value`
decoration rules, and unexplained language-specific color exceptions are not
copied into the restored profile. Generic semantic scopes still serve additional
grammars; this phase does not promise exhaustive new-language coverage.

`test files/identity/` contains purpose-written HTML with embedded CSS/JS, CSS,
JS, TS, Python, Markdown, JSON, YAML, and regex-heavy fixtures. Older top-level
samples are retained as historical examples. `tests/identity.test.mjs` uses pinned
Shiki/TextMate grammars and the **generated themes**, with real scope precedence
and font-style assertions rather than a home-grown selector matcher.

Known grammar limits are explicit regression expectations: the pinned Markdown
grammar marks a Setext heading's underline, not its preceding text; the pinned
YAML grammar does not distinguish quoted keys from quoted values. We do not turn
all paragraphs into headings or all YAML strings into properties. Python bare
identifiers can be unscoped and stay neutral; a constructor/call or a `const`
declaration/reference may be classified differently without semantic information.
These are grammar boundaries, not reasons to enable broad semantic tokens early.
Installed extensions, grammar versions, semantic highlighting settings, and
editor decorations such as bracket-pair colorization can change the visible result.
The listed colors describe our token roles, not a guarantee that every editor
decoration uses them.

## Authoring an override

For example, this is the shape of a Classic keyword override:

```json
{
  "$extensions": {
    "org.specialsboard.provenance": {
      "source": "phase2-interpretation",
      "evidence": "Classic keyword mapping to native JavaScript/Python copper; see the Phase 2 palette decisions."
    }
  },
  "semantic": {
    "syntax": {
      "keyword": {
        "$type": "color",
        "$value": "{palette.coda1.copper}"
      }
    }
  }
}
```

Overrides must replace existing semantic/component tokens with aliases. They
cannot add misspelled roles, alter the reference palette, or embed raw values.
Add a new palette color with its own evidence before referencing it. Child
overrides win over parents; aliases resolve after merging, so downstream component
references see the override. Unknown references and inheritance/alias cycles fail.

## Determinism and validation

Node.js 22.12+ is development tooling only. Ajv validates the checked-in draft-07
JSON Schemas in strict mode, offline. The generated-theme schema covers the
adapter's supported VS Code shape, not the entire upstream VS Code color-ID
registry. Existing **workbench color IDs** are retained unchanged; this does not
refer to the intentionally renamed Legacy theme-selection ID. New platform
coverage and current upstream registry validation belong with Phase 3.

```sh
npm ci --ignore-scripts
npm run generate
npm run check
npm test
npm run package
```

`generate` first validates all sources and all four results, then writes UTF-8
JSON with LF endings and a final newline. Object keys are sorted with
locale-independent JavaScript ordering; arrays are never sorted because TextMate
rule order and scope structure affect behavior. No timestamps, environment
values, network reads, Git commands, or filesystem enumeration order affect
generated bytes. `.gitattributes` keeps generated files and the fixture LF on
Windows too.

`check` is read-only and compares bytes. Missing, changed, CRLF-converted, or
unmanaged extra theme JSON files fail. It also checks extension contributions
against the variant registry and protects Legacy's normalized ID, exact deprecated
label, and unchanged path. Tests also reject reintroducing the retired ID. Both
packaging and the GitHub workflow run the check without regenerating away drift.

`node:test` supplies the test runner without another framework. Pinned Shiki is
development-only grammar/tokenization data and an engine, not a runtime extension
dependency or a second test runner. Tests cover the frozen baseline, all four
identities, deterministic sorting without source
mutation, sparse override inheritance/isolation, reference/layer/type failures,
alpha/fallback conversion, provenance, ANSI separation, future semantic-token
mapping, output schema, drift error paths, restored role families and provenance
paths, Contrast preview inheritance, and real language-token output. The fixture's
SHA-256 is fixed in the test and must not be regenerated from current tokens.

`npm run package` runs checks/tests and pinned `@vscode/vsce`; `vscode:prepublish`
also checks drift when packaging directly with vsce. The ignore file excludes
tokens, schemas, adapters, docs, fixtures, scripts, historical `.tmTheme`, lockfile,
and all development dependencies. Runtime payload is the manifest, README,
changelog, icon, and four generated themes (plus VSIX container metadata).
The `--skip-license` flag acknowledges deferred licensing; it is not a license
decision. Do not add a guessed LICENSE or package license field.

Packaging is local-only and does not publish or increment `package.json`'s
version. Before publication, prepare a version appropriate for the breaking
ID change and a dated changelog entry; do not describe this checkout's
Unreleased section as an already published release.

## Historical evidence

The full research report was authored as `docs/theme-token-comparison.md` in the
analysis workspace; it is **not a file in this checkout** or a runtime dependency.
Its immutable Git blob is
`94a1e18eaaa76d50a96a4260d366ca30b02e925a`; inspect with
`git cat-file blob 94a1e18eaaa76d50a96a4260d366ca30b02e925a` in the analysis
repository. The project keeps a small cited reference palette and source registry
instead of copying the exhaustive report. Generation never requires that blob.

| Evidence | Classification | How it is used |
|---|---|---|
| Original Joseph Bergantine Coda 1 `.seestyle` rows | Authoritative Coda-native data | Selected language-specific reference swatches, not automatic universal role assignments. |
| Coda 2 Atom community port | Reconstruction | Separate reference group; never described as a native Panic export. |
| Checked-in `.tmTheme` from `b6bf83a` | Project history | Retained unchanged; selected reference swatches. Not the current Legacy output. |
| Phase 0 theme at `c188c33`, blob `58d2c3a8d5e6b5d24e24f811209e8867b9cfe97b` | Project history / compatibility authority | Shared Phase 1 baseline and independent frozen test fixture. |
| Phase 1 semantic naming/grouping | Engineering judgment | Explicit aliases preserving appearance, not historical claims. |
| Phase 2 role normalization and adjusted colors | Engineering judgment | Native role relationships generalized to current grammars; all departures listed above. |

The comparison report predates Phase 0, so its old invalid-token and selection
rows do not override the fixed baseline. Coda 1 `_Default` foregrounds are not
universally warm white; evidence for the warm-white reference names an explicit
language token. One Dark Pro-derived scope coverage remains compatibility
research, not Coda color or semantic authority. Provenance metadata does not
resolve conflicting licensing.

## Further adapters and deferred work

`compileSources` in `scripts/tokens.mjs` resolves each variant to a map of portable
role paths and structured sRGB values. It works without a VS Code manifest or
mapping. `scripts/vscode.mjs` alone translates selectors and serializes colors for
VS Code; `scripts/generate.mjs` orchestrates its outputs. Another adapter can
consume the same resolved model without changing any palette/role file.

Phase 2 restores flagship/Classic syntax without expanding the workbench key set.
Existing component aliases see the changed canvas/default foreground; other
workbench colors and all ANSI/terminal colors are deliberately retained, not
promoted to historical Coda authority. Phase 3 will expand workbench/semantic-token
coverage (and revisit the minimum VS Code engine if needed). Phase 4 will differentiate
Contrast and establish reproducible accessibility/color-differentiation gates.
Phase 5 owns release positioning/screenshots. Phase 6 owns actual terminal and
second-editor exports. No repository license is chosen in this phase.
