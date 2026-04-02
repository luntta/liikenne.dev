import { escapeHtml } from "../utils.js";
import { t } from "../i18n.js";
import { store } from "../store.js";
import { selectedFromHash } from "../router.js";
import "./dt-nav.js";
import "./dt-hero.js";
import "./dt-search.js";
import "./dt-card-grid.js";
import "./dt-detail.js";
import "./dt-map.js";

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
              <a href="./docs/demos.md">${escapeHtml(t("footer.brief"))}</a>
              ·
              <a href="./docs/style.md">style.md</a>
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
