# Specials Board

**Coda roots. Warm color. Modern VS Code.**

A theme family with chalkboard-dark or whiteboard-light surfaces, copper declarations, green strings,
dusty-blue literals and terracotta functions. Specials Board brings a documented
Coda heritage to today's editor without turning every language into the same
pastel palette.

Now also generated for **Windows Terminal and Neovim** from the same source roles.
[Cross-app downloads, installation and capability matrix](https://github.com/filipmares/vscode-specialsboard-theme/blob/v3.4.0/docs/ports.md).

[Install from the Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=filipmares.theme-specialsboard)
· [Visual gallery](https://github.com/filipmares/vscode-specialsboard-theme/blob/master/docs/gallery.md)
· [History and fidelity](https://github.com/filipmares/vscode-specialsboard-theme/blob/v3.3.0/docs/heritage.md)

![Specials Board flagship: TypeScript menu with copper declarations, olive strings and terracotta functions, warm Explorer and status bar, and labeled normal and bright ANSI terminal colors.](https://raw.githubusercontent.com/filipmares/vscode-specialsboard-theme/v3.3.0/screenshots/flagship-workbench.png)

*Flagship in VS Code 1.136.2 (serve-web). The terminal is a deterministic ANSI fixture, not a
build log. Screenshots use only bundled language support and a local capture
fixture; they do not show an AI service or a third-party language server.*

## Five ways to use Specials Board

| Variant in the theme picker | Choose it for |
|---|---|
| **Specials Board** | Everyday coding with the modern warm palette, lavender variables, readable italic comments and a coordinated workbench. |
| **Specials Board Classic** | Coda 1-grounded syntax swatches and neutral variables. A historically informed translation, with documented exceptions and some low-contrast colors; not a Coda emulator. |
| **Specials Board Contrast** | Darker warm surfaces, stronger text and boundary contrast, and selected-role color-vision differentiation gates. The same syntax families, not a different language classification. |
| **Specials Board VS Code Legacy [Deprecated]** | The old VS Code port's post-2.1.1 appearance. Frozen for compatibility, not the Coda-grounded Classic palette. Still included; no removal date is announced. |
| **Specials Board Light** | Clean off-white board, neutral gray frame and saturated dry-erase marker colors. Preserves the flagship's role meanings, not its chalky finish or exact hues. |

**New, unreleased:** Light is generated from the same semantic roles, with
4.5:1 measured text and 3:1 indicator floors. It is VS Code-only for now.
[Light palette, evidence, limitations and system switching](https://github.com/filipmares/vscode-specialsboard-theme/blob/master/docs/light.md)
explain why there is one light option rather than duplicate Classic/Contrast entries.
The whiteboard interpretation uses green, blue, red and purple marker ink, with
deeper orange/ochre for readable keywords, properties and types rather than
low-contrast yellow marker strokes.

### Classic: history, not nostalgia by guesswork

![Specials Board Classic: Python dataclass and regular expressions alongside JavaScript regex examples, showing neutral variables, copper keywords, olive strings, purple regex and quiet italic comments.](https://raw.githubusercontent.com/filipmares/vscode-specialsboard-theme/v3.3.0/screenshots/classic-python.png)

Classic draws on surviving, language-specific Coda 1 `.seestyle` data.
Community Coda 2 reconstructions and later TextMate ports are documented
separately, not treated as original Panic exports. Warm-white defaults, universal
role mappings, modern workbench colors, comment readability and invalid-token
underlines include explicit project judgments. Read the
[cited fidelity notes](https://github.com/filipmares/vscode-specialsboard-theme/blob/v3.3.0/docs/heritage.md).

### Contrast: specific, reproducible color targets

![Specials Board Contrast: Rust and Go menu examples on darker warm canvases, with visible current-line outlines and distinct copper declarations, honey types, olive strings and terracotta calls.](https://raw.githubusercontent.com/filipmares/vscode-specialsboard-theme/v3.3.0/screenshots/contrast-systems.png)

The Contrast variant's release gates require **7:1** for measured base/current-line
syntax and primary UI text, **4.5:1** for other covered text and composited states,
and **3:1** for measured meaningful focus/boundary indicators. Twelve selected
semantic pairs are tested in normal vision and simulated deuteranopia, protanopia
and tritanopia using a documented OKLab-distance regression threshold.

These are bounded color-model results, **not a claim that this theme makes
VS Code WCAG-conformant**. The pair threshold is not a perceptual guarantee or
a participant study. Subtle selection fills do not themselves meet 3:1.
User overrides, host behavior, arbitrary webviews, terminal application colors
and untested AI-provider states have explicit limits. Classic and Legacy's
shortfalls remain visible in the report rather than being called passes.

[Accessibility contract and limitations](https://github.com/filipmares/vscode-specialsboard-theme/blob/v3.3.0/docs/accessibility.md)
· [Generated evidence for all five variants](https://github.com/filipmares/vscode-specialsboard-theme/blob/master/docs/accessibility-report.md)

### Legacy: keep the old VS Code appearance

![Deprecated Specials Board VS Code Legacy: the same TypeScript menu used in the flagship workbench image, with its historical cooler variables, mauve functions and flat gray editor surface.](https://raw.githubusercontent.com/filipmares/vscode-specialsboard-theme/v3.3.0/screenshots/legacy-code.png)

Legacy preserves the old port's colors and ordered syntax rules, including
known historical limitations. It does not receive the restored variants' semantic
highlighting or expanded workbench mappings.

## Install and choose a variant

Requires **VS Code 1.101.0 or newer**. In Extensions, search for **Specials Board**
by **filipmares**, or use the VS Code CLI:

```sh
code --install-extension filipmares.theme-specialsboard
```

Open the Command Palette, run **Preferences: Color Theme**, and choose a variant.
To select the flagship in your own `settings.json`:

```json
{
  "workbench.colorTheme": "specials-board"
}
```

The other saved IDs are `specials-board-classic`, `specials-board-contrast`,
`specials-board-legacy` and `specials-board-light`. The extension does not change your settings or
automatically switch themes.

To opt into system light/dark switching in your own settings:

```json
{
  "window.autoDetectColorScheme": true,
  "workbench.preferredLightColorTheme": "specials-board-light",
  "workbench.preferredDarkColorTheme": "specials-board"
}
```

Without automatic detection, set `workbench.colorTheme` to
`specials-board-light` to select Light directly. High-contrast preferences are
separate; Light is not a high-contrast theme. Light's measured color-differentiation
shortfalls are disclosed rather than presented as passing Contrast's contract.

**Upgrading from 2.x?** Version 3.0 retired the saved ID `"Specials Board "`
(including its trailing space), without an alias or automatic migration.
If VS Code falls back to a default theme, choose the deprecated Legacy entry
to retain the old port, or choose one of the restored variants. Update saved
profile, workspace and preferred-theme settings that reference the old ID.
The three 2.2 preview IDs, and all four IDs from 3.0 onward, remain stable.

**Already on 3.x?** Version 3.1 expanded workbench/semantic coverage and raised
the engine floor; 3.2 differentiated Contrast; 3.3 refreshed presentation;
3.4 added portable adapters. **3.5.0 changes branding, not colors:** all four
generated VS Code themes are byte-identical to 3.3.0.
[Migration and rollback guide](https://github.com/filipmares/vscode-specialsboard-theme/blob/v3.5.0/docs/migration.md)
· [Changelog](https://github.com/filipmares/vscode-specialsboard-theme/blob/v3.5.0/CHANGELOG.md)

## More than syntax colors

The restored variants coordinate navigation, controls, suggestions/hover,
search, diagnostics, diff/merge/review, testing/debugging, notebooks,
notifications, inlay hints, sticky scroll, bracket pairs, sixteen ANSI colors
and public inline-edit/chat color surfaces.

Semantic highlighting uses the same role families when a language provider
classifies a symbol. TextMate fallback remains available when semantics are off
or a provider is missing. A theme supplies colors; it does **not** install
grammars, language servers, debuggers, notebook kernels or AI services.

The [visual gallery](https://github.com/filipmares/vscode-specialsboard-theme/blob/master/docs/gallery.md)
also shows TSX, HTML/CSS, Markdown with YAML frontmatter, JSON/JSONC and actual
VS Code diff, local review and merge surfaces. Static images and explanatory
captions carry the same information; there is no animation.

## Built to be maintained

Five themes are generated from shared palette, semantic and component/state
roles. Schema, drift, compatibility, grammar and accessibility checks run in CI;
isolated native checks cover the supported engine floor and a pinned stable host.
The installed extension is declarative: **no activation code, runtime
dependencies, telemetry or settings mutations**.

The separate [GitHub release archives](https://github.com/filipmares/vscode-specialsboard-theme/releases/tag/v3.4.0)
provide flagship, Classic and Contrast for Windows Terminal (native schemes)
and Neovim 0.11.4+ (native Lua, Tree-sitter/LSP groups and syntax fallbacks).
They are not installed by this extension. Deprecated Legacy stays VS Code-only.
Terminal palettes cannot express syntax roles, and opaque native overlays do
not reproduce every VS Code state. The
[cross-app guide](https://github.com/filipmares/vscode-specialsboard-theme/blob/v3.4.0/docs/ports.md)
documents the losses, requirements, bounded color evidence and installation.

[Development and local installation](https://github.com/filipmares/vscode-specialsboard-theme/blob/v3.4.0/vsc-extension-quickstart.md)
· [Token architecture](https://github.com/filipmares/vscode-specialsboard-theme/blob/v3.4.0/docs/theme-tokens.md)
· [Brand icon](https://github.com/filipmares/vscode-specialsboard-theme/blob/v3.5.0/docs/branding.md)
· [Reproduce the screenshots](https://github.com/filipmares/vscode-specialsboard-theme/blob/master/docs/capturing.md)
· [Report a problem](https://github.com/filipmares/vscode-specialsboard-theme/issues)

**Provenance and licensing:** historical sources contain conflicting license
statements. No license has been assigned or inferred for this repository.
Attribution and source availability do not resolve permission; see the
[unresolved provenance caveat](https://github.com/filipmares/vscode-specialsboard-theme/blob/v3.3.0/docs/heritage.md).
This is an independent VS Code theme project, not a Panic product.
