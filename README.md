# Specials Board Theme

This theme brings the Specials Board theme from the Coda editor to Visual Studio Code. 

[Get it from the Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=filipmares.theme-specialsboard)

## Variants

Specials Board uses shared, generated semantic roles. **Specials Board** is the
modern Coda interpretation: warm off-white text, copper declarations, olive
strings, dusty-blue literals, terracotta functions, lavender variables, honey
types/tags, orange properties, and purple regex. **Specials Board Classic** uses
historically grounded Coda 1 colors and neutral variables, with documented
readability exceptions for comments and invalid syntax.

**Specials Board Contrast remains an undifferentiated preview.** It currently
inherits the flagship appearance; its accessibility differentiation is deferred.
Neither its name nor the flagship's readability adjustments are an
accessibility-conformance claim.

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

## Development

Use Node.js 22.12+ and npm. Tooling is development-only; the extension has no
runtime code or dependencies.

```sh
npm ci --ignore-scripts
npm run generate
npm run check
npm test
npm run package
```

Edit `tokens/` and `adapters/vscode.json`, not generated `themes/*.json`.
Commit generated files together with their sources. `check` validates schemas,
references, inheritance, manifest contributions, and byte-for-byte output drift.
Packaging runs that check and the tests instead of silently fixing stale output.

See [the token architecture and authoring guide](docs/theme-tokens.md) for the
exact palette, native evidence versus modern judgments, grammar limitations,
DTCG profile, and future adapter contract. Purpose-written language examples
live in `test files/identity/`; tests tokenize them with pinned TextMate grammars.
Licensing remains deferred because historical sources have conflicting provenance;
packaging explicitly skips the missing-license gate without assigning a license.

# Screenshot

Historical pre-restoration screenshot; it does not represent the restored
flagship or Classic. Updated Marketplace imagery belongs to the release-positioning phase.

![Specials Board Screenshot](https://user-images.githubusercontent.com/249027/71357793-2c97f880-25ca-11ea-80c4-fc79fcf1de4a.png)
