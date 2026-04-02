import { fetchJson, escapeHtml, todayHelsinki, timeRowAtStation, differenceMinutes, formatTime, renderTable, requestSample, rowDelayClass } from "./helpers.js";

export default async function demo5() {
  const date = todayHelsinki();
  const trains = await fetchJson(`https://rata.digitraffic.fi/api/v1/live-trains/station/HKI/TPE?departure_date=${date}`);
  const journeys = trains
    .map((train) => {
      const dep = timeRowAtStation(train, "HKI", "DEPARTURE");
      const arr = timeRowAtStation(train, "TPE", "ARRIVAL");
      if (!dep || !arr) return null;
      const duration = differenceMinutes(dep.scheduledTime, arr.scheduledTime);
      const stops = (train.timeTableRows || []).filter((row) => {
        const scheduled = new Date(row.scheduledTime);
        return (
          row.type === "ARRIVAL" &&
          row.commercialStop &&
          scheduled > new Date(dep.scheduledTime) &&
          scheduled < new Date(arr.scheduledTime)
        );
      }).length;
      return {
        train: `${train.trainType} ${train.trainNumber}`,
        departure: formatTime(dep.scheduledTime),
        arrival: formatTime(arr.scheduledTime),
        duration,
        stops,
        delay: arr.differenceInMinutes || dep.differenceInMinutes || 0,
        cancelled: train.cancelled,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.departure.localeCompare(b.departure));

  return {
    subtitle: "Direct services from Helsinki to Tampere today.",
    previewHtml: renderTable(
      ["Train", "Departure", "Arrival", "Duration", "Stops", "Status"],
      journeys.slice(0, 10).map((journey) => [
        `<span class="mono">${escapeHtml(journey.train)}</span>`,
        `<span class="mono">${escapeHtml(journey.departure)}</span>`,
        `<span class="mono">${escapeHtml(journey.arrival)}</span>`,
        `<span class="mono">${escapeHtml(`${journey.duration} min`)}</span>`,
        `<span class="mono">${escapeHtml(String(journey.stops))}</span>`,
        journey.cancelled
          ? '<span class="status-bad">Cancelled</span>'
          : `<span class="${rowDelayClass(journey.delay)}">${journey.delay > 0 ? `+${journey.delay} min` : "On time"}</span>`,
      ]),
    ),
    apiSections: [
      requestSample(
        "Direct train search",
        "GET",
        `https://rata.digitraffic.fi/api/v1/live-trains/station/HKI/TPE?departure_date=${date}`,
        trains[0],
      ),
    ],
  };
}
