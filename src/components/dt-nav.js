import { icons } from "../icons.js";
import { escapeHtml } from "../utils.js";
import { t, getLang, setLang } from "../i18n.js";
import { toggleTheme } from "../theme.js";

function toggleLang() {
  setLang(getLang() === "fi" ? "en" : "fi");
  document.querySelectorAll("dt-app").forEach((el) => el.render());
}

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
