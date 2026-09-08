# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Coda 1-grounded Classic palette and a contrast-adjusted modern flagship palette, with native evidence and deliberate departures documented.
- Purpose-written HTML/CSS, JS/TS, Python, Markdown, JSON/YAML, and regex fixtures with pinned TextMate tokenization regressions.
- Focused role-family, provenance, readability-adjustment, and compatibility coverage.

### Changed

- **Breaking:** Renamed Legacy's saved ID from `"Specials Board "` to `"specials-board-legacy"` and its picker label to **Specials Board VS Code Legacy [Deprecated]**. The old ID has no alias or automatic migration; existing users may see a default theme and must choose a theme again through **Preferences: Color Theme**.
- Reclassified flagship/Classic TextMate mappings around portable roles instead of inheriting One Dark-derived color exceptions.
- Restored copper declarations, olive strings, dusty-blue literals, terracotta calls, neutral/lavender variables, honey types/tags, orange properties, purple regex/escapes, and readable italic comments.
- Kept Contrast as an explicitly undifferentiated preview inheriting the flagship, with no accessibility guarantee.
- Replaced the scaffold quickstart with current token-authoring, local packaging, theme-selection, and scope-inspection instructions.

### Fixed

- Restored variants render invalid syntax as red underlined text; VS Code does not paint TextMate token backgrounds, so white text on a red token background did not provide the intended red signal.

### Compatibility

- Specials Board VS Code Legacy [Deprecated] keeps its output path, ordered 156 rules, and 47 workbench/ANSI values. Only its identity changes; preserving old saved selections is intentionally no longer a compatibility guarantee.
- No new workbench IDs, broad semantic-token enablement, accessibility differentiation, license assignment, or release publication.

## [2.2.0] - 2026-09-08

### Added

- Portable DTCG-compatible color tokens, semantic roles, component states, and variant inheritance.
- Deterministic VS Code generation, schema/invariant validation, drift detection, and compatibility tests.
- Stable definitions and generated foundation previews for Specials Board, Classic, and Contrast.
- Provenance distinctions for authoritative Coda 1 data, reconstructions, project history, and engineering judgments.

### Changed

- Retained the historical saved theme ID and labeled that appearance Specials Board Legacy, unchanged from post-Phase-0.
- Theme sources and build tooling are excluded from VSIX runtime contents.

## [2.1.1] - 2026-09-08

### Fixed

- Preserved syntax readability by using a translucent editor selection tint.
- Added explicit foreground/background settings for invalid, broken, unimplemented, and deprecated syntax. The token-background rendering limitation is addressed for restored variants in Unreleased.

### Changed

- Cleaned extension metadata and retained the existing theme identifier with a corrected display label.
- Limited packaged files to Marketplace release assets.
- Set the minimum supported VS Code version to 1.34.

## [2.1.0] - 2025-11-26

### Fixed

- Fixed invisible inactive selection in lists.

### Changed

- Updated metadata for theme with schema and additional fields

## [2.0.0] - 2019-12-22

### Added

- Support for Markdown
- Improved support for Python, JS, and TS.

### Fixed

- Made the theme more closely resemble the Coda theme.

### Changed

- Switched from a `.tmTheme` file to a JSON theme file.

## [1.0.0] - 2018-07-05

### Changed

- Initial release based on a port of the TextMate theme.
