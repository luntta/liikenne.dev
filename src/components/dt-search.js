import { escapeHtml } from "../utils.js";
import { t } from "../i18n.js";
import { store, filteredDemos } from "../store.js";

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
