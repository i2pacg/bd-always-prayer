# bd-always-prayer

Minimal Lively Wallpaper web project that rotates prayer and reflection text over a calm animated dark gradient.

## Use With Lively Wallpaper

No web server is required for normal Lively usage. The Python server mentioned during development is only a local preview convenience for browsers.

Recommended install:

1. Drag `dist/bd-always-prayer-lively.zip` into the Lively Wallpaper window.
2. Lively imports the wallpaper into its library.
3. Select `bd-always-prayer`.
4. Right-click the wallpaper in Lively and choose **Customize** to edit the available settings.

Folder install:

1. Open Lively Wallpaper.
2. Add a new wallpaper from this project folder.
3. Select `index.html` as the web wallpaper entry file if prompted.
4. Lively reads `LivelyInfo.json` and `LivelyProperties.json` from the same folder.

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
| Motion intensity | Speed of the background gradient drift. |
| Palette intensity | Strength of the muted color spectrum. |
| Palette mode | Chooses between calm spectrum, graphite, teal, violet, and emerald. |
| Background brightness | Dims or lifts the background while keeping the quote readable. |
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
