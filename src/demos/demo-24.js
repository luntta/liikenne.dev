import { fetchJson, fetchGraphQL, escapeHtml, formatDateTime, requestSample } from "./helpers.js";

export default async function demo24() {
  const [road, railMessages, marine] = await Promise.all([
    fetchJson("https://tie.digitraffic.fi/api/traffic-message/v1/messages?situationType=TRAFFIC_ANNOUNCEMENT&inactiveHours=0"),
    fetchGraphQL(`{
      passengerInformationMessages {
        id
        trainNumber
        startValidity
        endValidity
        video { text { en fi } }
        audio { text { en fi } }
      }
    }`),
    fetchJson("https://meri.digitraffic.fi/api/aton/v1/faults"),
  ]);

  const timeline = [
    ...(road.features || []).slice(0, 4).map((item) => ({
      mode: "road",
      time: item.properties?.releaseTime,
      title: item.properties?.announcements?.[0]?.title || "Road announcement",
    })),
    ...(railMessages.passengerInformationMessages || []).slice(0, 4).map((item) => ({
      mode: "rail",
      time: item.startValidity,
      title: item.video?.text?.en || item.audio?.text?.en || item.video?.text?.fi || "Passenger information message",
    })),
    ...(marine.features || []).slice(0, 4).map((item) => ({
      mode: "marine",
      time: item.properties?.entry_timestamp,
      title: item.properties?.aton_name_fi || "Marine fault",
    })),
  ].sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));

  return {
    subtitle: "A unified disruption timeline across current road, rail, and marine feeds.",
    previewHtml: `
      <div class="timeline">
        ${timeline
          .map(
            (item) => `
              <div class="timeline-item">
                <div class="micro">${escapeHtml(formatDateTime(item.time))}</div>
                <div>
                  <div class="inline-stack">
                    <span class="badge badge-${item.mode === "rail" ? "rail" : item.mode === "road" ? "road" : "marine"}">${escapeHtml(item.mode)}</span>
                  </div>
                  <div>${escapeHtml(item.title)}</div>
                </div>
              </div>
            `,
          )
          .join("")}
      </div>
    `,
    apiSections: [
      requestSample(
        "Road disruptions",
        "GET",
        "https://tie.digitraffic.fi/api/traffic-message/v1/messages?situationType=TRAFFIC_ANNOUNCEMENT&inactiveHours=0",
        road.features?.[0],
      ),
      requestSample("Rail passenger messages", "POST", "https://rata.digitraffic.fi/api/v2/graphql/graphql", railMessages.passengerInformationMessages?.[0]),
      requestSample("Marine hazard feed", "GET", "https://meri.digitraffic.fi/api/aton/v1/faults", marine.features?.[0]),
    ],
  };
}
