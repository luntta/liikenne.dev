import { fetchJson, formatNumber, clampArray, renderGeoPlot, renderBarList, requestSample, FINLAND_BOUNDS } from "./helpers.js";

export default async function demo2() {
  const locations = await fetchJson("https://rata.digitraffic.fi/api/v1/train-locations/latest");
  const active = locations.filter((item) => item.location?.coordinates?.length === 2);
  const topSpeed = clampArray(
    [...active].sort((a, b) => (b.speed || 0) - (a.speed || 0)).map((item) => ({
      label: `Train ${item.trainNumber}`,
      value: item.speed || 0,
      display: `${formatNumber(item.speed || 0)} km/h`,
      className: "rail",
    })),
    8,
  );
  const points = clampArray(active, 260).map((item) => ({
    lon: item.location.coordinates[0],
    lat: item.location.coordinates[1],
    radius: Math.max(3, Math.min(7, (item.speed || 0) / 28)),
    color: "var(--rail-solid)",
    title: `Train ${item.trainNumber} · ${item.speed || 0} km/h`,
  }));

  return {
    subtitle: `Latest position snapshot for ${formatNumber(active.length)} active trains.`,
    previewHtml: `
      ${renderGeoPlot({
        bounds: FINLAND_BOUNDS,
        points,
        legend: [{ color: "var(--rail-solid)", label: "Active train locations" }],
      })}
      ${renderBarList(topSpeed)}
    `,
    apiSections: [
      requestSample("Latest train locations", "GET", "https://rata.digitraffic.fi/api/v1/train-locations/latest", active[0]),
    ],
  };
}
