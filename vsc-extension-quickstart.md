# Specials Board contributor quickstart

Build and inspect the generated themes from this checkout. For palette evidence,
role mappings, and compatibility constraints, see the
[token authoring guide](docs/theme-tokens.md).

## Prerequisites

Use Node.js 22.12+, npm, and a current VS Code installation for development.
The extension's declared minimum VS Code version is 1.101.0; Node.js and the test
dependencies are development tools, not runtime requirements.

Run commands from the repository root. The examples below use PowerShell.


## Sources and generated files

| Path | Purpose |
|---|---|
| `package.json` | Extension metadata, theme contributions, and npm commands. |
| `tokens/` | Palette, portable roles, variant overrides, and provenance. |
| `adapters/vscode.json` | Workbench, TextMate, semantic-token, and ANSI mappings. |
| `themes/specialsboard-flagship.json` | Generated Specials Board theme. |
| `themes/specialsboard-classic.json` | Generated Specials Board Classic theme. |
| `themes/specialsboard-contrast.json` | Generated differentiated Contrast variant with measured color targets. |
| `themes/specialsboard.json` | Generated deprecated VS Code Legacy appearance. |
| `test files/identity/` | Current language fixtures for visual and automated token inspection. |
| `test files/modern/` | TS/TSX, JSONC, shell, Rust, Go, notebook, diff and merge workflow fixtures. |
| `test files/presentation/` | Compact, purpose-written public-gallery fixtures; no external application dependencies. |
| `scripts/presentation/` | Development-only capture extension and isolated settings; never shipped in the VSIX. |

Do not edit generated theme JSON directly. The checked-in `.tmTheme` and older
top-level files in `test files/` are historical material, not current theme sources.

## Build and install a local preview

```powershell
npm ci --ignore-scripts
npm run generate
npm run package -- --out .\specialsboard-preview.vsix
```

Packaging runs drift checks and tests before producing the VSIX. It does not
regenerate stale themes, change the version, or publish anything. Licensing
remains unresolved; the existing `--skip-license` packaging option does not
assign a license.

1. In VS Code, run **Extensions: Install from VSIX...** from the Command Palette.
2. Select `specialsboard-preview.vsix` and reload VS Code if requested.
3. Run **Preferences: Color Theme** and select a variant.
4. Open files from `test files/identity/` to inspect the result.

| Picker label | Saved `workbench.colorTheme` ID |
|---|---|
| Specials Board | `specials-board` |
| Specials Board Classic | `specials-board-classic` |
| Specials Board Contrast | `specials-board-contrast` |
| Specials Board VS Code Legacy [Deprecated] | `specials-board-legacy` |

Contrast has a [bounded, reproducible color contract](docs/accessibility.md), not
a whole-editor accessibility guarantee. Deprecated Legacy retains its old VS Code appearance;
it is not the historically grounded Classic variant.

**Breaking selection change:** the historical `"Specials Board "` ID is no longer
contributed. There is no compatibility alias, automatic migration, or automatic
selector opening. If an old selection falls back to a default theme, choose a
variant manually and update any preferred-theme, profile, or workspace settings
that still use the retired ID.

## Edit and inspect

Change palette/role aliases in `tokens/` and grammar mappings in
`adapters/vscode.json`, then regenerate. Preserve the deprecated Legacy
appearance, its `legacyTextMate` rule order, and its output path; do not update
the frozen fixture to hide a color or scope change.

For a development host without repeatedly installing a VSIX, use the VS Code
CLI if it is on your PATH (`code-insiders` for Insiders):

```powershell
code --new-window --extensionDevelopmentPath="$PWD" ".\test files\identity"
```

This repository does not include a launch configuration, so `F5` is not a
preconfigured theme-preview command. After regeneration, reload the development
window if it still displays cached colors. For an installed preview, rebuild and
reinstall the VSIX instead.

Use **Developer: Inspect Editor Tokens and Scopes** to see the grammar scopes and
winning theme rules under the cursor. For an isolated TextMate-only comparison,
disable semantic highlighting in a temporary VS Code profile, not in the shipped
theme. Bracket-pair colors and other editor decorations can also affect the view;
they are not TextMate syntax colors. See the
[VS Code syntax highlighting guide](https://code.visualstudio.com/api/language-extensions/syntax-highlight-guide)
for the inspector and scope-matching model.

After palette edits, run `npm run accessibility:generate` and review the evidence.
Run `npm run check`, `npm run accessibility` and `npm test` before committing generated output with its
sources. The package version comes from `package.json`; release changes are
documented in the [changelog](CHANGELOG.md). Local packaging does not increment
the version or publish a release. Versioning, release notes, licensing decisions,
and publication must be handled explicitly for each Marketplace release.

## Presentation and packaging

The [capture guide](docs/capturing.md) reproduces the [nine-scene gallery](docs/gallery.md)
using an exact VSIX, a fresh loopback-only VS Code web server/profile and a
development-only fixture extension. It does not run in or change a normal
editor profile. Screenshots have a recorded size/hash manifest; `npm test`
checks the manifest, image budgets, public document links/JSON examples and
purpose-written grammar fixtures. The [migration guide](docs/migration.md)
covers old saved IDs, compatible versions and rollback.

`npm run package` runs all existing generation drift/schema/invariant,
accessibility and Node test gates. It does not silently regenerate stale
sources, accessibility evidence or screenshots. The VSIX contains only its
container metadata, extension manifest, README, changelog, historical icon and
four theme JSON files. The Markdown uses HTTPS release-tag links; screenshots,
docs, fixture/capture code, test evidence, lockfile and development dependencies
are excluded.

For release, inspect the actual ZIP inventory and compare all four theme files
to the source bytes. Record SHA-256 of the exact VSIX tested in both isolated
native hosts. Publish that same bundle to the existing publisher, not a rebuild.
An annotated Git tag and GitHub release do not publish to Marketplace. Confirm
the public Marketplace version/engine and advertised plus independently
downloaded package hashes before claiming publication is complete.

## Isolated native smoke

The Windows runner downloads an official portable VS Code **1.101.0** or the
reviewed current stable **1.136.2**, checks the official archive digest and creates
a fresh GUID-owned test directory. It disables updates before launch and uses
only its own user-data/extensions directories. The extracted VSIX `extension`
directory is `--extensionDevelopmentPath`, so the observed bytes belong to the
actual candidate, not an unrelated source checkout.

```powershell
.\scripts\run-vscode-smoke.ps1 -VSIX .\specialsboard-preview.vsix `
  -ScratchRoot "$env:TEMP\specialsboard-native" -Version 1.101.0
.\scripts\run-vscode-smoke.ps1 -VSIX .\specialsboard-preview.vsix `
  -ScratchRoot "$env:TEMP\specialsboard-native" -Version 1.136.2 -Hold
```

Do not use process exit status alone. Both `runner-report.json` and
`live-report.json` must have fresh matching run IDs, the exact candidate hash,
host/extension versions, `success: true` and final `phase: complete`. While
held for visual review, `phase: holding` is not final completion. A failed or
partial report is retained as failure evidence. The runner compares authored
colors with native resolved exports, exercises real TypeScript providers with
semantics on/off, checks exported TextMate rule availability, and opens
diagnostic, test, review, diff, merge, notebook and ANSI fixtures. A local inline
completion is accepted into the editor without an AI service. Neither provider
responses nor command requests prove the painted colors; inspect the native UI
separately. No kernel is executed and no normal profile is modified.

For visual inspection use `-Hold`. The host waits for its unique run ID in the
output's `finish` file (or the documented bounded command protocol), not merely
for an arbitrary stale file to exist.
Inspect lists/quick input, hover/focus/selection, suggestions, error/warning
feedback, the notebook, diffs and terminal; compare Classic and Legacy via the
theme picker. Remove only the named temporary test profiles/extractions after
closing their host. The version-specific internal merge command is test tooling,
not an extension runtime dependency. Provider-dependent inline edits/chat and
arbitrary webviews remain outside guaranteed live coverage. Updating the stable
pin requires checking the official update API and validating the new host.
