param(
    [switch]$SkipRemoteProbe,
    [switch]$SkipPagesProbe
)

$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$Packager = Join-Path $PSScriptRoot "package-lively.ps1"
$ZipPath = Join-Path $Root "dist\bd-always-prayer-lively.zip"
$IndexPath = Join-Path $Root "index.html"
$ReadmePath = Join-Path $Root "README.md"
$RemoteUrl = "https://prayer.ibrahimomer.net/quotes.json"
$PagesUrl = "https://i2pacg.github.io/bd-always-prayer/"

$failures = @()
$summary = [ordered]@{}

function Step {
    param([string]$Name, [scriptblock]$Action)
    Write-Host ("[..] {0}" -f $Name) -ForegroundColor DarkGray
    try {
        $result = & $Action
        Write-Host ("[OK] {0}" -f $Name) -ForegroundColor Green
        $script:summary[$Name] = if ($result) { $result } else { "ok" }
    } catch {
        Write-Host ("[FAIL] {0}: {1}" -f $Name, $_.Exception.Message) -ForegroundColor Red
        $script:failures += "$Name`: $($_.Exception.Message)"
        $script:summary[$Name] = "FAILED"
    }
}

Step "Validate JSON and script.js" {
    & $Packager -ValidateOnly | Out-Null
    "JSON + script.js syntax OK"
}

Step "Check referenced assets exist" {
    $html = Get-Content -Raw -LiteralPath $IndexPath
    $patterns = @(
        '(?i)\bhref\s*=\s*"([^"#?]+)"',
        '(?i)\bsrc\s*=\s*"([^"#?]+)"',
        '(?i)url\(\s*"?([^")]+)"?\s*\)'
    )
    $refs = @()
    foreach ($p in $patterns) {
        $refs += [regex]::Matches($html, $p) | ForEach-Object { $_.Groups[1].Value }
    }
    # Also scan styles.css for url(...) refs.
    $css = Get-Content -Raw -LiteralPath (Join-Path $Root "styles.css")
    $refs += [regex]::Matches($css, '(?i)url\(\s*"?([^")]+)"?\s*\)') | ForEach-Object { $_.Groups[1].Value }

    $missing = @()
    foreach ($ref in ($refs | Sort-Object -Unique)) {
        if ($ref -match '^(https?:|data:|mailto:|#)') { continue }
        $resolved = Join-Path $Root ($ref -replace '/', '\')
        if (-not (Test-Path -LiteralPath $resolved)) {
            $missing += $ref
        }
    }
    if ($missing.Count -gt 0) {
        throw "Missing assets referenced from HTML/CSS: $($missing -join ', ')"
    }
    "$(($refs | Sort-Object -Unique).Count) local references all resolve"
}

if (-not $SkipRemoteProbe) {
    Step "Probe remote endpoint ($RemoteUrl)" {
        try {
            $r = Invoke-WebRequest -Uri $RemoteUrl -UseBasicParsing -TimeoutSec 10
        } catch {
            throw "Could not reach $RemoteUrl - $($_.Exception.Message)"
        }
        if ($r.StatusCode -ne 200) { throw "HTTP $($r.StatusCode)" }

        $cors = $r.Headers["Access-Control-Allow-Origin"]
        if (-not $cors) {
            throw "Endpoint reachable but missing Access-Control-Allow-Origin header. Upload server/.htaccess next to quotes.json on the host."
        }

        try {
            $payload = $r.Content | ConvertFrom-Json
        } catch {
            throw "Endpoint returned invalid JSON"
        }

        $entries = if ($payload -is [System.Array]) { $payload } elseif ($payload.prayers) { $payload.prayers } else { @() }
        if ($entries.Count -lt 1) { throw "Endpoint returned no prayers" }

        "HTTP 200, CORS=$cors, $($entries.Count) prayers"
    }
} else {
    $summary["Probe remote endpoint"] = "skipped"
}

if (-not $SkipPagesProbe) {
    Step "Probe GitHub Pages (last published)" {
        $assets = @(
            "",
            "styles.css",
            "script.js",
            "preview-controls.js",
            "preview-controls.css",
            "particles.js",
            "quotes.json",
            "LivelyInfo.json",
            "LivelyProperties.json",
            "assets/preview/preview.jpg",
            "assets/preview/thumbnail.jpg",
            "dist/bd-always-prayer-lively.zip"
        )
        $failed = @()
        foreach ($a in $assets) {
            $url = $PagesUrl + $a
            try {
                $r = Invoke-WebRequest -Uri $url -UseBasicParsing -Method Head -TimeoutSec 10
                if ($r.StatusCode -ne 200) { $failed += "$a (HTTP $($r.StatusCode))" }
            } catch {
                $failed += "$a ($($_.Exception.Message))"
            }
        }
        if ($failed.Count -gt 0) {
            throw "Pages assets not serving: $($failed -join '; ')"
        }
        "$($assets.Count) assets serve 200"
    }
} else {
    $summary["Probe GitHub Pages"] = "skipped"
}

Step "Build Lively zip" {
    & $Packager | Out-Null
    if (-not (Test-Path -LiteralPath $ZipPath)) { throw "Packager did not produce $ZipPath" }
    $size = (Get-Item -LiteralPath $ZipPath).Length
    $kb = [Math]::Round($size / 1024, 1)
    "$kb KB at dist\bd-always-prayer-lively.zip"
}

Step "Stamp zip size in README" {
    if (-not (Test-Path -LiteralPath $ZipPath)) { throw "Zip missing - cannot stamp size" }
    $size = (Get-Item -LiteralPath $ZipPath).Length
    $kb = [Math]::Round($size / 1024, 1)
    $stamp = "$kb KB"

    $readme = Get-Content -Raw -LiteralPath $ReadmePath
    $pattern = '(?s)(<!-- zip-size -->).*?(<!-- /zip-size -->)'
    $replacement = "`$1 $stamp `$2"
    if ($readme -notmatch $pattern) {
        return "no marker in README; skipped (add <!-- zip-size --> <!-- /zip-size --> to enable)"
    }
    $new = [regex]::Replace($readme, $pattern, $replacement)
    if ($new -ne $readme) {
        # Write UTF-8 without BOM. Windows PowerShell 5's Set-Content always
        # adds a BOM with -Encoding UTF8, which produces noisy diffs.
        [System.IO.File]::WriteAllText($ReadmePath, $new, (New-Object System.Text.UTF8Encoding($false)))
        return "stamped $stamp"
    }
    "already $stamp"
}

Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
$summary.GetEnumerator() | ForEach-Object {
    $color = if ($_.Value -eq "FAILED") { "Red" } elseif ($_.Value -eq "skipped") { "DarkGray" } else { "White" }
    Write-Host ("  {0,-40} {1}" -f $_.Key, $_.Value) -ForegroundColor $color
}

if ($failures.Count -gt 0) {
    Write-Host ""
    Write-Host "Ship aborted: $($failures.Count) check(s) failed." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Ship OK. Ready to commit and push." -ForegroundColor Green
