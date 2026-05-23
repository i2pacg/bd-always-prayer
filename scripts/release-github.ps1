param(
    [Parameter(Mandatory = $true)]
    [string]$Version,
    [switch]$SkipShip,
    [switch]$Draft,
    [switch]$Prerelease
)

$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$ZipPath = Join-Path $Root "dist\bd-always-prayer-lively.zip"
$ShipScript = Join-Path $PSScriptRoot "ship.ps1"

function Run-Git {
    param([string[]]$GitArgs)
    $output = & git @GitArgs
    if ($LASTEXITCODE -ne 0) {
        throw "git $($GitArgs -join ' ') failed."
    }
    return $output
}

function Test-ReleaseExists {
    param([string]$TagName)
    $previousErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
        & gh release view $TagName --json tagName *> $null
        return $LASTEXITCODE -eq 0
    } finally {
        $ErrorActionPreference = $previousErrorActionPreference
    }
}

if ($Version -notmatch '^v\d+\.\d+\.\d+([-.][0-9A-Za-z.-]+)?$') {
    throw "Version must look like v1.2.3, optionally with a suffix such as v1.2.3-beta.1."
}

Push-Location $Root
try {
    if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
        throw "GitHub CLI (gh) is required. Install it and run 'gh auth login' once."
    }

    & gh auth status | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "GitHub CLI is not authenticated. Run 'gh auth login' first."
    }

    if (-not $SkipShip) {
        & $ShipScript
        if ($LASTEXITCODE -ne 0) {
            throw "Ship pipeline failed."
        }
    }

    if (-not (Test-Path -LiteralPath $ZipPath -PathType Leaf)) {
        throw "Missing release asset: dist\bd-always-prayer-lively.zip"
    }

    $dirty = Run-Git @("status", "--porcelain")
    if ($dirty) {
        throw "Working tree has uncommitted changes after the build. Commit and push them, then rerun this release command."
    }

    $branch = (Run-Git @("branch", "--show-current")).Trim()
    if (-not $branch) {
        throw "Release must run from a named branch, not detached HEAD."
    }

    Run-Git @("fetch", "origin", $branch, "--tags") | Out-Null
    $head = (Run-Git @("rev-parse", "HEAD")).Trim()
    $remoteHead = (Run-Git @("rev-parse", "origin/$branch")).Trim()
    if ($head -ne $remoteHead) {
        throw "Local $branch is not pushed to origin. Push the branch before creating the release."
    }

    if (Test-ReleaseExists $Version) {
        throw "Release $Version already exists."
    }

    $existingTag = Run-Git @("tag", "--list", $Version)
    if ($existingTag) {
        $tagCommit = (Run-Git @("rev-list", "-n", "1", $Version)).Trim()
        if ($tagCommit -ne $head) {
            throw "Tag $Version already exists but does not point at HEAD."
        }
    } else {
        Run-Git @("tag", "-a", $Version, "-m", "Release $Version") | Out-Null
        Run-Git @("push", "origin", $Version) | Out-Null
    }

    $releaseArgs = @(
        "release",
        "create",
        $Version,
        "dist/bd-always-prayer-lively.zip",
        "--title",
        "bd-always-prayer $Version",
        "--generate-notes"
    )

    if ($Draft) {
        $releaseArgs += "--draft"
    }

    if ($Prerelease) {
        $releaseArgs += "--prerelease"
    }

    & gh @releaseArgs
    if ($LASTEXITCODE -ne 0) {
        throw "gh release create failed."
    }

    Write-Output "Created GitHub release $Version with dist\bd-always-prayer-lively.zip."
} finally {
    Pop-Location
}
