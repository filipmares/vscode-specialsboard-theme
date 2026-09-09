# Contrast color contract

Specials Board **3.2.0** differentiates Contrast, without changing the shipped
flagship, Classic or deprecated Legacy theme bytes from 3.1.0. The four stored
IDs and the **VS Code 1.101.0** minimum remain unchanged. Contrast is still a
`vs-dark` theme, not a claim to implement VS Code's high-contrast mode.

This is a **bounded color-quality contract**, not WCAG conformance for VS Code,
an extension, a document, or every possible user setting. A theme does not
implement keyboard navigation, accessible names, screen-reader announcements,
focus geometry or extension behavior. The [generated evidence](accessibility-report.md)
is reproducible color-model evidence; native observations are a separate layer.

## Targets and measured scope

| Content or state | Release-blocking Contrast minimum |
|---|---:|
| Authored TextMate and semantic syntax, punctuation, comments, invalid text and bracket text on the editor canvas and current-line background | 7:1 |
| Primary UI text in inputs, menus, selected/unselected lists, suggestions, hovers, buttons, notifications, sidebar, editor and terminal | 7:1 |
| Other enabled text, placeholders, secondary labels, ghost text, inlay hints, ANSI text and syntax over covered transient/stacked states | 4.5:1 |
| Meaningful focus outlines, control boundaries, search/diff borders, diagnostic/gutter icons, active guides and scrollbar thumbs | 3:1 |
| Twelve selected semantic-role pairs, independently in all four vision modes | OKLab distance 0.05 |

**7:1 remains the enhanced text target**, not an all-state promise. The report
also counts text below 7 even when it passes its assigned 4.5 minimum. No ratio
is rounded before comparison. Disabled controls, decorative shadows, inactive
optional guides, and canvas-colored seam covers are individually classified in
the report; placeholders, comments and ignored-file labels are **not** exempted
as decorative text.

The initial 3.2.0 candidate measures 7.300:1 minimum base syntax, 7.084:1 on the
current line, 4.579:1 in the most demanding modeled syntax stack, 4.965:1 for
other measured UI/terminal text, and 3.368:1 for measured indicators. The report,
not these rounded examples, is the source of truth for each released color.
Measurement counts are not an accessibility coverage percentage.

Flagship and Classic intentionally retain their identities, including Classic's
historically low-contrast colors. The same model exposes their shortfalls; exact
3.1.0 SHA-256 locks block accidental regressions or recoloring. Legacy is also
byte-locked, has only its authored historical contexts, and keeps its five
unsupported TextMate-background settings without pretending VS Code paints them.
These compatibility exceptions are not passing Contrast results.

## Palette, not pastel normalization

| Role | Contrast | Change from flagship |
|---|---|---|
| Ambient / navigation / canvas | `#100f0e` / `#141312` / `#181715` | Darker, still warm neutral planes |
| Transient raised surface | `#211f1c` | Dark warm popup canvas |
| Primary text | `#e6e1dc` | Unchanged warm white |
| Copper keywords | `#e6ae74` | Selective lightness lift |
| Olive strings | `#b2c879` | Unchanged |
| Dusty-blue numbers/constants | `#8aafcb` | Unchanged |
| Terracotta functions | `#e88e75` | Selective lightness lift |
| Lavender variables/parameters | `#cec8e8` | Unchanged |
| Honey tags/types | `#f1c782` | Small lightness lift |
| Orange attributes/properties | `#d99c63` | Darker than flagship, separating keys from olive values |
| Purple regex / escapes | `#b798e3` / `#cfa9f0` | Separate hue-preserving lightness lifts |
| Italic comments | `#b4a99d` | Readable, quiet warm neutral |

All syntax selectors, rule order, styles and semantic classifications remain
shared. Contrast changes aliases, not language meaning. Tests bound changes in
the nine chromatic syntax families to **6 degrees of OKLab hue** and retain at
least **85% of flagship chroma**. Those are identity safeguards, not perceptual
accessibility standards. Comments retain italics and invalid syntax retains
underline; there is no blanket italic or bold styling added to source text.

## Composition and state inventory

`scripts/accessibility-cases.mjs` names the actual public VS Code background
roles. Each stack is ordered bottom-to-top. `scripts/color.mjs` performs
source-over composition in **encoded sRGB**, then linearizes the resolved
channels for WCAG relative luminance:

`(max(Lforeground, Lbackground) + 0.05) / (min(Lforeground, Lbackground) + 0.05)`.

It uses the 0.04045 sRGB transfer breakpoint and luminance weights 0.2126,
0.7152, 0.0722. Transparent foregrounds are composed too. Intermediates stay
floating-point; displayed hex backgrounds are rounded illustrations only.
Unnecessary-code alpha is interpreted as text opacity, not black paint.
Contrast makes that opacity 1 and uses a visible underline border instead of
fading useful code.

The inventory includes focused/inactive editor and terminal selection, current
line, read/write/text occurrences, find/current/other/range search, hover,
bracket match, line-plus-word added/removed diff, changed merge regions,
current/incoming/common headers and content, active/inactive review ranges,
debug stack frames, test message lines, notebook editor/output/selected/focused/
hover states, peek matches, sticky scroll, syntax in hover/suggestion widgets,
inline completion text, inline original/modified line-plus-word edits, inline
chat diffs, chat requests/commands/change labels, forms, notifications and ANSI.

Nested states include line + selection + find, reversed find/selection order,
inactive selection + find, and selection/find + word occurrence over the
editor/diff/merge/review/inline contexts. Some combinations are **conservative
stress envelopes**, not claims that every VS Code version paints all of those
layers simultaneously. Component foregrounds are measured against their
normal/hover/focus/selection backgrounds where reused; this can also be stricter
than one particular host widget. The report names every limiting stack.
Missing declared layers and unknown rendering contexts fail rather than
silently falling back to a dark color.

### Selection and tint limitation

Contextual fills are intentionally subtle to avoid washing out source colors
when layered. Their fill-to-canvas contrast is **not 3:1**, and they are not
counted as passing focus indicators. Find, occurrence, current-line and diff
states have explicit contrasting borders; focus has an outline, not just a
different fill. VS Code does not expose a general selected-text-range border
token. Editor selection therefore retains a low-opacity blue fill and syntax
foregrounds: its geometry and host selection information remain, but the theme
cannot guarantee sufficient selection-boundary visibility for every user.

Preserving a full syntax palette, a 4.5 text floor on the selection and a
3:1 selection fill against this canvas cannot all be assumed simultaneously.
Users who need a stronger selection can choose VS Code's built-in High Contrast
theme or customize selection foreground/background together. Such overrides
are outside this report and must be measured again. A passing syntax-over-
selection measurement is not a passing selection-indicator verdict.

## Color-vision differentiation

Pair selection is committed in `scripts/accessibility-pairs.mjs`, based on
the identity/modern fixture tasks, **before tuning the candidate**:
declaration/binding, declaration/type, declaration/callable, type/binding,
call/argument, call/number, property/string, property/number, tag/attribute,
string/number, string/regex and regex/escape.

The four independent modes are normal vision; Machado 2009 severity-1
deuteranopia and protanopia; and Brettel 1997 two-plane tritanopia with the
libDaltonLens sRGB/Smith-Pokorny parameterization. The Machado authors caution
that their tritan endpoint is approximate; it is **not** used as a validated
tritanopia model here.

The pipeline linearizes sRGB, applies each specified matrix (and tritan plane
selection), clamps linear RGB to [0,1], converts D65 XYZ to OKLab, and measures
Euclidean distance on the **0-1 L scale**. It never re-encodes/quantizes a
simulated intermediate. Gamut clipping is recorded per pair/mode. Threshold
comparisons use full precision and the report shows all four results, not
their average. The initial worst distance is 0.05516.

**0.05 is a project engineering regression threshold**, not a WCAG requirement,
a universal just-noticeable difference, or a validated syntax-task threshold
for people with CVD. CSS Color 4's use of 0.02 in gamut mapping is not evidence
that 0.05 guarantees a fixed number of perceptual JNDs. Sensitivity at 0.04,
0.05 and 0.06 stays visible in the report; the chosen gate is not lowered to fit
a candidate. A CVD participant study has not been performed.

Related roles deliberately share color (number/constant, tag/type, parameter/
variable, function/method). Not every pair of unrelated roles can be separated
in every vision mode. We do not require all-pairs separation, infer diagnostic
severity from a color alone, or claim that repeating bracket-depth colors are
individually distinguishable under CVD. These simulations inform design; they
do not simulate every person's visual experience.

## Non-color cues and host limits

| Information | Retained supported cue | Boundary of the claim |
|---|---|---|
| Errors / warnings / information | Native severity icons, squiggles, Problems messages and navigation; invalid TextMate text also has underline | A provider must supply diagnostics; squiggles alone do not distinguish severity |
| Focus / active item | Explicit focus/active outline and active-tab top edge | Theme colors cannot guarantee host outline thickness, visibility or unobscured focus |
| Added / removed / changed / conflict | SCM status letters/tooltips, diff gutter signs, original/modified panes, conflict markers/headers and accessible diff view | Host/provider controls labels and decorations; not just red/green fills |
| Review / tests / notebook execution | Native state icons, labels, messages, comment text and cell focus border | This theme does not implement controllers, kernels or announcements |
| Regex / strings / types / calls | Language delimiters, keywords and syntactic structure; comments use italics | Syntax or semantic classification can be ambiguous or absent in a grammar |
| Unnecessary code | Underline border without dimming the text | The language service must identify unnecessary code |

The theme does not disable native cues or install code that changes settings.
Users can turn off decorations, enable screen-reader mode or accessibility
signals, and alter fonts, zoom, opacity or token colors. Native OS controls,
arbitrary webviews, notebook renderer HTML, extension-injected CSS/decorations,
and application-supplied terminal truecolor are outside theme control.

All 16 authored ANSI foreground slots are checked on the terminal canvas and
selection/find backgrounds, without crediting VS Code's optional minimum-
contrast adjustment. ANSI black is deliberately a readable warm gray in
Contrast; bright slots remain distinct/lighter. Arbitrary ANSI-background
combinations, inverse video, dim attributes and application color overrides
are not guaranteed readable.

TextMate and semantic rule colors are both measured. Real grammar tests cover
semantics-off fixtures including Contrast; native TypeScript providers supply
the semantics-on evidence. Providers can change classification; unsupported
semantic types fall back through the host, not an invented second palette.
An isolated deterministic inline-completion fixture can exercise ghost text
without an AI account. Authenticated AI edit/chat services are **not** exercised
by color math; modeled public colors must not be called a live provider test.

## Reproduce and release

```powershell
npm ci --ignore-scripts
npm run generate
npm run accessibility:generate
npm run check
npm run accessibility
npm test
npm run package
```

Generation is offline and deterministic. `accessibility:generate` writes the
human-readable report even when a threshold fails, then exits nonzero. The
ordinary `accessibility` command is read-only, blocks threshold failures and
requires exact committed report bytes. Packaging, prepublish and hosted CI
invoke the gates without regenerating away drift. Numerical reference vectors,
mutation tests, missing-layer checks, actual grammar tokenization and sibling
byte locks guard the gate itself. Native floor/stable smoke, exact VSIX
inspection and representative visual review remain separate release steps.

### 3.2.0 native release observations

The exact release candidate was exercised in isolated native **1.101.0** and
**1.136.2**, with official archive hashes checked and updates disabled before
launch. Both hosts resolved all 576 Contrast color IDs; flagship/Classic
retained 570 and Legacy 47. The only permitted theme schema warnings were
Legacy's five frozen unsupported token backgrounds.

Both hosts exercised TypeScript providers with semantic display on and off,
exported TextMate fallback rules, selection/inactive selection, find/occurrence,
suggestion/hover/signature requests, real local ghost-text acceptance,
diagnostics, testing, labeled SCM resources, review, native diff/merge tabs,
notebook cells and sixteen ANSI slots. The harness distinguishes registered
data, provider results, command requests and actual editor mutations; it does
not assert pixels from those signals.

Direct native screenshots on both hosts were reviewed for the warm dark
hierarchy, readable source, active/focus outlines, labeled SCM icons (including
deleted strikethrough), error/warning/info shapes and messages, test markers,
expanded review comments, and unused/deprecated cues. Further interactive tab
inspection was refused by the computer-use focus-safety policy. That refusal
was honored: hover/suggestion/diff/merge/notebook/terminal pixels are **not**
claimed as individually visually inspected in this release pass. Their
deterministic color/state checks and native API exercises remain distinct
evidence. No real screen-reader or CVD-participant pass is claimed.

## Sources and pins

Official sources checked 2026-09-08; paraphrased here rather than claiming
certification:

- [WCAG 2.2 contrast minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html),
  [enhanced](https://www.w3.org/WAI/WCAG22/Understanding/contrast-enhanced.html),
  [non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html),
  [use of color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html).
- [VS Code theme colors](https://code.visualstudio.com/api/references/theme-color),
  [semantic highlighting](https://code.visualstudio.com/api/language-extensions/semantic-highlight-guide),
  [accessibility](https://code.visualstudio.com/docs/configure/accessibility/accessibility),
  [terminal appearance](https://code.visualstudio.com/docs/terminal/appearance).
  The versioned public-ID evidence and exact 1.101.0 floor remain in
  [the token guide](theme-tokens.md#public-api-pins-and-minimum-version).
- [Machado authors' supplementary matrices and errata](https://www.inf.ufrgs.br/~oliveira/pubs_files/CVD_Simulation/CVD_Simulation.html)
  and [paper](https://www.inf.ufrgs.br/~oliveira/pubs_files/CVD_Simulation/Machado_Oliveira_Fernandes_CVD_Vis2009_final.pdf).
  Endpoint coefficients corroborated against
  [colorspacious at 5894892](https://github.com/njsmith/colorspacious/blob/58948923b706879a54071568c7501be3f108797c/colorspacious/cvd.py).
- [libDaltonLens coefficients at 1a01fc1](https://github.com/DaltonLens/libDaltonLens/blob/1a01fc1bf8d8dd419af8343b80b05e98ba50a75d/libDaltonLens.c):
  tritan matrices, separation normal and branch convention; its public-domain
  implementation supplies the specific parameterization.
- [CSS Color 4 conversions at 8a3430c](https://github.com/w3c/csswg-drafts/blob/8a3430c05846c3b8bf6e98f6b390d286191943d1/css-color-4/conversions.js)
  and [deltaEOK](https://github.com/w3c/csswg-drafts/blob/8a3430c05846c3b8bf6e98f6b390d286191943d1/css-color-4/deltaEOK.js):
  fixed conversion coefficients and distance definition.

These references do not resolve the theme's deferred historical licensing.
