# bd-always-prayer

[![Live preview](https://img.shields.io/badge/preview-live-2ea44f?logo=github)](https://i2pacg.github.io/bd-always-prayer/)
[![License](https://img.shields.io/badge/license-All%20rights%20reserved-lightgrey)](LivelyInfo.json)
[![Last commit](https://img.shields.io/github/last-commit/i2pacg/bd-always-prayer?color=informational)](https://github.com/i2pacg/bd-always-prayer/commits/master)

Minimal prayer wallpaper for [Lively Wallpaper](https://github.com/rocksdanister/lively). It rotates Arabic and English prayers over a dark animated gradient with an adaptive particle field, exact line control, self-hosted fonts, optional remote data, and an in-wallpaper editor for the local prayer library.

**Live preview:** <https://i2pacg.github.io/bd-always-prayer/>

![Preview](assets/preview/preview.jpg)

---

## Install

### Recommended: Lively zip

Use this when you want the full Lively **Customize** panel.

1. Download [bd-always-prayer-lively.zip](https://i2pacg.github.io/bd-always-prayer/dist/bd-always-prayer-lively.zip) <!-- zip-size --> 463.8 KB <!-- /zip-size -->
2. Drag the zip into Lively.
3. Select **bd-always-prayer** in the Lively library.
4. Right-click the wallpaper and open **Customize**.

This keeps all visual controls: quote interval, text scale, palette, particles, background brightness, remote endpoint URL, and refresh timing.

### Alternative: URL wallpaper

Use this when you want the wallpaper code to auto-update whenever the page reloads.

1. Open Lively.
2. Choose **Add Wallpaper**.
3. Paste:

   ```text
   https://i2pacg.github.io/bd-always-prayer/
   ```

URL wallpapers do not load `LivelyProperties.json`, so Lively's Customize panel will not appear. The wallpaper uses its built-in defaults instead.

---

## What You Can Edit

### Visual settings

Zip installs expose these through Lively's Customize panel:

| Group | Setting |
| --- | --- |
| Timing | Quote interval |
| Text | Text scale, opacity, title/source visibility |
| Data | Bundled file or remote endpoint, endpoint URL, refresh minutes |
| Background | Motion, palette intensity, palette mode, brightness |
| Particles | Density and glow |
| Motion | Animation on/off |

Settings are defined in [`LivelyProperties.json`](LivelyProperties.json).

### Local library inside the wallpaper

The small top-right control opens the local library editor. On first run, it reads the bundled [`quotes.json`](quotes.json), loads those prayers into the editor, and saves that editable copy in browser storage. From there, you can build on it directly.

- Edit prayers that originally came from `quotes.json`.
- Add a new local prayer.
- Delete local prayers.
- Preserve exact visual line breaks.
- Store optional title and source.
- Auto-detect Arabic/RTL, with manual language and direction controls.
- Export the full local library as JSON.
- Import defaults from bundled `quotes.json`.
- Import from a local JSON file or from an API endpoint URL.

The editable local library is stored under:

```text
bdAlwaysPrayer.localLibrary.v1
```

This storage is expected to survive normal app and machine restarts. It is still browser storage, so it can be lost if Lively/CEF storage is cleared, the wallpaper is installed under a different origin, or the wallpaper is reinstalled in a way that changes its storage identity. Use export/import before reinstalling or moving machines.

When **Prayer source** is set to bundled/local, the wallpaper rotates this editable local library. When **Prayer source** is set to remote, the remote endpoint remains the primary source and the editable local library is appended after it.

The import buttons are intentionally separate: default import restores/merges the bundled `quotes.json`, file import reads JSON from the machine, and endpoint import fetches JSON from a URL and merges it into the local library.

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
