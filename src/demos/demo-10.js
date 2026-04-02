import { fetchJson, escapeHtml, formatNumber, formatDateTime, clampArray, renderGeoPlot, renderCards, requestSample, ROAD_BOUNDS } from "./helpers.js";

export default async function demo10() {
  const [announcements, roadworks, restrictions] = await Promise.all([
    fetchJson("https://tie.digitraffic.fi/api/traffic-message/v1/messages?situationType=TRAFFIC_ANNOUNCEMENT&inactiveHours=0"),
    fetchJson("https://tie.digitraffic.fi/api/traffic-message/v1/messages?situationType=ROAD_WORK&inactiveHours=0"),
    fetchJson("https://tie.digitraffic.fi/api/traffic-message/v1/messages?situationType=WEIGHT_RESTRICTION&inactiveHours=0"),
  ]);
  const all = [announcements, roadworks, restrictions]
    .flatMap((data) => data.features || [])
    .map((feature) => ({
      type: feature.properties?.situationType || "UNKNOWN",
      title: feature.properties?.announcements?.[0]?.title || "Road message",
      description: feature.properties?.announcements?.[0]?.location?.description || feature.properties?.announcements?.[0]?.description || "",
      time: feature.properties?.releaseTime,
      geometry: feature.geometry,
    }));

  const points = clampArray(
    all
      .map((item) => {
        if (item.geometry?.type === "Point") {
          return {
            lon: item.geometry.coordinates[0],
            lat: item.geometry.coordinates[1],
            color: item.type === "ROAD_WORK" ? "var(--road-solid)" : "var(--error)",
            radius: 4,
            title: item.title,
          };
        }
        return null;
      })
      .filter(Boolean),
    180,
  );

  return {
    subtitle: `${formatNumber(all.length)} active road disruptions across announcements, works, and restrictions.`,
    previewHtml: `
      ${renderGeoPlot({
        bounds: ROAD_BOUNDS,
        points,
        legend: [
          { color: "var(--error)", label: "Traffic announcements" },
          { color: "var(--road-solid)", label: "Road works and restrictions" },
        ],
      })}
      ${renderCards(
        clampArray(all, 6).map((item) => ({
          title: item.title,
          meta: `${item.type} · ${formatDateTime(item.time)}`,
          body: item.description,
        })),
      )}
    `,
    apiSections: [
      requestSample(
        "Traffic announcements",
        "GET",
        "https://tie.digitraffic.fi/api/traffic-message/v1/messages?situationType=TRAFFIC_ANNOUNCEMENT&inactiveHours=0",
        announcements.features?.[0],
      ),
    ],
  };
}
