# Theme-token foundation

Phase 1 implements [#5](https://github.com/filipmares/vscode-specialsboard-theme/issues/5)
within the [roadmap](https://github.com/filipmares/vscode-specialsboard-theme/issues/11).
This is an architecture release, not a semantic recoloring.

## Source model

| Layer | File | Responsibility |
|---|---|---|
| Reference palette | `tokens/palette.json` | The only authored raw colors. Separate `legacy`, `coda1`, `coda2-atom`, and `repository-textmate` groups. |
| Semantic roles | `tokens/semantic.json` | Editor-independent syntax, markup, feedback, diff, surfaces, text, accents, and terminal colors. |
| Component/state roles | `tokens/components.json` | Editor, tabs, navigation, sidebar, list, status, badges, and console states. |
| Variant registry | `tokens/variants.json` | Stable portable IDs, labels, VS Code IDs, output filenames, inheritance, and readiness. |
| Variant overrides | `tokens/variants/*.json` | Sparse semantic/component alias replacements, applied after inheritance. |
| Platform adapter | `adapters/vscode.json` | VS Code workbench IDs, ordered TextMate scopes/styles, semantic-token selectors, and ANSI slots in separate sections. |
| Provenance | `tokens/provenance.json` | Source authority classifications and immutable historical anchors. |

The dependency direction is palette -> semantic -> component -> adapter.
Semantic roles can alias other semantic roles; component roles can alias other
components. Palette tokens may alias palette tokens only. Neither semantic nor
component source files contain VS Code IDs or TextMate selectors. Adapters may
reference semantic or component roles, never palette entries or raw colors.
Only generated platform files contain resolved color literals, and every one must
come through a validated role reference.

The shared roles currently describe the post-Phase-0 appearance. Colors shared by
unrelated concepts do not force shared roles: for example, keywords, terminal red,
and error feedback remain independent. Existing language-specific exceptions use
portable role names such as `parameter-accent` and `operator-secondary`; they are
not declarations of historical Coda semantics. Their exact grammar scope
assignments live only in the adapter. Phase 2 must deliberately review those
exceptions rather than assume changing one generic role recolors every scope.

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

| Key / portable ID | Picker label | VS Code stored ID | Parent | Phase 1 state |
|---|---|---|---|---|
| `flagship` / `specials-board` | Specials Board | `specials-board` | base | Foundation preview |
| `classic` / `specials-board-classic` | Specials Board Classic | `specials-board-classic` | flagship | Foundation preview |
| `contrast` / `specials-board-contrast` | Specials Board Contrast | `specials-board-contrast` | flagship | Foundation preview |
| `legacy` / `specials-board-legacy` | Specials Board Legacy | `"Specials Board "` (final space) | base | Compatibility |

All four are generated and contributed to the extension. Preview status is
documented here and in the README; stable labels intentionally have no temporary
suffix. Their override files are empty by design: differentiating their palettes
would prematurely implement Phases 2 and 4. Contrast has no tested accessibility
guarantee at this point.

Legacy retains `themes/specialsboard.json` and the historical stored ID introduced
explicitly in Phase 0. Existing users keep their selected appearance. The changed
picker label and generated theme name are presentation metadata, not recoloring.
The baseline fixture preserves all 47 workbench/ANSI entries, all 156 TextMate
rules in order, exact scope strings/arrays, and font styles. Comparisons permit
only equivalent hex casing/short-form expansion and the new display name.
No semantic-token settings are emitted for the baseline: enabling them could
change the existing appearance.

Keep the shared base and Legacy independent of flagship restoration. Apply new
flagship colors as overrides; Classic and Contrast inherit them and can replace
individual roles. Recoloring the shared base would intentionally fail the Legacy
fixture. Changing scope coverage requires preserving a compatibility path as part
of that later change, not updating the fixture to hide it.

## Authoring an override

For a future, evidence-backed flagship change, this illustrates the entire
override needed to change one role (it is **not** shipped in Phase 1):

```json
{
  "$extensions": {
    "org.specialsboard.provenance": {
      "source": "phase1-role-extraction",
      "evidence": "Illustrative only. A real Phase 2 change must cite its design decision and source evidence."
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
registry. Existing IDs are retained unchanged; new platform coverage and current
upstream registry validation belong with Phase 3.

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
against the variant registry and protects Legacy's ID/path. Both packaging and
the GitHub workflow run the check without regenerating away drift.

`node:test` supplies the test runner without another framework. Tests cover the
frozen baseline, all four identities, deterministic sorting without source
mutation, sparse override inheritance/isolation, reference/layer/type failures,
alpha/fallback conversion, provenance, ANSI separation, future semantic-token
mapping, output schema, and drift error paths. The fixture's SHA-256 is fixed in
the test and must not be regenerated from current tokens.

`npm run package` runs checks/tests and pinned `@vscode/vsce`; `vscode:prepublish`
also checks drift when packaging directly with vsce. The ignore file excludes
tokens, schemas, adapters, docs, fixtures, scripts, historical `.tmTheme`, lockfile,
and all development dependencies. Runtime payload is the manifest, README,
changelog, icon, and four generated themes (plus VSIX container metadata).
The `--skip-license` flag acknowledges deferred licensing; it is not a license
decision. Do not add a guessed LICENSE or package license field.

## Historical evidence

The full research report `docs/theme-token-comparison.md` remains analysis
material, not a runtime source or copied dependency. Its immutable Git blob is
`94a1e18eaaa76d50a96a4260d366ca30b02e925a`; inspect with
`git cat-file blob 94a1e18eaaa76d50a96a4260d366ca30b02e925a` in the analysis
repository. This branch keeps a small cited reference palette and source registry
instead of copying the exhaustive report. Generation never requires that blob.

| Evidence | Classification | How it is used |
|---|---|---|
| Original Joseph Bergantine Coda 1 `.seestyle` rows | Authoritative Coda-native data | Selected language-specific reference swatches, not automatic universal role assignments. |
| Coda 2 Atom community port | Reconstruction | Separate reference group; never described as a native Panic export. |
| Checked-in `.tmTheme` from `b6bf83a` | Project history | Retained unchanged; selected reference swatches. Not the current Legacy output. |
| Phase 0 theme at `c188c33`, blob `58d2c3a8d5e6b5d24e24f811209e8867b9cfe97b` | Project history / compatibility authority | Shared Phase 1 baseline and independent frozen test fixture. |
| Phase 1 semantic naming/grouping | Engineering judgment | Explicit aliases preserving appearance, not historical claims. |

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

Phase 2 will restore flagship/Classic Coda semantic roles and review existing
scope exceptions. Phase 3 will expand workbench/semantic-token coverage (and
revisit the minimum VS Code engine if needed). Phase 4 will differentiate
Contrast and establish reproducible accessibility/color-differentiation gates.
Phase 5 owns release positioning/screenshots. Phase 6 owns actual terminal and
second-editor exports. No repository license is chosen in this phase.
