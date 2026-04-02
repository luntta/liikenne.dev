import { fetchJson, todayHelsinki, formatNumber, extractSensorByName, timeRowAtStation, renderStatGrid, requestSample } from "./helpers.js";

export default async function demo22() {
  const [weather, journeys, tms, marineFaults] = await Promise.all([
    fetchJson("https://tie.digitraffic.fi/api/weather/v1/stations/data"),
    fetchJson(`https://rata.digitraffic.fi/api/v1/live-trains/station/HKI/TPE?departure_date=${todayHelsinki()}`),
    fetchJson("https://tie.digitraffic.fi/api/tms/v1/stations/data"),
    fetchJson("https://meri.digitraffic.fi/api/aton/v1/faults"),
  ]);

  const freezing = (weather.stations || []).filter((station) => extractSensorByName(station.sensorValues || [], "TIE_1") < 0).length;
  const trainDelays = journeys
    .map((train) => {
      const arr = timeRowAtStation(train, "TPE", "ARRIVAL");
      return arr?.differenceInMinutes || 0;
    })
    .filter((value) => value > 0);
  const avgTrainDelay = trainDelays.length ? trainDelays.reduce((sum, value) => sum + value, 0) / trainDelays.length : 0;
  const avgRoadSpeed = (tms.stations || [])
    .flatMap((station) => station.sensorValues || [])
    .filter((sensor) => sensor.name.startsWith("KESKINOPEUS_5MIN_KIINTEA_SUUNTA"))
    .reduce((acc, sensor, index, array) => acc + (sensor.value || 0) / array.length, 0);

  return {
    subtitle: "A live cross-domain weather impact sketch using road, rail, and marine data.",
    previewHtml: renderStatGrid([
      { label: "Freezing road stations", value: String(freezing), note: `${weather.stations?.length || 0} weather stations` },
      { label: "Average train delay", value: `${formatNumber(avgTrainDelay, 1)} min`, note: "HKI → TPE sample route" },
      { label: "Average road speed", value: `${formatNumber(avgRoadSpeed, 0)} km/h`, note: `${marineFaults.features?.length || 0} marine AtoN faults` },
    ]),
    apiSections: [
      requestSample("Road weather", "GET", "https://tie.digitraffic.fi/api/weather/v1/stations/data", weather.stations?.[0]),
      requestSample("Rail route sample", "GET", `https://rata.digitraffic.fi/api/v1/live-trains/station/HKI/TPE?departure_date=${todayHelsinki()}`, journeys[0]),
      requestSample("Marine hazard proxy", "GET", "https://meri.digitraffic.fi/api/aton/v1/faults", marineFaults.features?.[0]),
    ],
  };
}
