const quoteStage = document.getElementById("quoteStage");
const quoteText = document.getElementById("quoteText");
const quoteMeta = document.getElementById("quoteMeta");
const errorState = document.getElementById("errorState");
const errorMessage = document.getElementById("errorMessage");
const libraryToggle = document.getElementById("libraryToggle");
const libraryPanel = document.getElementById("libraryPanel");
const librarySheet = document.getElementById("librarySheet");
const libraryBackdrop = document.getElementById("libraryBackdrop");
const libraryClose = document.getElementById("libraryClose");
const libraryList = document.getElementById("libraryList");
const libraryEmpty = document.getElementById("libraryEmpty");
const libraryCount = document.getElementById("libraryCount");
const librarySourceSummary = document.getElementById("librarySourceSummary");
const librarySourceLocal = document.getElementById("librarySourceLocal");
const librarySourceRemote = document.getElementById("librarySourceRemote");
const libraryRemoteForm = document.getElementById("libraryRemoteForm");
const libraryRemoteEndpoint = document.getElementById("libraryRemoteEndpoint");
const libraryForm = document.getElementById("libraryForm");
const libraryEntryId = document.getElementById("libraryEntryId");
const libraryEntryTitle = document.getElementById("libraryEntryTitle");
const libraryEntrySource = document.getElementById("libraryEntrySource");
const libraryEntryLang = document.getElementById("libraryEntryLang");
const libraryEntryDir = document.getElementById("libraryEntryDir");
const libraryEntryLines = document.getElementById("libraryEntryLines");
const libraryPreview = document.getElementById("libraryPreview");
const libraryPreviewText = document.getElementById("libraryPreviewText");
const libraryPreviewMeta = document.getElementById("libraryPreviewMeta");
const libraryStatus = document.getElementById("libraryStatus");
const libraryNew = document.getElementById("libraryNew");
const libraryDelete = document.getElementById("libraryDelete");
const libraryDeleteAll = document.getElementById("libraryDeleteAll");
const libraryExport = document.getElementById("libraryExport");
const libraryImportDefault = document.getElementById("libraryImportDefault");
const libraryImport = document.getElementById("libraryImport");
const libraryImportEndpoint = document.getElementById("libraryImportEndpoint");
const libraryImportInput = document.getElementById("libraryImportInput");
const libraryEndpointImport = document.getElementById("libraryEndpointImport");
const libraryEndpointUrl = document.getElementById("libraryEndpointUrl");
const libraryChoice = document.getElementById("libraryChoice");
const libraryChoiceTitle = document.getElementById("libraryChoiceTitle");
const libraryChoiceMessage = document.getElementById("libraryChoiceMessage");
const libraryChoiceCancel = document.getElementById("libraryChoiceCancel");
const libraryChoiceSecondary = document.getElementById("libraryChoiceSecondary");
const libraryChoicePrimary = document.getElementById("libraryChoicePrimary");

const arabicPattern = /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\ufb50-\ufdff\ufe70-\ufeff]/;
const localLibraryStorageKey = "bdAlwaysPrayer.localLibrary.v1";
const sourceSettingsStorageKey = "bdAlwaysPrayer.sourceSettings.v1";
const legacySavedPrayersStorageKey = "bdAlwaysPrayer.savedPrayers.v1";

const state = {
  quotes: [],
  localSeedQuotes: [],
  savedPrayers: [],
  selectedSavedPrayerId: "",
  index: 0,
  timer: null,
  isReady: false,
  settings: {
    intervalSeconds: 12,
    textScale: 1,
    backgroundMotion: 0.7,
    paletteIntensity: 0.85,
    paletteMode: 0,
    backgroundBrightness: 28,
    particleDensity: 58,
    particleGlow: 62,
    textOpacity: 0.94,
    showMetadata: true,
    dataSource: 0,
    remoteEndpoint: "https://prayer.ibrahimomer.net/quotes.json",
    remoteRefreshMinutes: 15,
    enableAnimation: true
  },
  refreshTimer: null,
  activeQuotes: [],
  lastFocusedElement: null,
  pendingChoice: null,
  activeEditorControl: null
};

const paletteClasses = ["palette-spectrum", "palette-graphite", "palette-teal", "palette-violet", "palette-emerald"];

function trimLineEdges(lines) {
  const cleanLines = lines.map((line) => (typeof line === "string" ? line.trimEnd() : ""));

  while (cleanLines.length > 0 && !cleanLines[0].trim()) {
    cleanLines.shift();
  }

  while (cleanLines.length > 0 && !cleanLines[cleanLines.length - 1].trim()) {
    cleanLines.pop();
  }

  return cleanLines;
}

function getAuthoredLines(value) {
  if (Array.isArray(value)) {
    return trimLineEdges(value);
  }

  if (typeof value === "string") {
    return trimLineEdges(value.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n"));
  }

  return [];
}

function normalizeQuote(entry, index) {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
    throw new Error(`Quote ${index + 1} must be an object.`);
  }

  const authoredLines = getAuthoredLines(entry.lines);
  const text = authoredLines.length > 0
    ? authoredLines.join("\n")
    : typeof entry.text === "string"
      ? entry.text.trim()
      : "";
  if (!text) {
    throw new Error(`Quote ${index + 1} is missing required text or lines.`);
  }

  const isArabic = entry.lang === "ar" || entry.dir === "rtl" || arabicPattern.test(text);
  const dir = entry.dir === "rtl" || entry.dir === "ltr" ? entry.dir : isArabic ? "rtl" : "ltr";
  const lang = typeof entry.lang === "string" && entry.lang.trim() ? entry.lang.trim() : isArabic ? "ar" : "en";

  return {
    text,
    title: typeof entry.title === "string" ? entry.title.trim() : "",
    source: typeof entry.source === "string" ? entry.source.trim() : "",
    lang,
    dir,
    script: isArabic ? "arabic" : "latin",
    hasAuthoredLines: authoredLines.length > 0
  };
}

async function fetchJson(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}.`);
  }

  return response.json();
}

function normalizeQuotePayload(data, sourceName) {
  const entries = Array.isArray(data) ? data : data && Array.isArray(data.prayers) ? data.prayers : [];
  if (entries.length === 0) {
    throw new Error(`${sourceName} must contain at least one prayer.`);
  }

  return entries.map(normalizeQuote);
}

async function loadLocalQuotes() {
  return normalizeQuotePayload(await fetchJson("quotes.json"), "quotes.json");
}

async function loadRemoteQuotes() {
  const endpoint = state.settings.remoteEndpoint.trim();
  if (!endpoint) {
    throw new Error("Remote endpoint URL is empty.");
  }

  return normalizeQuotePayload(await fetchJson(endpoint), endpoint);
}

async function loadQuotes() {
  return state.settings.dataSource === 1 ? loadRemoteQuotes() : [];
}

function loadSourceSettings() {
  try {
    const raw = window.localStorage.getItem(sourceSettingsStorageKey);
    if (!raw) {
      return;
    }

    const parsed = JSON.parse(raw);
    state.settings.dataSource = parsed && Number(parsed.dataSource) === 1 ? 1 : 0;
    if (typeof parsed.remoteEndpoint === "string" && parsed.remoteEndpoint.trim()) {
      state.settings.remoteEndpoint = parsed.remoteEndpoint.trim();
    }
    if (Number.isFinite(Number(parsed.remoteRefreshMinutes))) {
      state.settings.remoteRefreshMinutes = Math.max(0, Number(parsed.remoteRefreshMinutes));
    }
  } catch (error) {
    setLibraryStatus(error instanceof Error ? error.message : String(error), true);
  }
}

function persistSourceSettings() {
  window.localStorage.setItem(sourceSettingsStorageKey, JSON.stringify({
    version: 1,
    dataSource: state.settings.dataSource,
    remoteEndpoint: state.settings.remoteEndpoint,
    remoteRefreshMinutes: state.settings.remoteRefreshMinutes,
    updatedAt: new Date().toISOString()
  }, null, 2));
}

function renderSourceControls() {
  const isRemote = state.settings.dataSource === 1;

  librarySourceSummary.textContent = isRemote ? "Remote endpoint, then local library" : "Local library only";
  librarySourceLocal.classList.toggle("is-active", !isRemote);
  librarySourceLocal.setAttribute("aria-pressed", String(!isRemote));
  librarySourceRemote.classList.toggle("is-active", isRemote);
  librarySourceRemote.setAttribute("aria-pressed", String(isRemote));
  libraryRemoteForm.hidden = !isRemote;
  libraryRemoteEndpoint.value = state.settings.remoteEndpoint;
}

async function setPrayerSource(source) {
  const nextSource = source === "remote" ? 1 : 0;
  if (state.settings.dataSource === nextSource) {
    renderSourceControls();
    return;
  }

  state.settings.dataSource = nextSource;
  persistSourceSettings();
  renderSourceControls();
  await reloadQuotes();
}

async function refreshRemoteSourceFromForm() {
  const endpoint = libraryRemoteEndpoint.value.trim();
  if (!endpoint) {
    setLibraryStatus("Remote endpoint URL is empty.", true);
    focusEditableControl(libraryRemoteEndpoint);
    return;
  }

  state.settings.remoteEndpoint = endpoint;
  state.settings.dataSource = 1;
  persistSourceSettings();
  renderSourceControls();
  await reloadQuotes();
  setLibraryStatus("Remote source refreshed.");
}

function createPrayerId() {
  return `saved-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function createSeedPrayerId(index) {
  return `local-json-${index + 1}`;
}

function hashString(value) {
  let hash = 0;

  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
  }

  return Math.abs(hash).toString(36);
}

function createImportPrayerId(entry) {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
    return createPrayerId();
  }

  const lines = getAuthoredLines(Array.isArray(entry.lines) ? entry.lines : entry.text).join("\n");
  const signature = [
    typeof entry.title === "string" ? entry.title.trim() : "",
    typeof entry.source === "string" ? entry.source.trim() : "",
    typeof entry.lang === "string" ? entry.lang.trim() : "",
    typeof entry.dir === "string" ? entry.dir.trim() : "",
    lines
  ].join("|");

  return `import-${hashString(signature)}`;
}

function normalizeSavedPrayer(entry, index) {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
    throw new Error(`Saved prayer ${index + 1} must be an object.`);
  }

  const lines = getAuthoredLines(Array.isArray(entry.lines) ? entry.lines : entry.text);
  if (lines.length === 0 || !lines.join("").trim()) {
    throw new Error(`Saved prayer ${index + 1} needs at least one line.`);
  }

  const id = typeof entry.id === "string" && entry.id.trim() ? entry.id.trim() : createPrayerId();
  const lang = entry.lang === "ar" || entry.lang === "en" ? entry.lang : "";
  const dir = entry.dir === "rtl" || entry.dir === "ltr" ? entry.dir : "";

  return {
    id,
    title: typeof entry.title === "string" ? entry.title.trim() : "",
    source: typeof entry.source === "string" ? entry.source.trim() : "",
    lang,
    dir,
    lines,
    createdAt: typeof entry.createdAt === "string" && entry.createdAt ? entry.createdAt : new Date().toISOString(),
    updatedAt: typeof entry.updatedAt === "string" && entry.updatedAt ? entry.updatedAt : new Date().toISOString()
  };
}

function savedPrayerToQuote(entry, index) {
  return {
    ...normalizeQuote({
      title: entry.title,
      source: entry.source,
      lang: entry.lang || undefined,
      dir: entry.dir || undefined,
      lines: entry.lines
    }, index),
    savedId: entry.id
  };
}

function quoteToSavedPrayer(quote, index) {
  const lines = quote.hasAuthoredLines ? quote.text.split("\n") : [quote.text];

  return normalizeSavedPrayer({
    id: createSeedPrayerId(index),
    title: quote.title,
    source: quote.source,
    lang: quote.lang,
    dir: quote.dir,
    lines
  }, index);
}

function readSavedPrayers() {
  try {
    const seedEntries = state.localSeedQuotes.map(quoteToSavedPrayer);
    const raw = window.localStorage.getItem(localLibraryStorageKey);
    if (!raw) {
      const legacyRaw = window.localStorage.getItem(legacySavedPrayersStorageKey);
      if (!legacyRaw) {
        return seedEntries;
      }

      const legacyParsed = JSON.parse(legacyRaw);
      const legacyEntries = Array.isArray(legacyParsed)
        ? legacyParsed
        : legacyParsed && Array.isArray(legacyParsed.prayers)
          ? legacyParsed.prayers
          : [];
      const seededIds = new Set(seedEntries.map((entry) => entry.id));
      const legacyPrayers = legacyEntries.map(normalizeSavedPrayer).filter((entry) => !seededIds.has(entry.id));
      return seedEntries.concat(legacyPrayers);
    }

    const parsed = JSON.parse(raw);
    const entries = Array.isArray(parsed) ? parsed : parsed && Array.isArray(parsed.prayers) ? parsed.prayers : [];
    return entries.map(normalizeSavedPrayer);
  } catch (error) {
    setLibraryStatus(error instanceof Error ? error.message : String(error), true);
    return [];
  }
}

function persistSavedPrayers() {
  window.localStorage.setItem(localLibraryStorageKey, JSON.stringify({
    version: 1,
    updatedAt: new Date().toISOString(),
    prayers: state.savedPrayers
  }, null, 2));
}

function getActiveQuotes() {
  const savedQuotes = state.savedPrayers.map(savedPrayerToQuote);
  return state.settings.dataSource === 1 ? state.quotes.concat(savedQuotes) : savedQuotes;
}

function refreshActiveLibrary() {
  if (!state.isReady) {
    return;
  }

  state.activeQuotes = getActiveQuotes();
  if (state.activeQuotes.length === 0) {
    showError(new Error("No prayers are available. Add at least one saved prayer or load a prayer source."));
    return;
  }

  state.index = Math.min(state.index, state.activeQuotes.length - 1);
  renderQuote(state.index, false);
  restartTimer();
}

function syncLibraryAfterMutation() {
  if (state.isReady) {
    refreshActiveLibrary();
    return;
  }

  if (getActiveQuotes().length > 0) {
    showQuotes();
  }
}

function showError(error) {
  state.isReady = false;
  clearTimer();
  clearRefreshTimer();
  quoteStage.hidden = true;
  errorState.hidden = false;
  errorMessage.textContent = error instanceof Error ? error.message : String(error);
}

function showQuotes() {
  state.isReady = true;
  errorState.hidden = true;
  quoteStage.hidden = false;
  state.activeQuotes = getActiveQuotes();
  state.index = Math.min(state.index, state.activeQuotes.length - 1);
  renderQuote(state.index, false);
  restartTimer();
  restartRefreshTimer();
}

function clearTimer() {
  if (state.timer) {
    window.clearInterval(state.timer);
    state.timer = null;
  }
}

function clearRefreshTimer() {
  if (state.refreshTimer) {
    window.clearInterval(state.refreshTimer);
    state.refreshTimer = null;
  }
}

function restartRefreshTimer() {
  clearRefreshTimer();
  if (state.settings.dataSource !== 1 || state.settings.remoteRefreshMinutes <= 0) {
    return;
  }

  state.refreshTimer = window.setInterval(reloadQuotes, state.settings.remoteRefreshMinutes * 60 * 1000);
}

function getMetaText(quote) {
  return [quote.title, quote.source].filter(Boolean).join("\n");
}

function applyQuote(quote) {
  quoteStage.dataset.script = quote.script;
  quoteStage.dir = quote.dir;
  quoteStage.lang = quote.lang;
  quoteStage.dataset.lineMode = quote.hasAuthoredLines ? "authored" : "flow";
  quoteText.textContent = quote.text;
  quoteMeta.textContent = state.settings.showMetadata ? getMetaText(quote) : "";
  if (window.bdParticles) {
    window.bdParticles.setQuote(quote);
  }
}

function applySettings() {
  const root = document.documentElement;
  const motionScale = Math.max(0.15, state.settings.backgroundMotion * 1.25);
  root.style.setProperty("--motion-scale", String(motionScale));
  root.style.setProperty("--palette-intensity", String(state.settings.paletteIntensity));
  root.style.setProperty("--background-dim", String((100 - state.settings.backgroundBrightness) / 100));
  root.style.setProperty("--text-opacity", String(state.settings.textOpacity));
  root.style.setProperty("--text-scale", String(state.settings.textScale));
  root.style.setProperty("--meta-display", state.settings.showMetadata ? "block" : "none");

  document.body.classList.toggle("motion-disabled", !state.settings.enableAnimation);
  document.body.classList.toggle("background-paused", state.settings.backgroundMotion <= 0.01);
  document.body.classList.remove(...paletteClasses);
  document.body.classList.add(paletteClasses[state.settings.paletteMode] || paletteClasses[0]);

  if (window.bdParticles) {
    window.bdParticles.set({
      enabled: state.settings.enableAnimation,
      density: state.settings.particleDensity,
      glow: state.settings.particleGlow,
      motion: state.settings.backgroundMotion,
      paletteMode: state.settings.paletteMode,
      brightness: state.settings.backgroundBrightness
    });
  }

  if (state.isReady) {
    refreshActiveLibrary();
    fitQuote();
  }
}

function setStageClass(className) {
  quoteStage.classList.remove("is-entering", "is-visible", "is-leaving");
  quoteStage.classList.add(className);
}

function renderQuote(nextIndex, animate = true) {
  const quote = state.activeQuotes[nextIndex];
  if (!quote) {
    return;
  }

  state.index = nextIndex;

  if (!animate || !state.settings.enableAnimation) {
    applyQuote(quote);
    fitQuote();
    setStageClass("is-visible");
    return;
  }

  setStageClass("is-leaving");

  window.setTimeout(() => {
    applyQuote(quote);
    fitQuote();
    setStageClass("is-entering");

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        setStageClass("is-visible");
      });
    });
  }, 420);
}

function nextQuote() {
  if (!state.isReady || state.activeQuotes.length < 2) {
    return;
  }

  renderQuote((state.index + 1) % state.activeQuotes.length);
}

function restartTimer() {
  clearTimer();
  if (!state.isReady || state.activeQuotes.length < 2) {
    return;
  }

  state.timer = window.setInterval(nextQuote, state.settings.intervalSeconds * 1000);
}

function getAvailableHeight() {
  const viewportCap = window.innerHeight * (window.innerWidth < 720 ? 0.78 : 0.74);
  return Math.min(viewportCap, 760);
}

function quoteFits(maxHeight) {
  const gap = parseFloat(window.getComputedStyle(quoteStage).gap) || 0;
  const metaHeight = quoteMeta.textContent ? quoteMeta.scrollHeight + gap : 0;
  const totalHeight = quoteText.scrollHeight + metaHeight;
  const stageWidth = quoteStage.clientWidth;

  return quoteText.scrollWidth <= stageWidth + 1 && totalHeight <= maxHeight + 1;
}

function fitQuote() {
  if (!quoteText.textContent) {
    return;
  }

  const scale = state.settings.textScale;
  const isArabic = quoteStage.dataset.script === "arabic";
  const viewportMax = Math.min(window.innerWidth * (isArabic ? 0.056 : 0.047), 64);
  const maxSize = Math.max(28, Math.min(68, viewportMax) * scale);
  const hasAuthoredLines = quoteStage.dataset.lineMode === "authored";
  const minBase = hasAuthoredLines ? 10 : 16;
  const minSize = Math.max(minBase, Math.min(24, window.innerWidth * 0.026) * scale);
  const maxHeight = getAvailableHeight();
  const lineHeight = isArabic ? 1.82 : 1.56;

  quoteText.style.setProperty("--quote-line-height", String(lineHeight));

  let low = minSize;
  let high = maxSize;
  let best = minSize;

  for (let i = 0; i < 16; i += 1) {
    const mid = (low + high) / 2;
    quoteText.style.setProperty("--quote-font-size", `${mid}px`);

    if (quoteFits(maxHeight)) {
      best = mid;
      low = mid;
    } else {
      high = mid;
    }
  }

  quoteText.style.setProperty("--quote-font-size", `${Math.floor(best)}px`);
}

function setLibraryStatus(message, isError = false) {
  if (!libraryStatus) {
    return;
  }

  libraryStatus.textContent = message || "";
  libraryStatus.classList.toggle("is-error", isError);
}

function getFocusableElements(container) {
  return Array.from(container.querySelectorAll([
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])"
  ].join(","))).filter((element) => {
    if (element.hidden || element.closest("[hidden]") || element.getAttribute("aria-hidden") === "true") {
      return false;
    }

    const style = window.getComputedStyle(element);
    return style.display !== "none" && style.visibility !== "hidden";
  });
}

function focusFirstIn(container, fallback = librarySheet) {
  const first = getFocusableElements(container)[0] || fallback;
  if (first) {
    first.focus({ preventScroll: true });
  }
}

function cycleFocus(event, container) {
  if (event.key !== "Tab") {
    return;
  }

  const focusable = getFocusableElements(container);
  if (focusable.length === 0) {
    event.preventDefault();
    container.focus({ preventScroll: true });
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus({ preventScroll: true });
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus({ preventScroll: true });
  }
}

function isEditableControl(element) {
  return element instanceof HTMLInputElement
    || element instanceof HTMLTextAreaElement
    || element instanceof HTMLSelectElement;
}

function focusEditableControl(control, shouldSelect = false) {
  if (!isEditableControl(control) || control.disabled || control.hidden) {
    return;
  }

  state.activeEditorControl = control;
  control.focus({ preventScroll: true });
  if (shouldSelect && (control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement)) {
    control.select();
  }

  window.requestAnimationFrame(() => {
    if (document.activeElement !== control) {
      control.focus({ preventScroll: true });
    }

    if (shouldSelect && (control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement)) {
      control.select();
    }
  });
}

function focusPrimaryEditorField(shouldSelect = false) {
  focusEditableControl(libraryEntryTitle, shouldSelect);
}

function restoreEditorFocus() {
  if (!libraryPanel.hidden && isEditableControl(state.activeEditorControl) && !state.activeEditorControl.closest("[hidden]")) {
    focusEditableControl(state.activeEditorControl);
    return;
  }

  librarySheet.focus({ preventScroll: true });
}

function containLibraryWheel(event) {
  if (libraryPanel.hidden || (event.target instanceof Node && libraryChoice.contains(event.target))) {
    return;
  }

  const scrollArea = event.target instanceof Element
    ? event.target.closest(".library-form, .library-list, textarea")
    : null;

  if (!scrollArea) {
    event.preventDefault();
    return;
  }

  const canScroll = scrollArea.scrollHeight > scrollArea.clientHeight;
  if (!canScroll) {
    event.preventDefault();
    return;
  }

  const atTop = scrollArea.scrollTop <= 0;
  const atBottom = scrollArea.scrollTop + scrollArea.clientHeight >= scrollArea.scrollHeight - 1;

  if ((event.deltaY < 0 && atTop) || (event.deltaY > 0 && atBottom)) {
    event.preventDefault();
  }
}

function installEditableFocusBridge() {
  const editableControls = [
    libraryEntryTitle,
    libraryEntrySource,
    libraryEntryLang,
    libraryEntryDir,
    libraryEntryLines,
    libraryRemoteEndpoint,
    libraryEndpointUrl
  ];

  editableControls.forEach((control) => {
    control.addEventListener("pointerdown", (event) => {
      event.stopPropagation();
      focusEditableControl(control);
    }, { capture: true });
    control.addEventListener("click", (event) => {
      event.stopPropagation();
      focusEditableControl(control);
    });
    control.addEventListener("focus", () => {
      state.activeEditorControl = control;
    });
  });

  librarySheet.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
  });
  librarySheet.addEventListener("wheel", containLibraryWheel, { passive: false });
}

function getLibraryDraft() {
  const lines = getAuthoredLines(libraryEntryLines.value);
  if (lines.length === 0 || !lines.join("").trim()) {
    throw new Error("Add at least one prayer line.");
  }

  return normalizeSavedPrayer({
    id: libraryEntryId.value,
    title: libraryEntryTitle.value,
    source: libraryEntrySource.value,
    lang: libraryEntryLang.value,
    dir: libraryEntryDir.value,
    lines,
    createdAt: state.savedPrayers.find((entry) => entry.id === libraryEntryId.value)?.createdAt
  }, 0);
}

function getPrayerListTitle(entry) {
  return entry.title || entry.source || entry.lines.find((line) => line.trim()) || "Untitled prayer";
}

function renderLibraryList() {
  libraryList.textContent = "";
  libraryEmpty.hidden = state.savedPrayers.length > 0;
  libraryCount.textContent = `${state.savedPrayers.length} local`;
  libraryDelete.classList.toggle("is-visible", Boolean(libraryEntryId.value));

  state.savedPrayers.forEach((entry) => {
    const button = document.createElement("button");
    const title = document.createElement("span");
    const lines = document.createElement("span");

    button.type = "button";
    button.className = entry.id === state.selectedSavedPrayerId ? "is-active" : "";
    button.dataset.id = entry.id;
    title.className = "library-list-title";
    lines.className = "library-list-lines";
    title.textContent = getPrayerListTitle(entry);
    lines.textContent = entry.lines.join(" / ");

    button.append(title, lines);
    button.addEventListener("click", () => selectSavedPrayer(entry.id));
    libraryList.append(button);
  });
}

function renderLibraryPreview() {
  const lines = getAuthoredLines(libraryEntryLines.value);
  const text = lines.join("\n");
  const title = libraryEntryTitle.value.trim();
  const source = libraryEntrySource.value.trim();
  const lang = libraryEntryLang.value;
  const dir = libraryEntryDir.value;
  const isArabic = lang === "ar" || dir === "rtl" || arabicPattern.test(text);

  libraryPreview.dataset.script = isArabic ? "arabic" : "latin";
  libraryPreview.dir = dir || (isArabic ? "rtl" : "ltr");
  libraryPreview.lang = lang || (isArabic ? "ar" : "en");
  libraryPreviewText.textContent = text;
  libraryPreviewMeta.textContent = [title, source].filter(Boolean).join("\n");
}

function fillLibraryForm(entry) {
  libraryEntryId.value = entry ? entry.id : "";
  libraryEntryTitle.value = entry ? entry.title : "";
  libraryEntrySource.value = entry ? entry.source : "";
  libraryEntryLang.value = entry ? entry.lang : "";
  libraryEntryDir.value = entry ? entry.dir : "";
  libraryEntryLines.value = entry ? entry.lines.join("\n") : "";
  state.selectedSavedPrayerId = entry ? entry.id : "";
  setLibraryStatus(entry ? "Editing local prayer." : "New local prayer.");
  renderLibraryPreview();
  renderLibraryList();
}

function selectSavedPrayer(id) {
  const entry = state.savedPrayers.find((item) => item.id === id);
  if (entry) {
    fillLibraryForm(entry);
    focusEditableControl(libraryEntryLines);
  }
}

function saveLibraryDraft() {
  const draft = {
    ...getLibraryDraft(),
    updatedAt: new Date().toISOString()
  };
  const existingIndex = state.savedPrayers.findIndex((entry) => entry.id === draft.id);

  if (existingIndex >= 0) {
    state.savedPrayers.splice(existingIndex, 1, draft);
  } else {
    draft.id = createPrayerId();
    state.savedPrayers.push(draft);
  }

  persistSavedPrayers();
  fillLibraryForm(draft);
  syncLibraryAfterMutation();
  setLibraryStatus("Saved.");
}

function deleteSelectedSavedPrayer() {
  const id = libraryEntryId.value;
  if (!id) {
    return;
  }

  const entry = state.savedPrayers.find((item) => item.id === id);
  if (!entry || !window.confirm(`Delete "${getPrayerListTitle(entry)}"?`)) {
    return;
  }

  state.savedPrayers = state.savedPrayers.filter((item) => item.id !== id);
  persistSavedPrayers();
  fillLibraryForm(state.savedPrayers[0] || null);
  syncLibraryAfterMutation();
  setLibraryStatus("Deleted.");
}

function deleteAllSavedPrayers() {
  if (state.savedPrayers.length === 0) {
    setLibraryStatus("The local library is already empty.");
    return;
  }

  openLibraryChoice({
    title: "Delete all local prayers?",
    message: "This clears the editable local library on this device. You can import defaults again later.",
    primaryLabel: "Delete all",
    cancelLabel: "Keep",
    isDanger: true,
    onPrimary: () => {
      state.savedPrayers = [];
      persistSavedPrayers();
      fillLibraryForm(null);
      syncLibraryAfterMutation();
      setLibraryStatus("Local library cleared.");
    }
  });
}

function exportSavedPrayers() {
  const payload = JSON.stringify({
    version: 1,
    exportedAt: new Date().toISOString(),
    prayers: state.savedPrayers
  }, null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "bd-always-prayer-local-library.json";
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  setLibraryStatus("Exported.");
}

function importDefaultPrayers() {
  const defaults = state.localSeedQuotes.map(quoteToSavedPrayer);
  if (defaults.length === 0) {
    setLibraryStatus("No default prayers found.", true);
    return;
  }

  askImportMode({
    title: "Import default prayers",
    message: `Found ${defaults.length} default prayer${defaults.length === 1 ? "" : "s"} from bundled quotes.json.`,
    entries: defaults,
    replaceStatus: "Replaced with",
    addStatus: "Added"
  });
}

function importSavedPrayers(file) {
  const reader = new FileReader();

  reader.addEventListener("load", () => {
    try {
      const parsed = JSON.parse(String(reader.result || ""));
      const entries = normalizeImportEntries(getImportEntries(parsed));
      askImportMode({
        title: "Import file prayers",
        message: `Found ${entries.length} prayer${entries.length === 1 ? "" : "s"} in this file.`,
        entries,
        replaceStatus: "Replaced with",
        addStatus: "Added"
      });
    } catch (error) {
      setLibraryStatus(error instanceof Error ? error.message : String(error), true);
    } finally {
      libraryImportInput.value = "";
    }
  });

  reader.addEventListener("error", () => {
    setLibraryStatus("Unable to read import file.", true);
  });

  reader.readAsText(file);
}

function normalizeImportEntries(entries) {
  if (entries.length === 0) {
    throw new Error("Import has no prayers.");
  }

  return entries.map((entry, index) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      return normalizeSavedPrayer(entry, index);
    }

    return normalizeSavedPrayer({
      ...entry,
      id: typeof entry.id === "string" && entry.id.trim() ? entry.id : createImportPrayerId(entry)
    }, index);
  });
}

function importLibraryEntries(entries, statusPrefix, mode = "add") {
  const imported = normalizeImportEntries(entries);
  const baseEntries = mode === "replace" ? [] : state.savedPrayers;
  const byId = new Map(baseEntries.map((entry) => [entry.id, entry]));

  imported.forEach((entry) => {
    byId.set(entry.id, {
      ...entry,
      updatedAt: new Date().toISOString()
    });
  });
  state.savedPrayers = Array.from(byId.values());
  persistSavedPrayers();
  fillLibraryForm(imported[0]);
  syncLibraryAfterMutation();
  setLibraryStatus(`${statusPrefix} ${imported.length} prayer${imported.length === 1 ? "" : "s"}.`);
}

function getImportEntries(data) {
  return Array.isArray(data) ? data : data && Array.isArray(data.prayers) ? data.prayers : [];
}

function askImportMode(options) {
  openLibraryChoice({
    title: options.title,
    message: options.message,
    primaryLabel: "Replace",
    secondaryLabel: "Add",
    cancelLabel: "Cancel",
    onPrimary: () => {
      importLibraryEntries(options.entries, options.replaceStatus || "Replaced with", "replace");
      if (typeof options.onDone === "function") {
        options.onDone();
      }
    },
    onSecondary: () => {
      importLibraryEntries(options.entries, options.addStatus || "Added", "add");
      if (typeof options.onDone === "function") {
        options.onDone();
      }
    }
  });
}

function openLibraryChoice(options) {
  state.pendingChoice = options;
  libraryChoiceTitle.textContent = options.title;
  libraryChoiceMessage.textContent = options.message;
  libraryChoiceCancel.textContent = options.cancelLabel || "Cancel";
  libraryChoicePrimary.textContent = options.primaryLabel || "Confirm";
  libraryChoicePrimary.classList.toggle("is-danger", Boolean(options.isDanger));

  if (options.secondaryLabel) {
    libraryChoiceSecondary.hidden = false;
    libraryChoiceSecondary.textContent = options.secondaryLabel;
  } else {
    libraryChoiceSecondary.hidden = true;
    libraryChoiceSecondary.textContent = "";
  }

  libraryChoice.hidden = false;
  document.body.classList.add("library-choice-open");
  focusFirstIn(libraryChoice, libraryChoicePrimary);
}

function closeLibraryChoice() {
  libraryChoice.hidden = true;
  document.body.classList.remove("library-choice-open");
  state.pendingChoice = null;
  if (!libraryPanel.hidden) {
    restoreEditorFocus();
  }
}

function runLibraryChoice(actionName) {
  const choice = state.pendingChoice;
  if (!choice) {
    closeLibraryChoice();
    return;
  }

  const action = choice[actionName];
  closeLibraryChoice();
  if (typeof action === "function") {
    action();
  }
}

async function importEndpointPrayers(url) {
  const endpoint = url.trim();
  if (!endpoint) {
    throw new Error("Endpoint URL is empty.");
  }

  const data = await fetchJson(endpoint);
  const entries = getImportEntries(data);
  const imported = normalizeImportEntries(entries);

  askImportMode({
    title: "Import API prayers",
    message: `Found ${imported.length} prayer${imported.length === 1 ? "" : "s"} from this endpoint.`,
    entries: imported,
    replaceStatus: "Replaced with",
    addStatus: "Added",
    onDone: () => {
      libraryEndpointImport.hidden = true;
    }
  });
}

function openLibraryPanel() {
  state.lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  libraryPanel.hidden = false;
  document.body.classList.add("library-open");
  renderLibraryList();
  renderLibraryPreview();
  focusPrimaryEditorField();
}

function closeLibraryPanel() {
  if (!libraryChoice.hidden) {
    closeLibraryChoice();
  }

  libraryPanel.hidden = true;
  document.body.classList.remove("library-open");
  const restoreTarget = state.lastFocusedElement || libraryToggle;
  restoreTarget.focus({ preventScroll: true });
  state.lastFocusedElement = null;
}

function initLibraryManager() {
  state.savedPrayers = readSavedPrayers();
  persistSavedPrayers();
  renderSourceControls();
  fillLibraryForm(state.savedPrayers[0] || null);

  libraryToggle.addEventListener("click", openLibraryPanel);
  libraryBackdrop.addEventListener("click", closeLibraryPanel);
  libraryClose.addEventListener("click", closeLibraryPanel);
  librarySourceLocal.addEventListener("click", () => {
    setPrayerSource("local").catch((error) => showError(error));
  });
  librarySourceRemote.addEventListener("click", () => {
    setPrayerSource("remote").catch((error) => showError(error));
  });
  libraryRemoteForm.addEventListener("submit", (event) => {
    event.preventDefault();
    refreshRemoteSourceFromForm().catch((error) => showError(error));
  });
  libraryRemoteEndpoint.addEventListener("change", () => {
    state.settings.remoteEndpoint = libraryRemoteEndpoint.value.trim() || state.settings.remoteEndpoint;
    persistSourceSettings();
    renderSourceControls();
  });
  libraryNew.addEventListener("click", () => {
    fillLibraryForm(null);
    focusPrimaryEditorField(true);
  });
  libraryDelete.addEventListener("click", deleteSelectedSavedPrayer);
  libraryDeleteAll.addEventListener("click", deleteAllSavedPrayers);
  libraryExport.addEventListener("click", exportSavedPrayers);
  libraryImportDefault.addEventListener("click", importDefaultPrayers);
  libraryImport.addEventListener("click", () => libraryImportInput.click());
  libraryImportEndpoint.addEventListener("click", () => {
    libraryEndpointImport.hidden = !libraryEndpointImport.hidden;
    if (!libraryEndpointImport.hidden) {
      focusEditableControl(libraryEndpointUrl, true);
    }
  });
  libraryEndpointImport.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      await importEndpointPrayers(libraryEndpointUrl.value);
    } catch (error) {
      setLibraryStatus(error instanceof Error ? error.message : String(error), true);
    }
  });
  libraryChoiceCancel.addEventListener("click", closeLibraryChoice);
  libraryChoicePrimary.addEventListener("click", () => runLibraryChoice("onPrimary"));
  libraryChoiceSecondary.addEventListener("click", () => runLibraryChoice("onSecondary"));
  libraryImportInput.addEventListener("change", () => {
    const file = libraryImportInput.files && libraryImportInput.files[0];
    if (file) {
      importSavedPrayers(file);
    }
  });
  [libraryEntryTitle, libraryEntrySource, libraryEntryLang, libraryEntryDir, libraryEntryLines].forEach((input) => {
    input.addEventListener("input", renderLibraryPreview);
    input.addEventListener("change", renderLibraryPreview);
  });
  installEditableFocusBridge();
  libraryForm.addEventListener("submit", (event) => {
    event.preventDefault();
    try {
      saveLibraryDraft();
    } catch (error) {
      setLibraryStatus(error instanceof Error ? error.message : String(error), true);
    }
  });
  window.addEventListener("keydown", (event) => {
    if (libraryPanel.hidden) {
      return;
    }

    if (!libraryChoice.hidden) {
      if (event.key === "Escape") {
        closeLibraryChoice();
        return;
      }

      cycleFocus(event, libraryChoice);
      return;
    }

    if (event.key === "Escape") {
      closeLibraryPanel();
      return;
    }

    cycleFocus(event, librarySheet);
  });
}

function handleResize() {
  window.requestAnimationFrame(fitQuote);
}

async function start() {
  try {
    loadSourceSettings();
    applySettings();
    state.localSeedQuotes = await loadLocalQuotes();
    initLibraryManager();
    state.quotes = await loadQuotes();
    showQuotes();
    window.addEventListener("resize", handleResize);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(fitQuote);
    }
  } catch (error) {
    showError(error);
  }
}

async function reloadQuotes() {
  try {
    clearTimer();
    if (state.settings.dataSource !== 1) {
      state.localSeedQuotes = await loadLocalQuotes();
    }
    state.quotes = await loadQuotes();
    state.index = 0;
    showQuotes();
  } catch (error) {
    showError(error);
  }
}

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBoolean(value) {
  if (typeof value === "boolean") {
    return value;
  }

  return String(value).toLowerCase() === "true";
}

window.livelyPropertyListener = function livelyPropertyListener(name, value) {
  switch (name) {
    case "intervalSeconds":
      state.settings.intervalSeconds = Math.max(5, toNumber(value, 12));
      break;
    case "textScale":
      state.settings.textScale = Math.max(0.7, toNumber(value, 100) / 100);
      break;
    case "backgroundMotion":
      state.settings.backgroundMotion = Math.max(0, toNumber(value, 70) / 100);
      break;
    case "paletteIntensity":
      state.settings.paletteIntensity = Math.max(0.2, toNumber(value, 85) / 100);
      break;
    case "paletteMode":
      state.settings.paletteMode = Math.round(toNumber(value, 0));
      break;
    case "backgroundBrightness":
      state.settings.backgroundBrightness = Math.min(70, Math.max(5, toNumber(value, 28)));
      break;
    case "particleDensity":
      state.settings.particleDensity = Math.min(100, Math.max(0, toNumber(value, 58)));
      break;
    case "particleGlow":
      state.settings.particleGlow = Math.min(100, Math.max(0, toNumber(value, 62)));
      break;
    case "textOpacity":
      state.settings.textOpacity = Math.min(1, Math.max(0.45, toNumber(value, 94) / 100));
      break;
    case "showMetadata":
      state.settings.showMetadata = toBoolean(value);
      break;
    case "dataSource":
    case "remoteEndpoint":
    case "remoteRefreshMinutes":
      return;
    case "enableAnimation":
      state.settings.enableAnimation = toBoolean(value);
      break;
    default:
      return;
  }

  applySettings();
};

start();
