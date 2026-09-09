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

## Isolated native smoke

Use an official portable VS Code **1.101.0** build for the engine floor and a
current stable build for forward coverage. Keep both separate from your normal
profile, disable updates in their temporary settings, and extract the candidate
VSIX to a temporary directory. The test runner uses the extracted `extension`
directory as `--extensionDevelopmentPath`, so the theme bytes being inspected
are the actual package, not an unrelated source checkout.

```powershell
$env:SPECIALSBOARD_SMOKE_OUTPUT = "$env:TEMP\specialsboard-smoke-report"
.\portable-vscode\bin\code.cmd --wait --disable-workspace-trust `
  --user-data-dir "$env:TEMP\specialsboard-smoke-profile" `
  --extensions-dir "$env:TEMP\specialsboard-smoke-extensions" `
  --extensionDevelopmentPath "$env:TEMP\specialsboard-vsix\extension" `
  --extensionTestsPath "$PWD\scripts\vscode-smoke.cjs"
```

The report is produced only after all assertions succeed. Do not use CLI exit
status alone: an updating VS Code installation can exit zero without running
the test host. Require a fresh `live-report.json` with `success: true`, the expected
VS Code and extension versions, and no unregistered colors. Use a fresh report
directory for each run to prevent stale success. The runner compares every
authored color with VS Code's own resolved theme export, tests real TypeScript
semantic/completion/hover/signature providers with semantics on/off, and opens
diagnostic, test, review, diff, notebook and terminal fixtures. It does not call
an AI service, execute notebook cells or modify your normal profile.

For visual inspection, set `$env:SPECIALSBOARD_SMOKE_HOLD = "1"` before launching.
The host stays open until a file named `finish` is created in the report directory.
Inspect lists/quick input, hover/focus/selection, suggestions, error/warning
feedback, the notebook, diffs and terminal; compare Classic and Legacy via the
theme picker. Remove only the named temporary test profiles/extractions after
closing their host. Provider-dependent inline edits/chat and arbitrary webviews
remain explicitly outside the guaranteed live coverage.
