# bd-always-prayer

[![Live preview](https://img.shields.io/badge/preview-live-2ea44f?logo=github)](https://i2pacg.github.io/bd-always-prayer/?preview=1)
[![License](https://img.shields.io/badge/license-All%20rights%20reserved-lightgrey)](LivelyInfo.json)
[![Last commit](https://img.shields.io/github/last-commit/i2pacg/bd-always-prayer?color=informational)](https://github.com/i2pacg/bd-always-prayer/commits/master)

Minimal prayer wallpaper for [Lively Wallpaper](https://github.com/rocksdanister/lively). It rotates Arabic and English prayers over an animated gradient with dark and light themes, an adaptive particle field, exact line control, self-hosted fonts, optional remote data, and an in-wallpaper editor for the local prayer library.

**Live preview:** <https://i2pacg.github.io/bd-always-prayer/?preview=1>

![Preview](assets/preview/preview.jpg)

---

## Install

### Recommended: Lively zip

Use this when you want the full Lively **Customize** panel.

1. Download the latest release zip: [bd-always-prayer-lively.zip](https://github.com/i2pacg/bd-always-prayer/releases/latest/download/bd-always-prayer-lively.zip) <!-- zip-size --> 469.5 KB <!-- /zip-size -->
2. Drag the zip into Lively.
3. Select **bd-always-prayer** in the Lively library.
4. Right-click the wallpaper and open **Customize**.

This keeps visual controls: quote interval, text scale, theme, palette, particles, background brightness, and animation.

### Updates and releases

Use GitHub Releases for downloads, older versions, rollback builds, and release notes:

```text
https://github.com/i2pacg/bd-always-prayer/releases
```

To update a zip install, download the newer zip and drag it into Lively again. If you use the URL wallpaper option below, the wallpaper code updates whenever Lively reloads the page, but Lively's Customize panel is not available for URL wallpapers.

### Changelog

**v1.0.0 - First public release**

- Elegant prayer wallpaper for Lively with Arabic and English text rotation.
- Dark and light themes with animated gradients and adaptive particles.
- Self-hosted Scheherazade New and Montserrat fonts.
- Local saved-prayer editor with exact line breaks, metadata, import/export, and clear-all.
- Live JSON source option for `https://prayer.ibrahimomer.net/quotes.json`.
- GitHub Pages browser preview with preview-only visual controls.
- Versioned release zip for Lively installs.

### Alternative: URL wallpaper

Use this when you want the wallpaper code to auto-update whenever the page reloads.

1. Open Lively.
2. Choose **Add Wallpaper**.
3. Paste:

   ```text
   https://i2pacg.github.io/bd-always-prayer/
   ```

URL wallpapers do not load `LivelyProperties.json`, so Lively's Customize panel will not appear. The wallpaper uses its built-in defaults instead.

The GitHub Pages live preview adds a small preview-only settings button when opened with `?preview=1`. That mirrors the visual Lively controls for browser testing only; the normal URL wallpaper above stays clean, and the preview helper files are not included in the Lively zip.

---

## What You Can Edit

### Visual settings

Zip installs expose these through Lively's Customize panel:

| Group | Setting |
| --- | --- |
| Timing | Quote interval |
| Text | Text scale, opacity, title/source visibility |
| Background | Theme, motion, palette intensity, palette mode, brightness |
| Particles | Density and glow |
| Motion | Animation on/off |

Settings are defined in [`LivelyProperties.json`](LivelyProperties.json).

Prayer source settings live inside the wallpaper panel, not in Lively Customize. This avoids split control between zip installs and URL installs.

### Local library inside the wallpaper

The small top-right control opens the local library editor. On first run, it reads the bundled [`quotes.json`](quotes.json), loads those prayers into the editor, and saves that editable copy in browser storage. From there, you can build on it directly.

- Choose what shows: saved prayers or a live JSON URL plus saved prayers.
- Edit the live JSON URL from the same panel.
- Edit prayers that originally came from `quotes.json`.
- Add a new local prayer.
- Delete local prayers.
- Clear the full local library.
- Preserve exact visual line breaks.
- Store optional title and source.
- Auto-detect Arabic/RTL, with manual language and direction controls.
- Export the full local library as JSON.
- Import defaults from bundled `quotes.json`.
- Import from the bundled defaults or a local JSON file.

The editable local library is stored under:

```text
bdAlwaysPrayer.localLibrary.v1
```

This storage is expected to survive normal app and machine restarts. It is still browser storage, so it can be lost if Lively/CEF storage is cleared, the wallpaper is installed under a different origin, or the wallpaper is reinstalled in a way that changes its storage identity. Use export/import before reinstalling or moving machines.

When **Showing** is set to saved, the wallpaper rotates this editable local library. When **Showing** is set to live URL, that endpoint is used first and saved prayers are appended after it.

The import buttons are intentionally simple: default import reads bundled `quotes.json`, and file import reads JSON from the machine. Every import asks whether to replace the current local library or add to it.

Static HTML cannot rewrite the packaged `quotes.json` from inside Lively. The editor reads it as the seed and then persists edits in browser storage.

---

## Prayer Sources

### Bundled source

The packaged local library lives in [`quotes.json`](quotes.json). Each item can use `text` for natural wrapping or `lines` for exact authored line breaks:

```json
{
  "lines": [
    "God grant me the serenity",
    "to accept the things I cannot change;"
  ],
  "title": "Serenity Prayer",
  "source": "",
  "lang": "en",
  "dir": "ltr"
}
```

Use `lines` for Quran verses, prayers, or anything where sentence flow needs deliberate line endings.

### Remote endpoint

The default remote source is:

```text
https://prayer.ibrahimomer.net/quotes.json
```

The endpoint may return a raw array:

```json
[
  { "lines": ["..."], "title": "...", "lang": "ar", "dir": "rtl" }
]
```

Or a wrapped object:

```json
{
  "version": 1,
  "updatedAt": "2026-05-20T00:00:00Z",
  "prayers": [
    { "lines": ["..."], "title": "...", "source": "...", "lang": "ar", "dir": "rtl" }
  ]
}
```

Remote means remote: if the endpoint fails, the wallpaper shows a clear error instead of silently falling back to local data.

For cross-origin loading, the host must send:

```http
Access-Control-Allow-Origin: *
```

[`server/.htaccess`](server/.htaccess) contains the Apache/LiteSpeed headers used for `prayer.ibrahimomer.net`.

---

## Data Shape

Every prayer entry supports:

| Field | Type | Notes |
| --- | --- | --- |
| `text` | string | Used when no `lines` array is provided. |
| `lines` | string[] | Preferred for exact visual line breaks. |
| `title` | string | Optional metadata. |
| `source` | string | Optional metadata. |
| `lang` | string | Use `ar` or `en` when known. |
| `dir` | string | `rtl` or `ltr`; auto-detected when omitted. |

Arabic renders with self-hosted Scheherazade New. Latin text renders with self-hosted Montserrat.

Local-library exports use this wrapper:

```json
{
  "version": 1,
  "exportedAt": "2026-05-20T00:00:00Z",
  "prayers": [
    { "lines": ["..."], "title": "...", "source": "...", "lang": "ar", "dir": "rtl" }
  ]
}
```

---

## Develop

### Local preview

```powershell
python -m http.server 4173
```

Open:

```text
http://localhost:4173
```

The server is only for browser preview. Lively runs the packaged HTML directly.

### Validate and package

```powershell
# Full local ship pipeline.
npm run ship

# Same build, but skip remote and GitHub Pages probes.
npm run ship:offline

# Just rebuild the Lively zip.
npm run package

# JSON and JavaScript syntax checks only.
npm run validate

# Create a versioned GitHub Release after committing and pushing.
npm run release:github -- -Version v1.2.3
```

`npm run ship` runs:

1. JSON validation and `script.js` syntax check.
2. Referenced asset check for `index.html` and `styles.css`.
3. Remote endpoint probe for HTTP 200, CORS, and valid prayer data.
4. GitHub Pages published-asset probe.
5. Lively zip build.
6. README zip-size stamp.

If GitHub Pages has not published yet or is unavailable, use `npm run ship:offline` for local packaging and run the full command again once Pages is healthy.

### Release checklist

1. Update code, prayers, previews, or metadata.
2. Run `npm run ship`.
3. If only Pages is unavailable, run `npm run ship:offline` and note the skipped probe.
4. Confirm `dist/bd-always-prayer-lively.zip` changed when packaging changed.
5. Commit the source changes, README stamp, and zip together.
6. Push `master`.
7. Create a GitHub Release when the update should be versioned for users:

   ```powershell
   npm run release:github -- -Version v1.2.3
   ```

### GitHub Releases without Actions

Releases are created locally with GitHub CLI, not GitHub Actions:

```powershell
npm run release:github -- -Version v1.2.3
```

The release helper runs the ship pipeline, checks that the working tree is clean, verifies the current branch is pushed, creates an annotated tag, pushes it, and uploads `dist/bd-always-prayer-lively.zip` to the GitHub Release. Add `-Draft` or `-Prerelease` when needed. Use `-SkipShip` only after a successful `npm run ship` on the same commit.

Release assets are the user-facing downloads. The built zip in `dist/` is kept in the repository so the release helper and GitHub Pages can serve the same packaged file.

---

## Project Layout

```text
index.html               Lively web entry point.
styles.css               Wallpaper and manager styling.
script.js                Quote loading, fitting, settings, local-library editor.
particles.js             Adaptive particle background.
quotes.json              Bundled prayer library.
LivelyInfo.json          Lively metadata.
LivelyProperties.json    Lively Customize panel definition.
assets/fonts/            Self-hosted Scheherazade New and Montserrat.
assets/preview/          Lively thumbnail and preview images.
server/.htaccess         CORS and no-cache config for remote JSON hosting.
scripts/                 Validation, ship, and package scripts.
dist/                    Built Lively zip.
```

---

## License

All rights reserved. The repository is public for browsing and installation, but redistribution or reuse is not granted without permission.
