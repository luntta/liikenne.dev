import { fetchJson, formatTime, formatNumber, renderBarList, requestSample } from "./helpers.js";

export default async function demo15() {
  const sitesData = await fetchJson("https://tie.digitraffic.fi/api/counting-site/v2/sites");
  const site = (sitesData.features || []).find((feature) => feature.properties?.lastDataTimestamp) || sitesData.features?.[0];
  const siteId = site.properties.id;
  const values = await fetchJson(`https://tie.digitraffic.fi/api/counting-site/v2/values?siteId=${siteId}`);
  const hourly = values
    .slice(-24)
    .map((item) => ({
      hour: formatTime(item.dataTimestamp),
      count: item.count,
      label: `${item.direction || "all"} ${item.travelMode || ""}`.trim(),
    }));

  return {
    subtitle: `Latest counting-site values from ${site.properties.name}.`,
    note: "The current public counting API is version 2, so the preview uses the live v2 endpoints rather than the older v1 paths in the markdown.",
    previewHtml: `
      ${renderBarList(
        hourly.map((entry) => ({
          label: entry.hour,
          value: entry.count,
          display: `${formatNumber(entry.count)} ${entry.label}`,
          className: "road",
        })),
      )}
    `,
    apiSections: [
      requestSample("Counting sites", "GET", "https://tie.digitraffic.fi/api/counting-site/v2/sites", site),
      requestSample("Counting values", "GET", `https://tie.digitraffic.fi/api/counting-site/v2/values?siteId=${siteId}`, values[0]),
    ],
  };
}
