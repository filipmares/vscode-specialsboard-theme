<#
.SYNOPSIS
Prepare a fresh local serve-web profile with an exact VSIX and visual fixtures.
.DESCRIPTION
Does not start a server or modify an existing VS Code profile. OutputRoot must
not exist. Use a short, dedicated scratch path. The fixture extension is local
development tooling and must never be included in the Marketplace VSIX.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string] $VSIX,
    [Parameter(Mandatory = $true)][string] $OutputRoot
)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$source = (Resolve-Path -LiteralPath $VSIX).ProviderPath
$root = [IO.Path]::GetFullPath($OutputRoot)
if (Test-Path -LiteralPath $root) { throw "Refusing to reuse capture root: $root" }
$repo = Split-Path $PSScriptRoot -Parent
New-Item -ItemType Directory -Path $root | Out-Null
$package = Join-Path $root 'package'
Add-Type -AssemblyName System.IO.Compression.FileSystem
[IO.Compression.ZipFile]::ExtractToDirectory($source, $package)
$extension = Join-Path $package 'extension'
$manifest = Get-Content -LiteralPath (Join-Path $extension 'package.json') -Raw | ConvertFrom-Json
if ("$($manifest.publisher).$($manifest.name)" -ne 'filipmares.theme-specialsboard') {
    throw 'Expected the existing filipmares.theme-specialsboard extension'
}
$extensions = Join-Path $root 'server\extensions'
$settings = Join-Path $root 'server\data\User'
$workspace = Join-Path $root 'Garden menu'
New-Item -ItemType Directory -Path $extensions, $settings, $workspace | Out-Null
Copy-Item -LiteralPath $extension -Destination (Join-Path $extensions "filipmares.theme-specialsboard-$($manifest.version)") -Recurse
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'presentation') -Destination (Join-Path $extensions 'specialsboard-local.specialsboard-capture-fixture-1.0.0') -Recurse
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'presentation\settings.json') -Destination (Join-Path $settings 'settings.json')
Get-ChildItem -LiteralPath (Join-Path $repo 'test files\presentation') -File |
    Copy-Item -Destination $workspace
foreach ($name in @('python.py', 'regex.js')) {
    if (-not (Test-Path -LiteralPath (Join-Path $workspace $name))) {
        Copy-Item -LiteralPath (Join-Path $repo "test files\identity\$name") -Destination $workspace
    }
}
foreach ($name in @('menu.rs', 'menu.go')) {
    if (-not (Test-Path -LiteralPath (Join-Path $workspace $name))) {
        Copy-Item -LiteralPath (Join-Path $repo "test files\modern\$name") -Destination $workspace
    }
}
Copy-Item -LiteralPath (Join-Path $workspace 'menu.base.json') -Destination (Join-Path $workspace 'menu.result.json')
$record = [ordered]@{
    extensionVersion = $manifest.version
    vsixSha256 = (Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash.ToLowerInvariant()
    themeFiles = @($manifest.contributes.themes | ForEach-Object {
        [ordered]@{ id = $_.id; sha256 = (Get-FileHash -LiteralPath (Join-Path $extension $_.path) -Algorithm SHA256).Hash.ToLowerInvariant() }
    })
    viewport = @{ width = 1440; height = 1000; deviceScaleFactor = 1 }
    serverCommit = '88e44fa0e00b08f7758b4f6d05632e4fd5e4df6f'
}
[IO.File]::WriteAllText((Join-Path $root 'capture-context.json'), ($record | ConvertTo-Json -Depth 6) + "`n", [Text.UTF8Encoding]::new($false))
Write-Host "Prepared: $root"
Write-Host "Serve with --server-data-dir `"$root\server`" --default-folder `"$workspace`" --commit-id $($record.serverCommit)"
