# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
