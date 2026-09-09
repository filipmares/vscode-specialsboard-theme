[CmdletBinding()]
param([string] $OutputDirectory = (Join-Path $PSScriptRoot '..\release-artifacts'))

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
Add-Type -AssemblyName System.IO.Compression
$root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$output = [IO.Path]::GetFullPath($OutputDirectory)
$manifest = Get-Content -LiteralPath (Join-Path $root 'package.json') -Raw | ConvertFrom-Json
$utf8 = [Text.UTF8Encoding]::new($false)
$stamp = [DateTimeOffset]::new(1980, 1, 1, 0, 0, 0, [TimeSpan]::Zero)
New-Item -ItemType Directory -Path $output -Force | Out-Null

function Get-Digest([byte[]] $Bytes) {
    [Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($Bytes)).ToLowerInvariant()
}

# Store entries without compression, with fixed metadata and ordinal names, so
# archive identity is independent of zlib versions, local time and file mtimes.
foreach ($target in @('windows-terminal', 'neovim')) {
    $base = [IO.Path]::GetFullPath((Join-Path $root "ports\$target"))
    $entries = @{}
    foreach ($file in Get-ChildItem -LiteralPath $base -File -Recurse) {
        if ($file.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw "Unexpected link: $($file.FullName)" }
        $name = [IO.Path]::GetRelativePath($base, $file.FullName).Replace('\', '/')
        $entries[$name] = [IO.File]::ReadAllBytes($file.FullName)
    }
    if ($entries.Count -ne 3) { throw "Expected three generated $target variants" }
    $readme = [IO.File]::ReadAllText((Join-Path $root 'docs\ports.md')).Replace("`r`n", "`n")
    $entries['README.md'] = $utf8.GetBytes($readme)
    $names = [string[]] @($entries.Keys)
    [Array]::Sort($names, [StringComparer]::Ordinal)
    $checksums = ($names | ForEach-Object { "$(Get-Digest $entries[$_])  $_" }) -join "`n"
    $entries['MANIFEST.sha256'] = $utf8.GetBytes($checksums + "`n")
    $names = [string[]] @($entries.Keys)
    [Array]::Sort($names, [StringComparer]::Ordinal)
    $path = Join-Path $output "specials-board-$target-$($manifest.version).zip"
    $stream = [IO.File]::Open($path, [IO.FileMode]::CreateNew)
    try {
        $zip = [IO.Compression.ZipArchive]::new($stream, [IO.Compression.ZipArchiveMode]::Create, $true)
        try {
            foreach ($name in $names) {
                $entry = $zip.CreateEntry($name, [IO.Compression.CompressionLevel]::NoCompression)
                $entry.LastWriteTime = $stamp
                $entry.ExternalAttributes = 0
                $writer = $entry.Open()
                try { $writer.Write($entries[$name], 0, $entries[$name].Length) } finally { $writer.Dispose() }
            }
        } finally { $zip.Dispose() }
    } finally { $stream.Dispose() }
    $digest = Get-Digest ([IO.File]::ReadAllBytes($path))
    [IO.File]::WriteAllText("$path.sha256", "$digest  $([IO.Path]::GetFileName($path))`n", $utf8)
    Write-Host "$digest  $path"
}
