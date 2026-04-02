import { fetchJson, escapeHtml, todayHelsinki, formatTime, formatDateTime, timeRowAtStation, requestSample } from "./helpers.js";

export default async function demo23() {
  const [portCalls, trains] = await Promise.all([
    fetchJson("https://meri.digitraffic.fi/api/port-call/v1/port-calls?locode=FITKU"),
    fetchJson(`https://rata.digitraffic.fi/api/v1/live-trains/station/TKU/HKI?departure_date=${todayHelsinki()}`),
  ]);
  const now = Date.now();
  const arrivals = (portCalls.portCalls || [])
    .filter((call) => call.portCallTimestamp && new Date(call.portCallTimestamp).getTime() > now)
    .sort((a, b) => new Date(a.portCallTimestamp) - new Date(b.portCallTimestamp))
    .slice(0, 3);

  const connections = arrivals.map((arrival) => {
    const eta = new Date(arrival.portCallTimestamp);
    const options = trains
      .map((train) => {
        const dep = timeRowAtStation(train, "TKU", "DEPARTURE");
        return dep ? { train, dep } : null;
      })
      .filter(Boolean)
      .filter((item) => new Date(item.dep.scheduledTime).getTime() > eta.getTime() + 60 * 60 * 1000)
      .slice(0, 3);
    return {
      vessel: arrival.vesselName,
      eta: formatDateTime(arrival.portCallTimestamp),
      options,
    };
  });

  return {
    subtitle: "Upcoming Turku ship arrivals paired with onward train connections to Helsinki.",
    previewHtml: `
      <div class="flow">
        ${connections
          .map(
            (connection) => `
              <section class="flow-step">
                <h4>${escapeHtml(connection.vessel)}</h4>
                <div class="micro">ETA ${escapeHtml(connection.eta)}</div>
                <div class="event-list">
                  ${connection.options
                    .map(
                      (option) => `
                        <div class="event-card">
                          <h4>${escapeHtml(`${option.train.trainType} ${option.train.trainNumber}`)}</h4>
                          <div class="micro">Departs ${escapeHtml(formatTime(option.dep.scheduledTime))}</div>
                        </div>
                      `,
                    )
                    .join("")}
                </div>
              </section>
            `,
          )
          .join("")}
      </div>
    `,
    apiSections: [
      requestSample("Turku port calls", "GET", "https://meri.digitraffic.fi/api/port-call/v1/port-calls?locode=FITKU", portCalls.portCalls?.[0]),
      requestSample("Turku → Helsinki trains", "GET", `https://rata.digitraffic.fi/api/v1/live-trains/station/TKU/HKI?departure_date=${todayHelsinki()}`, trains[0]),
    ],
  };
}
