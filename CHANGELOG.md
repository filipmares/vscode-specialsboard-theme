# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.2.0] - 2026-09-08

### Added

- Differentiated Specials Board Contrast: darker warm planes, selective hue-preserving copper/terracotta/purple/honey adjustments, readable orange keys distinct from olive values, and unchanged dusty blue/lavender/olive families.
- Blocking 7:1 base/current-line syntax and primary UI text targets, 4.5:1 floors for other covered text/composited states, and 3:1 meaningful indicator/boundary checks.
- Deterministic encoded-sRGB composition, linear-light luminance and selected-role CVD checks for normal vision, Machado deuteranopia/protanopia and Brettel tritanopia.
- Human-readable generated evidence for all four variants, explicit historical shortfalls, reference/mutation tests and CI regression gates.
- Contrast-only active/focus, current-line, unnecessary-code and diff text borders. Unnecessary code is underlined instead of faded; native severity/status icons, labels and diagnostic cues remain supported.

### Compatibility and limits

- Minor release: all four saved IDs, the VS Code 1.101.0 engine floor, and the exact flagship, Classic and deprecated Legacy theme bytes are unchanged from 3.1.0.
- Contrast replaces its former undifferentiated preview without changing syntax classification or semantics-on/off behavior. Its ANSI black is now readable warm gray; normal/bright slots stay distinct.
- Selected syntax remains readable over modeled overlays, but subtle selection fills do not themselves meet 3:1. Host focus geometry, arbitrary webviews/terminal colors, user overrides and authenticated AI-provider rendering remain outside the bounded claim.
- CVD separation is a documented engineering threshold, not universal perception, a participant study or WCAG conformance. Classic's historical low-contrast colors and Legacy's unsupported token backgrounds are explicitly reported and frozen.
- No Marketplace imagery/positioning redesign, additional platform adapter, runtime settings changes or license assignment.

## [3.1.0] - 2026-09-08

### Added

- Deliberate ambient/navigation/content workbench hierarchy with reusable normal, hover, active, unfocused-selection, focus, disabled and feedback roles.
- Public theme-color coverage for navigation, tabs/panels, trees/quick input, controls/forms, suggestions/hover/signature help, search/occurrences, diagnostics, SCM/diff/merge/review, testing/debugging, notebooks, notifications, peek, minimap/overview, inlay hints, sticky scroll, bracket pairs and inline-edit/chat editor surfaces.
- Deliberate semantic highlighting with compact standard role mappings, including readonly constants, without adding syntax hue families.
- Sixteen distinct normal/bright ANSI colors and themed terminal interaction states.
- Modern language fixtures, state/alpha/ANSI/semantic regressions and an isolated VS Code extension-host smoke harness.

### Compatibility

- Requires VS Code **1.101.0+**, the first stable version with the selected public chat line-count colors. Older VS Code installations should retain an earlier compatible extension version.
- Minor feature release: all four saved theme IDs remain unchanged from 3.0.0.
- Flagship and Classic retain their exact 3.0.0 TextMate syntax rules and colors, also used when semantic highlighting is unavailable or disabled.
- Deprecated Legacy retains its normalized ID, label, output path, all 47 workbench/ANSI entries, all 156 ordered syntax rules and the absence of semantic highlighting.
- Contrast remains an undifferentiated flagship preview. No Phase 4 accessibility palette differentiation or compliance claim is included.
- Public color IDs do not activate AI providers, kernels or debugger extensions, and cannot style arbitrary webviews. Historical licensing remains unresolved; no license is assigned.

## [3.0.0] - 2026-09-08

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
- Added explicit foreground/background settings for invalid, broken, unimplemented, and deprecated syntax. The token-background rendering limitation is addressed for restored variants in 3.0.0.

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
