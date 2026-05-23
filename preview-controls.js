function loadPreviewStylesheet() {
  if (document.querySelector('link[data-preview-controls="true"]')) {
    return;
  }

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "preview-controls.css?v=20260523-light-mode";
  link.dataset.previewControls = "true";
  document.head.appendChild(link);
}

function createPreviewControls() {
  const template = document.createElement("template");
  template.innerHTML = `
    <button class="preview-toggle" id="previewToggle" type="button" aria-label="Preview visual settings" title="Preview visual settings">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3v18"></path>
        <path d="M6 8h12"></path>
        <path d="M8 16h8"></path>
        <path d="M6 8a2 2 0 1 0 0 .1"></path>
        <path d="M16 16a2 2 0 1 0 0 .1"></path>
      </svg>
    </button>
    <section class="preview-panel" id="previewPanel" aria-labelledby="previewTitle" role="dialog" hidden>
      <div class="preview-card">
        <header class="preview-header">
          <div>
            <h2 id="previewTitle">Preview Settings</h2>
            <p>GitHub Pages only</p>
          </div>
          <button class="preview-close" id="previewClose" type="button" aria-label="Close preview settings" title="Close preview settings">
            <span></span>
            <span></span>
          </button>
        </header>
        <div class="preview-controls">
          <label>
            <span>Interval</span>
            <input data-preview-setting="intervalSeconds" type="range" min="5" max="60" step="1">
          </label>
          <label>
            <span>Text scale</span>
            <input data-preview-setting="textScale" type="range" min="70" max="140" step="1">
          </label>
          <label>
            <span>Text opacity</span>
            <input data-preview-setting="textOpacity" type="range" min="45" max="100" step="1">
          </label>
          <label>
            <span>Theme</span>
            <select data-preview-setting="themeMode">
              <option value="0">Dark</option>
              <option value="1">Light</option>
              <option value="2">Match System</option>
            </select>
          </label>
          <label>
            <span>Motion</span>
            <input data-preview-setting="backgroundMotion" type="range" min="0" max="140" step="1">
          </label>
          <label>
            <span>Palette</span>
            <select data-preview-setting="paletteMode">
              <option value="0">Calm Spectrum</option>
              <option value="1">Graphite</option>
              <option value="2">Deep Teal</option>
              <option value="3">Cool Violet</option>
              <option value="4">Smoky Emerald</option>
            </select>
          </label>
          <label>
            <span>Palette strength</span>
            <input data-preview-setting="paletteIntensity" type="range" min="20" max="140" step="1">
          </label>
          <label>
            <span>Brightness</span>
            <input data-preview-setting="backgroundBrightness" type="range" min="5" max="70" step="1">
          </label>
          <label>
            <span>Particles</span>
            <input data-preview-setting="particleDensity" type="range" min="0" max="100" step="1">
          </label>
          <label>
            <span>Particle glow</span>
            <input data-preview-setting="particleGlow" type="range" min="0" max="100" step="1">
          </label>
          <div class="preview-switches">
            <label>
              <input data-preview-setting="showMetadata" type="checkbox">
              <span>Metadata</span>
            </label>
            <label>
              <input data-preview-setting="enableAnimation" type="checkbox">
              <span>Animation</span>
            </label>
          </div>
        </div>
      </div>
    </section>
  `;

  const root = document.querySelector(".wallpaper");
  if (!root) {
    return null;
  }

  root.appendChild(template.content.cloneNode(true));
  return {
    panel: document.getElementById("previewPanel"),
    toggle: document.getElementById("previewToggle"),
    close: document.getElementById("previewClose")
  };
}

window.bdAlwaysPrayerInitPreviewControls = function initPreviewControls({ applySetting, getSetting }) {
  loadPreviewStylesheet();

  const controls = createPreviewControls();
  if (!controls || !controls.panel || !controls.toggle || !controls.close) {
    return function syncPreviewControlsUnavailable() {};
  }

  function syncPreviewControls() {
    controls.panel.querySelectorAll("[data-preview-setting]").forEach((control) => {
      const value = getSetting(control.dataset.previewSetting);
      if (control.type === "checkbox") {
        control.checked = Boolean(value);
      } else {
        control.value = String(value);
      }
    });
  }

  controls.toggle.addEventListener("click", () => {
    controls.panel.hidden = !controls.panel.hidden;
    document.body.classList.toggle("preview-open", !controls.panel.hidden);
    syncPreviewControls();
  });

  controls.close.addEventListener("click", () => {
    controls.panel.hidden = true;
    document.body.classList.remove("preview-open");
    controls.toggle.focus({ preventScroll: true });
  });

  controls.panel.addEventListener("input", (event) => {
    const control = event.target;
    if (!(control instanceof HTMLInputElement || control instanceof HTMLSelectElement) || !control.dataset.previewSetting) {
      return;
    }
    if (control.type !== "range") {
      return;
    }

    applySetting(control.dataset.previewSetting, control.value);
  });

  controls.panel.addEventListener("change", (event) => {
    const control = event.target;
    if (!(control instanceof HTMLInputElement || control instanceof HTMLSelectElement) || !control.dataset.previewSetting) {
      return;
    }

    applySetting(control.dataset.previewSetting, control.type === "checkbox" ? control.checked : control.value);
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !controls.panel.hidden) {
      controls.panel.hidden = true;
      document.body.classList.remove("preview-open");
      controls.toggle.focus({ preventScroll: true });
    }
  });

  syncPreviewControls();
  return syncPreviewControls;
};
