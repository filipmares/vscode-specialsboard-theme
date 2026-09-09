# Theme tokens and Coda identity

Phase 1 ([#5](https://github.com/filipmares/vscode-specialsboard-theme/issues/5))
introduced the portable architecture. Phase 2
([#8](https://github.com/filipmares/vscode-specialsboard-theme/issues/8)) restores
the flagship and Classic syntax identities within that architecture. Phase 3
([#9](https://github.com/filipmares/vscode-specialsboard-theme/issues/9)) extends
the restored variants across modern workbench and semantic-token surfaces. Legacy's
appearance remains frozen, with the 3.0.0 breaking identity rename and
deprecation label. Phase 4 ([#7](https://github.com/filipmares/vscode-specialsboard-theme/issues/7))
now differentiates Contrast with [measured accessibility gates](accessibility.md).

This guide describes the [3.2.0 token system](../CHANGELOG.md), retaining the
3.0.0 identity migration.
For local installation and development-host instructions, use the
[contributor quickstart](../vsc-extension-quickstart.md).

## Source model

| Layer | File | Responsibility |
|---|---|---|
| Reference palette | `tokens/palette.json` | The only authored raw colors. Separate `legacy`, `coda1`, `phase2`/`phase3`/`phase4` judgments, `coda2-atom`, and `repository-textmate` groups. |
| Semantic roles | `tokens/semantic.json` | Editor-independent syntax, markup, feedback, diff, surfaces, text, accents, and terminal colors. |
| Component/state roles | `tokens/components.json` | Shared workbench planes, interaction states, controls, feedback and brackets, plus frozen compatibility component roles. |
| Variant registry | `tokens/variants.json` | Stable portable IDs, labels, VS Code IDs, output filenames, inheritance, and readiness. |
| Variant overrides | `tokens/variants/*.json` | Sparse semantic/component alias replacements, applied after inheritance. |
| Platform adapter | `adapters/vscode.json` | Modern `workbench`/`textMate`, optional Contrast-only `contrastWorkbench`, frozen `legacyWorkbench`/`legacyTextMate`, semantic-token selectors, and ANSI slots in separate sections. |
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
| `contrast` / `specials-board-contrast` | Specials Board Contrast | `specials-board-contrast` | flagship | Differentiated accessibility-focused variant |
| `legacy` / `specials-board-legacy` | Specials Board VS Code Legacy [Deprecated] | `specials-board-legacy` | base | Deprecated compatibility appearance |

All four are generated and contributed to the extension. Contrast inherits
flagship's semantic relationships and supplies sparse palette/state overrides.
Its optional adapter section adds meaningful borders without leaking extra
colors into the other variants. The [color contract](accessibility.md) documents
targets, known limits and reproducible results, not whole-editor conformance.

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
No semantic-token settings are emitted for Legacy. The renderer excludes Legacy
from modern workbench and semantic mappings, even as those mappings evolve.
Flagship, Classic and Contrast enable semantic highlighting deliberately.

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
invalid treatment. Phase 4 now reports composited states and selected CVD pairs
without changing these swatches. Classic deliberately retains some historically
low-contrast colors, explicitly reported rather than treated as passing Contrast.

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
These are grammar boundaries: Phase 3 semantic highlighting can refine symbol
classification when a language provider is available, but never supplies a missing
grammar or language server.
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
adapter's supported VS Code shape. Public color-ID evidence is separate from the
shape schema; adding an arbitrary syntactically valid ID is not sufficient.
`schemas/vscode-colors.schema.json` is an offline, explicitly reviewed public
subset, enforced for adapter keys and generated theme keys. The minimum engine
must match its evidence floor. Generation itself remains network-free.

```sh
npm ci --ignore-scripts
npm run generate
npm run accessibility:generate
npm run check
npm run accessibility
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
alpha/fallback conversion, provenance, ANSI separation, semantic-token
mapping, output schema, drift error paths, restored role families and provenance
paths, Contrast differentiation/inheritance, and real language-token output. The fixture's
SHA-256 is fixed in the test and must not be regenerated from current tokens.

`npm run package` runs checks/tests and pinned `@vscode/vsce`; `vscode:prepublish`
also checks drift when packaging directly with vsce. The ignore file excludes
tokens, schemas, adapters, docs, fixtures, scripts, historical `.tmTheme`, lockfile,
and all development dependencies. Runtime payload is the manifest, README,
changelog, icon, and four generated themes (plus VSIX container metadata).
The `--skip-license` flag acknowledges deferred licensing; it is not a license
decision. Do not add a guessed LICENSE or package license field.

Packaging is local-only and does not publish or increment `package.json`'s
version. For future releases, update the manifest and lockfile to an appropriate
version and record changes in a dated changelog entry. A successful package build
alone is not evidence that a release has been published.

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

Phase 3 preserves the exact Phase 2 TextMate output, while modern workbench and
semantic coverage use independent shared roles. The 16-slot ANSI table is also
portable token data, not yet a standalone terminal export. Phase 4 differentiates
Contrast and adds reproducible accessibility/color-differentiation gates.
Phase 5 owns release positioning/screenshots. Phase 6 owns actual terminal and
second-editor exports. No repository license is chosen in this phase.

## Phase 3 workbench and state design

The hierarchy has three persistent planes, not a different color per widget:

| Plane | Flagship / Classic | Surfaces |
|---|---|---|
| Ambient | `#211f1e` / same | Activity, title and status bars; restrained peripheral chrome. |
| Navigation | `#282624` / same | Sidebar, inactive tabs, input fields, notebook framing. |
| Content | `#302e2c` / `#2b2b2b` | Existing editor canvas, active tabs, panels, terminal and notebook cell editors. |

Transient suggestions, hovers, quick input, menus, peek titles and notifications
sit on a warm raised `#3a3734` surface. That overlay treatment is not a fourth
persistent plane. Borders and quiet indent guides define edges without using
hard black dividers. Classic keeps its original canvas and all syntax swatches;
its workbench feedback deliberately shares flagship's modern lightness, rather
than using the dimmer native syntax swatches for small control labels.

| State | Shared treatment | Representative surfaces |
|---|---|---|
| Normal | Warm-white text, muted secondary text, plane-specific background | Chrome, tabs, controls, menus, tooltips |
| Hover | `#46413c` | Lists, tabs, menu actions, toolbars, sticky scroll |
| Active / selected | `#544c43`, warm-white foreground | Lists, quick input, suggestions, menu selections |
| Selected but unfocused | `#454039`, text still readable | Trees/lists, inactive focus, notebook selection |
| Keyboard focus | Copper border, not just fill | Lists, forms, tabs, notebook cells, status actions |
| Disabled | `#80776e`, native disabled opacity where the widget uses it | Controls, unverified/disabled breakpoints, skipped tests |
| Warning | Honey icon/border; opaque dark fill for validation popups | Diagnostics, forms, notifications, conflicts |
| Error | Visible red icon/border; opaque dark fill for validation popups | Diagnostics, forms, failed tests, debug errors |
| Editor overlays | Translucent blue selection/occurrences; honey search; olive/red diff | Editor, terminal, minimap, merge and inline edits |

Foreground overrides are deliberately absent for editor selections/search: syntax
colors must remain visible under the tint. Fine-grained diff words have stronger
alpha than their enclosing line. Merge current/incoming content uses olive/blue
with headers and borders; resolved and unresolved review states use distinct
roles. Phase 4 adds Contrast-specific tint budgets and explicit numerical gates;
the Phase 3 values described here remain unchanged in flagship and Classic.

### Covered workflow families

| Workflow | Intentional coverage |
|---|---|
| Navigation/chrome | Title/command center, activity bar including top location, sidebars, breadcrumbs, status/remote/debug states |
| Tabs/panels | Active/inactive/unfocused/hover/modified tabs, editor groups, panel titles and sections |
| Lists/trees/quick input | Active/unfocused selection, keyboard focus, hover, match emphasis, drop targets, guides and table rows |
| Controls/forms | Primary/secondary buttons, inputs and validation, dropdowns, checkbox/radio states, menus, toolbar, settings fields, progress and scrollbars |
| Language tools | Suggestions and symbol icons, hover and shared signature-help widget, links, code lens and diagnostic/lightbulb feedback |
| Editor interaction | Search, selections, read/write/text occurrences, gutters, indent guides, bracket matching, inlay hints, sticky scroll and ghost text |
| SCM/review | Git decorations, text/line/gutter diff, merge headers/content/conflict borders, review comments and peek results |
| Testing/debugging | Test states/messages, debug controls and breakpoints, stack frames, inline values and console tokens |
| Notebooks | Cell/editor/output framing, selection/focus/hover, insertion indicators and execution states |
| Notifications/peek | Normal/secondary text, headers, borders, severity icons and result selection/matches |
| Minimap/overview | Search, selection, occurrences, diagnostics, diff and merge markers; translucent slider states |
| AI-adjacent editor | Public ghost-text, inline-edit, inline-chat/input/diff, chat request/command/avatar/change-summary colors |
| Terminal | Canvas, cursor, find/selection/drop states, command decorations and sixteen independent ANSI slots |

Role reuse is deliberate: controls and feedback do not introduce unrelated hue
families, and the adapter never contains raw colors. Legacy's separate profile
emits only its frozen 47 entries; none of the new color IDs leak into it.

### Semantic highlighting

The compact set uses standard symbol and lexical token types. Types, namespaces,
classes/interfaces/structs/enums and type parameters share honey; variables and
parameters use their existing neutral/ lavender roles; properties/events use
orange; functions/methods/decorators use terracotta. Readonly variables,
readonly properties and enum members use the existing blue constant role.
Comments retain their quiet italic style. Keywords, strings, numbers, regex and
operators retain their TextMate families.

There is no blanket `*.readonly`, `*.defaultLibrary`, declaration-bold rule or
language-specific palette. Default-library modifiers inherit their actual token
type: builtin methods remain functions, not a new accent. Unknown/custom token
types use VS Code's documented semantic-to-TextMate fallback; classification
still depends on the installed language provider. With semantic highlighting off,
the **exact v3.0.0 TextMate arrays** remain available and hash-protected. On/off
classification can legitimately differ (for example a readonly member or a bare
identifier), but the hues do not. No runtime extension code changes users' settings.

`test files/modern/` supplements the original identity fixtures with TypeScript,
TSX, JSON/JSONC, YAML, shell, Rust and Go. Shiki tests exercise TextMate fallback;
the isolated VS Code smoke uses the actual TypeScript semantic, completion, hover
and signature providers. Shiki does not prove semantic-provider behavior.

Additional pinned-grammar limits are recorded in those tests: Go builtin types
use `storage.type` and retain the copper storage fallback; Go member selectors
can share variable scopes. Rust enum variants may be classified as types,
parameters/fields share variable scopes, and decimal dots have punctuation scopes.
Shell bare assignment values remain strings even when numeric. No broad selector
heuristic recolors unrelated language constructs to hide these limits; a real
language provider can supply more precise semantic types.

### Terminal and bracket decisions

The terminal has sixteen unique, opaque colors. Every bright slot is lighter
than its normal partner; neither blue/cyan nor normal/bright aliases are collapsed.
Warm red, olive, honey, dusty blue, muted magenta and desaturated cyan preserve the
overall warmth while respecting terminal ANSI meaning. Terminal magenta/cyan do
not become syntax roles. Terminal applications can override colors, use truecolor,
or ask VS Code to adjust contrast; `terminal.integrated.minimumContrastRatio`
is a user setting and is not modified by this theme.

Bracket-pair colors repeat a restrained honey/lavender/blue triad across six
depths. Inactive guides remain quiet; active guides follow the bracket. This is
coherent navigation, not a promise of color-vision-safe depth differentiation.

### Explicit limits

A color theme cannot style arbitrary extension webviews, notebook renderer HTML,
native OS title/menu/dialog chrome, application-supplied terminal truecolor, or
private/experimental extension decorations. Signature help uses VS Code's shared
editor widget colors; there is no invented `signatureHelp.*` color namespace.
Ghost text needs a completion provider; inline edits and chat additionally need
a supporting extension/service and, where required, an authenticated account.
Defining public color IDs does not activate those services or validate a model's
output. Provider-dependent AI editing states are not claimed as live tested when
no authenticated provider is available.

The testing/debugging/notebook/review fixtures exercise public UI mechanisms,
not every language server, kernel or debugger. No arbitrary key-count target is
used as a coverage or accessibility score. Contrast's independently differentiated
palette and measured states are documented in [the Phase 4 contract](accessibility.md).
No variant claims whole-application compliance.

### Public API pins and minimum version

The engine floor is **VS Code 1.101.0**, commit
`dfaf44141ea9deb3b4096f7cd6d24e00c147a4b1`. The limiting selected public IDs are
`chat.linesAddedForeground` and `chat.linesRemovedForeground`, registered in
[1.101.0 chat colors](https://github.com/microsoft/vscode/blob/dfaf44141ea9deb3b4096f7cd6d24e00c147a4b1/src/vs/workbench/contrib/chat/common/chatColors.ts#L61-L69)
and absent through
[1.100.3](https://github.com/microsoft/vscode/blob/258e40fedc6cb8edf399a463ce3a9d32e7e1f6f3/src/vs/workbench/contrib/chat/common/chatColors.ts#L46-L55).
The complete public inline-edit family needs 1.99.0: the separate original/modified
Tab-accept borders and gutter borders are not available at the 1.97 preview floor.
See the [1.99 inline-edit registrations](https://github.com/microsoft/vscode/blob/4437686ffebaf200fa4a6e6e67f735f3edf24ada/src/vs/editor/contrib/inlineCompletions/browser/view/inlineEdits/theme.ts#L64-L172).

Public documentation was checked against the live
[theme color reference](https://code.visualstudio.com/api/references/theme-color)
and pinned to `microsoft/vscode-docs@14f745e318ef4adb978f17dd8aff7f94591fccb4`,
[`api/references/theme-color.md`](https://github.com/microsoft/vscode-docs/blob/14f745e318ef4adb978f17dd8aff7f94591fccb4/api/references/theme-color.md).
The pinned document SHA-256 is
`72e254ccc477fa699a7e8c91046d77c7d8ee660ecf7016fa3da44c88710db21a`.
Semantic rules follow the official
[semantic highlighting guide](https://code.visualstudio.com/api/language-extensions/semantic-highlight-guide)
and its standard token types, modifiers and TextMate fallback model.

The allowlist is the intersection of explicitly documented definitions with the
selected IDs resolved by the **actual 1.101.0 runtime**, corroborated by the
versioned production-source audit. The audit includes bundled Git's
`contributes.colors` and dynamic ANSI registrations, not just literal
`registerColor` calls. It is not a claim that all current public colors existed
at the minimum version. Undocumented `inlineEdit.indicator.*`, newer unselected
colors and the nonexistent `testing.message.error.decorationForeground` are
not accepted by namespace analogy.

To refresh the reviewed subset after a deliberate coverage change, run the
isolated floor smoke against the new generated themes, then:

```powershell
node scripts\capture-vscode-colors.mjs C:\path\to\fresh-floor-report\live-report.json
```

The maintenance command checks the exact engine version, successful native
registry comparison, current adapter ID set, pinned documentation bytes and
explicit public definitions before generating the schema. It is never run
implicitly by generation, tests or packaging. An intentional engine-floor
change requires updating the evidence and guard together.

The native harness checks both schema errors **and warnings**. Translucent
minimap/overview markers honor overlap requirements; the two chat summary label
registrations also require transparency despite upstream opaque defaults, so
their shared label roles use 95% alpha. Restored variants have no native schema
warnings. The only allowed Legacy exceptions are its five exact historical
`#a71e17` TextMate-background warnings; those settings remain frozen, and VS Code
still does not paint them. Any other warning or unknown color fails the smoke.

3.1.0 is a minor feature release with a documented host-version requirement,
not another saved-ID migration or syntax redesign. Older hosts need an earlier
compatible extension version. The runtime package remains declarative: no
activation code, dependencies, telemetry or automatic settings changes.
