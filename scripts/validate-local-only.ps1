param()

$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$Failures = @()

function Read-ProjectFile {
    param([string]$Path)
    Get-Content -Raw -LiteralPath (Join-Path $Root $Path)
}

function Add-Failure {
    param([string]$Message)
    $script:Failures += $Message
}

$script = Read-ProjectFile "script.js"
$index = Read-ProjectFile "index.html"
$readme = Read-ProjectFile "README.md"
$ship = Read-ProjectFile "scripts\ship.ps1"
$props = Get-Content -Raw -LiteralPath (Join-Path $Root "LivelyProperties.json") | ConvertFrom-Json

$bannedScriptTokens = @(
    "dataSource",
    "remoteEndpoint",
    "remoteRefreshMinutes",
    "sourceSettingsStorageKey",
    "loadRemoteQuotes",
    "librarySourceRemote",
    "libraryRemote"
)

foreach ($token in $bannedScriptTokens) {
    if ($script.Contains($token)) {
        Add-Failure "script.js still contains remote/source token: $token"
    }
}

if ($index -match "Live URL|libraryRemote|librarySourceRemote") {
    Add-Failure "index.html still exposes live URL source controls."
}

if ($readme -match "Remote endpoint|remote data|Live JSON source|prayer\.ibrahimomer\.net|live URL") {
    Add-Failure "README.md still documents remote prayer loading."
}

if ($ship -match "RemoteUrl|SkipRemoteProbe|Probe remote endpoint|prayer\.ibrahimomer\.net") {
    Add-Failure "scripts/ship.ps1 still probes a remote prayer endpoint."
}

foreach ($propertyName in @("localLibraryJson", "applyLocalLibraryJson", "resetLocalLibraryJson")) {
    if (-not ($props.PSObject.Properties.Name -contains $propertyName)) {
        Add-Failure "LivelyProperties.json is missing $propertyName."
    }
}

if ($Failures.Count -gt 0) {
    $Failures | ForEach-Object { Write-Host "[FAIL] $_" -ForegroundColor Red }
    exit 1
}

Write-Output "Local-only validation passed."
