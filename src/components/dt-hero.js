import { icons } from "../icons.js";
import { escapeHtml } from "../utils.js";
import { t } from "../i18n.js";
import { store } from "../store.js";

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
