import { fetchJson, escapeHtml, renderCards, requestSample } from "./helpers.js";

export default async function demo7() {
  const data = await fetchJson("https://tie.digitraffic.fi/api/weathercam/v1/stations");
  const active = (data.features || [])
    .filter((feature) => feature.properties?.state === "OK" && feature.properties?.collectionStatus === "GATHERING")
    .map((feature) => ({
      id: feature.properties.id,
      name: feature.properties.name,
      presets: (feature.properties.presets || [])
        .filter((preset) => preset.inCollection)
        .slice(0, 4)
        .map((preset) => ({
          id: preset.id,
          label: preset.presentationName || preset.id,
          image: `https://weathercam.digitraffic.fi/${preset.id}.jpg`,
        })),
    }))
    .filter((station) => station.presets.length)
    .slice(0, 6);

  const primary = active[0];

  return {
    subtitle: `Current road weather images from ${escapeHtml(primary?.name || "the Finnish road network")}.`,
    previewHtml: `
      <div class="camera-layout" data-camera-demo="true">
        <div class="camera-stage">
          <img data-camera-stage alt="${escapeHtml(primary?.name || "Road weather camera")}" src="${escapeHtml(primary?.presets?.[0]?.image || "")}">
        </div>
        <div class="camera-strip">
          ${primary.presets
            .map(
              (preset) => `
                <div class="camera-thumb">
                  <button type="button" data-camera-thumb="${escapeHtml(preset.image)}">
                    <img src="${escapeHtml(preset.image)}" alt="${escapeHtml(preset.label)}">
                  </button>
                </div>
              `,
            )
            .join("")}
        </div>
        ${renderCards(
          active.map((station) => ({
            title: station.name,
            meta: `${station.presets.length} presets`,
            body: station.presets.map((preset) => preset.label).join(" · "),
          })),
        )}
      </div>
    `,
    enhance(container) {
      const stage = container.querySelector("[data-camera-stage]");
      container.querySelectorAll("[data-camera-thumb]").forEach((button) => {
        button.addEventListener("click", () => {
          stage.src = button.getAttribute("data-camera-thumb");
        });
      });
    },
    apiSections: [
      requestSample("Weather camera stations", "GET", "https://tie.digitraffic.fi/api/weathercam/v1/stations", data.features?.[0]),
    ],
  };
}
