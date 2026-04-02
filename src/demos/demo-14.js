import { fetchJson, escapeHtml, formatNumber, clampArray, renderTable, requestSample } from "./helpers.js";

export default async function demo14() {
  const data = await fetchJson("https://tie.digitraffic.fi/api/tms/v1/stations/data");
  const stations = (data.stations || [])
    .map((station) => {
      const values = station.sensorValues || [];
      const speeds = values.filter((sensor) => sensor.name.startsWith("KESKINOPEUS_5MIN_KIINTEA_SUUNTA"));
      const avgSpeed = speeds.length ? speeds.reduce((sum, sensor) => sum + (sensor.value || 0), 0) / speeds.length : null;
      const volume = values
        .filter((sensor) => sensor.name.startsWith("OHITUKSET_5MIN_KIINTEA_SUUNTA"))
        .reduce((sum, sensor) => sum + (sensor.value || 0), 0);
      return {
        id: station.id,
        avgSpeed,
        volume,
      };
    })
    .filter((station) => station.avgSpeed !== null)
    .sort((a, b) => (a.avgSpeed || 0) - (b.avgSpeed || 0));

  function fluencyClass(speed) {
    if (speed >= 85) return "Free";
    if (speed >= 60) return "Heavy";
    return "Congested";
  }

  return {
    subtitle: "Derived Helsinki-region fluency signal from current TMS speed and volume sensors.",
    note: "The public fluency endpoint used in demos.md is no longer available. This preview reconstructs a fluency view from current TMS station speeds.",
    previewHtml: renderTable(
      ["Station", "Average speed", "Volume", "Derived class"],
      clampArray(stations, 10).map((station) => [
        `<span class="mono">TMS ${station.id}</span>`,
        `<span class="mono">${escapeHtml(`${formatNumber(station.avgSpeed, 0)} km/h`)}</span>`,
        `<span class="mono">${escapeHtml(formatNumber(station.volume, 0))}</span>`,
        escapeHtml(fluencyClass(station.avgSpeed)),
      ]),
    ),
    apiSections: [
      requestSample("TMS data used for derived fluency", "GET", "https://tie.digitraffic.fi/api/tms/v1/stations/data", data.stations?.[1]),
    ],
  };
}
