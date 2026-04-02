import { fetchJson, isoHoursAgo, renderStatGrid, requestSample } from "./helpers.js";

export default async function demo21() {
  const from = isoHoursAgo(24);
  const [hkTrains, trainLocations, tms, disruptions, ais, portCalls] = await Promise.all([
    fetchJson("https://rata.digitraffic.fi/api/v1/live-trains/station/HKI?departing_trains=30&arrived_trains=0&arriving_trains=10"),
    fetchJson("https://rata.digitraffic.fi/api/v1/train-locations/latest"),
    fetchJson("https://tie.digitraffic.fi/api/tms/v1/stations/data"),
    fetchJson("https://tie.digitraffic.fi/api/traffic-message/v1/messages?situationType=TRAFFIC_ANNOUNCEMENT&inactiveHours=0"),
    fetchJson("https://meri.digitraffic.fi/api/ais/v1/locations"),
    fetchJson(`https://meri.digitraffic.fi/api/port-call/v1/port-calls?from=${encodeURIComponent(from)}`),
  ]);

  const delayed = hkTrains.filter((train) =>
    (train.timeTableRows || []).some((row) => row.stationShortCode === "HKI" && (row.differenceInMinutes || 0) > 5),
  ).length;

  return {
    subtitle: "A compact live dashboard spanning rail, road, and marine traffic.",
    previewHtml: renderStatGrid([
      { label: "Active trains", value: String(trainLocations.length), note: `${delayed} delayed in HKI board` },
      { label: "Road disruptions", value: String(disruptions.features?.length || 0), note: `${tms.stations?.length || 0} TMS stations reporting` },
      { label: "Vessels at sea", value: String(ais.features?.length || 0), note: `${portCalls.portCalls?.length || 0} port calls in 24h` },
    ]),
    apiSections: [
      requestSample("Rail pulse sample", "GET", "https://rata.digitraffic.fi/api/v1/train-locations/latest", trainLocations[0]),
      requestSample("Road pulse sample", "GET", "https://tie.digitraffic.fi/api/tms/v1/stations/data", tms.stations?.[1]),
      requestSample("Marine pulse sample", "GET", "https://meri.digitraffic.fi/api/ais/v1/locations", ais.features?.[0]),
    ],
  };
}
