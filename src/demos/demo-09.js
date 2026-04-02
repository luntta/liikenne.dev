import { fetchJson, formatNumber, clampArray, renderStatGrid, renderBarList, requestSample } from "./helpers.js";

export default async function demo9() {
  const data = await fetchJson("https://tie.digitraffic.fi/api/tms/v1/stations/data");
  const stations = (data.stations || [])
    .map((station) => {
      const values = station.sensorValues || [];
      const totalVolume = values
        .filter((sensor) => sensor.name.startsWith("OHITUKSET_5MIN_KIINTEA_SUUNTA"))
        .reduce((sum, sensor) => sum + (sensor.value || 0), 0);
      const avgSpeedSensors = values.filter((sensor) => sensor.name.startsWith("KESKINOPEUS_5MIN_KIINTEA_SUUNTA"));
      const avgSpeed = avgSpeedSensors.length
        ? avgSpeedSensors.reduce((sum, sensor) => sum + (sensor.value || 0), 0) / avgSpeedSensors.length
        : null;
      return {
        id: station.id,
        totalVolume,
        avgSpeed,
        measuredTime: station.dataUpdatedTime,
      };
    })
    .filter((station) => station.totalVolume > 0);

  const busiest = clampArray([...stations].sort((a, b) => b.totalVolume - a.totalVolume), 10);

  return {
    subtitle: "Latest five-minute traffic volume snapshot from TMS stations.",
    previewHtml: `
      ${renderStatGrid([
        { label: "Reporting stations", value: String(stations.length), note: "Non-zero five-minute volume" },
        {
          label: "Top station volume",
          value: formatNumber(busiest[0]?.totalVolume || 0),
          note: `Station ${busiest[0]?.id || "—"}`,
        },
        {
          label: "Average speed",
          value: `${formatNumber(
            stations.filter((station) => station.avgSpeed !== null).reduce((sum, station, _, array) => sum + station.avgSpeed / array.length, 0),
            0,
          )} km/h`,
          note: "Across stations with speed sensors",
        },
      ])}
      ${renderBarList(
        busiest.map((station) => ({
          label: `TMS ${station.id}`,
          value: station.totalVolume,
          display: `${formatNumber(station.totalVolume)} veh`,
          className: "road",
        })),
      )}
    `,
    apiSections: [
      requestSample("TMS station data", "GET", "https://tie.digitraffic.fi/api/tms/v1/stations/data", data.stations?.[1]),
    ],
  };
}
