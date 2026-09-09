<#
.SYNOPSIS
Validate current generated themes in isolated, pinned official Neovim on Windows.
.DESCRIPTION
Requires PowerShell 7 and Node.js. Downloads and SHA-256-verifies an official
archive, or uses an explicitly supplied existing Neovim package. Every invocation
owns a fresh GUID child of ScratchRoot and, when supplied, OutputRoot. Reports,
expectations and logs are retained under OutputRoot (otherwise ScratchRoot) on
failure and success. No profiles, plugins, parsers, or terminal settings are installed.
.EXAMPLE
pwsh -NoProfile -File .\scripts\run-port-smoke.ps1 -ScratchRoot .\portable-evidence\scratch -OutputRoot .\portable-evidence -Version 0.11.4
.EXAMPLE
pwsh -NoProfile -File .\scripts\run-port-smoke.ps1 -ScratchRoot .\portable-evidence -Version 0.12.5 -Neovim C:\tools\nvim-win64\bin\nvim.exe
#>
#Requires -Version 7.2
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string] $ScratchRoot,
    [string] $OutputRoot,
    [ValidateSet('0.11.4', '0.12.5')]
    [string] $Version = '0.12.5',
    [string] $Neovim,
    [ValidateRange(10, 600)]
    [int] $TimeoutSeconds = 120
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
if (-not $IsWindows) { throw 'This runner requires Windows and the official win64 Neovim package.' }

function Write-JsonFile([string] $Path, $Value) {
    [IO.File]::WriteAllText($Path, ($Value | ConvertTo-Json -Depth 40) + "`n", [Text.UTF8Encoding]::new($false))
}

function Get-SHA256([string] $Path) {
    (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant()
}

$pins = @{
    '0.11.4' = '77eee5936724b82e45b448e0370abe0911d75fad551c0a25415f4e51719faf34'
    '0.12.5' = 'de8625ba8cf65ebf40eb80a388ba1ec8e9c15b30218821e2c639119b05920de1'
}
$root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$runId = [Guid]::NewGuid().ToString('N')
$scratch = Join-Path ([IO.Path]::GetFullPath($ScratchRoot)) "nvim-$runId"
if ($scratch.Length -gt 170) { throw 'Use a shorter ScratchRoot to avoid Windows archive extraction path limits.' }
if (Test-Path -LiteralPath $scratch) { throw "Refusing to reuse run directory: $scratch" }
New-Item -ItemType Directory -Path $scratch | Out-Null
$output = $scratch
if ($OutputRoot) {
    $output = Join-Path ([IO.Path]::GetFullPath($OutputRoot)) "nvim-$runId-output"
    if (Test-Path -LiteralPath $output) { throw "Refusing to reuse output directory: $output" }
    New-Item -ItemType Directory -Path $output | Out-Null
}
$runnerReport = Join-Path $output 'runner-report.json'
$reportPath = Join-Path $output 'native-report.json'
$expectedPath = Join-Path $output 'expected.json'
$runner = [ordered]@{
    schemaVersion = 1; runId = $runId; version = $Version; scratch = $scratch; output = $output
    startedAt = [DateTime]::UtcNow.ToString('o'); success = $false
    scope = 'Native Neovim API, bundled Tree-sitter and Vim syntax; LSP groups only; no visual or Windows Terminal runtime validation'
}
$process = $null
$started = $false
$stdout = $null
$stderr = $null
try {
    Write-Host "Owned scratch: $scratch"
    Write-Host "Owned evidence: $output"
    Write-JsonFile (Join-Path $scratch 'owner.json') @{
        runId = $runId; output = $output; createdAt = $runner.startedAt
    }
    Write-JsonFile $runnerReport $runner
    if ($Neovim) {
        $executable = (Resolve-Path -LiteralPath $Neovim).ProviderPath
        $runner['binarySource'] = 'Explicit existing package; archive provenance not reverified by this run'
    } else {
        $archive = Join-Path $scratch 'nvim-win64.zip'
        $url = "https://github.com/neovim/neovim/releases/download/v$Version/nvim-win64.zip"
        Invoke-WebRequest -Uri $url -OutFile $archive -TimeoutSec 300
        $digest = Get-SHA256 $archive
        if ($digest -ne $pins[$Version]) { throw "Official archive SHA-256 mismatch: $digest" }
        $runner['archive'] = @{ url = $url; sha256 = $digest }
        [IO.Compression.ZipFile]::ExtractToDirectory($archive, $scratch)
        $executable = Join-Path $scratch 'nvim-win64\bin\nvim.exe'
        $runner['binarySource'] = 'Official release archive verified against committed SHA-256 pin'
    }
    $package = Split-Path (Split-Path $executable)
    $runtime = Join-Path $package 'share\nvim\runtime'
    $parserRuntime = Join-Path $package 'lib\nvim'
    foreach ($path in @($executable, (Join-Path $runtime 'doc\treesitter.txt'))) {
        if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { throw "Missing official package file: $path" }
    }
    foreach ($language in @('lua', 'c', 'markdown', 'markdown_inline', 'vim')) {
        $parser = Join-Path $parserRuntime "parser\$language.dll"
        if (-not (Test-Path -LiteralPath $parser -PathType Leaf)) { throw "Missing bundled parser: $parser" }
    }
    $runner['executable'] = $executable
    $runner['executableSha256'] = Get-SHA256 $executable
    & node (Join-Path $PSScriptRoot 'port-smoke-data.mjs') $expectedPath $runId $Version
    if ($LASTEXITCODE -ne 0) { throw 'Expected-model generation failed; generated files must be current.' }
    $expected = Get-Content -LiteralPath $expectedPath -Raw | ConvertFrom-Json
    $runner['expectedSha256'] = Get-SHA256 $expectedPath
    $runner['themes'] = @($expected.themes | ForEach-Object { @{ id = $_.id; sha256 = $_.sha256 } })

    $info = [Diagnostics.ProcessStartInfo]::new()
    $info.FileName = $executable
    $info.WorkingDirectory = $scratch
    $info.UseShellExecute = $false
    $info.CreateNoWindow = $true
    $info.RedirectStandardOutput = $true
    $info.RedirectStandardError = $true
    # Child-only allowlist: never inherit NVIM/VIMINIT, user runtime paths or profiles.
    $info.Environment.Clear()
    $info.Environment['SystemRoot'] = $env:SystemRoot
    $info.Environment['WINDIR'] = $env:WINDIR
    $info.Environment['PATH'] = "$(Split-Path $executable);$env:SystemRoot\System32"
    $info.Environment['VIMRUNTIME'] = $runtime
    $info.Environment['NVIM_APPNAME'] = 'specials-board-smoke'
    foreach ($key in @('HOME', 'USERPROFILE', 'APPDATA', 'LOCALAPPDATA', 'XDG_CONFIG_HOME',
            'XDG_DATA_HOME', 'XDG_STATE_HOME', 'XDG_CACHE_HOME', 'TEMP', 'TMP')) {
        $directory = Join-Path $scratch $key.ToLowerInvariant()
        New-Item -ItemType Directory -Path $directory | Out-Null
        $info.Environment[$key] = $directory
    }
    foreach ($argument in @('-n', '-i', 'NONE', '--clean', '--headless',
            '--cmd', 'set nomodeline noswapfile noundofile nobackup nowritebackup',
            '-l', (Join-Path $PSScriptRoot 'neovim-smoke.lua'), $expectedPath, $reportPath, $parserRuntime)) {
        $info.ArgumentList.Add($argument)
    }
    Write-JsonFile $runnerReport $runner
    $process = [Diagnostics.Process]::new()
    $process.StartInfo = $info
    if (-not $process.Start()) { throw 'Could not start the owned Neovim process.' }
    $started = $true
    $runner['pid'] = $process.Id
    $stdout = $process.StandardOutput.ReadToEndAsync()
    $stderr = $process.StandardError.ReadToEndAsync()
    if (-not $process.WaitForExit($TimeoutSeconds * 1000)) {
        # Kill only this Process instance, never another editor or a process name.
        $process.Kill()
        if (-not $process.WaitForExit(10000)) { throw "Owned Neovim PID $($process.Id) did not terminate." }
        throw "Native smoke timed out after $TimeoutSeconds seconds."
    }
    $runner['exitCode'] = $process.ExitCode
    if ($process.ExitCode -ne 0) { throw "Native smoke failed (exit $($process.ExitCode)); inspect native-report.json and stderr.log." }
    if (-not (Test-Path -LiteralPath $reportPath)) { throw 'Neovim exited without a fresh native report.' }
    $report = Get-Content -LiteralPath $reportPath -Raw | ConvertFrom-Json
    if ($report.runId -ne $runId -or $report.version -ne $Version -or
        $report.expectedSha256 -ne $runner.expectedSha256 -or -not $report.success) {
        throw 'Native report identity, version, expectation digest, or success did not match this run.'
    }
    if (@($report.themes).Count -ne @($expected.themes).Count) { throw 'Native report omitted themes.' }
    foreach ($theme in $expected.themes) {
        $actual = @($report.themes | Where-Object { $_.id -ceq $theme.id })
        if ($actual.Count -ne 1 -or $actual[0].sha256 -ne $theme.sha256 -or
            (Get-SHA256 $theme.path) -ne $theme.sha256) {
            throw "Theme evidence mismatch or repository changed during smoke: $($theme.id)"
        }
    }
    $runner['success'] = $true
    Write-Host "PASS Neovim ${Version}: $($report.assertions) assertions; report $reportPath"
} catch {
    $runner['error'] = $_.Exception.Message
    throw
} finally {
    if ($started) {
        if (-not $process.HasExited) {
            $process.Kill()
            $null = $process.WaitForExit(10000)
        }
        if ($stdout -and $stdout.Wait(5000)) {
            [IO.File]::WriteAllText((Join-Path $output 'stdout.log'), $stdout.GetAwaiter().GetResult())
        }
        if ($stderr -and $stderr.Wait(5000)) {
            [IO.File]::WriteAllText((Join-Path $output 'stderr.log'), $stderr.GetAwaiter().GetResult())
        }
    }
    if ($process) { $process.Dispose() }
    $runner['finishedAt'] = [DateTime]::UtcNow.ToString('o')
    Write-JsonFile $runnerReport $runner
}
