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

- Reclassified flagship/Classic TextMate mappings around portable roles instead of inheriting One Dark-derived color exceptions.
- Restored copper declarations, olive strings, dusty-blue literals, terracotta calls, neutral/lavender variables, honey types/tags, orange properties, purple regex/escapes, and readable italic comments.
- Kept Contrast as an explicitly undifferentiated preview inheriting the flagship, with no accessibility guarantee.

### Fixed

- Restored variants render invalid syntax as red underlined text; VS Code does not paint TextMate token backgrounds, so white text on a red token background did not provide the intended red signal.

### Compatibility

- Specials Board Legacy keeps its exact historical ID, output path, ordered 156 rules, 47 workbench/ANSI values, and existing user selections.
- No new workbench IDs, broad semantic-token enablement, accessibility differentiation, license assignment, or release publication.

## [2.2.0] - 2026-09-08

### Added

- Portable DTCG-compatible color tokens, semantic roles, component states, and variant inheritance.
- Deterministic VS Code generation, schema/invariant validation, drift detection, and compatibility tests.
- Stable definitions and generated foundation previews for Specials Board, Classic, and Contrast.
- Provenance distinctions for authoritative Coda 1 data, reconstructions, project history, and engineering judgments.

### Changed

- The historical saved theme ID now selects Specials Board Legacy with the unchanged post-Phase-0 appearance.
- Theme sources and build tooling are excluded from VSIX runtime contents.

## [2.1.1] - 2026-09-08

### Fixed

- Preserved syntax readability by using a translucent editor selection tint.
- Restored visible styling for invalid, broken, unimplemented, and deprecated syntax.

### Changed

- Cleaned extension metadata and retained the existing theme identifier with a corrected display label.
- Limited packaged files to Marketplace release assets.
- Set the minimum supported VS Code version to 1.34.

## [2.1.0] - 2025-11-26

### Fixed

- Inactive selection in list not visibile

### Changed

- Updated metadata for theme with schema and additional fields

## [2.0.0] - 2019-12-22

### Added

- Support for Markdown
- Imporved support for Python, JS, TS

### Fixed

- Theme closer resembles Coda theme

### Changed

- Using JSON theme file instead of tmTheme file

## [1.0.0] - 2018-07-05

### Changed

- Initial release based on port of Textmate theme
