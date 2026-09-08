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

Legacy preserves the post-Phase-0 2.1.1 theme data, including translucent selection
and historical invalid-token settings. Restored variants use visible red underlined
invalid text rather than relying on TextMate backgrounds. Existing saved selections keep working: the historical
theme ID `"Specials Board "` (including its final space) now labels this variant
**Specials Board Legacy**. The new flagship uses ID `"specials-board"`; switching
to it is opt-in, not an automatic migration.

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
