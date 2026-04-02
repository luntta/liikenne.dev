import { fetchJson, escapeHtml, formatNumber, requestSample } from "./helpers.js";

export default async function demo12() {
  const data = await fetchJson("https://tie.digitraffic.fi/api/variable-sign/v1/signs");
  const signs = (data.features || []).slice(0, 8);

  return {
    subtitle: `${formatNumber(data.features?.length || 0)} current variable sign states from Finnish highways.`,
    previewHtml: `
      <div class="list-grid">
        ${signs
          .map((feature) => {
            const props = feature.properties || {};
            const value = props.displayValue || props.displayedValue || (props.textRows || []).join(" ");
            return `
              <article class="mini-card">
                <div class="inline-stack">
                  <svg width="56" height="56" viewBox="0 0 60 60" aria-hidden="true">
                    <circle cx="30" cy="30" r="27" fill="white" stroke="#e5484d" stroke-width="4"></circle>
                    <text x="30" y="37" text-anchor="middle" font-size="20" font-family="Inter, sans-serif" fill="#1c2024">${escapeHtml(String(value || "!"))}</text>
                  </svg>
                  <div>
                    <h4>${escapeHtml(props.id)}</h4>
                    <div class="micro">${escapeHtml(props.type)} · ${escapeHtml(props.roadAddress || "")}</div>
                  </div>
                </div>
              </article>
            `;
          })
          .join("")}
      </div>
    `,
    apiSections: [
      requestSample("Variable signs", "GET", "https://tie.digitraffic.fi/api/variable-sign/v1/signs", data.features?.[0]),
    ],
  };
}
