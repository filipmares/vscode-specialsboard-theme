# Reproducing the visual gallery

The original 3.3.0 dark gallery and the Light scenes introduced in 3.6.0 use actual
VS Code **1.136.2** workbench pixels through
`serve-web`, on Windows with Chromium, at **1440 x 1000 CSS pixels / 1x**.
There is no simulated editor HTML, recoloring, image compositing or animation.
The four dark theme files are byte-identical to 3.2.0; their nine original
images are retained without modification. The original capture date was not
recorded. The four Light images were captured on **2026-09-09** from a local
3.5.0 candidate VSIX containing the revised whiteboard/marker Light theme,
not from 3.2.0. These four images replace the earlier warm-paper previews:
the current canvas is neutral `#fafafa`, framed by gray surfaces and saturated
marker syntax. Historical dark captures remain untouched.
Both batches use the same pinned host below. Exact theme/image hashes and the
Light capture date are in [the capture manifest](../screenshots/manifest.json).

This is a reproducible **scene setup**, not a promise of byte-identical
rasterization across operating systems, browser/font versions or GPU drivers.
Native desktop behavior at the engine floor and pinned stable version is a
separate [release check](../vsc-extension-quickstart.md#isolated-native-smoke).

## Isolate first

Use a fresh scratch folder, an unconnected browser profile, and no user settings
sync or account sign-in. Never use your normal editor's user-data/extensions
directories. Only the theme, bundled VS Code extensions and the explicitly
labeled local capture fixture are loaded. No Python, Rust, Go, React, AI,
notebook or review extension is installed.

Download the official standalone VS Code CLI for your platform from the
[VS Code download service](https://code.visualstudio.com/download).
For the published Windows captures, the update metadata endpoint is
`https://update.code.visualstudio.com/api/versions/1.136.2/cli-win32-x64/stable`.
Verify the archive against the returned `sha256hash` before extracting it.
The reviewed CLI archive SHA-256 is
`f32fd65cf106ea189b2b9a73bf45f05fc656289fc09220577fa2aab61c403fbe`;
the web client/server commit is
`88e44fa0e00b08f7758b4f6d05632e4fd5e4df6f`.
The CLI downloads the matching official server on first use.

From the repository root, in PowerShell (substitute your dedicated paths):

```powershell
npm ci --ignore-scripts
npm run package -- --out .\specialsboard-preview.vsix
.\scripts\prepare-presentation.ps1 -VSIX .\specialsboard-preview.vsix `
  -OutputRoot D:\temp\specialsboard-capture

# Use the standalone downloaded CLI, not your normal desktop profile.
& D:\temp\specialsboard-cli\code.exe `
  --cli-data-dir D:\temp\specialsboard-cli-data serve-web `
  --host 127.0.0.1 --port 8765 --without-connection-token `
  --accept-server-license-terms --disable-telemetry `
  --server-data-dir D:\temp\specialsboard-capture\server `
  --default-folder "D:\temp\specialsboard-capture\Garden menu" `
  --commit-id 88e44fa0e00b08f7758b4f6d05632e4fd5e4df6f
```

The script refuses an existing output root, extracts the exact VSIX, records
its checksum and theme hashes, and copies only the purpose-written fixtures.
The 2026-09-09 Light captures were refreshed from the exact
`specialsboard-whiteboard.vsix` development candidate after the
whiteboard/marker palette revision and prepublish checks.
The manifest records that exact VSIX checksum separately from the Light theme
checksum: later documentation-only packaging changes need not change theme
pixels. Capturing a candidate is not a substitute for the normal release
packaging and validation gates.
The tokenless server must remain **loopback-only**; do not expose or tunnel it.
Wait for `http://127.0.0.1:8765/` to return 200, not the initial 202 download page.

## Browser profile and scenes

Open the loopback URL in the isolated browser. `serve-web` has browser-local
user settings as well as server settings: pre-seeding the server is **not**
enough. Run **Preferences: Open User Settings (JSON)** and replace the document
with [scripts/presentation/settings.json](../scripts/presentation/settings.json).
If VS Code opens a modal editor, use **Open Modal Editor in Main Window** first.
Paste as a single JSON document, save, and accept the requested reload. Do not
type a multiline document as individual keystrokes with auto-indent enabled.
Confirm settings have no JSON errors before proceeding.

The profile disables telemetry, experiments, updates, AI features, sync-related
restoration, breadcrumbs and minimap. It selects Consolas (no font download),
18/20 px source text, 27/29 px line height and a solid cursor. It does not override
theme colors. `editor.experimentalEditContextEnabled: false` avoids a
browser-automation input limitation; it does not change token rendering.
`configuredByTheme` preserves semantic highlighting in the restored variants
and leaves Legacy on its historical TextMate behavior.

Run **Notifications: Clear All Notifications** and enable **Do Not Disturb**.
Then run **Specials Board Capture: Choose Scene**. The Light scenes are
`light-workbench` (TypeScript and ANSI terminal), `light-web` (HTML/CSS),
`light-python` (Python and JavaScript regex), and `light-content`
(Markdown with YAML frontmatter and JSONC). The fixture opens the
files, selects the variant, uses 18 px wrapped text for splits and 20 px text
for the single-editor views, and labels the status bar. No colors are changed.
It disposes terminals **only in this dedicated capture host**.

For automated capture, pass the absolute path to
[scripts/capture-presentation.mjs](../scripts/capture-presentation.mjs) as the
`filename` of Playwright MCP's `browser_run_code_unsafe`. It is a Playwright
function expression, not a Node CLI program. Run the MCP server from the
repository root so `screenshots\` resolves here. It targets only the loopback
tab, checks each scene's theme canvas, resizes the terminal to fit the whole
TypeScript example and writes **only the four new Light PNGs by default**,
preserving all historical dark captures. To deliberately recapture all thirteen
scenes, explicitly change `captureDark` to `true` in a local copy of the
capture function.
Before rerunning, close the merge editor with **Close with Conflicts**;
only the disposable fixture result is affected.

## What is real, and what is a fixture

| Surface | Capture evidence |
|---|---|
| TypeScript / TSX / JavaScript | Bundled language service plus TextMate; no external packages required by the JSX fixture. |
| Python / Rust / Go | Bundled TextMate grammars only; no semantic language-server claim. |
| HTML / CSS / Markdown / YAML frontmatter / JSON / JSONC | Bundled language support and embedded grammars; a theme cannot add missing classification. |
| Terminal | Native integrated terminal with a local pseudoterminal emitting labeled normal/bright ANSI slots, not a shell/build/test transcript. Minimum-contrast adjustment is set to 1 so the authored colors are shown. |
| Review | Native comments API with an explicitly named fixture reviewer, not a real account or hosted PR. |
| Diff / merge | Actual VS Code editors with valid purpose-written JSON inputs. The merge command is internal and pinned, not a public extension runtime dependency. |

No debugger session, notebook execution, AI provider, screen-reader exercise or
CVD participant study is depicted. Broader public-color coverage and native
API smoke evidence must not be relabeled as screenshot evidence.

## Inspect, optimize and publish

Inspect **every image** at full size and at normal README width. Ensure complete
examples, readable text, correct variant labels, no clipping, no notification
toasts, no account information and no personal paths. The title/status labels
and fixture names are intentional. Do not retouch syntax colors to hide
historical shortfalls. Captions and alt text in the README/gallery explain the
same content without requiring color perception.

PNG is lossless; Chromium's encoder, a bounded 1440 px width and 1x output keep
the gallery small without JPEG text artifacts. Do not upscale or produce a
second redundant image set. `screenshots/manifest.json` records dimensions,
SHA-256 and byte lengths; the presentation tests enforce a 400 KiB per-image
budget and a 4 MiB total budget for thirteen images. Regenerate the manifest after recapturing:

```powershell
node scripts/presentation-manifest.mjs
node --test tests/presentation.test.mjs
```

README images and documentation links use explicit HTTPS URLs because
Marketplace Markdown does not behave like a GitHub repository page. Released
material uses release-tag URLs; the Light guides and expanded gallery are
pinned to the 3.6.0 release.
The gallery uses ordinary headings, links, tables, fenced code and static PNGs;
no scripts, embedded video, SVG, collapsible sections or custom CSS are required.
Check the packaged README and the public Marketplace rendering after publication.
New tag URLs resolve only after the tag is pushed; validate the same paths
locally before that point, then verify the public URLs.

All screenshots and capture tooling are excluded from the VSIX. The package icon
is generated from the repository's own vector master rather than captured here;
see [brand icon and Marketplace presentation](branding.md). The screenshots
introduce no externally sourced artwork.

Stop only the server/process tree you started, close its isolated browser tab,
and remove only your named capture/CLI folders and upload/download scratch.
Never kill all `Code`, `node`, browser or updater processes by name.
