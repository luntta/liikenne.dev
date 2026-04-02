import { demoLiveRegistry } from "./demo-registry.js";
import { staticDemos } from "./demo-data.js";
import { initLang, getLang, setLang, t, demoT, domainLabel, partTitle } from "./i18n.js";

// ── Lucide icon SVGs (inline, no CDN dependency) ──

const icons = {
  sun: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>',
  moon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>',
  arrowLeft: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>',
  arrowRight: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>',
  copy: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>',
  refreshCw: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>',
  circle: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none"><circle cx="12" cy="12" r="5"/></svg>',
  globe: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>',
};

// ── Utilities ──

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function domainBadgeClass(domain) {
  if (domain === "rail") return "badge-rail";
  if (domain === "road") return "badge-road";
  if (domain === "marine") return "badge-marine";
  return "badge-multi";
}

// ── State store ──

class Store extends EventTarget {
  constructor(initial) {
    super();
    this._state = initial;
  }

  get state() {
    return this._state;
  }

  set(updates) {
    const prev = { ...this._state };
    Object.assign(this._state, updates);
    this.dispatchEvent(
      new CustomEvent("change", { detail: { prev, state: this._state } }),
    );
  }
}

const store = new Store({
  demos: staticDemos,
  search: "",
  filter: "all",
  selectedId: null,
  previewCache: new Map(),
});

// ── Theme ──

function initialTheme() {
  const saved = window.localStorage.getItem("digitraffic-theme");
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  window.localStorage.setItem("digitraffic-theme", theme);
}

function toggleTheme() {
  const next =
    document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(next);
  document
    .querySelectorAll("dt-nav")
    .forEach((el) => el.updateThemeIcon());
}

// ── Language ──

function toggleLang() {
  setLang(getLang() === "fi" ? "en" : "fi");
  // Full re-render — language touches every string
  document.querySelectorAll("dt-app").forEach((el) => el.render());
}

// ── Route helpers ──

function selectedFromHash() {
  const match = window.location.hash.match(/demo-(\d+)/);
  return match ? Number(match[1]) : null;
}

// ── Syntax highlighting ──

function highlightJavaScript(code) {
  const placeholders = [];
  let raw = code;

  function alphaToken(index) {
    let value = index + 1;
    let token = "";
    while (value > 0) {
      value -= 1;
      token = String.fromCharCode(65 + (value % 26)) + token;
      value = Math.floor(value / 26);
    }
    return token;
  }

  function stash(regex, className) {
    raw = raw.replace(regex, (match) => {
      const token = `__TOKEN_${alphaToken(placeholders.length)}__`;
      placeholders.push({
        token,
        html: `<span class="${className}">${escapeHtml(match)}</span>`,
      });
      return token;
    });
  }

  stash(
    /'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`/g,
    "syntax-string",
  );
  stash(/\/\/[^\n]*/g, "syntax-comment");

  let html = escapeHtml(raw);
  html = html.replace(
    /\b\d+(?:\.\d+)?\b/g,
    '<span class="syntax-number">$&</span>',
  );
  html = html.replace(
    /\b(?:const|let|var|return|await|async|if|else|for|while|switch|case|break|continue|function|new|try|catch|throw|import|from|export|default|class|null|true|false)\b/g,
    '<span class="syntax-keyword">$&</span>',
  );
  html = html.replace(
    /\b(?:undefined)\b/g,
    '<span class="syntax-bool">$&</span>',
  );

  [...placeholders].reverse().forEach((item) => {
    html = html.replaceAll(item.token, item.html);
  });
  return html;
}

function highlightJson(code) {
  let raw = code;
  const placeholders = [];

  raw = raw.replace(/"(?:\\.|[^"\\])*"/g, (match) => {
    const token = `__JSON_${placeholders.length}__`;
    placeholders.push({
      token,
      html: `<span class="syntax-string">${escapeHtml(match)}</span>`,
    });
    return token;
  });

  let html = escapeHtml(raw);
  html = html.replace(
    /\b\d+(?:\.\d+)?\b/g,
    '<span class="syntax-number">$&</span>',
  );
  html = html.replace(
    /\b(?:true|false|null)\b/g,
    '<span class="syntax-bool">$&</span>',
  );
  placeholders.forEach((item) => {
    html = html.replaceAll(item.token, item.html);
  });
  return html;
}

function highlightHttp(code) {
  return escapeHtml(code)
    .replace(
      /^(GET|POST|PUT|PATCH|DELETE|OPTIONS)(\s+)/gm,
      '<span class="syntax-method">$1</span>$2',
    )
    .replace(/https:\/\/[^\s`]+/g, '<span class="syntax-path">$&</span>');
}

function highlightCode(code, language) {
  if (language === "json") return highlightJson(code);
  if (language === "http") return highlightHttp(code);
  return highlightJavaScript(code);
}

// ── Toast ──

function showToast(message) {
  const existing = document.querySelector(".copy-toast");
  existing?.remove();
  const toast = document.createElement("div");
  toast.className = "copy-toast";
  toast.textContent = message;
  document.body.append(toast);
  window.setTimeout(() => toast.remove(), 1800);
}

async function copyToClipboard(text) {
  await navigator.clipboard.writeText(text);
  showToast(t("toast.copied"));
}

// ── Filtered demos ──

function filteredDemos() {
  const { demos, search, filter } = store.state;
  const query = search.trim().toLowerCase();
  return demos.filter((demo) => {
    const domainMatch = filter === "all" || demo.domain === filter;
    if (!domainMatch) return false;
    if (!query) return true;
    // Search across both languages for demo content
    const title = demoT(demo.id, "title", demo.title);
    const desc = demoT(demo.id, "description", demo.description);
    return [title, desc, demo.title, demo.description, demo.whatUserSees, demo.apis.join(" ")]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });
}

// ══════════════════════════════════════════
// Web Components
// ══════════════════════════════════════════

// ── <dt-nav> ──

class DtNav extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  updateThemeIcon() {
    const btn = this.querySelector("[data-theme-toggle]");
    if (btn)
      btn.innerHTML =
        document.documentElement.dataset.theme === "dark"
          ? icons.sun
          : icons.moon;
  }

  render() {
    const isDark = document.documentElement.dataset.theme === "dark";
    this.innerHTML = `
      <header class="nav">
        <div class="nav-inner">
          <a class="brand" href="#">
            <span class="brand-mark">D</span>
            <span class="brand-copy">
              <span class="brand-title">${escapeHtml(t("brand.title"))}</span>
              <span class="brand-subtitle">${escapeHtml(t("brand.subtitle"))}</span>
            </span>
          </a>
          <div class="nav-actions">
            <button class="theme-toggle" type="button" data-lang-toggle aria-label="${escapeHtml(t("lang.switchLabel"))}" title="${escapeHtml(t("lang.switchLabel"))}">
              <span style="font-size:var(--text-sm);font-weight:600;letter-spacing:0.02em">${escapeHtml(t("lang.switch"))}</span>
            </button>
            <button class="theme-toggle" type="button" data-theme-toggle aria-label="Toggle theme">
              ${isDark ? icons.sun : icons.moon}
            </button>
          </div>
        </div>
      </header>
    `;

    this.querySelector("[data-theme-toggle]").addEventListener(
      "click",
      toggleTheme,
    );
    this.querySelector("[data-lang-toggle]").addEventListener(
      "click",
      toggleLang,
    );
  }
}

customElements.define("dt-nav", DtNav);

// ── <dt-search> ──
// Manages its own input so it doesn't lose focus on re-render

class DtSearch extends HTMLElement {
  connectedCallback() {
    this._count = filteredDemos().length;
    const filterKeys = ["all", "rail", "road", "marine", "multi"];
    this.innerHTML = `
      <section class="toolbar">
        <div class="search-row">
          <input
            class="input"
            type="search"
            value="${escapeHtml(store.state.search)}"
            placeholder="${escapeHtml(t("search.placeholder"))}"
          >
          <span class="micro" data-count>${t("search.shown", { count: this._count })}</span>
        </div>
        <div class="chips" role="radiogroup" aria-label="${escapeHtml(t("filter.all"))}">
          ${filterKeys
            .map((value) => {
              const label = t(`filter.${value}`);
              const active = store.state.filter === value;
              return `<button type="button" class="chip ${active ? "active" : ""}" data-filter="${value}" role="radio" aria-checked="${active}">${escapeHtml(label)}</button>`;
            })
            .join("")}
        </div>
      </section>
    `;

    this.querySelector(".input").addEventListener("input", (e) => {
      store.set({ search: e.target.value });
    });

    this.querySelectorAll("[data-filter]").forEach((btn) => {
      btn.addEventListener("click", () => {
        store.set({ filter: btn.dataset.filter });
      });
    });

    this._onChange = () => this._updateCount();
    store.addEventListener("change", this._onChange);
  }

  disconnectedCallback() {
    store.removeEventListener("change", this._onChange);
  }

  _updateCount() {
    const count = filteredDemos().length;
    if (count !== this._count) {
      this._count = count;
      const el = this.querySelector("[data-count]");
      if (el) el.textContent = t("search.shown", { count });
    }
    this.querySelectorAll("[data-filter]").forEach((btn) => {
      const active = btn.dataset.filter === store.state.filter;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-checked", String(active));
    });
  }
}

customElements.define("dt-search", DtSearch);

// ── <dt-card-grid> ──

class DtCardGrid extends HTMLElement {
  connectedCallback() {
    this._render();
    this._onChange = () => this._render();
    store.addEventListener("change", this._onChange);
  }

  disconnectedCallback() {
    store.removeEventListener("change", this._onChange);
  }

  _render() {
    const demos = filteredDemos();
    if (demos.length === 0) {
      this.innerHTML = `<div class="empty-state">${escapeHtml(t("empty"))}</div>`;
      return;
    }
    this.innerHTML = `
      <section class="card-grid">
        ${demos
          .map((demo) => {
            const title = demoT(demo.id, "title", demo.title);
            const desc = demoT(demo.id, "description", demo.whatUserSees || demo.description);
            return `
              <article class="card">
                <a class="card-link" href="#demo-${demo.id}">
                  <div class="card-head">
                    <span class="badge ${domainBadgeClass(demo.domain)}">${escapeHtml(domainLabel(demo.domain))}</span>
                    ${demo.protocols.map((p) => `<span class="badge badge-${p.toLowerCase()}">${p}</span>`).join("")}
                    <span class="badge badge-live">${icons.circle} ${escapeHtml(t("badge.live"))}</span>
                  </div>
                  <div>
                    <h2 class="card-title">${escapeHtml(title)}</h2>
                    <p class="card-description">${escapeHtml(desc)}</p>
                  </div>
                  <div class="endpoint-preview">${escapeHtml(demo.endpointPreview)}</div>
                  <div class="card-footer">
                    <span class="card-link-copy">${escapeHtml(t("card.viewDemo"))} ${icons.arrowRight}</span>
                    <span class="card-count">${escapeHtml(t("card.demo"))} ${demo.id}</span>
                  </div>
                </a>
              </article>
            `;
          })
          .join("")}
      </section>
    `;
  }
}

customElements.define("dt-card-grid", DtCardGrid);

// ── <dt-hero> ──

class DtHero extends HTMLElement {
  connectedCallback() {
    const demos = store.state.demos;
    const counts = demos.reduce(
      (acc, demo) => {
        acc[demo.domain] += 1;
        return acc;
      },
      { rail: 0, road: 0, marine: 0, multi: 0 },
    );
    this.innerHTML = `
      <section class="hero">
        <div class="hero-copy">
          <div class="eyebrow">
            <span class="badge badge-live">${icons.circle} ${escapeHtml(t("hero.eyebrow"))}</span>
            <span>${escapeHtml(t("hero.eyebrowSub"))}</span>
          </div>
          <h1>${escapeHtml(t("hero.title"))}</h1>
          <p>${escapeHtml(t("hero.description"))}</p>
        </div>
        <div class="hero-meta">
          <div class="hero-stat">
            <span class="hero-stat-label">${escapeHtml(t("hero.stat.count.label"))}</span>
            <span class="hero-stat-value">${demos.length}</span>
            <span class="hero-stat-note">${escapeHtml(t("hero.stat.count.note"))}</span>
          </div>
          <div class="hero-stat">
            <span class="hero-stat-label">${escapeHtml(t("hero.stat.mix.label"))}</span>
            <span class="hero-stat-value">${counts.rail} · ${counts.road} · ${counts.marine}</span>
            <span class="hero-stat-note">${escapeHtml(t("hero.stat.mix.note", { count: counts.multi }))}</span>
          </div>
          <div class="hero-stat">
            <span class="hero-stat-label">${escapeHtml(t("hero.stat.experience.label"))}</span>
            <span class="hero-stat-value">${escapeHtml(t("hero.stat.experience.value"))}</span>
            <span class="hero-stat-note">${escapeHtml(t("hero.stat.experience.note"))}</span>
          </div>
        </div>
      </section>
    `;
  }
}

customElements.define("dt-hero", DtHero);

// ── <dt-code-block> ──

class DtCodeBlock extends HTMLElement {
  connectedCallback() {
    const code = this.getAttribute("code") || "";
    const language = this.getAttribute("language") || "javascript";
    const label = this.getAttribute("copy-label") || t("copy");
    this.innerHTML = `
      <div class="code-shell">
        <button class="btn-secondary btn-tiny copy-button" type="button">${icons.copy} ${escapeHtml(label)}</button>
        <pre class="code-block"><code>${highlightCode(code, language)}</code></pre>
      </div>
    `;
    this.querySelector(".copy-button").addEventListener("click", () =>
      copyToClipboard(code),
    );
  }
}

customElements.define("dt-code-block", DtCodeBlock);

// ── <dt-detail> ──

class DtDetail extends HTMLElement {
  static get observedAttributes() {
    return ["demo-id"];
  }

  connectedCallback() {
    this._render();
  }

  attributeChangedCallback() {
    this._render();
  }

  _render() {
    const id = Number(this.getAttribute("demo-id"));
    const demo = store.state.demos.find((d) => d.id === id);
    if (!demo) {
      this.innerHTML = `<div class="empty-state">${escapeHtml(t("error.notFound"))}</div>`;
      return;
    }

    const title = demoT(demo.id, "title", demo.title);
    const desc = demoT(demo.id, "description", demo.whatUserSees || demo.description);
    const pt = partTitle(demo.domain);

    this.innerHTML = `
      <div class="detail-layout">
        <a class="back-link" href="#">${icons.arrowLeft} ${escapeHtml(t("detail.back"))}</a>
        <header class="detail-header">
          <div class="detail-badges">
            <span class="badge ${domainBadgeClass(demo.domain)}">${escapeHtml(domainLabel(demo.domain))}</span>
            ${demo.protocols.map((p) => `<span class="badge badge-${p.toLowerCase()}">${p}</span>`).join("")}
            <span class="badge badge-live">${icons.circle} ${escapeHtml(t("badge.livePreview"))}</span>
          </div>
          <h1 class="detail-title">${escapeHtml(title)}</h1>
          <p class="detail-description">${escapeHtml(desc)}</p>
          <div class="detail-meta">
            <span>${escapeHtml(t("card.demo"))} ${demo.id}</span>
            <span>·</span>
            <span>${escapeHtml(pt)}</span>
          </div>
          <div class="detail-toolbar">
            <button class="btn-secondary" type="button" data-reload-preview>${icons.refreshCw} ${escapeHtml(t("detail.reload"))}</button>
            <button class="btn-secondary" type="button" data-copy-source>${icons.copy} ${escapeHtml(t("detail.copySource"))}</button>
          </div>
        </header>

        <section class="panel-card">
          <div class="tabs" role="tablist" aria-label="${escapeHtml(t("tab.preview"))}">
            <button class="tab active" type="button" data-tab="preview" role="tab" aria-selected="true">${escapeHtml(t("tab.preview"))}</button>
            <button class="tab" type="button" data-tab="code" role="tab" aria-selected="false">${escapeHtml(t("tab.code"))}</button>
            <button class="tab" type="button" data-tab="api" role="tab" aria-selected="false">${escapeHtml(t("tab.api"))}</button>
          </div>
          <div class="tab-panels panel-body">
            <section class="tab-panel active" data-panel="preview" role="tabpanel">
              <div class="panel-header">
                <div>
                  <h2 class="panel-title">${escapeHtml(t("preview.title"))}</h2>
                  <p class="panel-subtitle">${escapeHtml(t("preview.subtitle"))}</p>
                </div>
              </div>
              <div class="panel-body" data-preview-body>
                <div class="loader"></div>
              </div>
            </section>

            <section class="tab-panel" data-panel="code" role="tabpanel">
              <div class="panel-header">
                <div>
                  <h2 class="panel-title">${escapeHtml(t("code.title"))}</h2>
                  <p class="panel-subtitle">${escapeHtml(t("code.subtitle"))}</p>
                </div>
              </div>
              <div class="panel-body">
                <dt-code-block code="${escapeHtml(demo.code)}" language="${escapeHtml(demo.language)}"></dt-code-block>
              </div>
            </section>

            <section class="tab-panel" data-panel="api" role="tabpanel">
              <div class="panel-header">
                <div>
                  <h2 class="panel-title">${escapeHtml(t("api.title"))}</h2>
                  <p class="panel-subtitle">${escapeHtml(t("api.subtitle"))}</p>
                </div>
              </div>
              <div class="panel-body" data-api-body>
                <div class="loader"></div>
              </div>
            </section>
          </div>
        </section>
      </div>
    `;

    this._setupTabs();
    this._setupToolbar(demo);
    void this._loadPreview(demo, false);
  }

  _setupTabs() {
    this.querySelectorAll("[data-tab]").forEach((tab) => {
      tab.addEventListener("click", () => {
        const target = tab.dataset.tab;
        this.querySelectorAll("[data-tab]").forEach((t) => {
          const active = t === tab;
          t.classList.toggle("active", active);
          t.setAttribute("aria-selected", String(active));
        });
        this.querySelectorAll("[data-panel]").forEach((panel) => {
          panel.classList.toggle(
            "active",
            panel.dataset.panel === target,
          );
        });
      });
    });
  }

  _setupToolbar(demo) {
    this.querySelector("[data-copy-source]")?.addEventListener("click", () =>
      copyToClipboard(demo.code),
    );
    this.querySelector("[data-reload-preview]")?.addEventListener(
      "click",
      () => {
        store.state.previewCache.delete(demo.id);
        void this._loadPreview(demo, true);
      },
    );
  }

  async _loadPreview(demo, force) {
    const previewEl = this.querySelector("[data-preview-body]");
    const apiEl = this.querySelector("[data-api-body]");
    if (!previewEl || !apiEl) return;

    previewEl.innerHTML = '<div class="loader"></div>';
    apiEl.innerHTML = '<div class="loader"></div>';

    try {
      let payload = store.state.previewCache.get(demo.id);
      if (!payload || force) {
        const loader = demoLiveRegistry[demo.id];
        if (!loader) throw new Error(t("error.noPreview"));
        payload = await loader();
        store.state.previewCache.set(demo.id, payload);
      }

      previewEl.innerHTML = `
        ${payload.note ? `<div class="note-box"><strong>${escapeHtml(t("note.title"))}</strong><div class="caption">${escapeHtml(payload.note)}</div></div>` : ""}
        ${payload.subtitle ? `<p class="copy-body">${escapeHtml(payload.subtitle)}</p>` : ""}
        ${payload.previewHtml}
      `;
      apiEl.innerHTML = this._renderApiSections(payload);

      this._bindCopyButtons(previewEl);
      this._bindCopyButtons(apiEl);

      payload.enhance?.(previewEl);

      previewEl
        .querySelectorAll("dt-map")
        .forEach((map) => map.init?.());
    } catch (error) {
      const msg = t("error.previewFailed", { message: error.message });
      previewEl.innerHTML = `<div class="error-box">${escapeHtml(msg)}</div>`;
      apiEl.innerHTML = `<div class="error-box">${escapeHtml(msg)}</div>`;
    }
  }

  _bindCopyButtons(container) {
    container.querySelectorAll("[data-copy-text]").forEach((btn) => {
      btn.addEventListener("click", () =>
        copyToClipboard(btn.dataset.copyText),
      );
    });
  }

  _renderApiSections(payload) {
    return `
      <div class="api-grid">
        ${payload.apiSections
          .map((section) => {
            const blocks = [];
            if (section.body) {
              blocks.push(
                `<dt-code-block code="${escapeHtml(section.body)}" language="javascript" copy-label="${escapeHtml(t("copyQuery"))}"></dt-code-block>`,
              );
            }
            blocks.push(
              `<dt-code-block code="${escapeHtml(JSON.stringify(section.sample, null, 2))}" language="json"></dt-code-block>`,
            );
            return `
              <article class="api-card">
                <div class="api-request-head">
                  <span class="badge badge-${section.method.toLowerCase() === "post" ? "post" : "get"}">${escapeHtml(section.method)}</span>
                  <span class="mono-chip">${escapeHtml(section.endpoint)}</span>
                </div>
                <h4>${escapeHtml(section.title)}</h4>
                ${blocks.join("")}
              </article>
            `;
          })
          .join("")}
      </div>
    `;
  }
}

customElements.define("dt-detail", DtDetail);

// ── <dt-map> ──
// Leaflet map web component. Expects a JSON config via data-config attribute.

class DtMap extends HTMLElement {
  connectedCallback() {
    this.init();
  }

  init() {
    if (this._initialized) return;
    const configAttr = this.getAttribute("data-config");
    if (!configAttr) return;

    let config;
    try {
      config = JSON.parse(configAttr);
    } catch {
      return;
    }

    this._initialized = true;
    const { bounds, points = [], lines = [], polygons = [], legend = [] } = config;

    this.innerHTML = `
      <div class="map-shell">
        <div class="map-frame">
          <div data-map-container></div>
        </div>
        ${
          legend.length
            ? `
          <div class="map-legend">
            ${legend
              .map(
                (item) => `
              <span class="legend-item">
                <span class="legend-swatch" style="background:${this._resolveColor(item.color)}"></span>
                ${escapeHtml(item.label)}
              </span>
            `,
              )
              .join("")}
          </div>
        `
            : ""
        }
      </div>
    `;

    const container = this.querySelector("[data-map-container]");
    if (!container || typeof L === "undefined") return;

    const map = L.map(container, {
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: false,
    });

    const isDark = document.documentElement.dataset.theme === "dark";
    const tileUrl = isDark
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

    L.tileLayer(tileUrl, {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(map);

    const leafletBounds = L.latLngBounds(
      [bounds.minLat, bounds.minLon],
      [bounds.maxLat, bounds.maxLon],
    );
    map.fitBounds(leafletBounds, { padding: [20, 20] });

    for (const point of points) {
      const color = this._resolveColor(point.color);
      L.circleMarker([point.lat, point.lon], {
        radius: point.radius || 4,
        fillColor: color,
        fillOpacity: point.opacity ?? 0.85,
        color: color,
        weight: 1,
        opacity: 0.6,
      })
        .bindTooltip(point.title || point.label || "", {
          direction: "top",
          offset: [0, -6],
        })
        .addTo(map);
    }

    for (const line of lines) {
      const coords = line.coordinates.map(([lon, lat]) => [lat, lon]);
      L.polyline(coords, {
        color: this._resolveColor(line.color || "var(--accent-solid)"),
        weight: line.width || 2,
        opacity: 0.7,
        dashArray: line.dasharray || null,
      }).addTo(map);
    }

    for (const polygon of polygons) {
      const coords = polygon.coordinates.map(([lon, lat]) => [lat, lon]);
      L.polygon(coords, {
        color: this._resolveColor(polygon.color || "var(--accent-solid)"),
        fillColor: this._resolveColor(polygon.fill || "transparent"),
        weight: polygon.width || 1.5,
        fillOpacity: 0.3,
      }).addTo(map);
    }

    this._map = map;
    this._observer = new MutationObserver(() => this._updateTiles());
    this._observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
  }

  disconnectedCallback() {
    this._observer?.disconnect();
    this._map?.remove();
  }

  _updateTiles() {
    if (!this._map) return;
    this._map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) this._map.removeLayer(layer);
    });
    const isDark = document.documentElement.dataset.theme === "dark";
    const url = isDark
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
    L.tileLayer(url, {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(this._map);
  }

  _resolveColor(value) {
    if (!value || !value.startsWith("var(")) return value;
    const prop = value.match(/var\((--[^)]+)\)/)?.[1];
    if (!prop) return value;
    return (
      getComputedStyle(document.documentElement)
        .getPropertyValue(prop)
        .trim() || value
    );
  }
}

customElements.define("dt-map", DtMap);

// ── <dt-app> ──

class DtApp extends HTMLElement {
  connectedCallback() {
    this.render();

    store.addEventListener("change", (e) => {
      const { prev, state } = e.detail;
      if (prev.selectedId !== state.selectedId) {
        this.render();
      }
    });

    window.addEventListener("hashchange", () => {
      store.set({ selectedId: selectedFromHash() });
    });
  }

  render() {
    const { selectedId, demos } = store.state;
    const demo = demos.find((d) => d.id === selectedId);

    this.innerHTML = `
      <div class="app-shell">
        <dt-nav></dt-nav>
        <main class="main">
          <div class="container">
            ${
              demo
                ? `<dt-detail demo-id="${demo.id}"></dt-detail>`
                : `<dt-hero></dt-hero><dt-search></dt-search><dt-card-grid></dt-card-grid>`
            }
          </div>
        </main>
        <footer class="footer">
          <div class="footer-inner">
            <span>${escapeHtml(t("footer.license"))}</span>
            <span>
              <a href="./demos.md">${escapeHtml(t("footer.brief"))}</a>
              ·
              <a href="./style.md">style.md</a>
              ·
              <a href="https://www.digitraffic.fi/en/">${escapeHtml(t("footer.docs"))}</a>
            </span>
          </div>
        </footer>
      </div>
    `;
  }
}

customElements.define("dt-app", DtApp);

// ── Init ──

initLang();
applyTheme(initialTheme());
store.set({ selectedId: selectedFromHash() });
