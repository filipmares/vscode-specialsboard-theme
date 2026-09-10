# Specials Board Light

**Specials Board Light** (`specials-board-light`) is the whiteboard-and-marker counterpart
to the modern flagship. It is generated as `themes/specialsboard-light.json`,
with VS Code `type: "light"` and contribution `uiTheme: "vs"`. It is an additive,
currently unreleased option: the four released dark themes retain their exact
IDs, labels, output paths and bytes. Windows Terminal and Neovim downloads still
contain only flagship, Classic and Contrast; Light is presently VS Code-only.

## Whiteboard, not cream paper

The maintainer's direction pairs the original chalk/chalkboard styling with a
whiteboard and dry-erase markers. Light therefore uses a clean off-white writing
surface, neutral cool-gray frame and saturated marker ink instead of the first
iteration's cream canvas, beige chrome and muted earth tones. The same saved ID
now selects this revision; this is not a second Light entry.

Green strings, blue literals, red-orange functions and purple regex retain their
semantic relationships, but intentionally depart from the dark theme's olive,
dusty-blue and terracotta swatches. Variables stay quieter in dark indigo so
every identifier does not compete for attention. Yellow marker strokes are poor
body text on white, so types/tags use deep ochre and properties use dark orange.
Those are deliberate readability compromises, not a reason to reject the
whiteboard concept. Native theme JSON cannot add a board texture, handwritten
strokes or marker-tip effects; this interpretation uses color and existing
font styles without changing the user's font or editor settings.

## One light variant, not three nearly identical entries

Light inherits flagship's editor-independent role relationships and overrides
the family colors, all surfaces, feedback, interactions and ANSI roles. It does
not invert RGB channels or copy dark syntax onto a pale background.
There is no **Classic Light**: the evidence below does not establish a historical
Specials Board light palette to reconstruct. There is no **Contrast Light**:
Light already enforces the stated readability floors, but does not meet the
dark Contrast variant's stronger differentiation contract. A separately named
variant needs a demonstrated purpose and its own evidence, not a duplicate entry.

## Historical evidence reviewed

The original [package README at 979438c](https://github.com/partydrone/Specials-Board/blob/979438ca680a48d2bf8e8c2e52d531eb162e2efa/README.markdown)
explicitly describes Specials Board as **light-on-dark**. It identifies
`coda-default/` as a backup of Coda's factory **dark-on-light** theme, not another
Specials Board variant.

The pinned [factory JavaScript data](https://github.com/partydrone/Specials-Board/blob/979438ca680a48d2bf8e8c2e52d531eb162e2efa/coda-default/Javascript.seestyle)
has a `#fefefe` background, black default text, magenta keywords (`#881350`),
blue numbers (`#0000ff`), and red strings (`#760f15`). Those native rows are
evidence about Coda Default, not authority for Specials Board Light.

The pinned [Specials Board JavaScript data](https://github.com/partydrone/Specials-Board/blob/979438ca680a48d2bf8e8c2e52d531eb162e2efa/specials-board/native-syntax-modes/Javascript.seestyle)
includes `inverted-color` attributes, but its inverted default background is
black (`#000000`), with white default text. Inverted keywords are `#ec77b4`
and strings `#f0898f`, rather than the copper/olive normal values.
The presence of the word "inverted" is therefore **not evidence of a coherent
light Specials Board design**. Neither these rows nor community Coda 2
reconstructions are copied into Light.

Light's entire `palette.light` group and semantic remapping are labeled
`light-design`, authority **judgment**, in the provenance registry. The semantic
relationships retain the documented [Coda lineage](heritage.md); the modern
light swatches, universal language roles and workbench are intentional departures.
This review does not resolve the historical licensing conflict or assign a license.

## Palette and interaction decisions

| Role | Light color | Meaning |
|---|---|---|
| Canvas / primary text | `#fafafa` / `#222629` | Off-white board and near-black ink |
| Ambient / navigation / raised | `#e1e4e6` / `#f0f2f3` / `#ffffff` | Neutral gray frame and white transient surfaces |
| Keywords | `#923b0d` | Deep copper-orange declarations and control words |
| Strings | `#1f5d32` | Green marker, including embedded/template strings |
| Numbers / constants | `#164f9e` | Blue marker literals |
| Functions | `#a12320` | Red marker declarations, calls and methods |
| Variables / parameters | `#45466c` | Quiet dark indigo |
| Types / tags | `#704f00` | Deep ochre rather than low-contrast yellow |
| Properties / attributes | `#874009` | Dark orange marker |
| Regex / escapes | `#6930a3` / `#843187` | Purple/violet marker with distinct escape handling |
| Comments | `#4e555a` | Neutral gray with inherited italic styling |
| Invalid / errors | `#a61421` | Red, with underlines for invalid syntax |

Low-opacity blue selection, ochre find, and green/red diff overlays preserve
syntax colors, including overlapping selection/find/diff/merge states. Find
and word borders remain visible. Light does not fade unnecessary code below
the text floor. Buttons and badges use pale text on dark copper; normal controls
use dark ink on light surfaces. The small `lightWorkbench` adapter section
assigns role aliases to line numbers, ignored-file labels, ghost-text borders
and the common merge header; it contains no colors.

All sixteen ANSI slots are distinct, opaque and measured as text on the terminal
canvas and selection/find states. "White" slots are deliberately neutral grays,
and bright partners remain dark enough to read on white; they are not literal
white or the dark ports' large luminance steps. Programs using ANSI backgrounds,
their own truecolor palette, reverse video or arbitrary foreground/background
combinations remain outside this guarantee.

## Reproducible readability and differentiation evidence

Run `npm run generate`, `npm run accessibility:generate`, then
`npm run accessibility` and `node --test tests/light.test.mjs tests/identity.test.mjs tests/modern-languages.test.mjs`.
The [generated report](accessibility-report.md) evaluates the emitted theme,
not hand-copied swatches: more than 24,000 Light text/state/indicator samples,
including every emitted TextMate/semantic foreground, comments, invalid text,
terminal slots, selections, find, diff, merge, workbench and control states.
Every measured text sample must meet **4.5:1** and measured meaningful indicators
**3:1**, with actual sRGB source-over composition and unrounded comparisons.
The current output has 24,258 measurements and no readability-floor failures:
the worst syntax sample is 4.540:1 (inline-original with find and selection),
other text 4.637:1 (selected terminal bright-white), and indicators 3.316:1
(word-highlight border in a composited state). Displayed rounding is descriptive, not the pass rule.
The same fixture assertions cover HTML/CSS, JS/TS/TSX, Python, Markdown,
JSON/YAML and regex, including embedded languages and TextMate fallback.
The [gallery](gallery.md) shows actual generated output beside the dark variants;
[capture instructions](capturing.md) document the isolated host workflow.

The report also discloses all twelve existing semantic pairs in normal vision,
simulated deuteranopia, protanopia and tritanopia. **Light does not pass the
Contrast 0.05 OKLab differentiation floor.** Keyword/type, keyword/function,
property/string, tag/attribute, string/number and regex/escape pairs fall below
that floor in one or more modes. The close copper, red, ochre and orange
families intentionally preserve identity; do not rely on color alone to infer
syntax or state. Punctuation, names, position, diagnostic icons and underlines
provide additional context, not a claim that every possible ambiguity is solved.

The 7:1 enhanced targets are reported but not enforced for Light. These are
bounded color-model checks, not whole-editor WCAG conformance, a color-vision
user study, a perceptual guarantee or evidence for arbitrary third-party
webviews/providers. Host defaults, user overrides and rendering differences
remain subject to the [accessibility contract's limitations](accessibility.md).

## Selection and system color scheme

Choose **Preferences: Color Theme > Specials Board Light**, or set:

```json
{
  "workbench.colorTheme": "specials-board-light"
}
```

For optional system-driven light/dark switching, explicitly opt in yourself:

```json
{
  "window.autoDetectColorScheme": true,
  "workbench.preferredLightColorTheme": "specials-board-light",
  "workbench.preferredDarkColorTheme": "specials-board"
}
```

`preferredLightColorTheme` chooses the light theme when automatic system
detection is active; merely installing the extension or setting a preferred
theme does not opt you into switching. When detection is off, use
`workbench.colorTheme`. These examples are user choices, not extension defaults.
The extension neither rewrites settings nor contributes configuration defaults.
Keep high-contrast preferences separate: Light is `vs`, not `hc-light`, and
Contrast is `vs-dark`, not `hc-black`.

Existing dark selections need no migration. Profiles, workspace or remote
overrides may take precedence, so check the active settings scope. Rolling back
to a release without Light can trigger VS Code's default-theme fallback for
`specials-board-light`; select an existing dark ID or another installed light
theme and update any preferred-light setting deliberately.
