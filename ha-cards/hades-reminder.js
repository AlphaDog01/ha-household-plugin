/**
 * Hades Reminder Card
 * Displays an active reminder for a household member.
 * Collapses to nothing when no reminder is active.
 */

const REMINDER_ACCENT_COLORS = {
  blue:   { hex: "#3B82F6", bg: "rgba(59,130,246,0.12)",  border: "rgba(59,130,246,0.35)"  },
  orange: { hex: "#F97316", bg: "rgba(249,115,22,0.12)",  border: "rgba(249,115,22,0.35)"  },
  pink:   { hex: "#EC4899", bg: "rgba(236,72,153,0.12)",  border: "rgba(236,72,153,0.35)"  },
  green:  { hex: "#22C55E", bg: "rgba(34,197,94,0.12)",   border: "rgba(34,197,94,0.35)"   },
  purple: { hex: "#A855F7", bg: "rgba(168,85,247,0.12)",  border: "rgba(168,85,247,0.35)"  },
  white:  { hex: "#E5E7EB", bg: "rgba(229,231,235,0.08)", border: "rgba(229,231,235,0.25)" },
};

const REMINDER_DEFAULT_SIZE = 14;

const REMINDER_STYLES = `
  :host { display: block; }

  .reminder-card {
    background: var(--accent-bg);
    border: 1px solid var(--accent-border);
    border-left: 4px solid var(--accent-hex);
    border-radius: 12px;
    padding: 12px 16px;
    display: flex;
    align-items: flex-start;
    gap: 10px;
    box-sizing: border-box;
    font-family: var(--primary-font-family, sans-serif);
  }

  .reminder-icon {
    font-size: var(--reminder-size);
    flex-shrink: 0;
    margin-top: 1px;
  }

  .reminder-label {
    font-size: calc(var(--reminder-size) * 0.85);
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--accent-hex);
    margin-bottom: 4px;
  }

  .reminder-text {
    font-size: var(--reminder-size);
    color: rgba(255,255,255,0.9);
    line-height: 1.4;
  }

  .hidden {
    display: none;
  }
`;

class HadesReminder extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
    this._hass   = null;
  }

  setConfig(config) {
    if (!config.entity) throw new Error("entity is required");
    this._config = config;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  getCardSize() { return 1; }

  _accent() {
    return REMINDER_ACCENT_COLORS[this._config.accent || "blue"] || REMINDER_ACCENT_COLORS.blue;
  }

  _fontSize() {
    return parseFloat(this._config.font_size ?? REMINDER_DEFAULT_SIZE);
  }

  _render() {
    if (!this._hass || !this._config) return;

    const stateObj = this._hass.states[this._config.entity];
    const text     = stateObj?.state || "";
    const accent   = this._accent();
    const size     = this._fontSize();

    // Collapse entirely when no reminder is active
    if (!text || text.trim() === "") {
      this.shadowRoot.innerHTML = `<style>:host{display:none}</style>`;
      return;
    }

    const cssVars = [
      `--accent-hex:${accent.hex}`,
      `--accent-bg:${accent.bg}`,
      `--accent-border:${accent.border}`,
      `--reminder-size:${size}px`,
    ].join(";");

    this.shadowRoot.innerHTML = `
      <style>${REMINDER_STYLES}</style>
      <div class="reminder-card" style="${cssVars}">
        <div class="reminder-icon">📌</div>
        <div>
          <div class="reminder-label">Reminder</div>
          <div class="reminder-text">${text}</div>
        </div>
      </div>
    `;
  }
}

// ── GUI Editor ────────────────────────────────────────────────────────────────

class HadesReminderEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
    this._hass   = null;
  }

  setConfig(config) { this._config = { ...config }; this._render(); }
  set hass(hass)    { this._hass = hass; this._render(); }

  _fire(config) {
    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config }, bubbles: true, composed: true,
    }));
  }

  _reminderEntities() {
    if (!this._hass) return [];
    return Object.keys(this._hass.states)
      .filter(id => id.includes("reminder"))
      .sort();
  }

  _entityOptions() {
    return this._reminderEntities().map(id =>
      `<option value="${id}" ${this._config.entity === id ? "selected" : ""}>${id}</option>`
    ).join("");
  }

  _accentSwatches() {
    return Object.entries(REMINDER_ACCENT_COLORS).map(([key, val]) => `
      <div class="swatch ${this._config.accent === key ? "active" : ""}"
           data-accent="${key}" title="${key}"
           style="background:${val.hex}"></div>
    `).join("");
  }

  _render() {
    if (!this._hass) return;
    const fontSize = this._config.font_size ?? REMINDER_DEFAULT_SIZE;

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; padding: 16px; }
        label { display: block; margin-bottom: 12px; font-size: 13px; color: #ccc; }
        select, input[type="text"] {
          display: block; width: 100%; margin-top: 4px;
          background: #1f2937; color: #fff;
          border: 1px solid rgba(255,255,255,0.15); border-radius: 8px;
          padding: 8px 10px; font-size: 13px; box-sizing: border-box;
        }
        .size-row { display: flex; align-items: center; gap: 10px; margin-top: 4px; }
        .size-row input[type="range"] { flex: 1; accent-color: #3B82F6; }
        .size-val { font-size: 13px; color: #fff; min-width: 36px; text-align: right; }
        .swatches { display: flex; gap: 8px; margin-top: 6px; flex-wrap: wrap; }
        .swatch {
          width: 28px; height: 28px; border-radius: 50%; cursor: pointer;
          border: 2px solid transparent; transition: border 0.15s;
        }
        .swatch.active { border: 2px solid #fff; }
        .section-title {
          font-size: 11px; letter-spacing: 2px; color: rgba(255,255,255,0.4);
          text-transform: uppercase; margin: 16px 0 8px;
        }
        hr { border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 16px 0; }
      </style>

      <label>Reminder Entity<br>
        <select data-key="entity">
          <option value="">-- select --</option>
          ${this._entityOptions()}
        </select>
      </label>

      <hr>
      <div class="section-title">Font Size</div>
      <label>Text Size
        <div class="size-row">
          <input type="range" data-key="font_size" min="10" max="24" step="1" value="${fontSize}">
          <span class="size-val" id="font-val">${fontSize}px</span>
        </div>
      </label>

      <hr>
      <div class="section-title">Accent Color</div>
      <div class="swatches">${this._accentSwatches()}</div>
    `;

    // Select / text inputs
    this.shadowRoot.querySelectorAll("select, input[type='text']").forEach(el => {
      el.addEventListener("change", () => {
        this._config = { ...this._config, [el.dataset.key]: el.value };
        this._fire(this._config);
      });
    });

    // Range slider
    this.shadowRoot.querySelectorAll("input[type='range']").forEach(el => {
      const valEl = this.shadowRoot.getElementById("font-val");
      el.addEventListener("input", () => {
        valEl.textContent = `${el.value}px`;
        this._config = { ...this._config, [el.dataset.key]: parseFloat(el.value) };
        this._fire(this._config);
      });
    });

    // Accent swatches
    this.shadowRoot.querySelectorAll(".swatch").forEach(el => {
      el.addEventListener("click", () => {
        this._config = { ...this._config, accent: el.dataset.accent };
        this._fire(this._config);
        this._render();
      });
    });
  }
}

// ── Register ──────────────────────────────────────────────────────────────────

customElements.define("hades-reminder", HadesReminder);
customElements.define("hades-reminder-editor", HadesReminderEditor);

HadesReminder.getConfigElement = () => document.createElement("hades-reminder-editor");
HadesReminder.getStubConfig = () => ({
  entity:    "",
  accent:    "blue",
  font_size: REMINDER_DEFAULT_SIZE,
});

window.customCards = window.customCards || [];
window.customCards.push({
  type:        "hades-reminder",
  name:        "Hades Reminder",
  description: "Displays an active parent reminder for a household member. Collapses when empty.",
  preview:     true,
});
