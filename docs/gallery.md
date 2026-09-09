# Specials Board visual gallery

Nine real VS Code workbench captures, not hand-painted editor mockups.
All four palettes are unchanged from 3.2.0. Open an image for full-size text;
the [source fixtures](../test%20files/presentation/) are also available as text.
The [capture guide](capturing.md) records the host, settings, automation and
provider boundaries. These static examples do not substitute for the
[accessibility measurements and limitations](accessibility.md).

## Flagship: TypeScript and the workbench

![Flagship TypeScript menu: warm Explorer and status bar, copper declarations, honey types, olive strings, blue constants and terracotta calls, above labeled ANSI terminal slots.](../screenshots/flagship-workbench.png)

The built-in TypeScript provider refines symbol classification. For example,
readonly constants can be blue rather than the ordinary variable family's
lavender. The coordinated Explorer, active tab, current line, panel and terminal
show the ambient/navigation/content hierarchy. Terminal output is a labeled
local pseudoterminal fixture, not a shell prompt, command execution or test result.
Its black slots are deliberately shown as authored, without VS Code's optional
minimum-contrast adjustment; they are dim in flagship. Contrast's readable
ANSI black is documented separately in the color contract.

## Flagship: TSX

![TSX Board function: named interfaces and properties, honey JSX tags, olive strings and terracotta calls remain distinct through nested JSX expressions.](../screenshots/flagship-tsx.png)

This dependency-free JSX fixture declares its local JSX types. It demonstrates
TypeScript/TSX classification, not a running React application or a claim that
the theme installs React tooling. The companion `menu.ts` supplies its real types.

## Flagship: HTML and CSS

![HTML menu beside its CSS stylesheet: honey tags and selectors, orange attributes and properties, blue entities and units, olive strings and italic comments.](../screenshots/flagship-web.png)

Bundled grammars and language support render HTML and CSS with the restored
role families. Color swatch decorations are disabled in the capture profile
so the literal's theme color stays visible; the theme does not disable them.

## Classic: Python and regular expressions

![Classic Python dataclass beside JavaScript regex: neutral Python variables, native-grounded copper and red-orange syntax, olive strings and separate purple regex bodies and escapes.](../screenshots/classic-python.png)

Python uses bundled TextMate support without a Python language server. JavaScript
has the bundled language service, so constants may be refined to blue. Quotes
and delimiters still matter: a string containing regex-like text is not
automatically classified as a regex. Classic's quieter comments are a documented
readability departure; some historical syntax colors remain low-contrast.

## Contrast: Rust and Go

![Contrast Rust and Go menu fixtures side by side, with dark warm canvases, visible current-line and active-tab outlines, copper declarations, honey types, olive strings and terracotta functions.](../screenshots/contrast-systems.png)

Both use bundled TextMate grammars, **without rust-analyzer or a Go extension**.
The image demonstrates fallback syntax, not semantic-token, hover or language-server
coverage for those languages. The focus and current-line boundaries are
intentional Contrast additions.

## Flagship: Markdown, YAML frontmatter and JSONC

![Markdown menu with YAML frontmatter, styled emphasis, a quote, inline code, a TypeScript fence and a link, beside a JSONC menu with comments, orange keys, olive values and blue literals.](../screenshots/flagship-content.png)

The frontmatter and typed code fence use the bundled embedded grammars.
JSONC adds comments to the ordinary JSON data syntax. Quoted YAML keys can
remain string-colored when a grammar does not distinguish them from values;
the theme cannot manufacture missing scopes.

## Contrast: JSON diff and local review

![Side-by-side JSON diff with minus and plus gutter signs, word-change borders and an expanded native comment thread labeled Fixture reviewer.](../screenshots/contrast-review.png)

The diff is VS Code's actual original/modified editor. A development-only
fixture registers the native comment thread; this is **not a hosted pull
request**, an account, or a review extension screenshot. Signs, labels and
separate panes accompany color. The data is valid JSON.

## Contrast: three-way merge

![Three-way JSON merge with labeled Current and Incoming inputs above Result, three unresolved conflicts, outlined changed regions and Accept or Ignore controls.](../screenshots/contrast-merge.png)

The native merge editor is open on three purpose-written JSON revisions.
Nothing has been accepted: the conflict count and result are real host state.
An internal version-pinned command is used only by the development fixture.
It is not shipped as extension runtime code.

## Deprecated Legacy: the old VS Code port

![Legacy rendering of the same menu.ts shown in the flagship workbench: flat gray canvas, cooler variables, mauve functions, olive strings and historical comment styling.](../screenshots/legacy-code.png)

Legacy uses its frozen ordered TextMate rules; the profile's
`configuredByTheme` semantic setting does not enable semantics for Legacy.
It retains compatibility limitations and is not Classic. Use the
[migration guide](migration.md) to select its normalized ID.
