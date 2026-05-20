const quoteStage = document.getElementById("quoteStage");
const quoteText = document.getElementById("quoteText");
const quoteMeta = document.getElementById("quoteMeta");
const errorState = document.getElementById("errorState");
const errorMessage = document.getElementById("errorMessage");

const arabicPattern = /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\ufb50-\ufdff\ufe70-\ufeff]/;

const state = {
  quotes: [],
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
    fallbackToLocal: false,
    enableAnimation: true
  },
  refreshTimer: null,
  activeQuotes: []
};

const paletteClasses = ["palette-spectrum", "palette-graphite", "palette-teal", "palette-violet", "palette-emerald"];

function normalizeQuote(entry, index) {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
    throw new Error(`Quote ${index + 1} must be an object.`);
  }

  const authoredLines = Array.isArray(entry.lines)
    ? entry.lines.map((line) => (typeof line === "string" ? line.trim() : "")).filter(Boolean)
    : [];
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
  if (state.settings.dataSource !== 1) {
    return loadLocalQuotes();
  }

  try {
    return await loadRemoteQuotes();
  } catch (error) {
    if (state.settings.fallbackToLocal) {
      return loadLocalQuotes();
    }

    throw error;
  }
}

function getActiveQuotes() {
  return state.quotes;
}

function refreshActiveLibrary() {
  if (!state.isReady) {
    return;
  }

  state.activeQuotes = getActiveQuotes();
  if (state.activeQuotes.length === 0) {
    showError(new Error("No prayers are available. Add at least one custom prayer or enable the built-in library."));
    return;
  }

  state.index = Math.min(state.index, state.activeQuotes.length - 1);
  renderQuote(state.index, false);
  restartTimer();
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

function handleResize() {
  window.requestAnimationFrame(fitQuote);
}

async function start() {
  try {
    applySettings();
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
      state.settings.dataSource = Math.round(toNumber(value, 0));
      reloadQuotes();
      return;
    case "remoteEndpoint":
      state.settings.remoteEndpoint = typeof value === "string" ? value.trim() : String(value || "").trim();
      if (state.settings.dataSource === 1) {
        reloadQuotes();
        return;
      }
      break;
    case "remoteRefreshMinutes":
      state.settings.remoteRefreshMinutes = Math.max(0, toNumber(value, 15));
      restartRefreshTimer();
      break;
    case "fallbackToLocal":
      state.settings.fallbackToLocal = toBoolean(value);
      if (state.settings.dataSource === 1) {
        reloadQuotes();
        return;
      }
      break;
    case "enableAnimation":
      state.settings.enableAnimation = toBoolean(value);
      break;
    default:
      return;
  }

  applySettings();
};

start();
