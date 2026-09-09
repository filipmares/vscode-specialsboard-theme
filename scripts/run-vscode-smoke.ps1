<#
.SYNOPSIS
Run the exact candidate VSIX in a fresh, pinned native VS Code portable build.
.DESCRIPTION
Downloads official archives for 1.101.0 or 1.136.2 and checks the update API hash.
Creates GUID-owned children under ScratchRoot and optional OutputRoot; retains
all files for evidence and never cleans shared directories. Updates are disabled
before launch. A successful report covers API/model evidence, not visual review.
.EXAMPLE
pwsh -File .\scripts\run-vscode-smoke.ps1 -VSIX .\candidate.vsix -ScratchRoot .\.native-smoke -Version 1.101.0
.EXAMPLE
pwsh -File .\scripts\run-vscode-smoke.ps1 -VSIX .\candidate.vsix -ScratchRoot .\.native-smoke -OutputRoot .\.native-evidence -Version 1.136.2 -Hold

When live-report.json says phase=holding, write {runId,id,state} to command.json
in that run's output directory. Use unique ids and atomically replace the file.
Read the matching command-result.json before inspecting the native window.
The report lists state names. Finish with state=finish, or write only the runId
to the output's finish file. Switching fixtures does not certify UI inspection.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string] $VSIX,
    [Parameter(Mandatory = $true)]
    [string] $ScratchRoot,
    [string] $OutputRoot,
    [ValidateSet('1.101.0', '1.136.2')]
    [string] $Version = '1.136.2',
    [switch] $Hold,
    [ValidateRange(60, 1800)]
    [int] $TimeoutSeconds = 300,
    [ValidateRange(60, 14400)]
    [int] $HoldTimeoutSeconds = 3600
)

# Every invocation owns fresh children only. Nothing is installed into, updated in,
# or removed from an existing VS Code installation, profile, or shared scratch root.
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
if ($env:OS -ne 'Windows_NT') { throw 'This runner requires Windows; vscode-smoke.cjs remains cross-platform.' }

function Write-JsonFile([string] $Path, $Value) {
    [IO.File]::WriteAllText($Path, ($Value | ConvertTo-Json -Depth 40) + "`n", [Text.UTF8Encoding]::new($false))
}

function Get-SHA256([string] $Path) {
    (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant()
}

function Read-LiveReport([string] $Path) {
    # The writer atomically replaces this file; allow replacement while reading
    # the previous complete report rather than blocking Windows rename().
    $stream = [IO.File]::Open($Path, [IO.FileMode]::Open, [IO.FileAccess]::Read,
        ([IO.FileShare]::ReadWrite -bor [IO.FileShare]::Delete))
    $reader = [IO.StreamReader]::new($stream)
    try { $reader.ReadToEnd() | ConvertFrom-Json } finally { $reader.Dispose() }
}

function Convert-ToUtc($Value) {
    if ($Value -is [DateTime]) { return $Value.ToUniversalTime() }
    [DateTime]::Parse($Value, [Globalization.CultureInfo]::InvariantCulture,
        [Globalization.DateTimeStyles]::RoundtripKind).ToUniversalTime()
}

function New-OwnedDirectory([string] $Path) {
    if (Test-Path -LiteralPath $Path) { throw "Refusing to reuse owned directory: $Path" }
    New-Item -ItemType Directory -Path $Path | Out-Null
    (Get-Item -LiteralPath $Path).FullName
}

function Get-PackageFiles([string] $Root) {
    $prefix = $Root.TrimEnd('\') + '\'
    $files = @(Get-ChildItem -LiteralPath $Root -Recurse -File | ForEach-Object {
        if ($_.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw "Package contains a reparse point: $($_.FullName)" }
        [ordered]@{ path = $_.FullName.Substring($prefix.Length).Replace('\', '/'); sha256 = Get-SHA256 $_.FullName }
    })
    # Ordinal sorting agrees with the cross-platform Node inventory.
    $paths = [string[]]@($files | ForEach-Object { $_.path })
    [Array]::Sort($paths, [StringComparer]::Ordinal)
    $lookup = @{}
    foreach ($file in $files) { $lookup[$file.path] = $file }
    @($paths | ForEach-Object { $lookup[$_] })
}

function Stop-OwnedHost([string] $Executable) {
    # Match only the GUID-owned binary, never a process name or a user's normal editor.
    $escaped = $Executable.Replace('\', '\\').Replace("'", "\'")
    Get-CimInstance Win32_Process -Filter "ExecutablePath = '$escaped'" -OperationTimeoutSec 10 |
        ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction Continue }
}

$source = (Resolve-Path -LiteralPath $VSIX).ProviderPath
if (-not (Test-Path -LiteralPath $source -PathType Leaf)) { throw "Not a VSIX file: $source" }
$harness = Join-Path $PSScriptRoot 'vscode-smoke.cjs'
if (-not (Test-Path -LiteralPath $harness -PathType Leaf)) { throw "Missing harness: $harness" }
$runId = [Guid]::NewGuid().ToString('N')
$name = "sb-$Version-$($runId.Substring(0, 12))"
$plannedScratch = Join-Path ([IO.Path]::GetFullPath($ScratchRoot)) $name
if ($plannedScratch.Length -gt 80) { throw 'Use a short ScratchRoot (for example D:\temp\sb); native VS Code workers and loggers can hit Windows path limits.' }
$scratch = New-OwnedDirectory $plannedScratch
$output = if ($OutputRoot) {
    New-OwnedDirectory (Join-Path ([IO.Path]::GetFullPath($OutputRoot)) "$name-output")
} else {
    New-OwnedDirectory (Join-Path $scratch 'output')
}
Write-JsonFile (Join-Path $scratch 'owner.json') @{ runId = $runId; output = $output; createdAt = [DateTime]::UtcNow.ToString('o') }
$runner = [ordered]@{
    runId = $runId; version = $Version; scratch = $scratch; output = $output
    startedAt = [DateTime]::UtcNow.ToString('o'); success = $false; phase = 'preparing'
    visualReviewPerformed = $false
}
$runnerReport = Join-Path $output 'runner-report.json'
$process = $null
$code = $null
$stdout = $null
$stderr = $null
try {
    Write-Host "Owned scratch: $scratch"
    Write-Host "Artifacts: $output"
    Write-JsonFile $runnerReport $runner
    $candidateHash = Get-SHA256 $source
    $candidate = Join-Path $scratch 'candidate.vsix'
    Copy-Item -LiteralPath $source -Destination $candidate
    if ((Get-SHA256 $candidate) -ne $candidateHash) { throw 'VSIX changed while being copied' }
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $packageRoot = New-OwnedDirectory (Join-Path $scratch 'candidate')
    [IO.Compression.ZipFile]::ExtractToDirectory($candidate, $packageRoot)
    $extension = Join-Path $packageRoot 'extension'
    $manifest = Get-Content -LiteralPath (Join-Path $extension 'package.json') -Raw | ConvertFrom-Json
    if ("$($manifest.publisher).$($manifest.name)" -ne 'filipmares.theme-specialsboard') {
        throw 'The VSIX is not filipmares.theme-specialsboard'
    }
    $inventory = @(Get-PackageFiles $extension)

    $metadataUrl = "https://update.code.visualstudio.com/api/versions/$Version/win32-x64-archive/stable"
    $metadata = Invoke-RestMethod -Uri $metadataUrl -TimeoutSec 60
    if ($metadata.productVersion -ne $Version) { throw "Update API returned the wrong version: $($metadata.productVersion)" }
    $download = [Uri] $metadata.url
    $officialHosts = @('vscode.download.prss.microsoft.com', 'az764295.vo.msecnd.net', 'vscode.download.microsoft.com')
    if ($download.Scheme -ne 'https' -or $download.Host -notin $officialHosts) {
        throw "Update API returned an unexpected archive origin: $($download.Host)"
    }
    Write-JsonFile (Join-Path $output 'download-metadata.json') $metadata
    $archive = Join-Path $scratch "VSCode-win32-x64-$Version.zip"
    Invoke-WebRequest -Uri $download.AbsoluteUri -OutFile $archive -UseBasicParsing -TimeoutSec 600
    $archiveHash = Get-SHA256 $archive
    $verification = 'unavailable: API returned no SHA-256 or SHA-1'
    if ($metadata.PSObject.Properties['sha256hash'] -and $metadata.sha256hash) {
        if ($metadata.sha256hash -notmatch '^[a-fA-F0-9]{64}$') { throw 'Malformed API SHA-256' }
        if ($archiveHash -ne $metadata.sha256hash.ToLowerInvariant()) { throw 'Official archive SHA-256 mismatch' }
        $verification = 'SHA-256 verified against official update API'
    }
    elseif ($metadata.PSObject.Properties['hash'] -and $metadata.hash) {
        if ($metadata.hash -notmatch '^[a-fA-F0-9]{40}$') { throw 'Malformed API SHA-1' }
        if ((Get-FileHash -LiteralPath $archive -Algorithm SHA1).Hash -ne $metadata.hash) { throw 'Official archive SHA-1 mismatch' }
        $verification = 'SHA-1 verified against official update API; API supplied no SHA-256'
    }
    else { Write-Warning $verification }

    $build = New-OwnedDirectory (Join-Path $scratch 'vscode')
    [IO.Compression.ZipFile]::ExtractToDirectory($archive, $build)
    $code = Join-Path $build 'Code.exe'
    $appRoot = Join-Path $build 'resources\app'
    if (-not (Test-Path -LiteralPath (Join-Path $appRoot 'package.json'))) {
        # Fast-update archives keep the app beneath the official commit prefix.
        $appRoot = Join-Path $build ($metadata.version.Substring(0, 10) + '\resources\app')
    }
    $hostManifest = Get-Content -LiteralPath (Join-Path $appRoot 'package.json') -Raw | ConvertFrom-Json
    $product = Get-Content -LiteralPath (Join-Path $appRoot 'product.json') -Raw | ConvertFrom-Json
    if ($hostManifest.version -ne $Version -or $product.commit -ne $metadata.version) {
        throw 'Extracted VS Code version/commit does not match the official metadata'
    }
    if (-not (Test-Path -LiteralPath $code -PathType Leaf)) { throw 'Archive has no Code.exe' }
    $portable = New-OwnedDirectory (Join-Path $build 'data')
    $userData = New-OwnedDirectory (Join-Path $portable 'user-data')
    $extensions = New-OwnedDirectory (Join-Path $portable 'extensions')
    $userSettings = New-OwnedDirectory (Join-Path $userData 'User')
    $workspace = New-OwnedDirectory (Join-Path $scratch 'workspace')
    $settingsFile = Join-Path $userSettings 'settings.json'
    # The Default profile is confined to this brand-new portable user-data directory.
    # These settings exist BEFORE the first host process, not just in extension tests.
    Write-JsonFile $settingsFile ([ordered]@{
        'update.mode' = 'none'
        'update.showReleaseNotes' = $false
        'extensions.autoUpdate' = $false
        'extensions.autoCheckUpdates' = $false
        'extensions.ignoreRecommendations' = $true
        'telemetry.telemetryLevel' = 'off'
        'workbench.enableExperiments' = $false
        'workbench.startupEditor' = 'none'
        'workbench.welcomePage.walkthroughs.openOnInstall' = $false
        'workbench.colorTheme' = 'specials-board-contrast'
        'window.autoDetectColorScheme' = $false
        'window.autoDetectHighContrast' = $false
        'window.restoreWindows' = 'none'
        'security.workspace.trust.enabled' = $false
        'files.hotExit' = 'off'
        'git.enabled' = $false
        'typescript.disableAutomaticTypeAcquisition' = $true
        'chat.disableAIFeatures' = $true
    })
    Copy-Item -LiteralPath $settingsFile -Destination (Join-Path $output 'prelaunch-settings.json')
    $context = [ordered]@{
        runId = $runId; startedAt = [DateTime]::UtcNow.ToString('o'); version = $Version; commit = $product.commit
        candidateSource = $source; candidateVSIX = $candidate; candidateSha256 = $candidateHash
        extensionPath = $extension; extensionVersion = $manifest.version; packageFiles = $inventory
        harness = $harness; harnessSha256 = Get-SHA256 $harness
        output = $output; appRoot = $appRoot; userData = $userData; extensions = $extensions; profile = 'Default'
        settingsSha256 = Get-SHA256 $settingsFile
        archiveSha256 = $archiveHash; archiveVerification = $verification; metadataUrl = $metadataUrl
    }
    $contextFile = Join-Path $output 'run-context.json'
    Write-JsonFile $contextFile $context
    $arguments = @(
        '--new-window', '--wait', '--skip-welcome', '--skip-release-notes', '--disable-workspace-trust',
        '--disable-telemetry', '--sync', 'off', '--locale', 'en', '--log', 'info',
        '--profile', 'Default', '--user-data-dir', $userData, '--extensions-dir', $extensions,
        '--extensionDevelopmentPath', $extension, '--extensionTestsPath', $harness, $workspace
    )
    $start = [Diagnostics.ProcessStartInfo]::new()
    $start.FileName = $code
    $start.WorkingDirectory = $workspace
    $start.UseShellExecute = $false
    $start.RedirectStandardOutput = $true
    $start.RedirectStandardError = $true
    $start.Arguments = ($arguments | ForEach-Object { '"' + $_ + '"' }) -join ' '
    foreach ($key in @($start.EnvironmentVariables.Keys)) {
        if ($key.StartsWith('VSCODE_') -or $key -in @('ELECTRON_RUN_AS_NODE', 'NODE_OPTIONS')) {
            $start.EnvironmentVariables.Remove($key)
        }
    }
    $start.EnvironmentVariables['VSCODE_PORTABLE'] = $portable
    $start.EnvironmentVariables['SPECIALSBOARD_SMOKE_OUTPUT'] = $output
    $start.EnvironmentVariables['SPECIALSBOARD_SMOKE_CONTEXT'] = $contextFile
    $start.EnvironmentVariables['SPECIALSBOARD_SMOKE_HOLD'] = $(if ($Hold) { '1' } else { '0' })
    $start.EnvironmentVariables['SPECIALSBOARD_SMOKE_HOLD_SECONDS'] = "$HoldTimeoutSeconds"
    $runner.phase = 'running'
    $runner.launchAt = [DateTime]::UtcNow.ToString('o')
    $runner.candidateSha256 = $candidateHash
    $runner.archiveVerification = $verification
    $runner.arguments = $arguments
    Write-JsonFile $runnerReport $runner
    $process = [Diagnostics.Process]::Start($start)
    $stdout = $process.StandardOutput.ReadToEndAsync()
    $stderr = $process.StandardError.ReadToEndAsync()
    $runner.processId = $process.Id
    Write-JsonFile $runnerReport $runner
    Write-Host "Native test PID: $($process.Id); version $Version; candidate SHA-256 $candidateHash"
    if ($Hold) {
        Write-Host "Hold protocol: wait for live-report.json phase=holding, then write {runId,id,state} to command.json."
        Write-Host "Finish with state=finish or write '$runId' to '$output\finish'."
    }
    $deadline = [DateTime]::UtcNow.AddSeconds($TimeoutSeconds)
    $holdReady = $false
    while (-not $process.WaitForExit(500)) {
        $livePath = Join-Path $output 'live-report.json'
        if ($Hold -and -not $holdReady -and (Test-Path -LiteralPath $livePath)) {
            $live = Read-LiveReport $livePath
            if ($live -and $live.phase -eq 'holding' -and $live.runId -eq $runId -and $live.success) {
                $holdReady = $true
                $deadline = [DateTime]::UtcNow.AddSeconds($HoldTimeoutSeconds + 30)
                Write-Host "Native workflow fixtures ready for direct visual review: $livePath"
            }
        }
        if ([DateTime]::UtcNow -gt $deadline) { throw 'Owned native smoke host exceeded its bounded deadline' }
    }
    if (-not $stdout.Wait(5000) -or -not $stderr.Wait(5000)) {
        throw 'Owned native host exited but its output pipes did not close within the bounded drain window'
    }
    [IO.File]::WriteAllText((Join-Path $output 'host-stdout.log'), $stdout.GetAwaiter().GetResult())
    [IO.File]::WriteAllText((Join-Path $output 'host-stderr.log'), $stderr.GetAwaiter().GetResult())
    $runner.exitCode = $process.ExitCode
    if ($process.ExitCode -ne 0) { throw "Native host exited with code $($process.ExitCode)" }
    $reportPath = Join-Path $output 'live-report.json'
    if (-not (Test-Path -LiteralPath $reportPath)) { throw 'Native host produced no live report' }
    $report = Get-Content -LiteralPath $reportPath -Raw | ConvertFrom-Json
    if (-not $report.success -or $report.phase -ne 'complete' -or $report.runId -ne $runId) {
        throw 'Native report is failed, incomplete, or belongs to another invocation'
    }
    if ($report.vscode -ne $Version -or $report.expectedVSCode -ne $Version -or
        $report.candidateSha256 -ne $candidateHash -or $report.extension -ne $manifest.version -or
        $report.harnessSha256 -ne $context.harnessSha256) { throw 'Report candidate/version/harness identity mismatch' }
    $launched = Convert-ToUtc $runner.launchAt
    $started = Convert-ToUtc $report.startedAt
    $completed = Convert-ToUtc $report.completedAt
    if ($started -lt $launched -or $completed -lt $started -or $completed -gt [DateTime]::UtcNow -or
        (Get-Item -LiteralPath $reportPath).LastWriteTimeUtc -lt $launched) {
        throw 'Native report failed freshness validation'
    }
    if ((Get-SHA256 $source) -ne $candidateHash -or (Get-SHA256 $candidate) -ne $candidateHash) {
        throw 'Original or copied candidate changed during the smoke run'
    }
    if ((Get-SHA256 $harness) -ne $context.harnessSha256) { throw 'Harness changed during the smoke run' }
    if ((ConvertTo-Json -InputObject @(Get-PackageFiles $extension) -Depth 5 -Compress) -cne
        (ConvertTo-Json -InputObject $inventory -Depth 5 -Compress)) { throw 'Extracted candidate package changed' }
    $runner.phase = 'complete'
    $runner.success = $true
    Write-Host "PASS: exact candidate and native $Version API smoke. Direct visual review is separate."
}
catch {
    $runner.phase = 'failed'
    $runner.error = $_.Exception.ToString()
    if ($code) { Stop-OwnedHost $code }
    throw
}
finally {
    if ($process) {
        if (-not $process.HasExited) { Stop-OwnedHost $code }
        if ($stdout -and $stdout.IsCompleted) {
            [IO.File]::WriteAllText((Join-Path $output 'host-stdout.log'), $stdout.GetAwaiter().GetResult())
        }
        if ($stderr -and $stderr.IsCompleted) {
            [IO.File]::WriteAllText((Join-Path $output 'host-stderr.log'), $stderr.GetAwaiter().GetResult())
        }
        $process.Dispose()
    }
    $runner.completedAt = [DateTime]::UtcNow.ToString('o')
    Write-JsonFile $runnerReport $runner
}
