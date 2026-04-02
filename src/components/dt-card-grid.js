import { icons } from "../icons.js";
import { escapeHtml, domainBadgeClass } from "../utils.js";
import { t, demoT, domainLabel } from "../i18n.js";
import { store, filteredDemos } from "../store.js";

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
