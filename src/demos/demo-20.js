import { fetchJson, escapeHtml, formatNumber, clampArray, renderGeoPlot, renderCards, requestSample, MARINE_BOUNDS } from "./helpers.js";

export default async function demo20() {
  const [dirways, vessels, locations] = await Promise.all([
    fetchJson("https://meri.digitraffic.fi/api/winter-navigation/v2/dirways"),
    fetchJson("https://meri.digitraffic.fi/api/winter-navigation/v2/vessels"),
    fetchJson("https://meri.digitraffic.fi/api/winter-navigation/v2/locations"),
  ]);
  const lines = (dirways.features || [])
    .filter((feature) => feature.geometry?.type === "LineString")
    .map((feature) => ({
      coordinates: feature.geometry.coordinates,
      color: "var(--marine-solid)",
      width: 2,
    }));
  const points = (locations.features || [])
    .filter((feature) => feature.geometry?.coordinates?.length === 2)
    .map((feature) => ({
      lon: feature.geometry.coordinates[0],
      lat: feature.geometry.coordinates[1],
      color: "var(--accent-solid)",
      radius: 4,
      title: feature.properties?.name || "Winter navigation location",
    }));

  return {
    subtitle: `Live winter-navigation geometry with ${formatNumber(lines.length)} dirways and ${formatNumber(vessels.length)} vessels.`,
    note: "The current marine docs publish winter-navigation locations and vessels. This preview uses those supported endpoints to show the live ice-assistance layer.",
    previewHtml: `
      ${renderGeoPlot({
        bounds: MARINE_BOUNDS,
        lines: clampArray(lines, 60),
        points: clampArray(points, 80),
        legend: [
          { color: "var(--marine-solid)", label: "Dirways" },
          { color: "var(--accent-solid)", label: "Locations" },
        ],
      })}
      ${renderCards(
        clampArray(vessels, 6).map((vessel) => ({
          title: vessel.name || `IMO ${vessel.imo || "—"}`,
          meta: `${vessel.iceClass || "Ice class unavailable"} · ${vessel.destination || "No destination"}`,
          body: vessel.ibnetId ? `IBNet ${vessel.ibnetId}` : "Live winter-navigation vessel feed",
        })),
      )}
    `,
    apiSections: [
      requestSample("Winter dirways", "GET", "https://meri.digitraffic.fi/api/winter-navigation/v2/dirways", dirways.features?.[0]),
      requestSample("Winter navigation locations", "GET", "https://meri.digitraffic.fi/api/winter-navigation/v2/locations", locations.features?.[0]),
      requestSample("Winter navigation vessels", "GET", "https://meri.digitraffic.fi/api/winter-navigation/v2/vessels", vessels[0]),
    ],
  };
}
