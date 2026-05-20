# bd-always-prayer

Minimal Lively Wallpaper web project that rotates prayer and reflection text over a calm animated dark gradient.

## Use With Lively Wallpaper

Two install paths. Pick based on whether you want the Lively **Customize** sliders.

### Zip install (recommended - keeps the Customize panel)

1. Download the zip: <https://i2pacg.github.io/bd-always-prayer/dist/bd-always-prayer-lively.zip>
2. Drag the downloaded zip into the Lively Wallpaper window.
3. Select `bd-always-prayer` from the library.
4. Right-click the wallpaper in Lively and choose **Customize** to edit settings (palette, motion, refresh interval, etc.).

Updates: re-download the zip and drag again when the wallpaper code changes. Prayer text updates live without re-installing (see Remote Prayer API below).

### URL install (auto-updating, no Customize panel)

Lively's **Add Wallpaper -> URL** field accepts a webpage as a wallpaper. Paste:

```text
https://i2pacg.github.io/bd-always-prayer/
```

The wallpaper code auto-updates on every page load - no re-install when the visuals change. Tradeoff: Lively does not read `LivelyProperties.json` from a URL wallpaper, so the Customize sliders are not available on this path. Defaults from `script.js` are used.

### Folder install (development)

1. Open Lively Wallpaper.
2. Add a new wallpaper from this project folder.
3. Select `index.html` as the web wallpaper entry file if prompted.
4. Lively reads `LivelyInfo.json` and `LivelyProperties.json` from the same folder.

No web server is required for normal Lively usage. The Python server mentioned later is only a local preview convenience for browsers.

## Quote Data

Quotes are loaded from `quotes.json`. The file is required; the page intentionally does not include fallback quotes.

Each entry supports:

```json
{
  "text": "Required quote text.",
  "lines": ["Optional", "author-controlled", "visual lines"],
  "title": "Optional title.",
  "source": "Optional source or quoted-from text.",
  "lang": "Optional language hint, such as ar or en.",
  "dir": "Optional text direction, such as rtl or ltr."
}
```

Use `lines` when a prayer, verse, or quote needs specific line endings. The renderer treats those line breaks as intentional and fits the text to the screen instead of letting the browser choose the line breaks. Use `text` for simpler entries where automatic wrapping is acceptable.

Arabic entries render with Scheherazade New, a traditional Naskh-style Arabic font with strong shaping and diacritic support. English and Latin-script entries render with Montserrat.

## Remote Prayer API

Lively Customize can switch the data source from local `quotes.json` to a remote endpoint. The default endpoint field is:

```text
https://prayer.ibrahimomer.net/quotes.json
```

The endpoint can return either the raw array used by `quotes.json` or this wrapped shape:

```json
{
  "version": 1,
  "updatedAt": "2026-05-20T00:00:00Z",
  "prayers": [
    {
      "lines": ["Required prayer line", "Another exact line"],
      "title": "Optional title",
      "source": "Optional source",
      "lang": "ar",
      "dir": "rtl"
    }
  ]
}
```

If the remote endpoint fails, the wallpaper shows a clear error state. There is no silent fallback to local quotes.

The endpoint must send `Access-Control-Allow-Origin: *` (and ideally `Cache-Control: no-cache`) so the Lively wallpaper, which loads from `file://`, can fetch it. A ready-to-use `server/.htaccess` is included in this repo - drop it next to `quotes.json` on the host serving the endpoint.

## Local Preview

This is only for browser testing while developing. It is not needed by Lively.

Run a small local server from this folder:

```powershell
python -m http.server 4173
```

Then open `http://localhost:4173`.

## Lively Settings

The wallpaper includes `LivelyProperties.json`, so these are editable from Lively's **Customize** panel.

| Setting | What it changes |
| --- | --- |
| Quote interval | Seconds each entry stays on screen. |
| Text scale | Overall quote size, still constrained by automatic fitting. |
| Text opacity | Strength of the foreground text. |
| Show title/source | Toggles optional quote metadata. |
| Prayer source | Uses bundled `quotes.json` or a remote endpoint. |
| Remote endpoint URL | URL for the remote prayers JSON endpoint. |
| Remote refresh minutes | Reloads the remote endpoint periodically. Use `0` to disable. |
| Motion intensity | Speed of the background gradient drift. |
| Palette intensity | Strength of the muted color spectrum. |
| Palette mode | Chooses between calm spectrum, graphite, teal, violet, and emerald. |
| Background brightness | Dims or lifts the background while keeping the quote readable. |
| Particle density | Controls how many quiet light particles are shown. |
| Particle glow | Controls how softly particles illuminate the background. |
| Enable animation | Turns text and background motion on or off. |

## Update Workflow

Use this whenever you change the quote library, styling, Lively settings, or local fonts.

1. Edit the source files:

   - Quotes and line endings: `quotes.json`
   - Lively Customize controls: `LivelyProperties.json`
   - Lively metadata: `LivelyInfo.json`
   - Visual style: `styles.css`
   - Runtime behavior: `script.js`

2. Rebuild the import zip:

```powershell
npm run release
```

This validates the JSON, checks `script.js`, confirms required files exist, and writes:

```text
dist/bd-always-prayer-lively.zip
```

3. Test by dragging the rebuilt zip into Lively Wallpaper.

4. Commit and push:

```powershell
git status --short
git add .
git commit -m "Describe the wallpaper update"
git push
```
