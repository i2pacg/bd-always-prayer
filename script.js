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
    showMetadata: true,
    enableAnimation: true
  }
};

function normalizeQuote(entry, index) {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
    throw new Error(`Quote ${index + 1} must be an object.`);
  }

  const text = typeof entry.text === "string" ? entry.text.trim() : "";
  if (!text) {
    throw new Error(`Quote ${index + 1} is missing required text.`);
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
    script: isArabic ? "arabic" : "latin"
  };
}

async function loadQuotes() {
  const response = await fetch("quotes.json", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`quotes.json returned ${response.status}.`);
  }

  const data = await response.json();
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("quotes.json must contain at least one quote.");
  }

  return data.map(normalizeQuote);
}

function showError(error) {
  state.isReady = false;
  clearTimer();
  quoteStage.hidden = true;
  errorState.hidden = false;
  errorMessage.textContent = error instanceof Error ? error.message : String(error);
}

function clearTimer() {
  if (state.timer) {
    window.clearInterval(state.timer);
    state.timer = null;
  }
}

function getMetaText(quote) {
  return [quote.title, quote.source].filter(Boolean).join("\n");
}

function applyQuote(quote) {
  quoteStage.dataset.script = quote.script;
  quoteStage.dir = quote.dir;
  quoteStage.lang = quote.lang;
  quoteText.textContent = quote.text;
  quoteMeta.textContent = state.settings.showMetadata ? getMetaText(quote) : "";
}

function setStageClass(className) {
  quoteStage.classList.remove("is-entering", "is-visible", "is-leaving");
  quoteStage.classList.add(className);
}

function renderQuote(nextIndex, animate = true) {
  const quote = state.quotes[nextIndex];
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
  if (!state.isReady || state.quotes.length < 2) {
    return;
  }

  renderQuote((state.index + 1) % state.quotes.length);
}

function restartTimer() {
  clearTimer();
  if (!state.isReady || state.quotes.length < 2) {
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
  const minSize = Math.max(16, Math.min(24, window.innerWidth * 0.026) * scale);
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
    state.quotes = await loadQuotes();
    state.isReady = true;
    errorState.hidden = true;
    quoteStage.hidden = false;
    renderQuote(0, false);
    restartTimer();
    window.addEventListener("resize", handleResize);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(fitQuote);
    }
  } catch (error) {
    showError(error);
  }
}

start();
