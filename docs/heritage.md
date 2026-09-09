# Coda heritage and fidelity

Specials Board began as Joseph Bergantine's light-on-dark theme for Panic's
Coda editor. His [archived author page](https://web.archive.org/web/20130125171129id_/http://joebergantine.com/werkstatt/seestyle)
credits Ryan Bates' Railscast theme and Damien Timewell's idlefingers as
influences, and says Coda 2 includes Specials Board by default.
This VS Code project continues that lineage independently; it is not a Panic product.

**Fidelity means traceable decisions, not identical pixels.** Coda's per-language
style system, TextMate scopes, semantic providers and the modern VS Code
workbench do not have one-to-one equivalents. All four generated themes in
3.3.0 are byte-identical to 3.2.0; this document explains them, not a new palette.

## Which evidence has authority?

| Source | Classification | What it can establish |
|---|---|---|
| [Surviving Coda 1 package, pinned at 979438c](https://github.com/partydrone/Specials-Board/tree/979438ca680a48d2bf8e8c2e52d531eb162e2efa/specials-board) | **Authoritative Coda-native data** | Language-specific `.seestyle` token IDs, foregrounds, backgrounds and styles. The historical comparison transcribed 752 rows across 23 mode files, not 752 universal semantic roles. |
| [Original package README](https://github.com/partydrone/Specials-Board/blob/979438ca680a48d2bf8e8c2e52d531eb162e2efa/README.markdown) and archived author page above | **Author documentation** | Authorship, influences, installation and global-color instructions; Coda 2 bundling. They also contain conflicting licensing statements. |
| [Atom reconstruction, b51f42b](https://github.com/mikelentini/Specials-Board/tree/b51f42b7866dbe24b2153ccea139093083563804) and [Brackets reconstruction, c024afc](https://github.com/codetheweb/Specials-Board/tree/c024afc257827359639287841681221a26aafb2b) | **Coda 2 derivatives/reconstructions** | Useful evidence of later interpretations, not native Panic color exports. They disagree on some assignments. |
| [Later TextMate/Sublime port, 0392110](https://github.com/lamotta/specialsboard/tree/03921103a0f2b0e3a29cf779ff4272d2f017e2a4) | **Derivative scope translation** | Later Special Edition/Next scope and palette choices. Broad language coverage does not make its colors original Coda authority. |
| [Repository `.tmTheme`](../themes/specialsboard.tmTheme) and [release history](../CHANGELOG.md) | **Project history** | The initial VS Code port and later JSON evolution. The old `.tmTheme` is neither current Legacy nor a Coda-native file. |
| [Token provenance registry](../tokens/provenance.json) and [authoring guide](theme-tokens.md) | **Project judgments and compatibility contracts** | Role normalization, modern color adjustments, workbench design and the frozen post-2.1.1 Legacy baseline. |

Earlier research inspected an official Coda 2 application archive and confirmed
bundling, but did not recover standalone native `.seestyle` palette definitions.
Bundling is independently supported by the archived author page; it does not
authenticate community palettes. A [JetBrains derivative](https://github.com/wnvdhoven/coda2-specials-board)
was treated as low-confidence because its metadata identifies a Monokai copy.
Neither it nor One Dark Pro-derived scope coverage is color authority here.

## What the native colors actually support

Selected native rows, not a claim that every Coda language used identical roles:

| Native evidence | Classic translation | Modern flagship judgment |
|---|---|---|
| JavaScript `_Default` canvas `#2b2b2b` | Same editor canvas | Warmer `#302e2c` canvas |
| JavaScript/Python keywords `#cc762e` | Copper declarations | Lifted copper `#d99559` |
| JavaScript/CSS/Python strings `#a0c25f`; numbers `#6c99bb` | Olive strings, dusty-blue literals | Softer olive `#b2c879`, lifted blue `#8aafcb` |
| Python builtins/special methods `#da4632` | Red-orange functions/calls | Terracotta `#e08066`, not later-port mauve |
| HTML tags `#ffc05c`, attributes `#cc7832` | Honey tags/types, orange properties | Gentler honey/orange; universal type/property mappings are judgments |
| JavaScript/Ruby regex `#8856d2`, escapes `#be73fd` | Separate purple regex/escape roles | Lifted purples, retaining those relationships |
| Native comment `#666666` | **Readability departure:** italic `#8a847d` | Warmer, brighter italic `#a39a90` |

The native JavaScript row named `FunctionRegex` is red-orange, but its distinct
`Regular Expressions` row is purple. The row name alone must not be interpreted
as evidence that ordinary regex literals were function-colored.

Many serialized `_Default` foreground rows are black. Native embedded CSS/JS
rows supply warm white `#e6e1dc`, and the original README explicitly instructs
users to set the global foreground to that warm white manually. The data must
be read with its installation instructions, not flattened into a universal
`_Default` row. Ruby has lavender instance variables and language-specific
exceptions; **neutral Classic variables** and **lavender flagship variables**
are deliberate cross-language choices, not a universal original Coda rule.

Classic normalizes other language exceptions too. Modern Markdown, semantic
tokens, sixteen ANSI slots, workbench states and red underlined invalid text
are authored translations. Native red SGML/CDATA rows do not establish a
universal invalid/error role. VS Code does not paint TextMate token backgrounds;
restored variants therefore use visible red foreground and underline.
See the [complete maintained mapping decisions](theme-tokens.md#phase-2-palette-decisions).

## Four variants, four distinct purposes

**Specials Board** is a modern interpretation of Coda's role relationships,
not a Coda 2 reconstruction. **Specials Board Classic** is Coda 1-grounded,
with documented normalization/readability exceptions and historical contrast
shortfalls. **Specials Board Contrast** changes warm surfaces and selected
lightness values under a [bounded color contract](accessibility.md).
**Specials Board VS Code Legacy [Deprecated]** preserves the old VS Code port
after the 2.1.1 fixes; its 156 ordered rules and 47 workbench/ANSI entries are
compatibility authority, not Coda authority.

The VS Code chronology is recorded in the changelog: 1.0 (2018) used a
TextMate-based port; 2.0 (2019) moved to JSON and broader language coverage;
2.1.1 fixed selection/invalid-token data; 2.2 introduced generated variants;
3.0 restored flagship/Classic and normalized Legacy's ID; 3.1 added modern
workbench/semantic coverage; 3.2 differentiated Contrast; 3.3 refreshes the
public presentation without recoloring. See [migration and rollback](migration.md).

## Unresolved licensing

The surviving original README states **CC BY-SA 3.0**, while the archived
author page states **BSD** for Coda 1.x. This project has not established whether
those statements cover identical revisions, files or downstream permissions.
Attribution, source availability and derivative repositories do not resolve
that conflict or grant rights. **No license is assigned or inferred here**;
the existing packaging license exception remains an explicit unresolved caveat.

This is the release-facing distillation of historical comparison blob
`94a1e18eaaa76d50a96a4260d366ca30b02e925a`, not a copy of its exhaustive tables.
That report predates the Phase 0 fixes: its columns called "current VS Code"
describe the old port, **not 3.3.0**. The generated themes, frozen fixtures,
source registry and maintained token/accessibility guides govern current behavior.
