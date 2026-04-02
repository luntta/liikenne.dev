import { icons } from "../icons.js";
import { escapeHtml, domainBadgeClass, copyToClipboard } from "../utils.js";
import { t, demoT, domainLabel, partTitle } from "../i18n.js";
import { store } from "../store.js";
import { demoLiveRegistry } from "../demos/index.js";
import "./dt-code-block.js";

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
