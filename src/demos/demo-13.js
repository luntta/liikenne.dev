import { fetchJson, escapeHtml, formatNumber, clampArray, renderGeoPlot, renderCards, requestSample, FINLAND_BOUNDS } from "./helpers.js";

export default async function demo13() {
  const [locations, statuses] = await Promise.all([
    fetchJson("https://afir.digitraffic.fi/api/charging-network/v1/locations"),
    fetchJson("https://afir.digitraffic.fi/api/charging-network/v1/locations/statuses"),
  ]);
  const statusMap = Object.fromEntries((statuses.statuses || []).map((status) => [status.evseId, status.status]));
  const stations = (locations.features || [])
    .map((feature) => {
      const props = feature.properties || {};
      const evses = props.evses || [];
      const connectors = evses.flatMap((evse) => evse.connectors || []);
      const maxPower = Math.max(...connectors.map((connector) => connector.maxElectricPower || connector.maxPower || 0), 0);
      const statusesForStation = evses.map((evse) => statusMap[evse.id]).filter(Boolean);
      return {
        name: props.name,
        city: props.address?.city,
        lon: feature.geometry?.coordinates?.[0],
        lat: feature.geometry?.coordinates?.[1],
        evseCount: evses.length,
        maxPower,
        liveStatus: statusesForStation[0] || "UNKNOWN",
      };
    })
    .filter((station) => station.lon && station.lat)
    .sort((a, b) => b.maxPower - a.maxPower);

  return {
    subtitle: "Current AFIR charging network data from the live Digitraffic charging API.",
    note: "The markdown example points to tie.digitraffic.fi, but the current public AFIR API is served from afir.digitraffic.fi.",
    previewHtml: `
      ${renderGeoPlot({
        bounds: FINLAND_BOUNDS,
        points: clampArray(stations, 180).map((station) => ({
          lon: station.lon,
          lat: station.lat,
          color: station.liveStatus === "AVAILABLE" ? "var(--success)" : "var(--road-solid)",
          radius: Math.max(3, Math.min(8, station.evseCount)),
          title: `${station.name} · ${station.liveStatus}`,
        })),
        legend: [
          { color: "var(--success)", label: "Available" },
          { color: "var(--road-solid)", label: "Busy or blocked" },
        ],
      })}
      ${renderCards(
        clampArray(stations, 6).map((station) => ({
          title: station.name,
          meta: `${station.city || "Unknown city"} · ${station.evseCount} EVSEs`,
          body: `${formatNumber(station.maxPower, 0)} kW max · ${station.liveStatus}`,
        })),
      )}
    `,
    apiSections: [
      requestSample("Charging locations", "GET", "https://afir.digitraffic.fi/api/charging-network/v1/locations", locations.features?.[0]),
      requestSample("Live charging statuses", "GET", "https://afir.digitraffic.fi/api/charging-network/v1/locations/statuses", statuses.statuses?.[0]),
    ],
  };
}
