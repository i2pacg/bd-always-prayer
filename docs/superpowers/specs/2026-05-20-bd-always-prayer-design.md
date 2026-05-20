# bd-always-prayer Design

## Goal

Create a minimal static HTML wallpaper for Lively Wallpaper named `bd-always-prayer`. The page shows centered devotional text over a dark animated gradient, rotating between entries from a required JSON data file.

## Visual Direction

The wallpaper uses a restrained dark style: near-black base, soft glows, and subtle animated gradient movement. The gradient can travel through multiple color spectrums, but only through a curated low-saturation palette that preserves the chosen quiet minimalist mood. Suitable colors include muted graphite, deep teal, desaturated indigo, cool violet, smoky emerald, and soft warm gray. Bright neon, candy colors, and high-contrast rainbow effects are out of scope.

Quote text appears in the visual center with generous viewport padding. Text transitions use a soft fade, slight upward motion, and blur settling into sharp text. The background animation should feel alive but calm, with slow spectrum drift and no flashy pulses.

## Typography

Arabic text uses Scheherazade New, a traditional Naskh-style font suited to Arabic-script shaping and diacritics. English and Latin-script text uses Montserrat. Fonts will be bundled locally in the project so Lively can run the wallpaper without internet access.

The renderer chooses the font per quote based on explicit `lang`/`dir` fields when present, otherwise by detecting Arabic characters in the quote text.

## Data Model

`quotes.json` is required and is the only quote data source. No fallback quote array will be embedded in the page. If the JSON file is missing, invalid, or empty, the wallpaper shows a clear centered error state.

Each quote item supports:

```json
{
  "text": "Required quote or prayer text.",
  "lines": ["Optional author-controlled visual line endings."],
  "title": "Optional title.",
  "source": "Optional quoted-from/source text.",
  "lang": "Optional language hint such as ar or en.",
  "dir": "Optional text direction such as rtl or ltr."
}
```

`lines` is preferred when the author needs sentences, verses, or prayer phrases to end on specific visual lines. The renderer preserves those line breaks and fits the full block to the screen.

Starter data includes the provided Arabic du'a, the Serenity Prayer excerpt, and the Surah At-Talaq verse with `title` set to `سورة الطلاق`.

## Layout And Text Fitting

The quote container is centered horizontally and vertically with responsive padding. The text should try to fit all visible content without clipping:

- Use a bounded text area with viewport-relative max width and max height.
- Compute a font size for each quote that fits the available area.
- Keep sensible minimum and maximum sizes so short entries remain elegant and long entries stay readable.
- Preserve line breaks from the JSON data, especially author-controlled `lines` arrays.
- Use RTL layout for Arabic entries and LTR layout for English entries.

## Lively Integration

The project is a static web wallpaper folder with `index.html` as the entry page. It includes `LivelyProperties.json` so Lively can expose simple customization settings, using the documented `livelyPropertyListener(name, val)` hook.

Configuration should be neat and editable from the Lively Wallpaper application's Customize panel. Property labels should be human-readable, grouped by purpose where Lively supports labels, and use sensible defaults and ranges so a user can tune the wallpaper without editing code.

Initial editable properties:

- Rotation interval in seconds.
- Text scale.
- Background motion intensity.
- Color spectrum mode or palette intensity.
- Text opacity.
- Metadata visibility for title/source.
- Animation enabled/disabled.

The page applies Lively property changes immediately at runtime through `livelyPropertyListener`.

## Files

The project will include:

- `index.html`
- `styles.css`
- `script.js`
- `quotes.json`
- `LivelyProperties.json`
- local font files under `assets/fonts/`
- `README.md`
- `.gitignore`

## Verification

Verify the page locally in a browser and through the in-app browser. Check that:

- The background animates, moves through the curated spectrum, and remains dark/minimal.
- Quotes rotate at the configured interval.
- Text transitions animate smoothly.
- Arabic renders in Scheherazade New and RTL.
- English renders in Montserrat and LTR.
- Long entries fit centered with padding and no clipping on desktop and smaller viewports.
- Missing or malformed `quotes.json` produces a clear error state.
- Lively customization controls appear with clear labels and update the wallpaper immediately.

## Repository

Initialize this folder as `bd-always-prayer`, then create and push a private GitHub repository under the currently configured account for `i2pacg@gmail.com`.
