# Specials Board Theme

Specials Board interprets the Coda editor's theme for Visual Studio Code.

[Get it from the Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=filipmares.theme-specialsboard)

Version **3.2.0** adds a differentiated **Specials Board Contrast** variant and
reproducible color-accessibility gates. Flagship, Classic and deprecated Legacy
keep their exact 3.1.0 appearance and saved IDs. Read the [changelog](CHANGELOG.md) for
compatibility details. Building a local VSIX does not publish an extension update.

Requires **VS Code 1.101.0 or newer**. Older VS Code versions need an earlier
compatible extension release; no saved-theme-ID migration is required from 3.0.0.

## Variants

Specials Board uses shared, generated semantic roles. **Specials Board** is the
modern Coda interpretation: warm off-white text, copper declarations, olive
strings, dusty-blue literals, terracotta functions, lavender variables, honey
types/tags, orange properties, and purple regex. **Specials Board Classic** uses
historically grounded Coda 1 colors and neutral variables, with documented
readability exceptions for comments and invalid syntax.

**Specials Board Contrast** uses darker warm surfaces and selective
hue-preserving adjustments, retaining the same Coda color families. Its measured
base/current-line syntax and primary UI text meet 7:1; other covered text and
composited states have a 4.5:1 floor, with 3:1 for measured focus/boundary indicators.
Twelve selected semantic pairs pass a documented differentiation gate under
normal vision and deuteranopia, protanopia and tritanopia simulations.

These are specific color-model results, **not a claim that a theme makes VS Code
WCAG-conformant**. Subtle selection fills, host/extension behavior, user overrides
and untested AI-provider states have explicit limits. See the
[accessibility contract](https://github.com/filipmares/vscode-specialsboard-theme/blob/v3.2.0/docs/accessibility.md)
and [generated evidence](https://github.com/filipmares/vscode-specialsboard-theme/blob/v3.2.0/docs/accessibility-report.md).

The restored variants now cover navigation, controls, suggestions/hover, search,
diagnostics, SCM/diffs/merge/review, testing/debugging, notebooks, notifications,
peek, minimap, inlay hints, sticky scroll, bracket pairs and public inline-edit/chat
surfaces. Semantic highlighting refines classification using the same syntax
families; TextMate-only rendering remains available when semantics are off or a
language provider is missing. Provider-dependent features are not enabled by a
theme, and arbitrary extension webviews cannot be themed comprehensively.

**Specials Board VS Code Legacy [Deprecated]** preserves the post-Phase-0 2.1.1
appearance, including translucent selection and historical invalid-token settings.
It is the old VS Code port, not the Coda-grounded Classic variant. Restored variants
use visible red underlined invalid text rather than relying on TextMate backgrounds.

### Upgrading from the historical theme

**Breaking change:** Legacy's saved ID is now `"specials-board-legacy"`, matching
the other variants' naming convention. The historical `"Specials Board "` ID
(including its final space) is deliberately removed, without an alias or automatic
migration. Existing selections referencing it may fall back to a default VS Code
theme after updating or reloading.

Open **Preferences: Color Theme** and choose **Specials Board** to try the restored
flagship, **Specials Board Classic** for the Coda 1-grounded palette, or
**Specials Board VS Code Legacy [Deprecated]** to retain the old appearance.
VS Code does not automatically open the selector. Update any profiles, workspace
settings, or preferred-theme settings that still reference the retired ID.

Users already on the 2.2.0 flagship, Classic, or Contrast previews keep their
saved IDs but receive the corresponding restored palettes. Users of other
extensions' themes are not switched to Specials Board.

## Development

Use Node.js 22.12+ and npm. Tooling is development-only; the extension has no
runtime code or dependencies.

```sh
npm ci --ignore-scripts
npm run generate
npm run accessibility:generate
npm run check
npm run accessibility
npm test
npm run package
```

Edit `tokens/` and `adapters/vscode.json`, not generated `themes/*.json`.
Commit generated files together with their sources. `check` validates schemas,
references, inheritance, manifest contributions, and byte-for-byte output drift.
Packaging also checks the committed accessibility evidence and tests instead of
silently fixing stale output. Classic's known low-contrast colors are reported,
not relabeled as passing Contrast's contract.

See [the token architecture and authoring guide](docs/theme-tokens.md) for the
exact palette, workbench/state coverage and limits, native evidence versus modern judgments, grammar limitations,
DTCG profile, and future adapter contract. Purpose-written language examples
live in `test files/identity/` and `test files/modern/`; tests tokenize them with pinned TextMate grammars.
The [contributor quickstart](vsc-extension-quickstart.md) covers local VSIX
installation, development-host previews, and token inspection.
Licensing remains deferred because historical sources have conflicting provenance;
packaging explicitly skips the missing-license gate without assigning a license.

## Historical screenshot

Historical pre-restoration screenshot; it does not represent the restored
flagship or Classic. Updated Marketplace imagery belongs to the release-positioning phase.

![Historical pre-restoration Specials Board syntax highlighting in VS Code](https://user-images.githubusercontent.com/249027/71357793-2c97f880-25ca-11ea-80c4-fc79fcf1de4a.png)
