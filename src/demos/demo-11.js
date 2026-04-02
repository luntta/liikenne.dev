import { fetchJson, escapeHtml, formatDateTime, clampArray, renderGeoPlot, renderBarList, requestSample, ROAD_BOUNDS } from "./helpers.js";

export default async function demo11() {
  const data = await fetchJson("https://tie.digitraffic.fi/api/maintenance/v1/tracking/routes/latest?domain=state-roads");
  const features = data.features || [];
  const winterTasks = features.filter((feature) =>
    (feature.properties?.tasks || []).some((task) => ["PLOUGHING", "SALTING", "SANDING"].includes(task)),
  );
  const current = winterTasks.length ? winterTasks : features;
  const taskCounts = Object.entries(
    current.reduce((acc, feature) => {
      (feature.properties?.tasks || ["UNKNOWN"]).forEach((task) => {
        acc[task] = (acc[task] || 0) + 1;
      });
      return acc;
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  return {
    subtitle: `Latest maintenance vehicle positions from ${current.length} active route points.`,
    note: winterTasks.length
      ? "Current winter maintenance tasks are available, so the preview focuses on ploughing and related operations."
      : "No live ploughing routes were visible at fetch time, so the preview falls back to the latest state-road maintenance vehicles.",
    previewHtml: `
      ${renderGeoPlot({
        bounds: ROAD_BOUNDS,
        points: clampArray(current, 180).map((feature) => ({
          lon: feature.geometry.coordinates[0],
          lat: feature.geometry.coordinates[1],
          color: "var(--road-solid)",
          radius: 4,
          title: `${(feature.properties?.tasks || []).join(", ") || "Maintenance"} · ${formatDateTime(feature.properties?.time)}`,
        })),
        legend: [{ color: "var(--road-solid)", label: "Maintenance vehicles" }],
      })}
      ${renderBarList(
        taskCounts.map(([task, count]) => ({
          label: task,
          value: count,
          display: `${count} vehicles`,
          className: "road",
        })),
      )}
    `,
    apiSections: [
      requestSample(
        "Latest maintenance routes",
        "GET",
        "https://tie.digitraffic.fi/api/maintenance/v1/tracking/routes/latest?domain=state-roads",
        data.features?.[0],
      ),
    ],
  };
}
