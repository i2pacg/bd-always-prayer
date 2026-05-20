param(
    [switch]$ValidateOnly
)

$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$Dist = Join-Path $Root "dist"
$OutputFile = Join-Path $Dist "bd-always-prayer-lively.zip"
$Stage = Join-Path $Dist ".package-staging"

$RequiredFiles = @(
    "LivelyInfo.json",
    "LivelyProperties.json",
    "index.html",
    "styles.css",
    "script.js",
    "particles.js",
    "quotes.json",
    "README.md",
    "assets\fonts\montserrat-latin-400.woff2",
    "assets\fonts\montserrat-latin-500.woff2",
    "assets\fonts\montserrat-latin-600.woff2",
    "assets\fonts\scheherazade-new-arabic-400.woff2",
    "assets\fonts\scheherazade-new-arabic-500.woff2",
    "assets\fonts\scheherazade-new-arabic-600.woff2",
    "assets\fonts\scheherazade-new-latin-400.woff2",
    "assets\preview\thumbnail.jpg",
    "assets\preview\preview.jpg"
)

function Read-JsonFile {
    param([string]$Path)
    Get-Content -Raw -LiteralPath (Join-Path $Root $Path) | ConvertFrom-Json
}

foreach ($File in $RequiredFiles) {
    $FullPath = Join-Path $Root $File
    if (-not (Test-Path -LiteralPath $FullPath -PathType Leaf)) {
        throw "Missing required file: $File"
    }
}

$Info = Read-JsonFile "LivelyInfo.json"
if ($Info.FileName -ne "index.html") {
    throw "LivelyInfo.json FileName must be index.html."
}

if ($Info.Type -ne 1) {
    throw "LivelyInfo.json Type must be 1 for a web wallpaper."
}

$Quotes = Read-JsonFile "quotes.json"
if ($Quotes.Count -lt 1) {
    throw "quotes.json must contain at least one quote."
}

for ($Index = 0; $Index -lt $Quotes.Count; $Index++) {
    $Quote = $Quotes[$Index]
    $HasText = $Quote.PSObject.Properties.Name -contains "text" -and -not [string]::IsNullOrWhiteSpace($Quote.text)
    $HasLines = $Quote.PSObject.Properties.Name -contains "lines" -and @($Quote.lines | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }).Count -gt 0
    if (-not $HasText -and -not $HasLines) {
        throw "Quote $($Index + 1) must define text or lines."
    }
}

Read-JsonFile "LivelyProperties.json" | Out-Null
node --check (Join-Path $Root "script.js") | Out-Null

Write-Output "Validation passed."

if ($ValidateOnly) {
    exit 0
}

New-Item -ItemType Directory -Force -Path $Dist | Out-Null
if (Test-Path -LiteralPath $OutputFile) {
    Remove-Item -LiteralPath $OutputFile -Force
}

if (Test-Path -LiteralPath $Stage) {
    Remove-Item -LiteralPath $Stage -Recurse -Force
}

foreach ($File in $RequiredFiles) {
    $Source = Join-Path $Root $File
    $Destination = Join-Path $Stage $File
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $Destination) | Out-Null
    Copy-Item -LiteralPath $Source -Destination $Destination
}

$ArchiveItems = Get-ChildItem -LiteralPath $Stage -Force | ForEach-Object { $_.FullName }
Compress-Archive -Path $ArchiveItems -DestinationPath $OutputFile -Force
Remove-Item -LiteralPath $Stage -Recurse -Force

$Size = (Get-Item -LiteralPath $OutputFile).Length
Write-Output "Created dist\bd-always-prayer-lively.zip ($Size bytes)"
