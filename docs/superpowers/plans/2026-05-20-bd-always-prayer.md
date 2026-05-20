# bd-always-prayer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and publish a static Lively Wallpaper project that rotates mixed Arabic/English prayer text from required JSON over an elegant animated dark spectrum background.

**Architecture:** The project is a plain static web wallpaper. `index.html` provides semantic markup, `styles.css` owns visuals and local fonts, `script.js` loads required quote data, fits text responsively, rotates entries, and applies Lively customization changes. `LivelyProperties.json` defines neat user-editable settings in Lively's Customize panel.

**Tech Stack:** HTML, CSS, vanilla JavaScript, JSON, local WOFF2 fonts, Lively Wallpaper web properties.

---

## File Structure

- `index.html`: page shell, quote container, script/style links.
- `styles.css`: dark spectrum background, typography, transitions, responsive layout, error state.
- `script.js`: quote loading, validation, language/direction detection, text fitting, rotation, Lively property handling.
- `quotes.json`: required structured starter data.
- `LivelyProperties.json`: Lively Customize panel controls.
- `README.md`: usage, editing quote data, Lively setup, configuration notes.
- `assets/fonts/`: locally bundled Cairo and Montserrat WOFF2 font files.

### Task 1: Static Shell And Required Data

**Files:**
- Create: `index.html`
- Create: `quotes.json`
- Create: `README.md`

- [ ] **Step 1: Create the static page shell**

Create `index.html` with this content:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="dark">
    <title>bd-always-prayer</title>
    <link rel="stylesheet" href="styles.css">
  </head>
  <body>
    <main class="wallpaper" aria-live="polite">
      <div class="ambient ambient-one"></div>
      <div class="ambient ambient-two"></div>
      <section class="quote-stage" id="quoteStage">
        <p class="quote-text" id="quoteText"></p>
        <p class="quote-meta" id="quoteMeta"></p>
      </section>
      <section class="error-state" id="errorState" hidden>
        <p class="error-title">Unable to load prayer data</p>
        <p class="error-message" id="errorMessage"></p>
      </section>
    </main>
    <script src="script.js"></script>
  </body>
</html>
```

- [ ] **Step 2: Create the required JSON data**

Create `quotes.json` with this content:

```json
[
  {
    "text": "لَا إِلَٰهَ إِلَّا اللَّهُ الْعَظِيمُ الْحَلِيمُ لَا إِلَٰهَ إِلَّا اللَّهُ رَبُّ الْعَرْشِ الْعَظِيمِ لَا إِلَٰهَ إِلَّا اللَّهُ رَبُّ السَّمَاوَاتِ وَرَبُّ الْأَرْضِ وَرَبُّ الْعَرْشِ الْكَرِيم",
    "title": "دعاء الكرب",
    "lang": "ar",
    "dir": "rtl"
  },
  {
    "text": "God grant me the serenity\nto accept the things I cannot change;\ncourage to change the things I can;\nand wisdom to know the difference.",
    "title": "Serenity Prayer",
    "lang": "en",
    "dir": "ltr"
  },
  {
    "text": "لِيُنفِقْ ذُو سَعَةٍ مِّن سَعَتِهِ ۖ وَمَن قُدِرَ عَلَيْهِ رِزْقُهُ فَلْيُنفِقْ مِمَّا آتَاهُ اللَّهُ ۚ لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا مَا آتَاهَا ۚ سَيَجْعَلُ اللَّهُ بَعْدَ عُسْرٍ يُسْرًا (7)",
    "title": "سورة الطلاق",
    "lang": "ar",
    "dir": "rtl"
  }
]
```

- [ ] **Step 3: Create initial README**

Create `README.md` with usage instructions for opening `index.html` in Lively, editing `quotes.json`, and changing settings in Lively's Customize panel.

- [ ] **Step 4: Commit**

Run:

```powershell
git add index.html quotes.json README.md
git commit -m "Add wallpaper shell and prayer data"
```

Expected: commit succeeds.

### Task 2: Fonts And Visual Styling

**Files:**
- Create: `assets/fonts/cairo.woff2`
- Create: `assets/fonts/montserrat.woff2`
- Create: `styles.css`

- [ ] **Step 1: Download local fonts**

Download Cairo Arabic and Montserrat Latin WOFF2 files into `assets/fonts/`. Use Google Fonts CSS as the source and keep only the needed normal weight variable files or 500/600 weights.

- [ ] **Step 2: Create CSS**

Create `styles.css` with local `@font-face` rules, dark spectrum background animation, centered quote layout, quote/meta typography, animation classes, reduced-motion support, and CSS variables for runtime Lively settings.

- [ ] **Step 3: Commit**

Run:

```powershell
git add assets/fonts styles.css
git commit -m "Add local fonts and wallpaper styling"
```

Expected: commit succeeds.

### Task 3: Quote Runtime And Text Fitting

**Files:**
- Create: `script.js`

- [ ] **Step 1: Implement runtime**

Create `script.js` to:

- Fetch required `quotes.json`.
- Validate the data is a non-empty array of objects with non-empty `text`.
- Show a centered error state if loading or validation fails.
- Detect Arabic characters when `lang` or `dir` is missing.
- Render `text`, optional `title`, and optional `source`.
- Preserve line breaks.
- Rotate entries on an interval.
- Fit text by measuring the quote stage and reducing font size until text fits inside the padded area.
- Refit on resize and after every quote change.

- [ ] **Step 2: Commit**

Run:

```powershell
git add script.js
git commit -m "Add quote rotation and responsive fitting"
```

Expected: commit succeeds.

### Task 4: Lively Customization

**Files:**
- Create: `LivelyProperties.json`
- Modify: `script.js`
- Modify: `styles.css`
- Modify: `README.md`

- [ ] **Step 1: Add Lively properties**

Create `LivelyProperties.json` with labeled controls for rotation interval, text scale, background motion, palette intensity, text opacity, metadata visibility, and animation enabled.

- [ ] **Step 2: Apply runtime customization**

Update `script.js` with `window.livelyPropertyListener = function livelyPropertyListener(name, val) { ... }`. Changes must apply immediately by updating CSS variables and runtime settings.

- [ ] **Step 3: Document settings**

Update `README.md` with a short table explaining each Lively customization setting.

- [ ] **Step 4: Commit**

Run:

```powershell
git add LivelyProperties.json script.js styles.css README.md
git commit -m "Add Lively customization controls"
```

Expected: commit succeeds.

### Task 5: Verification And Publish

**Files:**
- Modify: files only if verification finds defects.

- [ ] **Step 1: Run a local server**

Run:

```powershell
python -m http.server 4173
```

Expected: `http://localhost:4173` serves the wallpaper.

- [ ] **Step 2: Verify in browser**

Open `http://localhost:4173` in the in-app browser. Verify the background animates, quotes rotate, text fits with padding, Arabic uses Cairo RTL, English uses Montserrat LTR, and no console errors appear.

- [ ] **Step 3: Verify error state**

Temporarily rename `quotes.json`, reload the page, and confirm the centered error state appears. Restore `quotes.json` before committing.

- [ ] **Step 4: Create private GitHub repository and push**

Use the configured GitHub account to create a private repository named `bd-always-prayer`, add it as `origin`, and push the current branch.

Expected: remote private repository exists and the branch is pushed.

## Self-Review

- Spec coverage: the plan includes required JSON-only data, mixed Arabic/English entries, Cairo/Montserrat local fonts, responsive fitting, curated dark spectrum animation, Lively customization, browser verification, and private repo publishing.
- Placeholder scan: no TBD/TODO placeholders are present.
- Type consistency: quote fields and Lively property names are defined once and used consistently by the planned files.
