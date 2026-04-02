import { fetchJson, escapeHtml, formatNumber, clampArray, renderGeoPlot, renderCards, requestSample, MARINE_BOUNDS } from "./helpers.js";

export default async function demo16() {
  const [locations, vessels] = await Promise.all([
    fetchJson("https://meri.digitraffic.fi/api/ais/v1/locations"),
    fetchJson("https://meri.digitraffic.fi/api/ais/v1/vessels"),
  ]);
  const meta = Object.fromEntries(vessels.map((vessel) => [vessel.mmsi, vessel]));
  const features = (locations.features || []).filter((feature) => feature.geometry?.coordinates?.length === 2);
  const fastest = clampArray(
    [...features]
      .sort((a, b) => (b.properties?.sog || 0) - (a.properties?.sog || 0))
      .map((feature) => {
        const vessel = meta[feature.mmsi];
        return {
          title: vessel?.name || `MMSI ${feature.mmsi}`,
          meta: `${escapeHtml(String(feature.properties?.sog || 0))} kn · type ${escapeHtml(String(vessel?.shipType || "—"))}`,
          body: vessel?.destination || "Destination unavailable",
        };
      }),
    6,
  );

  return {
    subtitle: `Current AIS snapshot with ${formatNumber(features.length)} vessel positions.`,
    previewHtml: `
      ${renderGeoPlot({
        bounds: MARINE_BOUNDS,
        points: clampArray(features, 260).map((feature) => ({
          lon: feature.geometry.coordinates[0],
          lat: feature.geometry.coordinates[1],
          color: "var(--marine-solid)",
          radius: Math.max(3, Math.min(7, (feature.properties?.sog || 0) / 6)),
          title: `${meta[feature.mmsi]?.name || feature.mmsi} · ${feature.properties?.sog || 0} kn`,
        })),
        legend: [{ color: "var(--marine-solid)", label: "Vessels in latest AIS snapshot" }],
      })}
      ${renderCards(fastest)}
    `,
    apiSections: [
      requestSample("AIS locations", "GET", "https://meri.digitraffic.fi/api/ais/v1/locations", features[0]),
      requestSample("Vessel metadata", "GET", "https://meri.digitraffic.fi/api/ais/v1/vessels", vessels[0]),
    ],
  };
}
