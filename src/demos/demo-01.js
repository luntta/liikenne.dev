import { fetchJson, escapeHtml, stationMap, timeRowAtStation, destinationForTrain, differenceMinutes, formatTime, renderTable, requestSample, rowDelayClass } from "./helpers.js";

export default async function demo1() {
  const [stations, trains] = await Promise.all([
    fetchJson("https://rata.digitraffic.fi/api/v1/metadata/stations"),
    fetchJson("https://rata.digitraffic.fi/api/v1/live-trains/station/HKI?departing_trains=10&arrived_trains=0&arriving_trains=0"),
  ]);
  const map = stationMap(stations);
  const departures = trains
    .map((train) => {
      const depRow = timeRowAtStation(train, "HKI", "DEPARTURE");
      if (!depRow) return null;
      const scheduled = depRow.scheduledTime;
      const estimated = depRow.liveEstimateTime || scheduled;
      const delay = differenceMinutes(scheduled, estimated) ?? 0;
      return {
        train: `${train.trainType} ${train.trainNumber}`,
        destination: destinationForTrain(train, map),
        scheduled,
        estimated,
        delay,
        track: depRow.commercialTrack || "—",
        cancelled: train.cancelled,
      };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(a.scheduled) - new Date(b.scheduled));

  return {
    subtitle: "Live departures from Helsinki Central Station.",
    previewHtml: `
      <div class="split-board">
        ${renderTable(
          ["Train", "Destination", "Scheduled", "Estimate", "Track", "Status"],
          departures.map((item) => [
            `<span class="mono">${escapeHtml(item.train)}</span>`,
            escapeHtml(item.destination),
            `<span class="mono">${escapeHtml(formatTime(item.scheduled))}</span>`,
            `<span class="mono">${escapeHtml(formatTime(item.estimated))}</span>`,
            `<span class="mono">${escapeHtml(item.track)}</span>`,
            item.cancelled
              ? '<span class="status-bad">Cancelled</span>'
              : `<span class="${rowDelayClass(item.delay)}">${item.delay > 0 ? `+${escapeHtml(String(item.delay))} min` : "On time"}</span>`,
          ]),
        )}
      </div>
    `,
    apiSections: [
      requestSample("Station metadata", "GET", "https://rata.digitraffic.fi/api/v1/metadata/stations", stations[0]),
      requestSample("Live departures", "GET", "https://rata.digitraffic.fi/api/v1/live-trains/station/HKI?departing_trains=10&arrived_trains=0&arriving_trains=0", trains[0]),
    ],
  };
}
