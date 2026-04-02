const USER_AGENT = "liikenne.dev Digitraffic Showcase/1.0";
const JSON_HEADERS = {
  "Digitraffic-User": USER_AGENT,
};

const FINLAND_BOUNDS = { minLon: 19, maxLon: 31.7, minLat: 59.4, maxLat: 70.2 };
const ROAD_BOUNDS = { minLon: 20, maxLon: 31, minLat: 59.5, maxLat: 69.8 };
const MARINE_BOUNDS = { minLon: 18, maxLon: 31.7, minLat: 55, maxLat: 66.5 };
const HELSINKI_BOUNDS = { minLon: 23.7, maxLon: 26.6, minLat: 59.7, maxLat: 61.25 };
const CORRIDOR_BOUNDS = { minLon: 24.4, maxLon: 27.4, minLat: 59.9, maxLat: 60.9 };
const TURKU_BOUNDS = { minLon: 20.8, maxLon: 25.9, minLat: 59.9, maxLat: 61.4 };

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatMultiline(value) {
  return escapeHtml(value).replaceAll("\n", "<br>");
}

function dash(value) {
  return value === null || value === undefined || value === "" ? '<span class="status-muted">—</span>' : escapeHtml(value);
}

function formatNumber(value, digits = 0) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "—";
  }
  return new Intl.NumberFormat("fi-FI", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(Number(value));
}

function formatPercent(value, digits = 0) {
  return value === null || value === undefined ? "—" : `${formatNumber(value, digits)}%`;
}

function formatTime(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fi-FI", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Helsinki",
  }).format(new Date(value));
}

function formatDateTime(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fi-FI", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Helsinki",
  }).format(new Date(value));
}

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fi-FI", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Europe/Helsinki",
  }).format(new Date(value));
}

function differenceMinutes(from, to) {
  if (!from || !to) return null;
  return Math.round((new Date(to) - new Date(from)) / 60000);
}

function todayHelsinki() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Europe/Helsinki",
  }).formatToParts(new Date());
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

function isoHoursAgo(hours) {
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

async function fetchJson(url, options = {}) {
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

async function fetchJsonOptional(url, options = {}) {
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

async function fetchGraphQL(query) {
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

function renderStatGrid(stats) {
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

function renderTable(columns, rows) {
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

function renderBarList(items) {
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

function renderCards(items) {
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

function renderGeoPlot({ bounds, points = [], lines = [], polygons = [], legend = [] }) {
  const config = JSON.stringify({ bounds, points, lines, polygons, legend });
  return `<dt-map data-config="${escapeHtml(config)}"></dt-map>`;
}

function stationMap(stations) {
  return Object.fromEntries(stations.map((station) => [station.stationShortCode, station.stationName]));
}

function rowDelayClass(delay) {
  if (delay === null || delay === undefined) return "status-muted";
  if (delay <= 2) return "status-good";
  if (delay <= 10) return "status-warn";
  return "status-bad";
}

function timeRowAtStation(train, station, type) {
  return train.timeTableRows?.find((row) => row.stationShortCode === station && row.type === type && row.commercialStop !== false);
}

function destinationForTrain(train, map) {
  const arrivals = (train.timeTableRows || []).filter((row) => row.type === "ARRIVAL");
  const last = arrivals[arrivals.length - 1];
  if (!last) return "—";
  return map[last.stationShortCode] || last.stationShortCode;
}

function extractSensorByName(values, name) {
  return values.find((sensor) => sensor.name === name)?.value ?? null;
}

function extractSensorByPrefix(values, prefix) {
  return values.find((sensor) => sensor.name.startsWith(prefix))?.value ?? null;
}

function clampArray(items, count = 8) {
  return items.slice(0, count);
}

function requestSample(title, method, endpoint, sample, extra = {}) {
  return {
    title,
    method,
    endpoint,
    sample: sampleJson(sample),
    ...extra,
  };
}

async function demo1() {
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

async function demo2() {
  const locations = await fetchJson("https://rata.digitraffic.fi/api/v1/train-locations/latest");
  const active = locations.filter((item) => item.location?.coordinates?.length === 2);
  const topSpeed = clampArray(
    [...active].sort((a, b) => (b.speed || 0) - (a.speed || 0)).map((item) => ({
      label: `Train ${item.trainNumber}`,
      value: item.speed || 0,
      display: `${formatNumber(item.speed || 0)} km/h`,
      className: "rail",
    })),
    8,
  );
  const points = clampArray(active, 260).map((item) => ({
    lon: item.location.coordinates[0],
    lat: item.location.coordinates[1],
    radius: Math.max(3, Math.min(7, (item.speed || 0) / 28)),
    color: "var(--rail-solid)",
    title: `Train ${item.trainNumber} · ${item.speed || 0} km/h`,
  }));

  return {
    subtitle: `Latest position snapshot for ${formatNumber(active.length)} active trains.`,
    previewHtml: `
      ${renderGeoPlot({
        bounds: FINLAND_BOUNDS,
        points,
        legend: [{ color: "var(--rail-solid)", label: "Active train locations" }],
      })}
      ${renderBarList(topSpeed)}
    `,
    apiSections: [
      requestSample("Latest train locations", "GET", "https://rata.digitraffic.fi/api/v1/train-locations/latest", active[0]),
    ],
  };
}

async function demo3() {
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

async function demo4() {
  const compositions = await fetchJson(`https://rata.digitraffic.fi/api/v1/compositions/${todayHelsinki()}`);
  const composition = compositions.find((item) => item.journeySections?.[0]?.wagons?.length) || compositions[0];
  const section = composition.journeySections[0];
  const units = [
    ...section.locomotives.map((item) => ({ ...item, unitType: "locomotive" })),
    ...section.wagons.map((item) => ({ ...item, unitType: "wagon" })),
  ].sort((a, b) => a.location - b.location);
  const width = units.length * 88 + 24;

  return {
    subtitle: `Train ${composition.trainType} ${composition.trainNumber} from ${section.beginTimeTableRow.stationShortCode} to ${section.endTimeTableRow.stationShortCode}.`,
    previewHtml: `
      <div class="geo-frame">
        <svg viewBox="0 0 ${width} 150" class="geo-svg" role="img" aria-label="Train composition">
          ${units
            .map((unit, index) => {
              const x = 12 + index * 88;
              const fill = unit.unitType === "locomotive" ? "var(--text-primary)" : "var(--rail-solid)";
              const label = unit.unitType === "locomotive" ? unit.locomotiveType : unit.salesNumber || unit.location;
              const amenities = [
                unit.catering ? "Cafe" : null,
                unit.pet ? "Pets" : null,
                unit.playground ? "Play area" : null,
                unit.disabled ? "Accessible" : null,
              ]
                .filter(Boolean)
                .join(" · ");
              return `
                <g>
                  <rect x="${x}" y="20" width="80" height="52" rx="10" fill="${fill}"></rect>
                  <text x="${x + 40}" y="52" text-anchor="middle" font-size="16" fill="white" font-family="var(--font-mono)">${escapeHtml(String(label))}</text>
                  <text x="${x + 40}" y="94" text-anchor="middle" font-size="11" fill="var(--text-secondary)" font-family="var(--font-sans)">${escapeHtml(unit.wagonType || unit.powerType || "")}</text>
                  <text x="${x + 40}" y="112" text-anchor="middle" font-size="10" fill="var(--text-secondary)" font-family="var(--font-sans)">${escapeHtml(amenities)}</text>
                </g>
              `;
            })
            .join("")}
        </svg>
      </div>
    `,
    apiSections: [
      requestSample(
        "Daily train compositions",
        "GET",
        `https://rata.digitraffic.fi/api/v1/compositions/${todayHelsinki()}`,
        composition,
      ),
    ],
  };
}

async function demo5() {
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

async function demo6() {
  const query = `{
    passengerInformationMessages {
      id
      version
      creationDateTime
      startValidity
      endValidity
      trainNumber
      video { text { fi sv en } }
      audio { text { fi sv en } }
    }
  }`;
  const data = await fetchGraphQL(query);
  const now = Date.now();
  const messages = (data.passengerInformationMessages || [])
    .filter((message) => {
      return new Date(message.startValidity).getTime() <= now && new Date(message.endValidity).getTime() >= now;
    })
    .slice(0, 8);

  return {
    subtitle: `Latest ${formatNumber(messages.length)} active passenger information messages from rail GraphQL.`,
    note: "The original station filter in demos.md no longer validates in the current schema. This preview uses the supported query and filters active messages client-side.",
    previewHtml: `
      <div class="announcement-list">
        ${messages
          .map(
            (message) => `
              <article class="announcement-card">
                <h4>${escapeHtml(message.trainNumber ? `Train ${message.trainNumber}` : "Station message")}</h4>
                <div class="micro">${escapeHtml(`${formatDateTime(message.startValidity)} → ${formatDateTime(message.endValidity)}`)}</div>
                <div class="caption">${formatMultiline(message.video?.text?.en || message.audio?.text?.en || message.video?.text?.fi || message.audio?.text?.fi || "No text payload")}</div>
              </article>
            `,
          )
          .join("")}
      </div>
    `,
    apiSections: [
      requestSample("Passenger information GraphQL", "POST", "https://rata.digitraffic.fi/api/v2/graphql/graphql", messages[0], {
        body: query,
      }),
    ],
  };
}

async function demo7() {
  const data = await fetchJson("https://tie.digitraffic.fi/api/weathercam/v1/stations");
  const active = (data.features || [])
    .filter((feature) => feature.properties?.state === "OK" && feature.properties?.collectionStatus === "GATHERING")
    .map((feature) => ({
      id: feature.properties.id,
      name: feature.properties.name,
      presets: (feature.properties.presets || [])
        .filter((preset) => preset.inCollection)
        .slice(0, 4)
        .map((preset) => ({
          id: preset.id,
          label: preset.presentationName || preset.id,
          image: `https://weathercam.digitraffic.fi/${preset.id}.jpg`,
        })),
    }))
    .filter((station) => station.presets.length)
    .slice(0, 6);

  const primary = active[0];

  return {
    subtitle: `Current road weather images from ${escapeHtml(primary?.name || "the Finnish road network")}.`,
    previewHtml: `
      <div class="camera-layout" data-camera-demo="true">
        <div class="camera-stage">
          <img data-camera-stage alt="${escapeHtml(primary?.name || "Road weather camera")}" src="${escapeHtml(primary?.presets?.[0]?.image || "")}">
        </div>
        <div class="camera-strip">
          ${primary.presets
            .map(
              (preset) => `
                <div class="camera-thumb">
                  <button type="button" data-camera-thumb="${escapeHtml(preset.image)}">
                    <img src="${escapeHtml(preset.image)}" alt="${escapeHtml(preset.label)}">
                  </button>
                </div>
              `,
            )
            .join("")}
        </div>
        ${renderCards(
          active.map((station) => ({
            title: station.name,
            meta: `${station.presets.length} presets`,
            body: station.presets.map((preset) => preset.label).join(" · "),
          })),
        )}
      </div>
    `,
    enhance(container) {
      const stage = container.querySelector("[data-camera-stage]");
      container.querySelectorAll("[data-camera-thumb]").forEach((button) => {
        button.addEventListener("click", () => {
          stage.src = button.getAttribute("data-camera-thumb");
        });
      });
    },
    apiSections: [
      requestSample("Weather camera stations", "GET", "https://tie.digitraffic.fi/api/weathercam/v1/stations", data.features?.[0]),
    ],
  };
}

async function demo8() {
  const data = await fetchJson("https://tie.digitraffic.fi/api/weather/v1/stations/data");
  const stations = (data.stations || []).map((station) => {
    const values = station.sensorValues || [];
    return {
      id: station.id,
      air: extractSensorByName(values, "ILMA"),
      road: extractSensorByName(values, "TIE_1"),
      wind: extractSensorByName(values, "TUULENNOPEUSKESKIARVO"),
      visibility: extractSensorByName(values, "NAKYVYYS"),
    };
  });
  const withRoad = stations.filter((station) => station.road !== null);
  const coldest = clampArray([...withRoad].sort((a, b) => a.road - b.road), 8);
  const avgAir = stations.filter((station) => station.air !== null).reduce((sum, station, _, array) => sum + station.air / array.length, 0);
  const avgRoad = withRoad.reduce((sum, station, _, array) => sum + station.road / array.length, 0);

  return {
    subtitle: `Live readings from ${formatNumber(stations.length)} road weather stations.`,
    previewHtml: `
      ${renderStatGrid([
        { label: "Average air temp", value: `${formatNumber(avgAir, 1)} °C`, note: "Current network average" },
        { label: "Average road temp", value: `${formatNumber(avgRoad, 1)} °C`, note: "Surface sensor TIE_1" },
        {
          label: "Freezing stations",
          value: String(withRoad.filter((station) => station.road < 0).length),
          note: "Road surface below 0 °C",
        },
      ])}
      ${renderBarList(
        coldest.map((station) => ({
          label: `Station ${station.id}`,
          value: Math.abs(station.road),
          display: `${formatNumber(station.road, 1)} °C`,
          className: "road",
        })),
      )}
    `,
    apiSections: [
      requestSample("Road weather stations", "GET", "https://tie.digitraffic.fi/api/weather/v1/stations/data", data.stations?.[0]),
    ],
  };
}

async function demo9() {
  const data = await fetchJson("https://tie.digitraffic.fi/api/tms/v1/stations/data");
  const stations = (data.stations || [])
    .map((station) => {
      const values = station.sensorValues || [];
      const totalVolume = values
        .filter((sensor) => sensor.name.startsWith("OHITUKSET_5MIN_KIINTEA_SUUNTA"))
        .reduce((sum, sensor) => sum + (sensor.value || 0), 0);
      const avgSpeedSensors = values.filter((sensor) => sensor.name.startsWith("KESKINOPEUS_5MIN_KIINTEA_SUUNTA"));
      const avgSpeed = avgSpeedSensors.length
        ? avgSpeedSensors.reduce((sum, sensor) => sum + (sensor.value || 0), 0) / avgSpeedSensors.length
        : null;
      return {
        id: station.id,
        totalVolume,
        avgSpeed,
        measuredTime: station.dataUpdatedTime,
      };
    })
    .filter((station) => station.totalVolume > 0);

  const busiest = clampArray([...stations].sort((a, b) => b.totalVolume - a.totalVolume), 10);

  return {
    subtitle: "Latest five-minute traffic volume snapshot from TMS stations.",
    previewHtml: `
      ${renderStatGrid([
        { label: "Reporting stations", value: String(stations.length), note: "Non-zero five-minute volume" },
        {
          label: "Top station volume",
          value: formatNumber(busiest[0]?.totalVolume || 0),
          note: `Station ${busiest[0]?.id || "—"}`,
        },
        {
          label: "Average speed",
          value: `${formatNumber(
            stations.filter((station) => station.avgSpeed !== null).reduce((sum, station, _, array) => sum + station.avgSpeed / array.length, 0),
            0,
          )} km/h`,
          note: "Across stations with speed sensors",
        },
      ])}
      ${renderBarList(
        busiest.map((station) => ({
          label: `TMS ${station.id}`,
          value: station.totalVolume,
          display: `${formatNumber(station.totalVolume)} veh`,
          className: "road",
        })),
      )}
    `,
    apiSections: [
      requestSample("TMS station data", "GET", "https://tie.digitraffic.fi/api/tms/v1/stations/data", data.stations?.[1]),
    ],
  };
}

async function demo10() {
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

async function demo11() {
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

async function demo12() {
  const data = await fetchJson("https://tie.digitraffic.fi/api/variable-sign/v1/signs");
  const signs = (data.features || []).slice(0, 8);

  return {
    subtitle: `${formatNumber(data.features?.length || 0)} current variable sign states from Finnish highways.`,
    previewHtml: `
      <div class="list-grid">
        ${signs
          .map((feature) => {
            const props = feature.properties || {};
            const value = props.displayValue || props.displayedValue || (props.textRows || []).join(" ");
            return `
              <article class="mini-card">
                <div class="inline-stack">
                  <svg width="56" height="56" viewBox="0 0 60 60" aria-hidden="true">
                    <circle cx="30" cy="30" r="27" fill="white" stroke="#e5484d" stroke-width="4"></circle>
                    <text x="30" y="37" text-anchor="middle" font-size="20" font-family="Inter, sans-serif" fill="#1c2024">${escapeHtml(String(value || "!"))}</text>
                  </svg>
                  <div>
                    <h4>${escapeHtml(props.id)}</h4>
                    <div class="micro">${escapeHtml(props.type)} · ${escapeHtml(props.roadAddress || "")}</div>
                  </div>
                </div>
              </article>
            `;
          })
          .join("")}
      </div>
    `,
    apiSections: [
      requestSample("Variable signs", "GET", "https://tie.digitraffic.fi/api/variable-sign/v1/signs", data.features?.[0]),
    ],
  };
}

async function demo13() {
  const [locations, statuses] = await Promise.all([
    fetchJson("https://afir.digitraffic.fi/api/charging-network/v1/locations"),
    fetchJson("https://afir.digitraffic.fi/api/charging-network/v1/locations/statuses"),
  ]);
  const statusMap = Object.fromEntries((statuses.statuses || []).map((status) => [status.evseId, status.status]));
  const stations = (locations.features || [])
    .map((feature) => {
      const props = feature.properties || {};
      const evses = props.evses || [];
      const connectors = evses.flatMap((evse) => evse.connectors || []);
      const maxPower = Math.max(...connectors.map((connector) => connector.maxElectricPower || connector.maxPower || 0), 0);
      const statusesForStation = evses.map((evse) => statusMap[evse.id]).filter(Boolean);
      return {
        name: props.name,
        city: props.address?.city,
        lon: feature.geometry?.coordinates?.[0],
        lat: feature.geometry?.coordinates?.[1],
        evseCount: evses.length,
        maxPower,
        liveStatus: statusesForStation[0] || "UNKNOWN",
      };
    })
    .filter((station) => station.lon && station.lat)
    .sort((a, b) => b.maxPower - a.maxPower);

  return {
    subtitle: "Current AFIR charging network data from the live Digitraffic charging API.",
    note: "The markdown example points to tie.digitraffic.fi, but the current public AFIR API is served from afir.digitraffic.fi.",
    previewHtml: `
      ${renderGeoPlot({
        bounds: FINLAND_BOUNDS,
        points: clampArray(stations, 180).map((station) => ({
          lon: station.lon,
          lat: station.lat,
          color: station.liveStatus === "AVAILABLE" ? "var(--success)" : "var(--road-solid)",
          radius: Math.max(3, Math.min(8, station.evseCount)),
          title: `${station.name} · ${station.liveStatus}`,
        })),
        legend: [
          { color: "var(--success)", label: "Available" },
          { color: "var(--road-solid)", label: "Busy or blocked" },
        ],
      })}
      ${renderCards(
        clampArray(stations, 6).map((station) => ({
          title: station.name,
          meta: `${station.city || "Unknown city"} · ${station.evseCount} EVSEs`,
          body: `${formatNumber(station.maxPower, 0)} kW max · ${station.liveStatus}`,
        })),
      )}
    `,
    apiSections: [
      requestSample("Charging locations", "GET", "https://afir.digitraffic.fi/api/charging-network/v1/locations", locations.features?.[0]),
      requestSample("Live charging statuses", "GET", "https://afir.digitraffic.fi/api/charging-network/v1/locations/statuses", statuses.statuses?.[0]),
    ],
  };
}

async function demo14() {
  const data = await fetchJson("https://tie.digitraffic.fi/api/tms/v1/stations/data");
  const stations = (data.stations || [])
    .map((station) => {
      const values = station.sensorValues || [];
      const speeds = values.filter((sensor) => sensor.name.startsWith("KESKINOPEUS_5MIN_KIINTEA_SUUNTA"));
      const avgSpeed = speeds.length ? speeds.reduce((sum, sensor) => sum + (sensor.value || 0), 0) / speeds.length : null;
      const volume = values
        .filter((sensor) => sensor.name.startsWith("OHITUKSET_5MIN_KIINTEA_SUUNTA"))
        .reduce((sum, sensor) => sum + (sensor.value || 0), 0);
      return {
        id: station.id,
        avgSpeed,
        volume,
      };
    })
    .filter((station) => station.avgSpeed !== null)
    .sort((a, b) => (a.avgSpeed || 0) - (b.avgSpeed || 0));

  function fluencyClass(speed) {
    if (speed >= 85) return "Free";
    if (speed >= 60) return "Heavy";
    return "Congested";
  }

  return {
    subtitle: "Derived Helsinki-region fluency signal from current TMS speed and volume sensors.",
    note: "The public fluency endpoint used in demos.md is no longer available. This preview reconstructs a fluency view from current TMS station speeds.",
    previewHtml: renderTable(
      ["Station", "Average speed", "Volume", "Derived class"],
      clampArray(stations, 10).map((station) => [
        `<span class="mono">TMS ${station.id}</span>`,
        `<span class="mono">${escapeHtml(`${formatNumber(station.avgSpeed, 0)} km/h`)}</span>`,
        `<span class="mono">${escapeHtml(formatNumber(station.volume, 0))}</span>`,
        escapeHtml(fluencyClass(station.avgSpeed)),
      ]),
    ),
    apiSections: [
      requestSample("TMS data used for derived fluency", "GET", "https://tie.digitraffic.fi/api/tms/v1/stations/data", data.stations?.[1]),
    ],
  };
}

async function demo15() {
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

async function demo16() {
  const [locations, vessels] = await Promise.all([
    fetchJson("https://meri.digitraffic.fi/api/ais/v1/locations"),
    fetchJson("https://meri.digitraffic.fi/api/ais/v1/vessels"),
  ]);
  const meta = Object.fromEntries(vessels.map((vessel) => [vessel.mmsi, vessel]));
  const features = (locations.features || []).filter((feature) => feature.geometry?.coordinates?.length === 2);
  const fastest = clampArray(
    [...features]
      .sort((a, b) => (b.properties?.sog || 0) - (a.properties?.sog || 0))
      .map((feature) => {
        const vessel = meta[feature.mmsi];
        return {
          title: vessel?.name || `MMSI ${feature.mmsi}`,
          meta: `${escapeHtml(String(feature.properties?.sog || 0))} kn · type ${escapeHtml(String(vessel?.shipType || "—"))}`,
          body: vessel?.destination || "Destination unavailable",
        };
      }),
    6,
  );

  return {
    subtitle: `Current AIS snapshot with ${formatNumber(features.length)} vessel positions.`,
    previewHtml: `
      ${renderGeoPlot({
        bounds: MARINE_BOUNDS,
        points: clampArray(features, 260).map((feature) => ({
          lon: feature.geometry.coordinates[0],
          lat: feature.geometry.coordinates[1],
          color: "var(--marine-solid)",
          radius: Math.max(3, Math.min(7, (feature.properties?.sog || 0) / 6)),
          title: `${meta[feature.mmsi]?.name || feature.mmsi} · ${feature.properties?.sog || 0} kn`,
        })),
        legend: [{ color: "var(--marine-solid)", label: "Vessels in latest AIS snapshot" }],
      })}
      ${renderCards(fastest)}
    `,
    apiSections: [
      requestSample("AIS locations", "GET", "https://meri.digitraffic.fi/api/ais/v1/locations", features[0]),
      requestSample("Vessel metadata", "GET", "https://meri.digitraffic.fi/api/ais/v1/vessels", vessels[0]),
    ],
  };
}

async function demo17() {
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

async function demo18() {
  const [faults, disruptions] = await Promise.all([
    fetchJson("https://meri.digitraffic.fi/api/aton/v1/faults"),
    fetchJson("https://meri.digitraffic.fi/api/bridge-lock/v1/disruptions"),
  ]);
  const faultFeatures = faults.features || [];
  const disruptionFeatures = disruptions.features || [];
  return {
    subtitle: "Current marine hazard proxy using AtoN faults and waterway disruptions.",
    note: "The nautical warning endpoint referenced in demos.md is not published in the current marine documentation. This preview uses the supported live marine hazard feeds that are available today.",
    previewHtml: `
      ${renderGeoPlot({
        bounds: MARINE_BOUNDS,
        points: clampArray(faultFeatures, 180).map((feature) => ({
          lon: feature.geometry.coordinates[0],
          lat: feature.geometry.coordinates[1],
          color: "var(--marine-solid)",
          radius: 4,
          title: `${feature.properties?.aton_name_fi || "AtoN fault"} · ${feature.properties?.type || ""}`,
        })),
        legend: [
          { color: "var(--marine-solid)", label: "AtoN faults" },
          { color: "var(--accent-solid)", label: "Bridge and lock disruptions" },
        ],
      })}
      ${renderCards(
        clampArray(
          [
            ...faultFeatures.map((feature) => ({
              title: feature.properties?.aton_name_fi || "AtoN fault",
              meta: `${feature.properties?.type || "Fault"} · ${feature.properties?.area_description || ""}`,
              body: feature.properties?.fairway_name_fi || "",
            })),
            ...disruptionFeatures.map((feature) => ({
              title: feature.properties?.descriptionEn || "Waterway disruption",
              meta: formatDateTime(feature.properties?.startDate),
              body: feature.properties?.descriptionFi || "",
            })),
          ],
          6,
        ),
      )}
    `,
    apiSections: [
      requestSample("AtoN faults", "GET", "https://meri.digitraffic.fi/api/aton/v1/faults", faultFeatures[0]),
      requestSample("Bridge and lock disruptions", "GET", "https://meri.digitraffic.fi/api/bridge-lock/v1/disruptions", disruptionFeatures[0]),
    ],
  };
}

async function demo19() {
  const data = await fetchJson("https://meri.digitraffic.fi/api/sse/v1/measurements");
  const features = (data.features || []).filter((feature) => feature.geometry?.coordinates?.length === 2);
  return {
    subtitle: `Sea state estimation from ${formatNumber(features.length)} buoy and fixed sites.`,
    previewHtml: `
      ${renderGeoPlot({
        bounds: MARINE_BOUNDS,
        points: clampArray(features, 180).map((feature) => ({
          lon: feature.geometry.coordinates[0],
          lat: feature.geometry.coordinates[1],
          color: "var(--marine-solid)",
          radius: 4,
          title: `${feature.properties?.siteName || feature.siteNumber} · ${feature.properties?.seaState || "No reading"}`,
        })),
        legend: [{ color: "var(--marine-solid)", label: "Sea-state sites" }],
      })}
      ${renderCards(
        clampArray(features, 6).map((feature) => ({
          title: feature.properties?.siteName || String(feature.siteNumber),
          meta: `${feature.properties?.seaState || "Unknown"} · ${feature.properties?.confidence || "No confidence"}`,
          body: `Trend: ${feature.properties?.trend || "—"} · Temp ${formatNumber(feature.properties?.temperature, 0)} °C`,
        })),
      )}
    `,
    apiSections: [
      requestSample("Sea state measurements", "GET", "https://meri.digitraffic.fi/api/sse/v1/measurements", features[0]),
    ],
  };
}

async function demo20() {
  const [dirways, vessels, locations] = await Promise.all([
    fetchJson("https://meri.digitraffic.fi/api/winter-navigation/v2/dirways"),
    fetchJson("https://meri.digitraffic.fi/api/winter-navigation/v2/vessels"),
    fetchJson("https://meri.digitraffic.fi/api/winter-navigation/v2/locations"),
  ]);
  const lines = (dirways.features || [])
    .filter((feature) => feature.geometry?.type === "LineString")
    .map((feature) => ({
      coordinates: feature.geometry.coordinates,
      color: "var(--marine-solid)",
      width: 2,
    }));
  const points = (locations.features || [])
    .filter((feature) => feature.geometry?.coordinates?.length === 2)
    .map((feature) => ({
      lon: feature.geometry.coordinates[0],
      lat: feature.geometry.coordinates[1],
      color: "var(--accent-solid)",
      radius: 4,
      title: feature.properties?.name || "Winter navigation location",
    }));

  return {
    subtitle: `Live winter-navigation geometry with ${formatNumber(lines.length)} dirways and ${formatNumber(vessels.length)} vessels.`,
    note: "The current marine docs publish winter-navigation locations and vessels. This preview uses those supported endpoints to show the live ice-assistance layer.",
    previewHtml: `
      ${renderGeoPlot({
        bounds: MARINE_BOUNDS,
        lines: clampArray(lines, 60),
        points: clampArray(points, 80),
        legend: [
          { color: "var(--marine-solid)", label: "Dirways" },
          { color: "var(--accent-solid)", label: "Locations" },
        ],
      })}
      ${renderCards(
        clampArray(vessels, 6).map((vessel) => ({
          title: vessel.name || `IMO ${vessel.imo || "—"}`,
          meta: `${vessel.iceClass || "Ice class unavailable"} · ${vessel.destination || "No destination"}`,
          body: vessel.ibnetId ? `IBNet ${vessel.ibnetId}` : "Live winter-navigation vessel feed",
        })),
      )}
    `,
    apiSections: [
      requestSample("Winter dirways", "GET", "https://meri.digitraffic.fi/api/winter-navigation/v2/dirways", dirways.features?.[0]),
      requestSample("Winter navigation locations", "GET", "https://meri.digitraffic.fi/api/winter-navigation/v2/locations", locations.features?.[0]),
      requestSample("Winter navigation vessels", "GET", "https://meri.digitraffic.fi/api/winter-navigation/v2/vessels", vessels[0]),
    ],
  };
}

async function demo21() {
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

async function demo22() {
  const [weather, journeys, tms, marineFaults] = await Promise.all([
    fetchJson("https://tie.digitraffic.fi/api/weather/v1/stations/data"),
    fetchJson(`https://rata.digitraffic.fi/api/v1/live-trains/station/HKI/TPE?departure_date=${todayHelsinki()}`),
    fetchJson("https://tie.digitraffic.fi/api/tms/v1/stations/data"),
    fetchJson("https://meri.digitraffic.fi/api/aton/v1/faults"),
  ]);

  const freezing = (weather.stations || []).filter((station) => extractSensorByName(station.sensorValues || [], "TIE_1") < 0).length;
  const trainDelays = journeys
    .map((train) => {
      const arr = timeRowAtStation(train, "TPE", "ARRIVAL");
      return arr?.differenceInMinutes || 0;
    })
    .filter((value) => value > 0);
  const avgTrainDelay = trainDelays.length ? trainDelays.reduce((sum, value) => sum + value, 0) / trainDelays.length : 0;
  const avgRoadSpeed = (tms.stations || [])
    .flatMap((station) => station.sensorValues || [])
    .filter((sensor) => sensor.name.startsWith("KESKINOPEUS_5MIN_KIINTEA_SUUNTA"))
    .reduce((acc, sensor, index, array) => acc + (sensor.value || 0) / array.length, 0);

  return {
    subtitle: "A live cross-domain weather impact sketch using road, rail, and marine data.",
    previewHtml: renderStatGrid([
      { label: "Freezing road stations", value: String(freezing), note: `${weather.stations?.length || 0} weather stations` },
      { label: "Average train delay", value: `${formatNumber(avgTrainDelay, 1)} min`, note: "HKI → TPE sample route" },
      { label: "Average road speed", value: `${formatNumber(avgRoadSpeed, 0)} km/h`, note: `${marineFaults.features?.length || 0} marine AtoN faults` },
    ]),
    apiSections: [
      requestSample("Road weather", "GET", "https://tie.digitraffic.fi/api/weather/v1/stations/data", weather.stations?.[0]),
      requestSample("Rail route sample", "GET", `https://rata.digitraffic.fi/api/v1/live-trains/station/HKI/TPE?departure_date=${todayHelsinki()}`, journeys[0]),
      requestSample("Marine hazard proxy", "GET", "https://meri.digitraffic.fi/api/aton/v1/faults", marineFaults.features?.[0]),
    ],
  };
}

async function demo23() {
  const [portCalls, trains] = await Promise.all([
    fetchJson("https://meri.digitraffic.fi/api/port-call/v1/port-calls?locode=FITKU"),
    fetchJson(`https://rata.digitraffic.fi/api/v1/live-trains/station/TKU/HKI?departure_date=${todayHelsinki()}`),
  ]);
  const now = Date.now();
  const arrivals = (portCalls.portCalls || [])
    .filter((call) => call.portCallTimestamp && new Date(call.portCallTimestamp).getTime() > now)
    .sort((a, b) => new Date(a.portCallTimestamp) - new Date(b.portCallTimestamp))
    .slice(0, 3);

  const connections = arrivals.map((arrival) => {
    const eta = new Date(arrival.portCallTimestamp);
    const options = trains
      .map((train) => {
        const dep = timeRowAtStation(train, "TKU", "DEPARTURE");
        return dep ? { train, dep } : null;
      })
      .filter(Boolean)
      .filter((item) => new Date(item.dep.scheduledTime).getTime() > eta.getTime() + 60 * 60 * 1000)
      .slice(0, 3);
    return {
      vessel: arrival.vesselName,
      eta: formatDateTime(arrival.portCallTimestamp),
      options,
    };
  });

  return {
    subtitle: "Upcoming Turku ship arrivals paired with onward train connections to Helsinki.",
    previewHtml: `
      <div class="flow">
        ${connections
          .map(
            (connection) => `
              <section class="flow-step">
                <h4>${escapeHtml(connection.vessel)}</h4>
                <div class="micro">ETA ${escapeHtml(connection.eta)}</div>
                <div class="event-list">
                  ${connection.options
                    .map(
                      (option) => `
                        <div class="event-card">
                          <h4>${escapeHtml(`${option.train.trainType} ${option.train.trainNumber}`)}</h4>
                          <div class="micro">Departs ${escapeHtml(formatTime(option.dep.scheduledTime))}</div>
                        </div>
                      `,
                    )
                    .join("")}
                </div>
              </section>
            `,
          )
          .join("")}
      </div>
    `,
    apiSections: [
      requestSample("Turku port calls", "GET", "https://meri.digitraffic.fi/api/port-call/v1/port-calls?locode=FITKU", portCalls.portCalls?.[0]),
      requestSample("Turku → Helsinki trains", "GET", `https://rata.digitraffic.fi/api/v1/live-trains/station/TKU/HKI?departure_date=${todayHelsinki()}`, trains[0]),
    ],
  };
}

async function demo24() {
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

async function demo25() {
  const [trains, weather, tms, disruptions] = await Promise.all([
    fetchJson(`https://rata.digitraffic.fi/api/v1/live-trains/station/HKI/PSL?departure_date=${todayHelsinki()}`),
    fetchJson("https://tie.digitraffic.fi/api/weather/v1/stations/data"),
    fetchJson("https://tie.digitraffic.fi/api/tms/v1/stations/data"),
    fetchJson("https://tie.digitraffic.fi/api/traffic-message/v1/messages?situationType=TRAFFIC_ANNOUNCEMENT&inactiveHours=0"),
  ]);

  const now = Date.now();
  const nextTrain = trains
    .map((train) => {
      const dep = timeRowAtStation(train, "HKI", "DEPARTURE");
      return dep ? { train, dep } : null;
    })
    .filter(Boolean)
    .find((item) => new Date(item.dep.scheduledTime).getTime() > now && !item.train.cancelled);

  const freezing = (weather.stations || []).some((station) => extractSensorByName(station.sensorValues || [], "TIE_1") < -2);
  const avgSpeed = (tms.stations || [])
    .flatMap((station) => station.sensorValues || [])
    .filter((sensor) => sensor.name.startsWith("KESKINOPEUS_5MIN_KIINTEA_SUUNTA"))
    .reduce((acc, sensor, index, array) => acc + (sensor.value || 0) / array.length, 0);

  let recommendation = {
    mode: "TRAIN",
    confidence: "HIGH",
    reason: nextTrain ? `Next train ${nextTrain.train.trainType} ${nextTrain.train.trainNumber} departs at ${formatTime(nextTrain.dep.scheduledTime)}` : "Rail is the most predictable current option.",
    className: "pill-success",
  };

  if (!nextTrain) {
    recommendation = {
      mode: "DRIVE",
      confidence: "MEDIUM",
      reason: "No immediate train departure was available in the current sample route.",
      className: "pill-road",
    };
  }

  if (freezing && (disruptions.features?.length || 0) > 20 && avgSpeed < 60) {
    recommendation = {
      mode: "REMOTE",
      confidence: "HIGH",
      reason: "Freezing roads, slower traffic, and a busy road disruption feed all point to staying flexible today.",
      className: "pill-error",
    };
  }

  return {
    subtitle: "A live commute recommendation using current rail, weather, and road conditions.",
    previewHtml: `
      <div class="recommendation">
        <span class="recommendation-pill ${escapeHtml(recommendation.className)}">${escapeHtml(`${recommendation.mode} · ${recommendation.confidence}`)}</span>
        <div>${escapeHtml(recommendation.reason)}</div>
        ${renderStatGrid([
          { label: "Next train", value: nextTrain ? formatTime(nextTrain.dep.scheduledTime) : "—", note: "HKI → PSL sample route" },
          { label: "Freezing roads", value: freezing ? "Yes" : "No", note: "Road surface below -2 °C" },
          { label: "Road disruptions", value: String(disruptions.features?.length || 0), note: `${formatNumber(avgSpeed, 0)} km/h avg TMS speed` },
        ])}
      </div>
    `,
    apiSections: [
      requestSample("Rail option", "GET", `https://rata.digitraffic.fi/api/v1/live-trains/station/HKI/PSL?departure_date=${todayHelsinki()}`, trains[0]),
      requestSample("Road weather option", "GET", "https://tie.digitraffic.fi/api/weather/v1/stations/data", weather.stations?.[0]),
      requestSample("Road disruption option", "GET", "https://tie.digitraffic.fi/api/traffic-message/v1/messages?situationType=TRAFFIC_ANNOUNCEMENT&inactiveHours=0", disruptions.features?.[0]),
    ],
  };
}

async function demo26() {
  const from = isoHoursAgo(24);
  const [portCalls, rail, maintenance, weather, disruptions] = await Promise.all([
    fetchJson(`https://meri.digitraffic.fi/api/port-call/v1/port-calls?locode=FIKTK&from=${encodeURIComponent(from)}`),
    fetchJson("https://rata.digitraffic.fi/api/v1/live-trains/station/KTK?departing_trains=15&arrived_trains=5"),
    fetchJson("https://tie.digitraffic.fi/api/maintenance/v1/tracking/routes/latest?domain=state-roads"),
    fetchJson("https://tie.digitraffic.fi/api/weather/v1/stations/data"),
    fetchJson("https://tie.digitraffic.fi/api/traffic-message/v1/messages?situationType=TRAFFIC_ANNOUNCEMENT&inactiveHours=0"),
  ]);

  const nextArrival = (portCalls.portCalls || [])
    .filter((call) => call.portCallTimestamp && new Date(call.portCallTimestamp).getTime() > Date.now())
    .sort((a, b) => new Date(a.portCallTimestamp) - new Date(b.portCallTimestamp))[0];
  const activeCargo = rail.filter((train) => train.trainCategory === "Cargo").length;
  const corridorWeather = (weather.stations || []).filter((station) => station.lon >= 24.4 && station.lon <= 27.4 && station.lat >= 59.9 && station.lat <= 60.9);
  const corridorMaintenance = (maintenance.features || []).filter((feature) => {
    const [lon, lat] = feature.geometry.coordinates;
    return lon >= 24.4 && lon <= 27.4 && lat >= 59.9 && lat <= 60.9;
  });

  return {
    subtitle: "A live corridor view for the Kotka to Helsinki freight chain.",
    previewHtml: `
      <div class="flow">
        <section class="flow-step">
          <h4>Port</h4>
          <div class="caption">${escapeHtml(nextArrival?.vesselName || "No upcoming arrival found")}</div>
          <div class="micro">${escapeHtml(nextArrival ? `ETA ${formatDateTime(nextArrival.portCallTimestamp)}` : `${portCalls.portCalls?.length || 0} calls in 24h`)}</div>
        </section>
        <section class="flow-step">
          <h4>Rail</h4>
          <div class="caption">${escapeHtml(`${activeCargo} active cargo trains`)}</div>
          <div class="micro">${escapeHtml(`${rail.length} trains in current KTK board`)}</div>
        </section>
        <section class="flow-step">
          <h4>Road</h4>
          <div class="caption">${escapeHtml(`${corridorMaintenance.length} maintenance points on corridor`)}</div>
          <div class="micro">${escapeHtml(`${disruptions.features?.length || 0} active road announcements`)}</div>
        </section>
      </div>
      ${renderStatGrid([
        { label: "Weather stations", value: String(corridorWeather.length), note: "Along the E18 corridor sample" },
        { label: "Maintenance points", value: String(corridorMaintenance.length), note: "Current latest positions" },
        { label: "Port calls 24h", value: String(portCalls.portCalls?.length || 0), note: "Kotka/HaminaKotka" },
      ])}
    `,
    apiSections: [
      requestSample("Kotka port calls", "GET", `https://meri.digitraffic.fi/api/port-call/v1/port-calls?locode=FIKTK&from=${from}`, portCalls.portCalls?.[0]),
      requestSample("Kotka train board", "GET", "https://rata.digitraffic.fi/api/v1/live-trains/station/KTK?departing_trains=15&arrived_trains=5", rail[0]),
      requestSample("Corridor maintenance", "GET", "https://tie.digitraffic.fi/api/maintenance/v1/tracking/routes/latest?domain=state-roads", maintenance.features?.[0]),
    ],
  };
}

export const demoLiveRegistry = {
  1: demo1,
  2: demo2,
  3: demo3,
  4: demo4,
  5: demo5,
  6: demo6,
  7: demo7,
  8: demo8,
  9: demo9,
  10: demo10,
  11: demo11,
  12: demo12,
  13: demo13,
  14: demo14,
  15: demo15,
  16: demo16,
  17: demo17,
  18: demo18,
  19: demo19,
  20: demo20,
  21: demo21,
  22: demo22,
  23: demo23,
  24: demo24,
  25: demo25,
  26: demo26,
};
