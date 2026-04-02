import { fetchJson, escapeHtml, todayHelsinki, formatNumber, formatTime, extractSensorByName, timeRowAtStation, renderStatGrid, requestSample } from "./helpers.js";

export default async function demo25() {
  const [trains, weather, tms, disruptions] = await Promise.all([
    fetchJson(`https://rata.digitraffic.fi/api/v1/live-trains/station/HKI/PSL?departure_date=${todayHelsinki()}`),
    fetchJson("https://tie.digitraffic.fi/api/weather/v1/stations/data"),
    fetchJson("https://tie.digitraffic.fi/api/tms/v1/stations/data"),
    fetchJson("https://tie.digitraffic.fi/api/traffic-message/v1/messages?situationType=TRAFFIC_ANNOUNCEMENT&inactiveHours=0"),
  ]);

  const now = Date.now();
  const nextTrain = trains
    .map((train) => {
      const dep = timeRowAtStation(train, "HKI", "DEPARTURE");
      return dep ? { train, dep } : null;
    })
    .filter(Boolean)
    .find((item) => new Date(item.dep.scheduledTime).getTime() > now && !item.train.cancelled);

  const freezing = (weather.stations || []).some((station) => extractSensorByName(station.sensorValues || [], "TIE_1") < -2);
  const avgSpeed = (tms.stations || [])
    .flatMap((station) => station.sensorValues || [])
    .filter((sensor) => sensor.name.startsWith("KESKINOPEUS_5MIN_KIINTEA_SUUNTA"))
    .reduce((acc, sensor, index, array) => acc + (sensor.value || 0) / array.length, 0);

  let recommendation = {
    mode: "TRAIN",
    confidence: "HIGH",
    reason: nextTrain ? `Next train ${nextTrain.train.trainType} ${nextTrain.train.trainNumber} departs at ${formatTime(nextTrain.dep.scheduledTime)}` : "Rail is the most predictable current option.",
    className: "pill-success",
  };

  if (!nextTrain) {
    recommendation = {
      mode: "DRIVE",
      confidence: "MEDIUM",
      reason: "No immediate train departure was available in the current sample route.",
      className: "pill-road",
    };
  }

  if (freezing && (disruptions.features?.length || 0) > 20 && avgSpeed < 60) {
    recommendation = {
      mode: "REMOTE",
      confidence: "HIGH",
      reason: "Freezing roads, slower traffic, and a busy road disruption feed all point to staying flexible today.",
      className: "pill-error",
    };
  }

  return {
    subtitle: "A live commute recommendation using current rail, weather, and road conditions.",
    previewHtml: `
      <div class="recommendation">
        <span class="recommendation-pill ${escapeHtml(recommendation.className)}">${escapeHtml(`${recommendation.mode} · ${recommendation.confidence}`)}</span>
        <div>${escapeHtml(recommendation.reason)}</div>
        ${renderStatGrid([
          { label: "Next train", value: nextTrain ? formatTime(nextTrain.dep.scheduledTime) : "—", note: "HKI → PSL sample route" },
          { label: "Freezing roads", value: freezing ? "Yes" : "No", note: "Road surface below -2 °C" },
          { label: "Road disruptions", value: String(disruptions.features?.length || 0), note: `${formatNumber(avgSpeed, 0)} km/h avg TMS speed` },
        ])}
      </div>
    `,
    apiSections: [
      requestSample("Rail option", "GET", `https://rata.digitraffic.fi/api/v1/live-trains/station/HKI/PSL?departure_date=${todayHelsinki()}`, trains[0]),
      requestSample("Road weather option", "GET", "https://tie.digitraffic.fi/api/weather/v1/stations/data", weather.stations?.[0]),
      requestSample("Road disruption option", "GET", "https://tie.digitraffic.fi/api/traffic-message/v1/messages?situationType=TRAFFIC_ANNOUNCEMENT&inactiveHours=0", disruptions.features?.[0]),
    ],
  };
}
