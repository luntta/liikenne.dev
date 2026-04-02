import { fetchJson, escapeHtml, isoHoursAgo, formatDateTime, clampArray, renderTable, requestSample } from "./helpers.js";

export default async function demo17() {
  const from = isoHoursAgo(24);
  const [ports, calls] = await Promise.all([
    fetchJson("https://meri.digitraffic.fi/api/port-call/v1/ports"),
    fetchJson(`https://meri.digitraffic.fi/api/port-call/v1/port-calls?locode=FIHEL&from=${encodeURIComponent(from)}`),
  ]);
  const rows = clampArray(calls.portCalls || [], 10);
  return {
    subtitle: "Recent Helsinki port calls with arrival, departure, and routing context.",
    previewHtml: renderTable(
      ["Vessel", "ETA", "Arrival", "Departure", "From", "To"],
      rows.map((call) => [
        escapeHtml(call.vesselName || "Unknown"),
        escapeHtml(formatDateTime(call.portCallTimestamp)),
        escapeHtml(formatDateTime(call.arrivalTime)),
        escapeHtml(formatDateTime(call.departureTime)),
        escapeHtml(call.prevPort || "—"),
        escapeHtml(call.nextPort || "—"),
      ]),
    ),
    apiSections: [
      requestSample("Port metadata", "GET", "https://meri.digitraffic.fi/api/port-call/v1/ports", ports.ssnLocations?.features?.[0]),
      requestSample(
        "Port calls",
        "GET",
        `https://meri.digitraffic.fi/api/port-call/v1/port-calls?locode=FIHEL&from=${from}`,
        calls.portCalls?.[0],
      ),
    ],
  };
}
