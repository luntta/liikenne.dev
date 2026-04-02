import { fetchJson, escapeHtml, formatNumber, clampArray, renderGeoPlot, renderCards, requestSample, MARINE_BOUNDS } from "./helpers.js";

export default async function demo19() {
  const data = await fetchJson("https://meri.digitraffic.fi/api/sse/v1/measurements");
  const features = (data.features || []).filter((feature) => feature.geometry?.coordinates?.length === 2);
  return {
    subtitle: `Sea state estimation from ${formatNumber(features.length)} buoy and fixed sites.`,
    previewHtml: `
      ${renderGeoPlot({
        bounds: MARINE_BOUNDS,
        points: clampArray(features, 180).map((feature) => ({
          lon: feature.geometry.coordinates[0],
          lat: feature.geometry.coordinates[1],
          color: "var(--marine-solid)",
          radius: 4,
          title: `${feature.properties?.siteName || feature.siteNumber} · ${feature.properties?.seaState || "No reading"}`,
        })),
        legend: [{ color: "var(--marine-solid)", label: "Sea-state sites" }],
      })}
      ${renderCards(
        clampArray(features, 6).map((feature) => ({
          title: feature.properties?.siteName || String(feature.siteNumber),
          meta: `${feature.properties?.seaState || "Unknown"} · ${feature.properties?.confidence || "No confidence"}`,
          body: `Trend: ${feature.properties?.trend || "—"} · Temp ${formatNumber(feature.properties?.temperature, 0)} °C`,
        })),
      )}
    `,
    apiSections: [
      requestSample("Sea state measurements", "GET", "https://meri.digitraffic.fi/api/sse/v1/measurements", features[0]),
    ],
  };
}
