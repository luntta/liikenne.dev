import { escapeHtml } from "../utils.js";
export { escapeHtml };

const USER_AGENT = "liikenne.dev Digitraffic Showcase/1.0";
const JSON_HEADERS = {
  "Digitraffic-User": USER_AGENT,
};

export const FINLAND_BOUNDS = { minLon: 19, maxLon: 31.7, minLat: 59.4, maxLat: 70.2 };
export const ROAD_BOUNDS = { minLon: 20, maxLon: 31, minLat: 59.5, maxLat: 69.8 };
export const MARINE_BOUNDS = { minLon: 18, maxLon: 31.7, minLat: 55, maxLat: 66.5 };
export const HELSINKI_BOUNDS = { minLon: 23.7, maxLon: 26.6, minLat: 59.7, maxLat: 61.25 };
export const CORRIDOR_BOUNDS = { minLon: 24.4, maxLon: 27.4, minLat: 59.9, maxLat: 60.9 };
export const TURKU_BOUNDS = { minLon: 20.8, maxLon: 25.9, minLat: 59.9, maxLat: 61.4 };

export function formatMultiline(value) {
  return escapeHtml(value).replaceAll("\n", "<br>");
}

export function dash(value) {
  return value === null || value === undefined || value === "" ? '<span class="status-muted">—</span>' : escapeHtml(value);
}

export function formatNumber(value, digits = 0) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "—";
  }
  return new Intl.NumberFormat("fi-FI", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(Number(value));
}

export function formatPercent(value, digits = 0) {
  return value === null || value === undefined ? "—" : `${formatNumber(value, digits)}%`;
}

export function formatTime(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fi-FI", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Helsinki",
  }).format(new Date(value));
}

export function formatDateTime(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fi-FI", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Helsinki",
  }).format(new Date(value));
}

export function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fi-FI", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Europe/Helsinki",
  }).format(new Date(value));
}

export function differenceMinutes(from, to) {
  if (!from || !to) return null;
  return Math.round((new Date(to) - new Date(from)) / 60000);
}

export function todayHelsinki() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Europe/Helsinki",
  }).formatToParts(new Date());
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

export function isoHoursAgo(hours) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function sampleJson(value, depth = 2) {
  if (depth < 0) return "…";
  if (Array.isArray(value)) {
    return value.slice(0, 3).map((item) => sampleJson(item, depth - 1));
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value).slice(0, 10);
    return Object.fromEntries(entries.map(([key, item]) => [key, sampleJson(item, depth - 1)]));
  }
  return value;
}

export async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...JSON_HEADERS,
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status} ${response.statusText}: ${text.slice(0, 200)}`);
  }

  return response.json();
}

export async function fetchJsonOptional(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...JSON_HEADERS,
      ...(options.headers || {}),
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status} ${response.statusText}: ${text.slice(0, 200)}`);
  }

  return response.json();
}

export async function fetchGraphQL(query) {
  const response = await fetch("https://rata.digitraffic.fi/api/v2/graphql/graphql", {
    method: "POST",
    headers: {
      ...JSON_HEADERS,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status} ${response.statusText}: ${text.slice(0, 200)}`);
  }

  const data = await response.json();
  if (data.errors?.length) {
    throw new Error(data.errors.map((error) => error.message).join("; "));
  }
  return data.data;
}

export function renderStatGrid(stats) {
  return `
    <div class="stat-grid">
      ${stats
        .map(
          (stat) => `
            <div class="stat-card">
              <span class="stat-label">${escapeHtml(stat.label)}</span>
              <span class="stat-value">${escapeHtml(stat.value)}</span>
              <span class="stat-note">${escapeHtml(stat.note || "")}</span>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}

export function renderTable(columns, rows) {
  return `
    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>${columns.map((column) => `<th>${escapeHtml(column)}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (row) => `
                <tr>${row.map((cell) => `<td>${cell ?? '<span class="status-muted">—</span>'}</td>`).join("")}</tr>
              `,
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

export function renderBarList(items) {
  const maxValue = Math.max(...items.map((item) => item.value || 0), 1);
  return `
    <div class="bar-list">
      ${items
        .map((item) => {
          const width = Math.max(4, Math.round(((item.value || 0) / maxValue) * 100));
          return `
            <div class="bar-row">
              <div class="bar-label">${escapeHtml(item.label)}</div>
              <div class="bar-track"><div class="bar-fill ${escapeHtml(item.className || "")}" style="width:${width}%"></div></div>
              <div class="bar-value">${escapeHtml(item.display)}</div>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

export function renderCards(items) {
  return `
    <div class="list-grid">
      ${items
        .map(
          (item) => `
            <article class="mini-card">
              <h4>${escapeHtml(item.title)}</h4>
              ${item.meta ? `<div class="micro">${escapeHtml(item.meta)}</div>` : ""}
              ${item.body ? `<div class="caption">${item.body}</div>` : ""}
            </article>
          `,
        )
        .join("")}
    </div>
  `;
}

export function renderGeoPlot({ bounds, points = [], lines = [], polygons = [], legend = [] }) {
  const config = JSON.stringify({ bounds, points, lines, polygons, legend });
  return `<dt-map data-config="${escapeHtml(config)}"></dt-map>`;
}

export function stationMap(stations) {
  return Object.fromEntries(stations.map((station) => [station.stationShortCode, station.stationName]));
}

export function rowDelayClass(delay) {
  if (delay === null || delay === undefined) return "status-muted";
  if (delay <= 2) return "status-good";
  if (delay <= 10) return "status-warn";
  return "status-bad";
}

export function timeRowAtStation(train, station, type) {
  return train.timeTableRows?.find((row) => row.stationShortCode === station && row.type === type && row.commercialStop !== false);
}

export function destinationForTrain(train, map) {
  const arrivals = (train.timeTableRows || []).filter((row) => row.type === "ARRIVAL");
  const last = arrivals[arrivals.length - 1];
  if (!last) return "—";
  return map[last.stationShortCode] || last.stationShortCode;
}

export function extractSensorByName(values, name) {
  return values.find((sensor) => sensor.name === name)?.value ?? null;
}

export function extractSensorByPrefix(values, prefix) {
  return values.find((sensor) => sensor.name.startsWith(prefix))?.value ?? null;
}

export function clampArray(items, count = 8) {
  return items.slice(0, count);
}

export function requestSample(title, method, endpoint, sample, extra = {}) {
  return {
    title,
    method,
    endpoint,
    sample: sampleJson(sample),
    ...extra,
  };
}
