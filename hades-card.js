/**
 * Hades Card — Custom Lovelace Card
 * Matches the Hades Household dark dashboard aesthetic.
 * Card types: person | summary | leaderboard | calendar | stat
 */

// ── Shared styles ─────────────────────────────────────────────────────────────

const ACCENT_COLORS = {
  blue:   { hex: "#3B82F6", bg: "#1e3a5f", label: "Blue"   },
  orange: { hex: "#F97316", bg: "#3d1f00", label: "Orange" },
  pink:   { hex: "#EC4899", bg: "#3d0020", label: "Pink"   },
  green:  { hex: "#22C55E", bg: "#0d2e1a", label: "Green"  },
  purple: { hex: "#A855F7", bg: "#2d1a4a", label: "Purple" },
  white:  { hex: "#E5E7EB", bg: "#1f2937", label: "White"  },
};

const CARD_TYPES = {
  person:      "Person Chores",
  summary:     "Summary Bar",
  leaderboard: "Leaderboard",
  calendar:    "Calendar Events",
  stat:        "Generic Stat",
};

const BASE_STYLES = `
  :host { display: block; }
  .hades-card {
    background: #111827;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 20px;
    padding: 16px;
    font-family: var(--primary-font-family, sans-serif);
    color: #fff;
    box-sizing: border-box;
  }
  .hades-card.summary {
    border-radius: 16px;
    padding: 20px;
  }
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .col { display: flex; flex-direction: column; }
  .label {
    font-size: 11px;
    letter-spacing: 2px;
    font-weight: 600;
    margin-bottom: 8px;
    text-transform: uppercase;
  }
  .big-num {
    font-size: 52px;
    font-weight: 700;
    line-height: 1;
  }
  .sub {
    font-size: 13px;
    color: rgba(255,255,255,0.4);
    margin-top: 6px;
  }
  .avatar {
    width: 44px; height: 44px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 18px; flex-shrink: 0;
  }
  .person-name {
    font-size: 20px; font-weight: 700; color: #fff;
  }
  .pts {
    font-size: 13px; margin-top: 2px;
  }
  .chore-row {
    display: flex; justify-content: space-between;
    padding: 6px 0;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    align-items: center;
  }
  .chore-name { font-size: 13px; }
  .chore-pts  { font-size: 12px; }
  .done-name  { text-decoration: line-through; color: #4CAF50; opacity: 0.8; }
  .done-pts   { color: #4CAF50; }
  .pend-name  { color: rgba(255,255,255,0.85); }
  .pend-pts   { color: rgba(255,255,255,0.4); }
  .no-chores  { color: rgba(255,255,255,0.3); font-size: 13px; padding: 8px 0; }
  .progress-track {
    background: rgba(255,255,255,0.1);
    border-radius: 4px; height: 6px; margin-top: 12px;
  }
  .progress-fill { height: 6px; border-radius: 4px; }
  .progress-label { font-size: 11px; color: rgba(255,255,255,0.3); margin-top: 4px; }
  .badge {
    font-size: 12px; color: #4CAF50;
    background: rgba(76,175,80,0.15);
    border-radius: 20px; padding: 2px 10px;
    margin-left: 8px;
  }
  .lb-title { font-size: 16px; font-weight: 700; color: #fff; margin-bottom: 12px; }
  .lb-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .lb-left { display: flex; align-items: center; gap: 12px; }
  .lb-medal { font-size: 20px; width: 28px; }
  .lb-avatar {
    width: 32px; height: 32px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 13px;
  }
  .lb-name { font-size: 15px; font-weight: 600; color: #fff; }
  .lb-pts  { font-size: 15px; font-weight: 700; }
  .cal-title-bar { font-size: 16px; font-weight: 700; color: #fff; margin-bottom: 12px; }
  .cal-row {
    display: flex; align-items: flex-start; justify-content: space-between;
    padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.06);
    gap: 8px;
  }
  .cal-time { font-size: 12px; color: rgba(255,255,255,0.4); white-space: nowrap; flex-shrink: 0; margin-top: 2px; }
  .cal-event-name { font-size: 14px; color: rgba(255,255,255,0.9); flex: 1; }
  .cal-loc { font-size: 11px; color: rgba(255,255,255,0.35); margin-top: 2px; }
  .cal-allday {
    font-size: 11px; padding: 1px 8px; border-radius: 20px;
    font-weight: 600; flex-shrink: 0; margin-top: 2px;
  }
  .no-events { color: rgba(255,255,255,0.3); font-size: 13px; padding: 8px 0; }
  .stat-val { font-size: 42px; font-weight: 700; line-height: 1; }
  .stat-name { font-size: 13px; color: rgba(255,255,255,0.5); margin-top: 6px; }
  .stat-unit { font-size: 18px; font-weight: 400; margin-left: 4px; }
`;


// ── Main Card Element ─────────────────────────────────────────────────────────

class HadesCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
    this._hass = null;
  }

  setConfig(config) {
    if (!config.card_type) throw new Error("card_type is required");
    this._config = config;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  getCardSize() { return 3; }

  _accent() {
    const key = this._config.accent || "blue";
    return ACCENT_COLORS[key] || ACCENT_COLORS.blue;
  }

  _state(entity_id) {
    return this._hass?.states?.[entity_id];
  }

  _attr(entity_id) {
    return this._state(entity_id)?.attributes || {};
  }

  _render() {
    if (!this._hass || !this._config) return;
    const type = this._config.card_type;
    let inner = "";
    let cardClass = "hades-card";

    switch (type) {
      case "person":      inner = this._renderPerson();      break;
      case "summary":     inner = this._renderSummary();     cardClass += " summary"; break;
      case "leaderboard": inner = this._renderLeaderboard(); break;
      case "calendar":    inner = this._renderCalendar();    break;
      case "stat":        inner = this._renderStat();        break;
      default:            inner = `<div class="no-chores">Unknown card type: ${type}</div>`;
    }

    this.shadowRoot.innerHTML = `
      <style>${BASE_STYLES}</style>
      <div class="${cardClass}">${inner}</div>
    `;
  }

  // ── Person Card ─────────────────────────────────────────────────────────────

  _renderPerson() {
    const entity    = this._config.entity || "";
    const rateEnt   = this._config.rate_entity || "";
    const accent    = this._accent();
    const name      = this._config.display_name || "Person";
    const initials  = this._config.initials || name[0];

    const attr      = this._attr(entity);
    const rateState = parseFloat(this._state(rateEnt)?.state || 0);
    const pts       = this._attr(rateEnt)?.points_total || 0;
    const done      = Array.isArray(attr.completed) ? attr.completed : [];
    const pending   = Array.isArray(attr.pending)   ? attr.pending   : [];
    const total     = attr.total_chores || (done.length + pending.length);
    const barPct    = total > 0 ? Math.round((done.length / total) * 100) : 0;
    const allDone   = rateState === 100;

    let choresHtml = "";
    done.forEach(c => {
      choresHtml += `
        <div class="chore-row">
          <span class="chore-name done-name">${c.name}</span>
          <span class="chore-pts done-pts">+${c.points}</span>
        </div>`;
    });
    pending.forEach(c => {
      choresHtml += `
        <div class="chore-row">
          <span class="chore-name pend-name">${c.name}</span>
          <span class="chore-pts pend-pts">+${c.points}</span>
        </div>`;
    });
    if (!choresHtml) choresHtml = `<div class="no-chores">No chores today</div>`;

    const badge = allDone ? `<span class="badge">✓ All done!</span>` : "";

    return `
      <div class="row" style="margin-bottom:12px;justify-content:flex-start;gap:12px">
        <div class="avatar" style="background:${accent.bg};color:${accent.hex}">${initials}</div>
        <div>
          <div class="person-name">${name} ${badge}</div>
          <div class="pts" style="color:${accent.hex}">★ ${pts} pts</div>
        </div>
      </div>
      ${choresHtml}
      <div class="progress-track">
        <div class="progress-fill" style="background:${accent.hex};width:${barPct}%"></div>
      </div>
      <div class="progress-label">${done.length}/${total}</div>
    `;
  }

  // ── Summary Card ────────────────────────────────────────────────────────────

  _renderSummary() {
    const entity  = this._config.entity || "";
    const accent  = this._accent();
    const field   = this._config.summary_field || "total";
    const label   = this._config.label || field.toUpperCase();
    const sub     = this._config.sublabel || "";
    const attr    = this._attr(entity);
    const val     = attr[field] ?? this._state(entity)?.state ?? "—";

    return `
      <div class="label" style="color:${accent.hex}">${label}</div>
      <div class="big-num" style="color:${accent.hex}">${val}</div>
      <div class="sub">${sub || `${val} total`}</div>
    `;
  }

  // ── Leaderboard Card ────────────────────────────────────────────────────────

  _renderLeaderboard() {
    const entity   = this._config.entity || "";
    const rankings = this._attr(entity)?.rankings || [];
    const medals   = ["🥇", "🥈", "🥉"];

    if (!rankings.length) return `<div class="no-events">No leaderboard data</div>`;

    const COLORS = {
      Caleb: "#3B82F6", Cameron: "#F97316", Courtney: "#EC4899",
      Dad: "#22C55E", Mom: "#A855F7",
    };

    let rows = `<div class="lb-title">Points Leaderboard</div>`;
    rankings.forEach((p, i) => {
      const color  = COLORS[p.name] || this._accent().hex;
      const medal  = medals[i] || `${i + 1}.`;
      rows += `
        <div class="lb-row">
          <div class="lb-left">
            <span class="lb-medal">${medal}</span>
            <div class="lb-avatar" style="background:${color}22;color:${color}">${p.name[0]}</div>
            <span class="lb-name">${p.name}</span>
          </div>
          <span class="lb-pts" style="color:${color}">${p.points} pts</span>
        </div>`;
    });
    return rows;
  }

  // ── Calendar Card ───────────────────────────────────────────────────────────

  _renderCalendar() {
    const entity  = this._config.entity || "";
    const accent  = this._accent();
    const title   = this._config.display_name || "Today's Events";
    const events  = this._attr(entity)?.events || [];

    let rows = `<div class="cal-title-bar">${title}</div>`;
    if (!events.length) {
      rows += `<div class="no-events">No events today</div>`;
    } else {
      events.forEach(e => {
        const timeHtml = e.all_day
          ? `<span class="cal-allday" style="background:${accent.hex}22;color:${accent.hex}">All Day</span>`
          : `<span class="cal-time">${e.start}${e.end ? " – " + e.end : ""}</span>`;
        rows += `
          <div class="cal-row">
            ${timeHtml}
            <div class="col" style="flex:1">
              <span class="cal-event-name">${e.title}</span>
              ${e.location ? `<span class="cal-loc">📍 ${e.location}</span>` : ""}
            </div>
          </div>`;
      });
    }
    return rows;
  }

  // ── Stat Card ───────────────────────────────────────────────────────────────

  _renderStat() {
    const entity  = this._config.entity || "";
    const accent  = this._accent();
    const label   = this._config.label || "";
    const unit    = this._config.unit || "";
    const stateObj = this._state(entity);
    const val     = stateObj?.state ?? "—";
    const friendly = stateObj?.attributes?.friendly_name || entity;

    return `
      <div class="label" style="color:${accent.hex}">${label || friendly}</div>
      <div class="stat-val" style="color:${accent.hex}">${val}<span class="stat-unit">${unit}</span></div>
      <div class="stat-name">${this._config.sublabel || ""}</div>
    `;
  }
}


// ── GUI Editor ────────────────────────────────────────────────────────────────

class HadesCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
    this._hass = null;
  }

  setConfig(config) {
    this._config = { ...config };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _fire(config) {
    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config },
      bubbles: true,
      composed: true,
    }));
  }

  _hadesEntities(filter) {
    if (!this._hass) return [];
    return Object.keys(this._hass.states)
      .filter(id => id.startsWith("sensor.hades") || id.startsWith("calendar.hades"))
      .filter(id => filter ? id.includes(filter) : true)
      .sort();
  }

  _entityOptions(filter) {
    return this._hadesEntities(filter).map(id =>
      `<option value="${id}" ${this._config.entity === id ? "selected" : ""}>${id}</option>`
    ).join("");
  }

  _rateOptions() {
    return this._hadesEntities("completion_rate").map(id =>
      `<option value="${id}" ${this._config.rate_entity === id ? "selected" : ""}>${id}</option>`
    ).join("");
  }

  _accentSwatches() {
    return Object.entries(ACCENT_COLORS).map(([key, val]) => `
      <div class="swatch ${this._config.accent === key ? "active" : ""}"
           data-accent="${key}"
           title="${val.label}"
           style="background:${val.hex}"></div>
    `).join("");
  }

  _typeOptions() {
    return Object.entries(CARD_TYPES).map(([key, label]) =>
      `<option value="${key}" ${this._config.card_type === key ? "selected" : ""}>${label}</option>`
    ).join("");
  }

  _extraFields() {
    const t = this._config.card_type;
    if (t === "person") {
      return `
        <label>Rate Entity (completion %)<br>
          <select data-key="rate_entity">
            <option value="">-- select --</option>
            ${this._rateOptions()}
          </select>
        </label>
        <label>Display Name<br>
          <input type="text" data-key="display_name" value="${this._config.display_name || ""}">
        </label>
        <label>Initials (avatar)<br>
          <input type="text" data-key="initials" value="${this._config.initials || ""}">
        </label>
      `;
    }
    if (t === "summary") {
      return `
        <label>Summary Field (e.g. total, pending, completed)<br>
          <input type="text" data-key="summary_field" value="${this._config.summary_field || "total"}">
        </label>
        <label>Label<br>
          <input type="text" data-key="label" value="${this._config.label || ""}">
        </label>
        <label>Sub-label<br>
          <input type="text" data-key="sublabel" value="${this._config.sublabel || ""}">
        </label>
      `;
    }
    if (t === "calendar") {
      return `
        <label>Display Name<br>
          <input type="text" data-key="display_name" value="${this._config.display_name || "Today's Events"}">
        </label>
      `;
    }
    if (t === "stat") {
      return `
        <label>Label<br>
          <input type="text" data-key="label" value="${this._config.label || ""}">
        </label>
        <label>Sub-label<br>
          <input type="text" data-key="sublabel" value="${this._config.sublabel || ""}">
        </label>
        <label>Unit<br>
          <input type="text" data-key="unit" value="${this._config.unit || ""}">
        </label>
      `;
    }
    return "";
  }

  _entityFilter() {
    const t = this._config.card_type;
    if (t === "person")      return "chores_today";
    if (t === "calendar")    return "calendar";
    if (t === "leaderboard") return "leaderboard";
    if (t === "summary")     return "summary";
    return "";
  }

  _render() {
    if (!this._hass) return;

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

      <label>Card Type<br>
        <select data-key="card_type">${this._typeOptions()}</select>
      </label>

      <label>Entity<br>
        <select data-key="entity">
          <option value="">-- select --</option>
          ${this._entityOptions(this._entityFilter())}
        </select>
      </label>

      ${this._extraFields()}

      <hr>
      <div class="section-title">Accent Color</div>
      <div class="swatches">${this._accentSwatches()}</div>
    `;

    // ── Event listeners ───────────────────────────────────────────────────────

    this.shadowRoot.querySelectorAll("select, input").forEach(el => {
      el.addEventListener("change", () => {
        const key = el.dataset.key;
        if (!key) return;
        this._config = { ...this._config, [key]: el.value };
        this._fire(this._config);
        // Re-render to show/hide extra fields when card_type changes
        if (key === "card_type") this._render();
      });
    });

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

customElements.define("hades-card", HadesCard);
customElements.define("hades-card-editor", HadesCardEditor);

HadesCard.getConfigElement = () => document.createElement("hades-card-editor");
HadesCard.getStubConfig = () => ({
  card_type: "person",
  entity: "",
  accent: "blue",
});

window.customCards = window.customCards || [];
window.customCards.push({
  type: "hades-card",
  name: "Hades Card",
  description: "Household chores, calendars, leaderboard, and stats in one card.",
  preview: true,
});
