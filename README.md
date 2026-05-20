# bd-always-prayer

[![Live preview](https://img.shields.io/badge/preview-live-2ea44f?logo=github)](https://i2pacg.github.io/bd-always-prayer/)
[![License](https://img.shields.io/badge/license-All%20rights%20reserved-lightgrey)](LivelyInfo.json)
[![Last commit](https://img.shields.io/github/last-commit/i2pacg/bd-always-prayer?color=informational)](https://github.com/i2pacg/bd-always-prayer/commits/master)

A quiet Lively Wallpaper that rotates Arabic and English prayers over a calm animated dark gradient. Tunable from Lively's Customize panel; prayers can refresh live from a remote JSON endpoint.

**Live preview:** <https://i2pacg.github.io/bd-always-prayer/>

![Preview](assets/preview/preview.jpg)

---

## Install

Two paths. Pick based on whether you want Lively's **Customize** sliders.

### Zip install &nbsp;·&nbsp; recommended

Keeps the full Customize panel (palette, motion, refresh interval, particles, etc.). Re-download when the wallpaper code changes; prayer text updates live without re-installing.

1. Download &nbsp;→&nbsp; [bd-always-prayer-lively.zip](https://i2pacg.github.io/bd-always-prayer/dist/bd-always-prayer-lively.zip) &nbsp;<!-- zip-size --> 457 KB <!-- /zip-size -->
2. Drag the zip into the Lively window.
3. Select **bd-always-prayer** in the library.
4. Right-click → **Customize** to tune settings.

### URL install &nbsp;·&nbsp; auto-updating

Wallpaper code auto-updates on every page load. No Customize panel — Lively does not read `LivelyProperties.json` from URL wallpapers, so the in-script defaults are used.

1. Open Lively → **Add Wallpaper** → URL field.
2. Paste:

   ```
   https://i2pacg.github.io/bd-always-prayer/
   ```

---

## Configure

The Lively Customize panel controls every visual and behavior knob below. Settings come from [`LivelyProperties.json`](LivelyProperties.json).

| Group | Setting | What it changes |
| --- | --- | --- |
| Timing | Quote interval | Seconds each entry stays on screen. |
| Text | Text scale | Overall quote size; still bounded by auto-fit. |
| Text | Text opacity | Strength of the foreground text. |
| Text | Show title/source | Shows or hides quote metadata. |
| Data | Prayer source | Bundled `quotes.json` or a remote endpoint. |
| Data | Remote endpoint URL | URL of the remote prayers JSON. |
| Data | Remote refresh minutes | Auto-reload interval. `0` disables. |
| Background | Motion intensity | Speed of the gradient drift. |
| Background | Palette intensity | Strength of the muted color spectrum. |
| Background | Palette mode | Calm Spectrum · Graphite · Deep Teal · Cool Violet · Smoky Emerald. |
| Background | Background brightness | Dim or lift the backdrop while keeping text readable. |
| Background | Particle density | How many quiet light particles are shown. |
| Background | Particle glow | How softly particles illuminate the background. |
| Motion | Enable animation | Master on/off for text and background motion. |

---

## Prayer data

### Local file

Prayers ship in [`quotes.json`](quotes.json). The file is required; there is no silent fallback. Each entry:

```json
{
  "text": "Required when no lines.",
  "lines": ["Optional", "author-controlled", "exact line breaks"],
  "title": "Optional",
  "source": "Optional",
  "lang": "ar | en | ...",
  "dir": "rtl | ltr"
}
```

Use `lines` when a verse needs specific line breaks. Use `text` for simpler entries that may wrap automatically. Arabic entries render with Scheherazade New; everything else uses Montserrat.

### Remote endpoint

Switch **Prayer source** to *Remote endpoint* in Customize. Default URL:

```
https://prayer.ibrahimomer.net/quotes.json
```

Endpoint returns either a raw array or a wrapped object:

```json
{
  "version": 1,
  "updatedAt": "2026-05-20T00:00:00Z",
  "prayers": [
    { "lines": ["..."], "title": "...", "lang": "ar", "dir": "rtl" }
  ]
}
```

If the endpoint fails the wallpaper shows a clear error — no silent local fallback.

**CORS requirement.** Because the wallpaper loads from `file://` (zip install) or from `i2pacg.github.io` (URL install), the endpoint must send `Access-Control-Allow-Origin: *`. A ready-to-use [`server/.htaccess`](server/.htaccess) is included — drop it next to `quotes.json` on the host serving the endpoint.

---

## Develop

```powershell
# Validate, build the zip, probe the remote endpoint, stamp the README size.
npm run ship

# Same, but skip the network probe (offline dev).
npm run ship:offline

# Just rebuild the zip without the full pipeline.
npm run package

# Just validate JSON + script.js syntax.
npm run validate
```

`npm run ship` is the only command you need before pushing. It:

1. Validates JSON files and `script.js`.
2. Checks every asset referenced from `index.html` and `styles.css` exists on disk.
3. Probes the remote endpoint (HTTP 200, CORS header, valid JSON shape).
4. Builds `dist/bd-always-prayer-lively.zip`.
5. Stamps the current zip size into this README.

It exits non-zero on any failure, so you don't push broken state. Step 5 may modify this README - stage the change if so.

### Local browser preview

Optional; not needed by Lively.

```powershell
python -m http.server 4173
```

Open <http://localhost:4173>.

### Project layout

```
index.html               Entry point. Lively loads this.
styles.css               Visual style.
script.js                Quote rotation, fitting, Lively property listener.
particles.js             Background particle field.
quotes.json              Bundled prayers (also served via Pages).
LivelyInfo.json          Lively metadata.
LivelyProperties.json    Customize panel definition.
assets/fonts/            Self-hosted Scheherazade New and Montserrat.
assets/preview/          Thumbnail + preview image for Lively library.
server/.htaccess         CORS + no-cache config for the remote endpoint host.
scripts/                 ship.ps1 and package-lively.ps1.
dist/                    Built zip lives here.
```
