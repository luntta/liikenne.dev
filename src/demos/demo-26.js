import { fetchJson, escapeHtml, isoHoursAgo, todayHelsinki, formatNumber, formatDateTime, clampArray, renderStatGrid, requestSample } from "./helpers.js";

export default async function demo26() {
  const from = isoHoursAgo(24);
  const [portCalls, rail, maintenance, weather, disruptions] = await Promise.all([
    fetchJson(`https://meri.digitraffic.fi/api/port-call/v1/port-calls?locode=FIKTK&from=${encodeURIComponent(from)}`),
    fetchJson("https://rata.digitraffic.fi/api/v1/live-trains/station/KTK?departing_trains=15&arrived_trains=5"),
    fetchJson("https://tie.digitraffic.fi/api/maintenance/v1/tracking/routes/latest?domain=state-roads"),
    fetchJson("https://tie.digitraffic.fi/api/weather/v1/stations/data"),
    fetchJson("https://tie.digitraffic.fi/api/traffic-message/v1/messages?situationType=TRAFFIC_ANNOUNCEMENT&inactiveHours=0"),
  ]);

  const nextArrival = (portCalls.portCalls || [])
    .filter((call) => call.portCallTimestamp && new Date(call.portCallTimestamp).getTime() > Date.now())
    .sort((a, b) => new Date(a.portCallTimestamp) - new Date(b.portCallTimestamp))[0];
  const activeCargo = rail.filter((train) => train.trainCategory === "Cargo").length;
  const corridorWeather = (weather.stations || []).filter((station) => station.lon >= 24.4 && station.lon <= 27.4 && station.lat >= 59.9 && station.lat <= 60.9);
  const corridorMaintenance = (maintenance.features || []).filter((feature) => {
    const [lon, lat] = feature.geometry.coordinates;
    return lon >= 24.4 && lon <= 27.4 && lat >= 59.9 && lat <= 60.9;
  });

  return {
    subtitle: "A live corridor view for the Kotka to Helsinki freight chain.",
    previewHtml: `
      <div class="flow">
        <section class="flow-step">
          <h4>Port</h4>
          <div class="caption">${escapeHtml(nextArrival?.vesselName || "No upcoming arrival found")}</div>
          <div class="micro">${escapeHtml(nextArrival ? `ETA ${formatDateTime(nextArrival.portCallTimestamp)}` : `${portCalls.portCalls?.length || 0} calls in 24h`)}</div>
        </section>
        <section class="flow-step">
          <h4>Rail</h4>
          <div class="caption">${escapeHtml(`${activeCargo} active cargo trains`)}</div>
          <div class="micro">${escapeHtml(`${rail.length} trains in current KTK board`)}</div>
        </section>
        <section class="flow-step">
          <h4>Road</h4>
          <div class="caption">${escapeHtml(`${corridorMaintenance.length} maintenance points on corridor`)}</div>
          <div class="micro">${escapeHtml(`${disruptions.features?.length || 0} active road announcements`)}</div>
        </section>
      </div>
      ${renderStatGrid([
        { label: "Weather stations", value: String(corridorWeather.length), note: "Along the E18 corridor sample" },
        { label: "Maintenance points", value: String(corridorMaintenance.length), note: "Current latest positions" },
        { label: "Port calls 24h", value: String(portCalls.portCalls?.length || 0), note: "Kotka/HaminaKotka" },
      ])}
    `,
    apiSections: [
      requestSample("Kotka port calls", "GET", `https://meri.digitraffic.fi/api/port-call/v1/port-calls?locode=FIKTK&from=${from}`, portCalls.portCalls?.[0]),
      requestSample("Kotka train board", "GET", "https://rata.digitraffic.fi/api/v1/live-trains/station/KTK?departing_trains=15&arrived_trains=5", rail[0]),
      requestSample("Corridor maintenance", "GET", "https://tie.digitraffic.fi/api/maintenance/v1/tracking/routes/latest?domain=state-roads", maintenance.features?.[0]),
    ],
  };
}
