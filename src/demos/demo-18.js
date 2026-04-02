import { fetchJson, escapeHtml, formatDateTime, clampArray, renderGeoPlot, renderCards, requestSample, MARINE_BOUNDS } from "./helpers.js";

export default async function demo18() {
  const [faults, disruptions] = await Promise.all([
    fetchJson("https://meri.digitraffic.fi/api/aton/v1/faults"),
    fetchJson("https://meri.digitraffic.fi/api/bridge-lock/v1/disruptions"),
  ]);
  const faultFeatures = faults.features || [];
  const disruptionFeatures = disruptions.features || [];
  return {
    subtitle: "Current marine hazard proxy using AtoN faults and waterway disruptions.",
    note: "The nautical warning endpoint referenced in demos.md is not published in the current marine documentation. This preview uses the supported live marine hazard feeds that are available today.",
    previewHtml: `
      ${renderGeoPlot({
        bounds: MARINE_BOUNDS,
        points: clampArray(faultFeatures, 180).map((feature) => ({
          lon: feature.geometry.coordinates[0],
          lat: feature.geometry.coordinates[1],
          color: "var(--marine-solid)",
          radius: 4,
          title: `${feature.properties?.aton_name_fi || "AtoN fault"} · ${feature.properties?.type || ""}`,
        })),
        legend: [
          { color: "var(--marine-solid)", label: "AtoN faults" },
          { color: "var(--accent-solid)", label: "Bridge and lock disruptions" },
        ],
      })}
      ${renderCards(
        clampArray(
          [
            ...faultFeatures.map((feature) => ({
              title: feature.properties?.aton_name_fi || "AtoN fault",
              meta: `${feature.properties?.type || "Fault"} · ${feature.properties?.area_description || ""}`,
              body: feature.properties?.fairway_name_fi || "",
            })),
            ...disruptionFeatures.map((feature) => ({
              title: feature.properties?.descriptionEn || "Waterway disruption",
              meta: formatDateTime(feature.properties?.startDate),
              body: feature.properties?.descriptionFi || "",
            })),
          ],
          6,
        ),
      )}
    `,
    apiSections: [
      requestSample("AtoN faults", "GET", "https://meri.digitraffic.fi/api/aton/v1/faults", faultFeatures[0]),
      requestSample("Bridge and lock disruptions", "GET", "https://meri.digitraffic.fi/api/bridge-lock/v1/disruptions", disruptionFeatures[0]),
    ],
  };
}
