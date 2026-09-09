# Upgrading and rolling back

**3.5.0 preserves all four 3.3.0 theme files and saved IDs exactly.**
It changes only the package icon and Marketplace gallery banner. The
[cross-app ports](ports.md) added in 3.4.0 are separate optional downloads, not
installed into other applications by the VS Code extension. No color/theme
selection migration is needed from 3.2.0 onwards. Earlier versions have
the changes below; you can upgrade directly without installing intermediate releases.

## Choose the intended variant

| Theme picker label | Saved ID for `workbench.colorTheme` | Intended audience |
|---|---|---|
| Specials Board | `specials-board` | Modern warm flagship |
| Specials Board Classic | `specials-board-classic` | Coda 1-grounded syntax, with historical contrast limitations |
| Specials Board Contrast | `specials-board-contrast` | Darker warm surfaces and measured color-quality targets |
| Specials Board VS Code Legacy [Deprecated] | `specials-board-legacy` | Frozen old VS Code port; not Classic |

Open the Command Palette and run **Preferences: Color Theme**. Select the exact
label above. VS Code does not automatically open the picker, and this extension
contains no runtime code that rewrites your settings.

## Historical 2.x users

**Version 3.0 removed the old saved ID `"Specials Board "`**, including the
trailing space. There is no alias or automatic migration. A saved selection
using that ID may fall back to a default VS Code theme after updating/reloading.
To keep the old port's appearance, select **Specials Board VS Code Legacy [Deprecated]**,
or replace the old value in your own settings:

```json
{
  "workbench.colorTheme": "specials-board-legacy"
}
```

This is **not** a rename to the flagship ID. Classic is also not a replacement
name for the old VS Code port. Legacy preserves the post-2.1.1 appearance:
2.1.1 made selection translucent and corrected invalid-token data, so Legacy
is not claimed to be byte-identical to every earlier 2.0/2.1 release.
Its unsupported historical token-background settings remain a documented limitation.

In **2.2.0**, flagship, Classic and Contrast were foundation previews with the
current normalized IDs. Those three IDs still work, but upgrading receives the
restored palettes/workbench and the now-differentiated Contrast. The 2.2 Legacy
selection still used the retired trailing-space ID and needs the change above.

Check each profile's user settings, workspace settings, remote settings and any
preferred-theme settings that used the retired value. If automatic color-scheme
selection is enabled, update the relevant existing preference too:

```json
{
  "workbench.colorTheme": "specials-board-legacy",
  "workbench.preferredDarkColorTheme": "specials-board-legacy"
}
```

Also check `workbench.preferredHighContrastColorTheme` if you explicitly assigned
the old theme there. Do not enable automatic switching merely to migrate.
All four Specials Board variants are `vs-dark`; Contrast does not implement
VS Code's built-in high-contrast mode. Existing custom color overrides remain
yours and can change both the appearance and the measured contrast results.

## Users already on 3.x

| Installed version | What changes on the way to 3.5.0 |
|---|---|
| 3.0.x | IDs remain valid. 3.1 adds workbench and semantic-token coverage and raises the engine floor. 3.2 differentiates Contrast. |
| 3.1.x | IDs remain valid; flagship, Classic and Legacy bytes stay fixed. Contrast replaces its undifferentiated preview with darker surfaces and measured adjustments in 3.2. |
| 3.2.x | No theme-byte, engine or ID change. 3.3 refreshes documentation, Marketplace metadata and screenshots. |
| 3.3.x | No VS Code theme-byte, engine or ID change. 3.4 adds separately downloaded Windows Terminal/Neovim ports. |
| 3.4.x | No VS Code theme-byte, engine or ID change. 3.5 replaces the package icon and gallery banner colour. Nothing in your settings refers to either. |

Semantic highlighting in the restored variants can refine classifications when
a language provider is available. To compare TextMate fallback, change
`editor.semanticHighlighting.enabled` to `false` in a temporary profile, not in
the extension's theme files. Legacy does not opt into semantic highlighting.

## Engine compatibility

| Extension release | Declared VS Code requirement |
|---|---|
| 2.2.0 and 3.0.0 | `^1.34.0` |
| 3.1.0 through 3.5.0 | `^1.101.0` |

The floors above are verified against those release manifests, not inferred from
the version number. Check other historical versions' own manifests.
The current requirement supports selected public workbench color IDs; do not
edit the manifest locally to bypass compatibility checks.

## Roll back deliberately

In the Extensions view, find **Specials Board** by **filipmares**, open its
Manage/gear menu, and select **Install Another Version...**. Choose the intended
compatible release and reload when prompted. Confirm both its installed version
and the active theme. If that VS Code version offers extension-specific
**Auto Update** control, turn it off for Specials Board while pinned; check your
update policy rather than disabling updates for every extension.

Alternatively, download the matching VSIX and checksum from
[GitHub releases](https://github.com/filipmares/vscode-specialsboard-theme/releases).
Check SHA-256, then run **Extensions: Install from VSIX...** and select the file.
For example, after downloading both 3.2.0 assets to the current directory:

```powershell
Get-FileHash .\theme-specialsboard-3.2.0.vsix -Algorithm SHA256
Get-Content .\theme-specialsboard-3.2.0.vsix.sha256
code --install-extension .\theme-specialsboard-3.2.0.vsix --force
```

Compare the displayed digest with the `.sha256` record **before** installation.
`--force` explicitly replaces the installed extension; it does not bypass the
engine requirement. If rolling back below 3.0, choose the historical theme again
in that version's picker: the normalized Legacy ID does not exist there.
Re-enable the extension's update policy when the temporary rollback is finished.

See the [changelog](../CHANGELOG.md), [history/fidelity guide](heritage.md),
[color contract](accessibility.md) and [VS Code theme settings documentation](https://code.visualstudio.com/docs/configure/themes).
