import { fetchJson, formatNumber, extractSensorByName, clampArray, renderStatGrid, renderBarList, requestSample } from "./helpers.js";

export default async function demo8() {
  const data = await fetchJson("https://tie.digitraffic.fi/api/weather/v1/stations/data");
  const stations = (data.stations || []).map((station) => {
    const values = station.sensorValues || [];
    return {
      id: station.id,
      air: extractSensorByName(values, "ILMA"),
      road: extractSensorByName(values, "TIE_1"),
      wind: extractSensorByName(values, "TUULENNOPEUSKESKIARVO"),
      visibility: extractSensorByName(values, "NAKYVYYS"),
    };
  });
  const withRoad = stations.filter((station) => station.road !== null);
  const coldest = clampArray([...withRoad].sort((a, b) => a.road - b.road), 8);
  const avgAir = stations.filter((station) => station.air !== null).reduce((sum, station, _, array) => sum + station.air / array.length, 0);
  const avgRoad = withRoad.reduce((sum, station, _, array) => sum + station.road / array.length, 0);

  return {
    subtitle: `Live readings from ${formatNumber(stations.length)} road weather stations.`,
    previewHtml: `
      ${renderStatGrid([
        { label: "Average air temp", value: `${formatNumber(avgAir, 1)} °C`, note: "Current network average" },
        { label: "Average road temp", value: `${formatNumber(avgRoad, 1)} °C`, note: "Surface sensor TIE_1" },
        {
          label: "Freezing stations",
          value: String(withRoad.filter((station) => station.road < 0).length),
          note: "Road surface below 0 °C",
        },
      ])}
      ${renderBarList(
        coldest.map((station) => ({
          label: `Station ${station.id}`,
          value: Math.abs(station.road),
          display: `${formatNumber(station.road, 1)} °C`,
          className: "road",
        })),
      )}
    `,
    apiSections: [
      requestSample("Road weather stations", "GET", "https://tie.digitraffic.fi/api/weather/v1/stations/data", data.stations?.[0]),
    ],
  };
}
