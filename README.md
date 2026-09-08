# Specials Board Theme

This theme brings the Specials Board theme from the Coda editor to Visual Studio Code. 

[Get it from the Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=filipmares.theme-specialsboard)

## Variants

This branch establishes the generated-theme foundation. **Specials Board**,
**Specials Board Classic**, and **Specials Board Contrast** are foundation previews:
they currently share the same appearance as **Specials Board Legacy**. The Coda
palette restoration and Contrast accessibility work are not implemented yet.
Contrast is not an accessibility-conformance claim.

Legacy preserves the post-Phase-0 2.1.1 appearance, including translucent selection
and visible invalid syntax. Existing saved selections keep working: the historical
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
DTCG profile, variant overrides, provenance, and future adapter contract.
Licensing remains deferred because historical sources have conflicting provenance;
packaging explicitly skips the missing-license gate without assigning a license.

# Screenshot
![Specials Board Screenshot](https://user-images.githubusercontent.com/249027/71357793-2c97f880-25ca-11ea-80c4-fc79fcf1de4a.png)
