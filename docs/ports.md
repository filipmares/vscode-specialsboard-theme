# Specials Board across applications

The unreleased [Light variant](light.md) is currently VS Code-only. The portable
lineup below remains the same three dark variants; adding Light does not change
any of their generated files or native color contracts.

**3.4.0 adds generated Windows Terminal and Neovim ports.** The four VS Code
themes remain byte-identical to v3.3.0: no new palette, saved ID, syntax
classification or engine requirement. All targets resolve the same canonical
palette -> semantic -> component/state -> variant graph. Platform mappings
contain role references, never independent color copies.

**The next release adds Oh My Posh 31.2.1**, with three generated native prompt
themes and their own reusable RGB palettes. Existing editor and terminal exports
are unchanged. Until released, use `ports/oh-my-posh` from this checkout;
the older v3.4.0 assets below do not contain prompt themes.

Download the two platform archives and adjacent SHA-256 files from the
[v3.4.0 release](https://github.com/filipmares/vscode-specialsboard-theme/releases/tag/v3.4.0).
Each archive includes three generated variants, this guide and an entry-level
`MANIFEST.sha256`. These files are **not installed by the VS Code extension**.
Keeping them in GitHub releases and the repository avoids shipping another
editor's executable configuration in a Marketplace theme bundle.

## Choose what to install

| Appearance | Install | What it does not change |
|---|---|---|
| Terminal canvas, cursor, selection and ANSI-colored output | [Windows Terminal scheme](#install-in-windows-terminal) | Prompt layout and explicit RGB colors chosen by applications |
| Directory/Git/status segments before your command | [Oh My Posh theme](#install-in-oh-my-posh) | Terminal scheme, command output and shell input highlighting |
| Colors only, retaining an existing full prompt | [Generated palette in your own layout](#reuse-the-palette-without-this-layout) | Your segments, icons, templates and right-hand prompt |

**Configure both Windows Terminal and Oh My Posh for a coordinated terminal.**
They are separate installations; selecting one does not activate the other.
The supplied Oh My Posh file is a minimal layout, not a recoloring overlay for
your current preset. Read the layout choice below before replacing anything.

## Why these targets?

| Target | Evidence and user value | Deliberate boundary |
|---|---|---|
| Windows Terminal 1.0+ | Native scheme objects have had the required fields since 1.0; useful on the project's Windows development platform and independently checkable against Microsoft's closed JSON schema. | A palette, not a syntax editor or a Terminal application-UI theme. |
| Neovim 0.11.4+ | Native Lua colorschemes expose universal syntax, Tree-sitter, standard LSP and real UI states. Official portable binaries, bundled parsers and a headless API make native verification practical without plugins or a user's profile. | 0.11.4 is the researched/tested floor, not the first version of every API. Tree-sitter integration is still documented as experimental. |
| Oh My Posh 31.2.1 | Native palette, templates and local Git/status/duration segments; pinned schema and isolated CLI rendering make conditional states reproducible. | A prompt theme, not a terminal scheme or editor theme. Exactly this version is the supported/tested baseline; other versions need revalidation. |
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

| Canonical capability | VS Code | Windows Terminal | Neovim | Oh My Posh |
|---|---|---|---|---|
| Flagship / Classic / Contrast | Full; three restored themes | Lossy; three scheme objects | Full role families; three native colorschemes | Three native prompt themes; syntax differences are not prompt semantics |
| Deprecated Legacy | Full frozen compatibility profile | Unsupported; not exported | Unsupported; not exported | Unsupported; not exported |
| Warm canvas / primary text / cursor | Full | Full | Full; terminal cursor appearance still depends on the host | Explicit prompt background/text only; cursor and terminal canvas untouched |
| Copper keywords, olive strings, blue numbers/constants | Full TextMate + semantic | Unsupported as syntax; ANSI has separate meaning | Full standard captures, LSP types and Vim syntax fallbacks | Unsupported as syntax |
| Terracotta calls, lavender variables/parameters, honey types/tags, orange properties | Full, provider-dependent distinctions | Unsupported | Full native captures and LSP types; fallback grammars may merge distinctions | Unsupported as syntax |
| Regex / escapes / character classes | Context-specific purple and lighter-purple rules | Unsupported | `@string.regexp` / `@string.escape`, native Vim/Lua patterns and JS fallback; class/quantifier substructure may be lost | Unsupported |
| Markdown headings, emphasis, links, raw code, lists, quotes | Full within grammar limits | Unsupported | Full `@markup.*` and native Markdown fallbacks; language fences need their parser | Unsupported |
| JSON / YAML / TOML keys, values, escapes | Full generic roles; grammar-specific limits | Unsupported | Property/key and escape fallbacks; quoted YAML keys can remain strings; external Tree-sitter config parsers not bundled | Unsupported |
| Diff-file added / removed / changed / headers | Full | Unsupported as syntax | Full `@diff.*`, native diff syntax and separate `Diff*` UI groups | Unsupported; Git prompt states are separate roles |
| Normal / bright ANSI 0-15 | Full; separate from syntax | Full sixteen-slot palette | Full `terminal_color_0` through `terminal_color_15`; does not recolor normal syntax | Not used; explicit RGB, independent of ANSI |
| Translucent selection / occurrences / find / line / diff | Native composited layers | Lossy; only opaque selection, host can replace selected foreground | Lossy; authored stacks flattened to RGB over a named canvas, not dynamic per-pixel alpha | Unsupported; opaque prompt backgrounds only |
| Normal / raised / active / inactive UI | Broad workbench coverage | Unsupported in a scheme object | Native windows, floats, status/tab lines and completion menus | Unsupported |
| Keyboard focus / boundaries / search cues | Explicit native outlines/borders | Unsupported in this format | Partial; float/window boundaries, active labels and underlined matches, not VS Code's outline geometry | Unsupported |
| Hover / disabled / unfocused selection | Authored component states | Unsupported in this format | No universal equivalent; plugin/host behavior, not invented names. `VisualNOS` is selection ownership, not inactive focus. | Unsupported |
| Diagnostics / inlay hints / spelling | Native colors with provider cues | Unsupported | Native signs, messages, undercurls, inlay groups; providers and terminal glyph/style support required | Unsupported |
| Notebooks / review / testing / AI editing / arbitrary plugin UI | Selected public surfaces; documented limits | Unsupported | Unsupported outside the standard native groups; no plugin-specific claim | Unsupported |
| Directory / Git / command outcome / execution duration | Not a prompt layout | Scheme cannot supply a prompt | Colorscheme cannot supply a shell prompt | Full supplied layout; optional extra contexts excluded |
| Accessibility contract | Existing bounded VS Code report | Selected source text/ANSI floors only; not transferred whole-app conformance | Selected syntax/state floors only; no transferred VS Code geometry, CVD-participant or screen-reader claim | Measured normal/conditional prompt text and separators only; no whole-terminal claim |

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
is **one scheme object**, not a complete Terminal settings file. Alternatively,
use the generated files in `ports\windows-terminal` from this checkout; no build
or VS Code installation is needed. This requires Windows Terminal, not the
legacy Windows Console Host.

1. In Windows Terminal, open **Settings -> Open JSON file** and back up that file.
   Note the current color scheme for the profile you intend to change.
2. Add the contents of each desired generated object to the existing top-level
   `schemes` array, separated from other objects by commas. If the same scheme
   name already exists, replace that object rather than adding a duplicate.
   Preserve other schemes and all unrelated settings.
3. In your intended profile's **Appearance -> Color scheme**, choose
   **Specials Board**, **Specials Board Classic** or **Specials Board Contrast**.
4. Save the settings and open a new tab using that profile. For PowerShell 7,
   select its profile, not the separate Windows PowerShell or Command Prompt
   profile. Repeat the selection for other profiles only if desired.

**Rollback:** select the profile's previous color scheme. You can then remove
the added scheme objects if no profile uses them, or restore your settings
backup if you have made no other settings changes since creating it.

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

## Install in Oh My Posh

A Windows Terminal scheme sets the terminal canvas and ANSI slots. **Oh My Posh
sets the prompt layout and conditional segment colors.** Either can be used
without the other. These prompts use explicit RGB foregrounds and backgrounds,
not Terminal ANSI slots; they do not recolor command output or input text.

Supported native baseline: **Oh My Posh 31.2.1**, PowerShell 7 and Git available
on `PATH`. Use a **truecolor-capable terminal**. The supplied layout and Git
context indicators use ASCII, so a normal monospace font suffices; no Nerd Font,
powerline glyphs, font installation or font setting change is required. Unicode
in your own paths/branches still needs suitable glyph coverage. Long paths can
wrap naturally; there is no right-aligned panel or automatic truncation.

Install the supported engine explicitly, if needed:

```powershell
winget install --id JanDeDobbeleer.OhMyPosh --exact --version 31.2.1
oh-my-posh version
```

The theme does not install or upgrade the engine. If that package version is not
available in your package source, use the official
[31.2.1 assets](https://github.com/JanDeDobbeleer/oh-my-posh/releases/tag/v31.2.1);
do not assume a newer engine has been validated.

From the next [GitHub release](https://github.com/filipmares/vscode-specialsboard-theme/releases),
download `specials-board-oh-my-posh-<version>.zip` and its adjacent `.sha256`.
Compare `Get-FileHash -Algorithm SHA256` against the sidecar before extraction;
the archive also contains per-entry `MANIFEST.sha256`. Extract to a directory
you own, without replacing an existing preset. Before release, copy the three
generated files from `ports\oh-my-posh` instead.

**Choose your layout before activating a file:**

- **Use the supplied minimal prompt:** follow the initialization steps below.
  It replaces your previous layout with directory, Git, command status and
  duration. User/host, runtime versions, clock, battery and a right-hand prompt
  are not included.
- **Keep your existing full prompt:** use
  [palette-only customization](#reuse-the-palette-without-this-layout) instead.
  Back up your current `.omp.json` and edit a copy; do not overwrite it with a
  generated file. Existing custom glyphs may still require your current Nerd
  Font even though the supplied minimal layout does not.

For a one-session preview, open a fresh `pwsh -NoProfile`, then select one file:

```powershell
$theme = 'C:\Themes\SpecialsBoard\specials-board.omp.json'
# Alternatives: specials-board-classic.omp.json, specials-board-contrast.omp.json
oh-my-posh init pwsh --config $theme | Invoke-Expression
```

This evaluates the official engine's shell initialization output, not theme
implementation code. Nothing in this repository edits your profile or settings.

For persistent installation:

1. In the intended PowerShell 7 session, run `$PROFILE` to find its startup file.
   Different PowerShell editions and hosts can use different profile files.
2. Back up that file and your existing prompt configuration. Open the profile in
   a text editor; create the parent directory and file if they do not exist.
3. Add the following line using your actual configuration path. If the profile
   already initializes Oh My Posh, **replace that line**, not the whole profile,
   and do not initialize two themes. Preserve unrelated modules and settings.
4. Save the profile and open a new PowerShell tab. To apply the choice to the
   current session, run the same initialization line there.

```powershell
oh-my-posh init pwsh --config 'C:\Themes\SpecialsBoard\specials-board.omp.json' | Invoke-Expression
```

Use an absolute path in the profile, not a `$theme` variable defined only during
the earlier preview. If keeping a custom layout, point to your customized copy
instead. Keep the previous config file and exact initialization line for rollback.
Close the preview shell to discard a temporary selection; for persistent rollback,
restore the original profile line **and** its backed-up configuration if you
changed that file, then start a new shell. Leave Terminal's scheme/font settings
alone unless you independently want to change them.

### Layout and state meanings

The original single-line layout is `directory | git:branch states | time:duration | ok >`.
Git disappears outside a repository; time appears only at/above 500 ms. Failure
replaces `ok` with `exit:<code>`. No user/host, runtime, cloud, credential, weather
or network segment is enabled. Additional context is optional through your own
layout, not required to use the supplied theme.

| Native palette role | Meaning and non-color cue | Source feedback family |
|---|---|---|
| `background`, `path` | Explicit warm prompt background; current directory | Canvas, primary text |
| `separator`, `duration` | ASCII `|`; `time:` plus duration | Muted text |
| `git-clean` | No staged/working changes: `clean` (not a claim of upstream synchronization) | Success |
| `git-modified` | Working-tree changes, including untracked files: `modified:` plus counts | Warning |
| `git-staged` | Index changes: `staged:` plus counts | Accent |
| `git-ahead` | `ahead:N` relative to the local upstream tracking ref | Info |
| `git-behind` | `behind:N` relative to the local upstream tracking ref | Warning |
| `git-diverged` | Both directions: `ahead:N behind:N diverged` | Error |
| `success`, `failure` | `ok >` or `exit:<nonzero code> >` | Success, error |

Git chooses the first matching color: **diverged > modified > staged > ahead >
behind > clean**. All simultaneous labels/counts remain visible regardless of
the selected color. Git's ASCII counters are `x` unmerged, `-` deleted, `+` added,
`~` modified and `?` untracked; HEAD uses textual merge/rebase/detached/tag cues.
The engine reads local Git metadata, not real cloud accounts; upstream counts
describe your last fetched tracking refs, not a live remote query. On large or
inaccessible repositories, Git probing can be slow or unavailable; the prompt
does not replace `git status` or repair repository state.

### Reuse the palette without this layout

Read the selected generated file with `Get-Content -Raw | ConvertFrom-Json` and
copy its top-level **`palette` object only** into a copy of your own `.omp.json`.
Keep your own blocks/segments. Replace your segment colors with native references,
for example `"foreground": "p:path"` and `"background": "p:background"`, or a
conditional `"{{ if ne .Code 0 }}p:failure{{ end }}"`. Palette keys are ordinary
Oh My Posh names, not special engine fields.

If your preset already has a palette, merge deliberately: preserve keys still
referenced by that layout and resolve name collisions (rename both the imported
key and its `p:` references if needed). Do not blindly replace a palette used by
other segments. An alternative is to retain your existing palette key names and
replace their values with the appropriate RGB values from the generated palette.
That preserves existing `p:` references without rewriting templates or segments.

Match the role to its use, not just its name. The supplied `path` color is light
**foreground text**; an existing preset's `path` key might instead be a colored
**background panel**. A panel can use a light accent such as `git-staged` or
`git-ahead` as its background and the dark `background` color for its text.
Check normal and conditional text/background pairs and separators in that layout.
Preserve its `blocks`, segment order, templates, options and icons when the goal
is recoloring only; do not paste the generated `blocks` over them.

Copying the palette does not bring the supplied layout, status
templates or contrast guarantees with it. Keep custom files outside `ports`;
generated files are overwritten by regeneration. Refresh your copied palette
explicitly when adopting a later release.

### Bounded color evidence and limitations

The [generated prompt report](https://github.com/filipmares/vscode-specialsboard-theme/blob/master/docs/oh-my-posh-accessibility.md)
measures all eleven foreground roles against each variant's explicit opaque
background, including every conditional Git/outcome color and inline separators.
Combined states cannot introduce a new background or color pair. Contrast
requires **7:1 for primary path text** and **4.5:1 for other text and separators**,
consistent with the existing bounded text contract (stronger than a 3:1
indicator-only threshold). A regression blocks generation and release.

Flagship and Classic are reported without release-blocking floors. Their current
prompt pairs meet the assigned text floors, but with less margin; this neither
fixes Classic's editor syntax limitations nor guarantees arbitrary background
combinations. Hue alone is not guaranteed distinguishable: modified/behind and
diverged/failure intentionally share feedback families. Labels carry the
distinction. No prompt-specific CVD participant/differentiation, screen-reader,
pixel-rendering, terminal selection, transparency, font, terminal input/output
or whole-terminal accessibility claim is made.

## See the terminal colors in use

After selecting the Windows Terminal scheme, run these read-only commands in a
Git repository:

```powershell
git -c color.status=always status --short
git --no-pager diff --color=always
git --no-pager log --graph --oneline --decorate --color=always -15
```

Status and diff can be empty in a clean repository. The colored commit graph
still gives an example if the repository has commits. These commands demonstrate
Git's ANSI-colored output, not Oh My Posh rendering; Git color overrides can
choose different colors. Other programs may supply their own RGB themes.

For prompt behavior, run `Start-Sleep -Seconds 2` to show duration, then
`pwsh -NoProfile -Command 'exit 1'` to exercise failure status. The supplied prompt
shows `exit:1`; custom layouts retain their own status labels or icons.

### Installation troubleshooting

| Symptom | What to check |
|---|---|
| Prompt changed, but command output did not | Select the Windows Terminal scheme in the profile you actually use; Oh My Posh does not theme command output. |
| Terminal colors changed, but prompt panels did not | The prompt may use explicit RGB; initialize the desired Oh My Posh file or recolor its palette separately. |
| Clock, battery or runtime segments disappeared | The supplied generated file replaced your full layout. Restore your preset and apply only the generated palette colors. |
| Only some custom segments appear | Existing segment conditions, runtime availability and terminal width still apply; recoloring does not enable missing data sources. |
| Custom icons appear as boxes | Your retained layout may require a Nerd Font. Its requirements are separate from the ASCII supplied layout; no font is installed automatically. |
| Theme does not load in a new tab | Confirm that tab uses the expected shell/profile and that its startup file references an existing absolute config path. |

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

`generate` validates all results before writing five VS Code files and nine
portable files. `check` is read-only and fails on missing, changed, CRLF or
unmanaged output files. It does not repair drift. JSON keys and Lua definitions
are sorted, arrays preserve their declared order, output is UTF-8/LF with a
final newline, and generation never reads a clock, environment or network.

`ports:validate` additionally downloads **immutable, SHA-256-pinned official
documentation/schema files**. Microsoft's complete schema is not vendored:
the actual 2020-12 scheme/color definitions are validated with the already-pinned
Ajv dependency, in addition to the stricter authored complete-field schema.
Neovim's offline 90-capture enum is compared with the official native vocabulary.
Oh My Posh is checked against its pinned native 2020-12 schema as well as the
closed authored subset; unsupported options fail even if the CLI ignores them.
Native execution remains a separate gate, not a claim inferred from schema success.

`ports:package` writes three versioned ZIPs in `release-artifacts` with fixed
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

For Oh My Posh, install the pinned engine on `PATH` and run `npm run posh:smoke`.
The runner uses temporary HOME/profile/config/cache directories, isolated Git
configuration and synthetic local repositories, never your normal profile,
credentials or remote accounts. It covers no repository, clean/modified/staged/
combined/ahead/behind/diverged Git, success/failure and duration presence/absence
for all three themes, checking native text and truecolor output. CI installs the
hash-pinned official engine and runs this separate gate. Published release tags
must match `package.json`; only after all quality/native jobs pass does CI attach
the three archives and sidecars, without overwriting existing assets.

The Windows 31.2.1 native run passed **459 renders**: 17 synthetic repository/
non-repository states across three variants, three exit statuses (0, 7, -7), and
three durations (499, 500, 1500 ms). This includes combined local/upstream states,
detached commits and tags. Native export preserves the palette and segment
configuration; rendered text, explicit RGB foreground/background and each
separator are checked. The 500 ms boundary is inclusive. These observations
are CLI rendering evidence, not an interactive pixel or font inspection.

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
| Oh My Posh 31.2.1 native schema | [schema.json](https://github.com/JanDeDobbeleer/oh-my-posh/blob/fc19b6fccaac637600151d0c383cd86bc949f290/themes/schema.json), SHA-256 `6620237cb6b837880b9d2721a6a6a71d0cc57b7fc7b1b5b7d50d133abd8dcd82` |
| Native prompt palette and Git state fields | [colors](https://github.com/JanDeDobbeleer/oh-my-posh/blob/fc19b6fccaac637600151d0c383cd86bc949f290/website/docs/configuration/colors.mdx), [Git](https://github.com/JanDeDobbeleer/oh-my-posh/blob/fc19b6fccaac637600151d0c383cd86bc949f290/website/docs/segments/scm/git.mdx); native schema is authoritative when example options lag |
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
