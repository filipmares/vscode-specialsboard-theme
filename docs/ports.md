# Specials Board across applications

**3.4.0 adds generated Windows Terminal and Neovim ports.** The four VS Code
themes remain byte-identical to v3.3.0: no new palette, saved ID, syntax
classification or engine requirement. All targets resolve the same canonical
palette -> semantic -> component/state -> variant graph. Platform mappings
contain role references, never independent color copies.

Download the two platform archives and adjacent SHA-256 files from the
[v3.4.0 release](https://github.com/filipmares/vscode-specialsboard-theme/releases/tag/v3.4.0).
Each archive includes three generated variants, this guide and an entry-level
`MANIFEST.sha256`. These files are **not installed by the VS Code extension**.
Keeping them in GitHub releases and the repository avoids shipping another
editor's executable configuration in a Marketplace theme bundle.

## Why these targets?

| Target | Evidence and user value | Deliberate boundary |
|---|---|---|
| Windows Terminal 1.0+ | Native scheme objects have had the required fields since 1.0; useful on the project's Windows development platform and independently checkable against Microsoft's closed JSON schema. | A palette, not a syntax editor or a Terminal application-UI theme. |
| Neovim 0.11.4+ | Native Lua colorschemes expose universal syntax, Tree-sitter, standard LSP and real UI states. Official portable binaries, bundled parsers and a headless API make native verification practical without plugins or a user's profile. | 0.11.4 is the researched/tested floor, not the first version of every API. Tree-sitter integration is still documented as experimental. |
| Zed, deferred | Public schema and rich capture support make this a credible future adapter. | Schema acceptance alone does not prove capture coverage; no comparable documented standalone native headless theme import was established in this investigation. |
| Sublime Text, deferred | Stable native JSON color schemes and rich scope support. | Color schemes and application-UI themes are separate; this phase chose the independently testable Neovim host instead. |

Neovim's documented 90 standard highlight captures are unchanged between the
reviewed 0.11.4 and 0.12.5 releases. This is evidence for the chosen baseline,
not a guarantee about future grammars, plugins or releases. No third-party theme
implementation or One Dark semantic assignments were copied.

## Variants and capability matrix

**Full** means an authored native mapping exists, not that a grammar/provider
always emits it. **Lossy** means the reduced native model changes its meaning or
rendering. **Unsupported** means this adapter intentionally supplies no mapping.

| Canonical capability | VS Code | Windows Terminal | Neovim |
|---|---|---|---|
| Flagship / Classic / Contrast | Full; three restored themes | Lossy; three scheme objects | Full role families; three native colorschemes |
| Deprecated Legacy | Full frozen compatibility profile | Unsupported; not exported | Unsupported; not exported |
| Warm canvas / primary text / cursor | Full | Full | Full; terminal cursor appearance still depends on the host |
| Copper keywords, olive strings, blue numbers/constants | Full TextMate + semantic | Unsupported as syntax; ANSI has separate meaning | Full standard captures, LSP types and Vim syntax fallbacks |
| Terracotta calls, lavender variables/parameters, honey types/tags, orange properties | Full, provider-dependent distinctions | Unsupported | Full native captures and LSP types; fallback grammars may merge distinctions |
| Regex / escapes / character classes | Context-specific purple and lighter-purple rules | Unsupported | `@string.regexp` / `@string.escape`, native Vim/Lua patterns and JS fallback; class/quantifier substructure may be lost |
| Markdown headings, emphasis, links, raw code, lists, quotes | Full within grammar limits | Unsupported | Full `@markup.*` and native Markdown fallbacks; language fences need their parser |
| JSON / YAML / TOML keys, values, escapes | Full generic roles; grammar-specific limits | Unsupported | Property/key and escape fallbacks; quoted YAML keys can remain strings; external Tree-sitter config parsers not bundled |
| Diff-file added / removed / changed / headers | Full | Unsupported as syntax | Full `@diff.*`, native diff syntax and separate `Diff*` UI groups |
| Normal / bright ANSI 0-15 | Full; separate from syntax | Full sixteen-slot palette | Full `terminal_color_0` through `terminal_color_15`; does not recolor normal syntax |
| Translucent selection / occurrences / find / line / diff | Native composited layers | Lossy; only opaque selection, host can replace selected foreground | Lossy; authored stacks flattened to RGB over a named canvas, not dynamic per-pixel alpha |
| Normal / raised / active / inactive UI | Broad workbench coverage | Unsupported in a scheme object | Native windows, floats, status/tab lines and completion menus |
| Keyboard focus / boundaries / search cues | Explicit native outlines/borders | Unsupported in this format | Partial; float/window boundaries, active labels and underlined matches, not VS Code's outline geometry |
| Hover / disabled / unfocused selection | Authored component states | Unsupported in this format | No universal equivalent; plugin/host behavior, not invented names. `VisualNOS` is selection ownership, not inactive focus. |
| Diagnostics / inlay hints / spelling | Native colors with provider cues | Unsupported | Native signs, messages, undercurls, inlay groups; providers and terminal glyph/style support required |
| Notebooks / review / testing / AI editing / arbitrary plugin UI | Selected public surfaces; documented limits | Unsupported | Unsupported outside the standard native groups; no plugin-specific claim |
| Accessibility contract | Existing bounded VS Code report | Selected source text/ANSI floors only; not transferred whole-app conformance | Selected syntax/state floors only; no transferred VS Code geometry, CVD-participant or screen-reader claim |

**Legacy remains VS Code-only.** It exists to preserve the old VS Code port's
ordered scope behavior, not a historical cross-application installation. Several
of its normal/bright ANSI slots collapse to the same value. Exporting that
deprecated compatibility data would add another maintenance promise without
preserving a real cross-app contract. It is not removed or recolored in VS Code.

Classic and flagship intentionally share the modern ANSI families; their
terminal canvases differ. A terminal has no keyword/property/string roles with
which to reproduce Classic's syntax differences. Contrast additionally changes
ANSI lightness and the canvas. Classic's historical syntax contrast limitations
remain visible in Neovim, rather than silently recoloring it.

## Install in Windows Terminal

Unzip `specials-board-windows-terminal-3.4.0.zip`. Each `specials-board*.json`
is **one scheme object**, not a complete Terminal settings file.

1. In Windows Terminal, open **Settings -> Open JSON file** and back up that file.
2. Add the contents of each desired generated object to the existing top-level
   `schemes` array. Preserve its other entries and all other settings.
3. In your intended profile's **Appearance -> Color scheme**, choose
   **Specials Board**, **Specials Board Classic** or **Specials Board Contrast**.

The native profile property is `colorScheme`; for example, this is a fragment
to merge into an existing profile, **not replacement settings**:

```json
{
  "colorScheme": "Specials Board Contrast"
}
```

The native names `purple` / `brightPurple` represent ANSI magenta, not regex.
Every normal/bright pair has relative-luminance separation greater than **0.1**,
and all sixteen slots are distinct and opaque. This engineering invariant is
not a guarantee of differentiation under every kind of color vision.

Terminal applications can use explicit RGB, 256-color indices, inverse video,
dim/bold attributes or their own themes. Those can bypass or reinterpret the
sixteen slots. Do not infer readability of every foreground/background pair.
Contrast's ANSI black is deliberately readable warm gray, not literal black.
No profile opacity, font, renderer, contrast adjustment or app setting is changed
by the files.

**Selection limitation:** the canonical translucent blue tint is flattened
over that variant's canvas. Current Terminal rendering treats the selection
as opaque and chooses black/white selected foreground; it does not preserve
VS Code's syntax foreground beneath an alpha layer. Acrylic/opacity, renderer
versions and application-supplied backgrounds can further change the result.

## Install in Neovim

Unzip `specials-board-neovim-3.4.0.zip`. Copy its `colors` directory into your
Neovim configuration directory, without replacing other files. Find that
directory with `:echo stdpath('config')` (normally `%LOCALAPPDATA%\nvim` on
Windows, `~/.config/nvim` on Unix). Alternatively add the extracted directory
to your own `runtimepath` or load it with your usual local-package workflow.
No plugin manager is required.

In your own `init.lua`, choose one variant:

```lua
vim.opt.termguicolors = true
vim.cmd.colorscheme("specials-board")
-- Alternatives: "specials-board-classic", "specials-board-contrast"
```

Or preview with `:colorscheme specials-board-contrast`. Enable native syntax
with `:syntax enable` if your configuration has disabled it. The colorscheme
sets a dark background, resets highlights, applies native groups and sets the
sixteen embedded-terminal ANSI variables. It does not write configuration,
enable transparency, install parsers, start an LSP, remap keys or configure
diagnostic behavior.

Use a truecolor-capable terminal or GUI. Italic, bold, underline, undercurl and
strikethrough depend on the font and host. There is no separately maintained
8/16/256-color `cterm` approximation; without RGB, fidelity is unsupported.

### Syntax decisions, not inherited theme semantics

The adapter covers all 90 standard Neovim captures explicitly. In particular,
`@variable.member` is an orange property, not a lavender variable;
`@keyword.operator` is copper while symbolic `@operator` is neutral.
`@string.regexp` is purple, escapes lighter purple, and documentation strings
are quiet italic comments. Lua pattern strings are not described as full regex.
Types/tags stay honey and calls/methods terracotta.

Standard LSP types share those same families. Only typed readonly variables
and properties use the blue constant refinement; no blanket readonly/type
or default-library recoloring is introduced. Deprecated text retains a
strikethrough cue. Group mappings do not prove an LSP has classified a symbol.

Vim-syntax fallbacks deliberately correct `jsonNull` (stock `Function`) and
`javaScriptNull` (stock `Keyword`) to blue constants. JSON/YAML/TOML keys are
orange where their native grammar distinguishes them. JavaScript regex bodies
override the stock string link with purple; the bundled regex recognizer is
not a complete modern ECMAScript parser. Quoted ordinary strings are not
guessed to be regex. A grammar that emits only a single regex body cannot
supply separate character-class/quantifier colors.
The bundled Vim query specifically emits `@string.regexp` for a quantifier
such as `\+`, but `@string.special` for adjacent pattern text: both remain in
the purple family, with that native distinction documented rather than
rewriting the grammar. Neovim 0.12 also automatically starts bundled Markdown
Tree-sitter on `FileType`; the fallback smoke explicitly stops it so the two
highlighting paths are genuinely exercised separately.

Markdown has styled headings/emphasis, olive raw code, blue underlined URLs,
warm-white link text and quiet quotes. Tree-sitter injection into typed fences
depends on installed parsers and queries. Native JSON/YAML/TOML/diff/JS syntax
fallbacks do not require extra parsers; these Tree-sitter parsers are **not**
included in the theme. Neovim bundles C, Lua, Markdown/inline, Vim, Vimdoc and
query parsers at the supported floor.

Neovim does not support arbitrary RGBA highlight backgrounds. Selection,
current-line, search and diff groups are computed from the source-role stack
over an explicit canvas. Multiple simultaneous native highlights can replace
each other instead of reproducing a VS Code alpha stack. Float/popup `blend`
is not substituted for token opacity; user blending settings are untouched.
Visual selection leaves syntax foreground unset, and search/occurrence groups
also supply an underline cue. These do not recreate every VS Code border.

## Reproduce and contribute

Use Node.js 22.12+, npm and PowerShell 7 for archive/native Windows tooling.
The generator and offline tests need no installed editor:

```powershell
npm ci --ignore-scripts
npm run generate
npm run accessibility:generate
npm run check
npm run accessibility
npm test
npm run ports:validate
npm run package
npm run ports:package
```

`generate` validates all results before writing four VS Code files and six
portable files. `check` is read-only and fails on missing, changed, CRLF or
unmanaged output files. It does not repair drift. JSON keys and Lua definitions
are sorted, arrays preserve their declared order, output is UTF-8/LF with a
final newline, and generation never reads a clock, environment or network.

`ports:validate` additionally downloads **immutable, SHA-256-pinned official
documentation/schema files**. Microsoft's complete schema is not vendored:
the actual 2020-12 scheme/color definitions are validated with the already-pinned
Ajv dependency, in addition to the stricter authored complete-field schema.
Neovim's offline 90-capture enum is compared with the official native vocabulary.
Native execution remains a separate gate, not a claim inferred from schema success.

`ports:package` writes two versioned ZIPs in `release-artifacts` with fixed
timestamps, ordinal paths, uncompressed entries and SHA-256 manifests. It refuses
to overwrite an existing ZIP; use `-OutputDirectory` for a second build.
The release process compares independent archive builds and each extracted
entry with local generated bytes. No development dependency or parser is
bundled. The `.sha256` files authenticate bytes against the published digest,
not authorship by themselves.

For isolated native evidence on Windows:

```powershell
.\scripts\run-port-smoke.ps1 -Version 0.11.4 -ScratchRoot D:\temp\sb-ports
.\scripts\run-port-smoke.ps1 -Version 0.12.5 -ScratchRoot D:\temp\sb-ports
```

The runner uses official hash-checked portable Neovim distributions and owned
scratch, not normal editor profiles. Native Lua load/lookup, resolved highlights,
ANSI globals, variant switching and representative actual Tree-sitter/Vim
syntax results are distinct from painted pixels, LSP execution or user studies.
See the release notes for the actual observations and remaining visual limits.

For 3.4.0, both official 0.11.4 and 0.12.5 hosts passed exact generated-file
loading, lookup and highlight/style checks, 93 actual capture probes, 78 native
syntax probes and 18 variant switches per host. The probes span all three
variants; they are not counts of independent language features. The harness
also checks all 90 documented captures and 45 authored fallback names against
the installed runtime. A real isolated flagship C/Markdown window in 0.12.5
was visually inspected for warm role families, emphasis and links. No
Classic/Contrast pixel pass or Windows Terminal scheme-import visual pass is
claimed; native schema, syntax/API and visual evidence remain distinct.

For a future adapter, add a native-name-to-role mapping in `adapters`, a strict
supported-format schema, and a renderer consuming `compileSources`. Keep ANSI
in its independent mapping, not syntax groups. Use explicit bottom-to-top
`over` stacks when the native format cannot represent alpha; never drop alpha
silently or introduce platform palette literals. Reuse canonical roles first.
Add source-referenced native vocabulary evidence, loss/variant decisions to
this matrix, deterministic and mutation/drift/inheritance tests, actual native
parsing/tokenization where practical, installation instructions and lean-package
exclusions. A new renderer must work without VS Code's mapping or manifest.
Do not change byte locks or the Legacy fixture to hide a regression.

## Official format evidence

Checked 2026-09-09:

| Contract | Immutable authority |
|---|---|
| Windows Terminal 1.0 scheme fields | [1.0 schema](https://github.com/microsoft/terminal/blob/0dfe1bed1e9bf7bcf2cfadda2ece045a6bff3b8e/doc/cascadia/profiles.schema.json#L640-L729) |
| Current closed scheme shape and RGB | [1.24 schema](https://github.com/microsoft/terminal/blob/5a830b2bf7c053d5c7ac22208fe5a346cb5dd3dc/doc/cascadia/profiles.schema.json) (SHA-256 `57ef7816e2c941f14351cefbdf5a5ee4ffcdc9199470296cf5f4eb56720e65e7`) |
| ANSI names and native requirements | [ColorScheme.cpp](https://github.com/microsoft/terminal/blob/5a830b2bf7c053d5c7ac22208fe5a346cb5dd3dc/src/cascadia/TerminalSettingsModel/ColorScheme.cpp#L18-L146) |
| Current Terminal selection behavior | [AtlasEngine.cpp](https://github.com/microsoft/terminal/blob/5a830b2bf7c053d5c7ac22208fe5a346cb5dd3dc/src/renderer/atlas/AtlasEngine.cpp#L317-L331) |
| Neovim 0.11.4 native captures | [treesitter.txt](https://github.com/neovim/neovim/blob/cec0ecabd8f47ff81dcb52e8fc9003e365563a84/runtime/doc/treesitter.txt#L365-L482) (document SHA-256 `458dce1cf257bffa5d2122c6c3bb0a93ae3f6d45672f5a574362df695a1506ef`) |
| Neovim 0.12.5 vocabulary comparison | [treesitter.txt](https://github.com/neovim/neovim/blob/5885a30e1e1225349079e7a1c4a3848aa8e43e42/runtime/doc/treesitter.txt#L367-L484) |
| Native highlights / colorscheme lookup / isolation | [API](https://github.com/neovim/neovim/blob/cec0ecabd8f47ff81dcb52e8fc9003e365563a84/runtime/doc/api.txt#L1425-L1475), [syntax/UI](https://github.com/neovim/neovim/blob/cec0ecabd8f47ff81dcb52e8fc9003e365563a84/runtime/doc/syntax.txt), [startup](https://github.com/neovim/neovim/blob/cec0ecabd8f47ff81dcb52e8fc9003e365563a84/runtime/doc/starting.txt) |
| Native fallback grammar names | [JSON](https://github.com/neovim/neovim/blob/cec0ecabd8f47ff81dcb52e8fc9003e365563a84/runtime/syntax/json.vim), [YAML](https://github.com/neovim/neovim/blob/cec0ecabd8f47ff81dcb52e8fc9003e365563a84/runtime/syntax/yaml.vim), [TOML](https://github.com/neovim/neovim/blob/cec0ecabd8f47ff81dcb52e8fc9003e365563a84/runtime/syntax/toml.vim), [Markdown](https://github.com/neovim/neovim/blob/cec0ecabd8f47ff81dcb52e8fc9003e365563a84/runtime/syntax/markdown.vim), [diff](https://github.com/neovim/neovim/blob/cec0ecabd8f47ff81dcb52e8fc9003e365563a84/runtime/syntax/diff.vim), [JavaScript](https://github.com/neovim/neovim/blob/cec0ecabd8f47ff81dcb52e8fc9003e365563a84/runtime/syntax/javascript.vim) |

**Provenance remains unresolved.** Historical sources conflict between CC BY-SA
and BSD statements. No project license or downstream permission is inferred,
and source availability/attribution does not settle that conflict. These new
mappings are authored format translations, not new evidence of original Coda
roles or licensing. See the
[heritage caveat](https://github.com/filipmares/vscode-specialsboard-theme/blob/v3.4.0/docs/heritage.md)
and the existing
[bounded color contract](https://github.com/filipmares/vscode-specialsboard-theme/blob/v3.4.0/docs/accessibility.md).
