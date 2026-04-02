import { fetchJson, formatNumber, formatPercent, renderStatGrid, renderBarList, requestSample } from "./helpers.js";

export default async function demo3() {
  const hubs = ["HKI", "PSL", "TPE", "TKU", "JY", "OL", "LEN", "KE"];
  const stationResults = await Promise.all(
    hubs.map(async (code) => {
      const trains = await fetchJson(
        `https://rata.digitraffic.fi/api/v1/live-trains/station/${code}?departing_trains=15&arrived_trains=0&arriving_trains=15`,
      );
      const delays = trains
        .flatMap((train) => train.timeTableRows || [])
        .filter((row) => row.stationShortCode === code && row.differenceInMinutes !== null && row.differenceInMinutes !== undefined)
        .map((row) => Number(row.differenceInMinutes));
      const over5 = delays.filter((value) => value > 5).length;
      const avg = delays.length ? delays.reduce((sum, value) => sum + value, 0) / delays.length : 0;
      return {
        code,
        avg,
        punctuality: delays.length ? ((delays.length - over5) / delays.length) * 100 : 100,
        rows: delays.length,
      };
    }),
  );

  const sorted = stationResults.sort((a, b) => b.avg - a.avg);
  return {
    subtitle: "Current delay profile across major Finnish hubs using live station boards.",
    note: "The markdown example uses the full-day train feed. This preview uses smaller live station queries so the browser can render it quickly.",
    previewHtml: `
      ${renderStatGrid([
        { label: "Stations compared", value: String(sorted.length), note: "Major passenger hubs" },
        {
          label: "Worst average delay",
          value: `${formatNumber(sorted[0]?.avg || 0, 1)} min`,
          note: sorted[0]?.code || "—",
        },
        {
          label: "Best punctuality",
          value: formatPercent(Math.max(...sorted.map((item) => item.punctuality || 0)), 0),
          note: "Share within 5 minutes",
        },
      ])}
      ${renderBarList(
        sorted.map((item) => ({
          label: item.code,
          value: item.avg,
          display: `${formatNumber(item.avg, 1)} min`,
          className: item.avg > 5 ? "error" : "rail",
        })),
      )}
    `,
    apiSections: [
      requestSample(
        "Sample station feed",
        "GET",
        "https://rata.digitraffic.fi/api/v1/live-trains/station/HKI?departing_trains=15&arrived_trains=0&arriving_trains=15",
        stationResults[0],
      ),
    ],
  };
}
