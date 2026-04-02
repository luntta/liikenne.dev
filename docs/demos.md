# Digitraffic Open Data Showcase
## What You Can Build With Finland's Traffic Data

*A product owner's guide to 26 demo applications — with working code for each.*

---

## Platform Overview

Digitraffic provides **free, open, real-time data** about all modes of Finnish transport under a CC 4.0 license. Three API domains cover road, rail, and sea — each with REST endpoints and live MQTT WebSocket feeds.

| Domain | Base URL | Update Frequency | Real-time Feed |
|--------|----------|-------------------|----------------|
| Road | `tie.digitraffic.fi` | 1 min (sensors), 10 min (cameras) | `wss://tie.digitraffic.fi:443/mqtt` |
| Rail | `rata.digitraffic.fi` | Seconds (GPS), minutes (timetables) | `wss://rata.digitraffic.fi:443/mqtt` |
| Marine | `meri.digitraffic.fi` | 10 min (REST), real-time (MQTT) | `wss://meri.digitraffic.fi:443/mqtt` |

**Common headers for all requests:**
```http
Digitraffic-User: YourAppName/1.0
Accept-Encoding: gzip
```

---

# PART 1 — RAIL DEMOS

---

## Demo 1: Live Train Departure Board

A classic split-flap style departure/arrival board for any Finnish railway station.

**APIs Used:**
- `GET /api/v1/live-trains/station/{stationShortCode}?departing_trains=10&arrived_trains=0&arriving_trains=5`
- `GET /api/v1/metadata/stations` (station list)

**What the user sees:** Real-time departures with train number, destination, scheduled time, estimated time, track number, and a color-coded delay indicator. Auto-refreshes every 30 seconds.

```javascript
// Fetch departing trains from Helsinki (HKI)
const STATION = 'HKI';

// 1. Get station metadata (cache this — updated twice daily)
const stationsRes = await fetch(
  'https://rata.digitraffic.fi/api/v1/metadata/stations',
  { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }
);
const stations = await stationsRes.json();
const stationMap = Object.fromEntries(
  stations.map(s => [s.stationShortCode, s.stationName])
);

// 2. Get live departures
const trainsRes = await fetch(
  `https://rata.digitraffic.fi/api/v1/live-trains/station/${STATION}?departing_trains=10&arrived_trains=0&arriving_trains=0`,
  { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }
);
const trains = await trainsRes.json();

// 3. Parse each train into a departure row
const departures = trains.map(train => {
  // Find the departure row for our station
  const depRow = train.timeTableRows.find(
    r => r.stationShortCode === STATION && r.type === 'DEPARTURE'
  );
  // Find the final destination (last ARRIVAL row)
  const arrivals = train.timeTableRows.filter(r => r.type === 'ARRIVAL');
  const destination = arrivals[arrivals.length - 1];

  const scheduled = new Date(depRow.scheduledTime);
  const estimated = depRow.liveEstimateTime
    ? new Date(depRow.liveEstimateTime)
    : scheduled;
  const delayMinutes = Math.round((estimated - scheduled) / 60000);

  return {
    trainNumber: train.trainNumber,
    trainType: train.trainType,           // IC, S, P, HDM, ...
    commuterLine: train.commuterLineID,   // A, E, U, K, ... (commuter)
    destination: stationMap[destination.stationShortCode] || destination.stationShortCode,
    scheduledTime: scheduled.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' }),
    estimatedTime: estimated.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' }),
    track: depRow.commercialTrack,
    delayMinutes,
    cancelled: train.cancelled
  };
});

// Sort by scheduled departure time
departures.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));

console.log(departures);
// → [{ trainNumber: 71, trainType: "IC", destination: "Oulu",
//      scheduledTime: "14:25", estimatedTime: "14:28",
//      track: "8", delayMinutes: 3, cancelled: false }, ...]
```

**Key data fields:** `trainType` (IC/S/P/HDM), `commuterLineID` (A/E/K/U for Helsinki commuter trains), `cancelled`, `commercialTrack`, `liveEstimateTime`.

---

## Demo 2: Live Train Tracker Map

Every active train in Finland plotted on a map with real-time GPS updates via MQTT WebSocket.

**APIs Used:**
- `GET /api/v1/train-locations/latest` (initial snapshot)
- MQTT topic `train-locations/#` (live updates)
- GraphQL for train details on click

**What the user sees:** An animated map of Finland. Colored dots move along rail lines. Click a dot to see train number, speed, route, and delay.

```javascript
// === STEP 1: Fetch initial positions for all trains ===
const locRes = await fetch(
  'https://rata.digitraffic.fi/api/v1/train-locations/latest',
  { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }
);
const locations = await locRes.json();
// Each: { trainNumber, departureDate, timestamp, speed,
//         location: { type: "Point", coordinates: [lon, lat] } }

// === STEP 2: Connect MQTT for live updates ===
// Using Eclipse Paho MQTT.js client
const client = new Paho.MQTT.Client(
  'rata.digitraffic.fi', 443, `demo-app-${Date.now()}`
);

client.onMessageArrived = (message) => {
  const payload = JSON.parse(message.payloadString);
  // payload: { trainNumber, departureDate, timestamp, speed,
  //            location: { type: "Point", coordinates: [lon, lat] } }

  // Update marker on map
  updateTrainMarker(payload.trainNumber, {
    lng: payload.location.coordinates[0],
    lat: payload.location.coordinates[1],
    speed: payload.speed
  });
};

client.connect({
  useSSL: true,
  onSuccess: () => {
    // Subscribe to all train location updates
    client.subscribe('train-locations/#');
    // Or single train: client.subscribe('train-locations/2025-04-01/71');
  }
});

// === STEP 3: Get train details via GraphQL (on click) ===
async function getTrainDetails(trainNumber, departureDate) {
  const query = `{
    trainsByDepartureDate(
      departureDate: "${departureDate}",
      where: { trainNumber: { equals: ${trainNumber} } }
    ) {
      trainNumber
      trainType
      commuterLineid
      operator { shortCode }
      timeTableRows {
        station { name shortCode }
        type
        scheduledTime
        liveEstimateTime
        differenceInMinutes
        commercialStop
      }
    }
  }`;

  const res = await fetch('https://rata.digitraffic.fi/api/v2/graphql/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Digitraffic-User': 'DemoApp/1.0' },
    body: JSON.stringify({ query })
  });
  return (await res.json()).data.trainsByDepartureDate[0];
}
```

**MQTT topics for rail:**
| Topic | Description |
|-------|-------------|
| `train-locations/#` | All train GPS locations |
| `train-locations/{departureDate}/{trainNumber}` | Single train |
| `trains/{departureDate}/{trainNumber}` | Timetable changes |

---

## Demo 3: Train Delay Analyzer

Aggregated delay statistics: which stations and routes perform worst, time-of-day patterns.

**APIs Used:**
- GraphQL `trainsByDepartureDate` with date ranges
- `GET /api/v1/trains/{date}` (all trains for a date)

```javascript
// Fetch all trains for a given date and compute delay stats
async function getDelayStats(date) {
  const res = await fetch(
    `https://rata.digitraffic.fi/api/v1/trains/${date}`,
    { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }
  );
  const trains = await res.json();

  const stationDelays = {};

  trains.forEach(train => {
    train.timeTableRows
      .filter(r => r.type === 'ARRIVAL' && r.differenceInMinutes != null)
      .forEach(row => {
        const code = row.stationShortCode;
        if (!stationDelays[code]) {
          stationDelays[code] = { totalDelay: 0, count: 0, over5min: 0, over15min: 0 };
        }
        stationDelays[code].count++;
        stationDelays[code].totalDelay += row.differenceInMinutes;
        if (row.differenceInMinutes > 5) stationDelays[code].over5min++;
        if (row.differenceInMinutes > 15) stationDelays[code].over15min++;
      });
  });

  // Rank stations by average delay
  return Object.entries(stationDelays)
    .map(([code, stats]) => ({
      station: code,
      avgDelay: (stats.totalDelay / stats.count).toFixed(1),
      punctuality: (((stats.count - stats.over5min) / stats.count) * 100).toFixed(1),
      totalTrains: stats.count
    }))
    .sort((a, b) => b.avgDelay - a.avgDelay);
}

// Usage
const stats = await getDelayStats('2025-04-01');
// → [{ station: "TPE", avgDelay: "4.2", punctuality: "78.3", totalTrains: 312 }, ...]
```

---

## Demo 4: Train Composition Visualizer

SVG diagram showing a train's locomotive and wagon layout — 1st class, 2nd class, restaurant car, pet wagon.

**APIs Used:**
- `GET /api/v1/compositions/{date}?train_number={number}`
- GraphQL `compositions` query

```javascript
// Fetch train composition
async function getComposition(trainNumber, date) {
  const res = await fetch(
    `https://rata.digitraffic.fi/api/v1/compositions/${date}?train_number=${trainNumber}`,
    { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }
  );
  const data = await res.json();
  const train = data[0]; // first match

  // journeySections contain wagon orders at different parts of route
  return train.journeySections.map(section => ({
    fromStation: section.beginTimeTableRow.stationShortCode,
    toStation: section.endTimeTableRow.stationShortCode,
    locomotives: section.locomotives.map(l => ({
      location: l.location,        // position in train
      powerType: l.locomotivePowerType,  // "Sm3" (Pendolino), "Dr16", etc.
    })),
    wagons: section.wagons.map(w => ({
      location: w.location,
      salesNumber: w.salesNumber,  // wagon number visible to passengers
      wagonType: w.wagonType,      // "Ed", "Edfs", "Gfot", etc.
      catering: w.catering,        // true if restaurant / café
      disabled: w.disabled,        // wheelchair accessible
      pet: w.pet,                  // pet-friendly wagon
      playground: w.playground,    // children's play area
      video: w.video,              // video screens
      luggage: w.luggage,
    }))
  }));
}

// Render as SVG: each wagon is a rounded rectangle with icons
function renderCompositionSVG(composition) {
  const section = composition[0]; // first section of journey
  const allUnits = [
    ...section.locomotives.map(l => ({ ...l, type: 'locomotive' })),
    ...section.wagons.map(w => ({ ...w, type: 'wagon' }))
  ].sort((a, b) => a.location - b.location);

  // Return SVG string with wagon rectangles, labels, and amenity icons
  const wagonWidth = 80, gap = 4, height = 40;
  const svgWidth = allUnits.length * (wagonWidth + gap);

  return `<svg viewBox="0 0 ${svgWidth} ${height + 30}" xmlns="http://www.w3.org/2000/svg">
    ${allUnits.map((unit, i) => `
      <rect x="${i * (wagonWidth + gap)}" y="0" width="${wagonWidth}" height="${height}"
        rx="4" fill="${unit.type === 'locomotive' ? '#334155' : '#3b82f6'}" />
      <text x="${i * (wagonWidth + gap) + wagonWidth/2}" y="${height/2 + 5}"
        text-anchor="middle" fill="white" font-size="12">
        ${unit.type === 'locomotive' ? '🚂' : unit.salesNumber || unit.location}
      </text>
      <text x="${i * (wagonWidth + gap) + wagonWidth/2}" y="${height + 16}"
        text-anchor="middle" font-size="9" fill="#64748b">
        ${[unit.catering && '🍽️', unit.pet && '🐾', unit.playground && '🧒', unit.disabled && '♿']
          .filter(Boolean).join(' ')}
      </text>
    `).join('')}
  </svg>`;
}
```

---

## Demo 5: Station-to-Station Journey Finder

Find all direct trains between two stations today with real-time delay info.

**APIs Used:**
- `GET /api/v1/live-trains/station/{from}/{to}?departure_date={date}`

```javascript
async function findJourneys(from, to, date) {
  const res = await fetch(
    `https://rata.digitraffic.fi/api/v1/live-trains/station/${from}/${to}?departure_date=${date}`,
    { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }
  );
  const trains = await res.json();

  return trains.map(train => {
    const depRow = train.timeTableRows.find(
      r => r.stationShortCode === from && r.type === 'DEPARTURE' && r.commercialStop
    );
    const arrRow = train.timeTableRows.find(
      r => r.stationShortCode === to && r.type === 'ARRIVAL' && r.commercialStop
    );
    if (!depRow || !arrRow) return null;

    const depTime = new Date(depRow.scheduledTime);
    const arrTime = new Date(arrRow.scheduledTime);
    const durationMin = Math.round((arrTime - depTime) / 60000);
    const stops = train.timeTableRows.filter(r =>
      r.commercialStop && r.type === 'ARRIVAL' &&
      new Date(r.scheduledTime) > depTime &&
      new Date(r.scheduledTime) < arrTime
    ).length;

    return {
      trainNumber: train.trainNumber,
      trainType: train.trainType,
      commuterLine: train.commuterLineID,
      departure: depTime.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' }),
      arrival: arrTime.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' }),
      durationMin,
      stops,
      depDelay: depRow.differenceInMinutes || 0,
      arrDelay: arrRow.differenceInMinutes || 0,
      cancelled: train.cancelled
    };
  }).filter(Boolean).sort((a, b) => a.departure.localeCompare(b.departure));
}

// Helsinki → Tampere
const journeys = await findJourneys('HKI', 'TPE', '2025-04-01');
// → [{ trainNumber: 3, trainType: "IC", departure: "06:18",
//      arrival: "08:03", durationMin: 105, stops: 2, arrDelay: 0 }, ...]
```

---

## Demo 6: Passenger Information Messages

Live station announcements — disruptions, platform changes, delay explanations — in 3 languages.

**APIs Used:**
- GraphQL `passengerInformationMessages`

```javascript
// Fetch active passenger information messages
async function getPassengerMessages(stationCode) {
  const query = `{
    passengerInformationMessages(
      where: {
        station: { shortCode: { equals: "${stationCode}" } }
      }
    ) {
      id
      version
      creationDateTime
      startValidity
      endValidity
      trainNumber
      trainDepartureDate
      stations { shortCode }
      video { text { fi sv en } deliveryRules { startDateTime endDateTime } }
      audio { text { fi sv en } deliveryRules { startDateTime endDateTime } }
    }
  }`;

  const res = await fetch('https://rata.digitraffic.fi/api/v2/graphql/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Digitraffic-User': 'DemoApp/1.0' },
    body: JSON.stringify({ query })
  });

  const data = await res.json();
  return data.data.passengerInformationMessages.map(msg => ({
    id: msg.id,
    trainNumber: msg.trainNumber,
    textFi: msg.video?.text?.fi || msg.audio?.text?.fi || '',
    textSv: msg.video?.text?.sv || msg.audio?.text?.sv || '',
    textEn: msg.video?.text?.en || msg.audio?.text?.en || '',
    validFrom: msg.startValidity,
    validTo: msg.endValidity,
  }));
}

const messages = await getPassengerMessages('HKI');
// → [{ id: "...", trainNumber: 71,
//      textEn: "IC 71 to Oulu is delayed approximately 15 minutes...", ... }]
```

---

# PART 2 — ROAD DEMOS

---

## Demo 7: Live Road Weather Cameras

A browsable gallery/map of 470+ road weather cameras with 24-hour history timelapse.

**APIs Used:**
- `GET /api/weathercam/v1/stations` (metadata with camera positions)
- `GET /api/weathercam/v1/stations/{id}/history` (24h history)
- Image URL: `https://weathercam.digitraffic.fi/{presetId}.jpg`

```javascript
// 1. Fetch all camera stations with presets
const camRes = await fetch(
  'https://tie.digitraffic.fi/api/weathercam/v1/stations',
  { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }
);
const camData = await camRes.json();

// 2. Filter to active cameras and extract image URLs
const cameras = camData.features
  .filter(f => f.properties.state === 'OK' && f.properties.collectionStatus === 'GATHERING')
  .map(f => ({
    id: f.properties.id,
    name: f.properties.name,
    lat: f.geometry.coordinates[1],
    lng: f.geometry.coordinates[0],
    presets: f.properties.presets
      .filter(p => p.inCollection)
      .map(p => ({
        presetId: p.id,
        imageUrl: `https://weathercam.digitraffic.fi/${p.id}.jpg`,
        thumbUrl: `https://weathercam.digitraffic.fi/${p.id}.jpg?thumbnail=true`,
        direction: p.presentationName,
      }))
  }));

// 3. Get 24-hour history for a specific preset
async function getCameraHistory(presetId) {
  const res = await fetch(
    `https://tie.digitraffic.fi/api/weathercam/v1/stations/${presetId}/history`,
    { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }
  );
  const data = await res.json();
  // Returns array of { presetId, imageUrl, lastModified }
  return data.presetHistories?.[0]?.history || [];
}

// Timelapse: cycle through history images at 200ms intervals
async function playTimelapse(presetId, imgElement) {
  const history = await getCameraHistory(presetId);
  for (const frame of history) {
    imgElement.src = frame.imageUrl;
    await new Promise(r => setTimeout(r, 200));
  }
}
```

**Note:** Use `If-None-Match` (ETag) header when polling camera images to save bandwidth. The API returns `304 Not Modified` if the image hasn't changed.

---

## Demo 8: Road Weather Dashboard

Real-time surface temperature, wind, rain, and visibility from 350+ road weather stations.

**APIs Used:**
- `GET /api/weather/v1/stations` (station metadata)
- `GET /api/weather/v1/stations/data` (latest readings)
- `GET /api/weather/v1/stations/{id}/data/{sensorId}/history?from={iso}&to={iso}` (24h history)

```javascript
// 1. Fetch latest readings from all road weather stations
const weatherRes = await fetch(
  'https://tie.digitraffic.fi/api/weather/v1/stations/data',
  { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }
);
const weatherData = await weatherRes.json();

// 2. Parse sensor values (each station has many sensors)
const stations = weatherData.stations.map(station => {
  const sensors = {};
  station.sensorValues.forEach(s => {
    sensors[s.name] = { value: s.sensorValue, unit: s.sensorUnit, measuredTime: s.measuredTime };
  });

  return {
    id: station.id,
    name: station.name,
    lat: station.lat,
    lng: station.lon,
    airTemperature: sensors['ILMA']?.value,         // Air temp (°C)
    roadTemperature: sensors['TIE_1']?.value,       // Road surface temp (°C)
    humidity: sensors['ILMAN_KOSTEUS']?.value,       // Relative humidity (%)
    windSpeed: sensors['TUULENNOPEUSKESKIARVO']?.value,  // Avg wind speed (m/s)
    windDirection: sensors['TUULENSUUNTA']?.value,        // Wind dir (degrees)
    precipitation: sensors['SADE']?.value,            // Rain/snow
    visibility: sensors['NAKYVYYS']?.value,           // Visibility (m)
    roadCondition: sensors['TIEN_SUOLA']?.value,      // Road salt status
  };
});

// 3. Color-code for map: road surface temp thresholds
function tempColor(roadTemp) {
  if (roadTemp === null || roadTemp === undefined) return '#94a3b8';
  if (roadTemp < -5) return '#7c3aed';   // Very cold: purple
  if (roadTemp < 0)  return '#3b82f6';   // Freezing: blue
  if (roadTemp < 5)  return '#06b6d4';   // Cold: cyan
  if (roadTemp < 15) return '#22c55e';   // Mild: green
  if (roadTemp < 25) return '#eab308';   // Warm: yellow
  return '#ef4444';                       // Hot: red
}

// 4. MQTT real-time updates (optional — for live dashboard)
// Topic: weather/observations/{stationId}
```

---

## Demo 9: Traffic Volume Heatmap (TMS/LAM)

Vehicle counts and speeds from 500+ Traffic Measurement System stations.

**APIs Used:**
- `GET /api/tms/v1/stations` (station metadata with road info)
- `GET /api/tms/v1/stations/data` (latest measurements)
- `GET /api/tms/v1/history/raw/lamraw_{id}_{YY}_{dayNum}.csv` (raw historical CSV)

```javascript
// 1. Fetch latest TMS sensor data
const tmsRes = await fetch(
  'https://tie.digitraffic.fi/api/tms/v1/stations/data',
  { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }
);
const tmsData = await tmsRes.json();

// 2. Parse key sensors
// Sensor IDs: 5122 = avg speed (dir1), 5119 = traffic volume (dir1),
//             5164 = avg speed (dir2), 5168 = traffic volume (dir2)
const trafficData = tmsData.stations.map(station => {
  const vals = {};
  station.sensorValues.forEach(s => { vals[s.id] = s.sensorValue; });

  return {
    id: station.id,
    name: station.name,
    lat: station.lat,
    lng: station.lon,
    avgSpeedDir1: vals[5122],      // km/h
    volumeDir1: vals[5119],        // vehicles / time period
    avgSpeedDir2: vals[5164],      // km/h
    volumeDir2: vals[5168],        // vehicles / time period
    totalVolume: (vals[5119] || 0) + (vals[5168] || 0),
    measuredTime: station.measuredTime
  };
});

// 3. Historical raw CSV data (for analytics demos)
// Vehicle classes in CSV: 1=car, 2=truck, 3=bus, 4=semi-trailer,
//                         5=truck+trailer, 6=car+trailer, 7=car+camper, 8=motorcycle
const csvUrl = 'https://tie.digitraffic.fi/api/tms/v1/history/raw/lamraw_101_25_91.csv';
// Fields: id;year;day;hour;minute;second;1/100s;length(m);lane;direction;
//         class;speed(km/h);faulty;totalTime(ms);timeInterval(ms);queueStart
```

---

## Demo 10: Traffic Disruption Feed

Active accidents, road works, weight restrictions, and exempted transports on a filterable map.

**APIs Used:**
- `GET /api/traffic-message/v1/messages?situationType={type}&inactiveHours=0`
- Types: `TRAFFIC_ANNOUNCEMENT`, `ROAD_WORK`, `WEIGHT_RESTRICTION`, `EXEMPTED_TRANSPORT`

```javascript
// Fetch all active traffic announcements
async function getTrafficMessages(type = 'TRAFFIC_ANNOUNCEMENT') {
  const res = await fetch(
    `https://tie.digitraffic.fi/api/traffic-message/v1/messages?situationType=${type}&inactiveHours=0`,
    { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }
  );
  const data = await res.json();

  return data.features.map(f => ({
    id: f.properties.situationId,
    type: f.properties.situationType,
    severity: f.properties.announcements?.[0]?.severity,          // LOW, MEDIUM, HIGH
    title: f.properties.announcements?.[0]?.title,
    description: f.properties.announcements?.[0]?.description,
    location: f.properties.announcements?.[0]?.locationDescription,
    startTime: f.properties.announcements?.[0]?.timeAndDuration?.startTime,
    endTime: f.properties.announcements?.[0]?.timeAndDuration?.endTime,
    geometry: f.geometry,  // GeoJSON Point, LineString, or Polygon
    // Render on map using f.geometry directly
  }));
}

// Fetch all types in parallel
const [accidents, roadworks, restrictions, transports] = await Promise.all([
  getTrafficMessages('TRAFFIC_ANNOUNCEMENT'),
  getTrafficMessages('ROAD_WORK'),
  getTrafficMessages('WEIGHT_RESTRICTION'),
  getTrafficMessages('EXEMPTED_TRANSPORT'),
]);

// MQTT real-time: topic traffic-message-v2/simple/{situationType}
// Payload is gzipped + base64 encoded
```

---

## Demo 11: Snowplow & Maintenance Tracker

Real-time locations and routes of road maintenance vehicles — watch snowplows clear Finnish highways.

**APIs Used:**
- `GET /api/maintenance/v1/tracking/routes?endFrom={iso}&endBefore={iso}&taskId={id}`
- `GET /api/maintenance/v1/tracking/routes/latest?taskId={id}`
- `GET /api/maintenance/v1/tracking/tasks` (task type list)
- `GET /api/maintenance/v1/tracking/domains` (data source domains)

```javascript
// 1. Get available task types
const tasksRes = await fetch(
  'https://tie.digitraffic.fi/api/maintenance/v1/tracking/tasks',
  { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }
);
const tasks = await tasksRes.json();
// Common tasks: PLOUGHING, SALTING, SANDING, BRUSHING, LEVELLING_GRAVEL,
//               LINE_SANDING, PAVING, CRACK_FILLING, OTHER

// 2. Get latest routes for ploughing vehicles (last 4 hours)
const now = new Date();
const fourHoursAgo = new Date(now - 4 * 3600000);

const routesRes = await fetch(
  `https://tie.digitraffic.fi/api/maintenance/v1/tracking/routes?endFrom=${fourHoursAgo.toISOString()}&endBefore=${now.toISOString()}&taskId=PLOUGHING&domain=state-roads`,
  { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }
);
const routeData = await routesRes.json();

// GeoJSON FeatureCollection — each feature is a route segment
routeData.features.forEach(feature => {
  console.log({
    tasks: feature.properties.tasks,          // ["PLOUGHING", "SALTING"]
    startTime: feature.properties.startTime,
    endTime: feature.properties.endTime,
    direction: feature.properties.direction,
    domain: feature.properties.domain,        // "state-roads" or municipal
    geometry: feature.geometry                // LineString or Point
  });
});

// 3. MQTT for real-time updates
// Topic: maintenance/routes/{domain}
// Message contains GeoJSON route with task list
```

---

## Demo 12: Variable Speed Limit Signs

Current values of electronic speed limit and warning signs along Finnish highways.

**APIs Used:**
- `GET /api/variable-sign/v1/signs` (sign metadata)
- `GET /api/variable-sign/v1/signs/data` (current values)
- SVG images: `/api/variable-sign/v1/images/tie_{number}` and `/api/variable-sign/v1/images/ramppi_{number}`

```javascript
// Fetch current variable sign values
const signsRes = await fetch(
  'https://tie.digitraffic.fi/api/variable-sign/v1/signs/data',
  { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }
);
const signsData = await signsRes.json();

const signs = signsData.map(sign => ({
  id: sign.id,
  type: sign.type,                 // "SPEEDLIMIT" or "WARNING"
  roadNumber: sign.roadAddress?.roadNumber,
  direction: sign.direction,
  lat: sign.lat,
  lng: sign.lon,
  // For speed limits:
  displayedValue: sign.displayedValue,  // e.g. "80"
  // For warnings: text content
  effectDate: sign.effectDate,
  cause: sign.cause,
  reliability: sign.reliability,
}));

// Render speed limit as SVG road sign
function speedLimitSVG(value) {
  return `<svg width="60" height="60" viewBox="0 0 60 60">
    <circle cx="30" cy="30" r="28" fill="white" stroke="red" stroke-width="4"/>
    <text x="30" y="37" text-anchor="middle" font-size="22"
          font-weight="bold" font-family="Arial">${value}</text>
  </svg>`;
}
```

---

## Demo 13: EV Charging Station Finder (AFIR)

Electric vehicle charging points with real-time connector availability and power levels.

**APIs Used:**
- AFIR endpoints under `tie.digitraffic.fi/api/afir/v1/...`
- Swagger: `https://tie.digitraffic.fi/swagger/` → Alternative Fuels section

```javascript
// Note: AFIR API specifics — check Swagger for exact current endpoints.
// The AFIR dataset follows EU Alternative Fuels Infrastructure Regulation format.

// Conceptual structure (verify endpoint paths against current Swagger docs):
const stationsRes = await fetch(
  'https://tie.digitraffic.fi/api/afir/v1/stations',
  { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }
);
const stations = await stationsRes.json();

// Each station typically contains:
// - location (lat/lon)
// - operator info
// - connectors: type (CCS, CHAdeMO, Type2), power (kW), availability status
// - pricing info
// - opening hours

// Filter high-power DC chargers
const dcFast = stations.filter(s =>
  s.connectors?.some(c => c.powerKW >= 50 && c.connectorType === 'CCS')
);
```

---

## Demo 14: Helsinki Commute Fluency

Real-time travel times and congestion levels for Helsinki metropolitan road links.

**APIs Used:**
- `GET /api/v1/data/fluency-current` (live fluency)
- `GET /api/v1/data/fluency-history-previous-day` (yesterday's data)
- `GET /api/v1/data/free-flow-speeds` (reference free-flow speeds)

```javascript
// Fetch current fluency (Helsinki metro area only, link IDs < 1000)
const fluencyRes = await fetch(
  'https://tie.digitraffic.fi/api/v1/data/fluency-current',
  { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }
);
const fluency = await fluencyRes.json();

// Each link has: medianTravelTime, averageSpeed, fluencyClass, timestamp
const links = fluency.travelTimes?.links || [];
links.forEach(link => {
  console.log({
    linkId: link.id,
    medianTravelTimeSec: link.travelTime?.median,
    avgSpeedKmh: link.travelTime?.averageSpeed,
    fluencyClass: link.travelTime?.fluencyClass,
    // FLUENCY_CLASS_FREE, FLUENCY_CLASS_HEAVY, FLUENCY_CLASS_CONGESTED
  });
});

// Color by fluency class
function fluencyColor(cls) {
  switch (cls) {
    case 'FLUENCY_CLASS_FREE': return '#22c55e';       // Green
    case 'FLUENCY_CLASS_HEAVY': return '#eab308';       // Yellow
    case 'FLUENCY_CLASS_CONGESTED': return '#ef4444';   // Red
    default: return '#94a3b8';                          // Gray
  }
}
```

---

## Demo 15: Walking & Cycling Counter

Pedestrian and cyclist counts from automated counting sites across Finland.

**APIs Used:**
- `GET /api/counting-site/v1/stations` (GeoJSON with all sites)
- `GET /api/counting-site/v1/stations/{id}` (single site metadata)
- `GET /api/counting-site/v1/values/{id}?from={iso}&to={iso}` (count values)
- `GET /api/counting-site/v1/values/{id}.csv?from={iso}&to={iso}` (CSV export)

```javascript
// 1. Get all counting sites
const sitesRes = await fetch(
  'https://tie.digitraffic.fi/api/counting-site/v1/stations',
  { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }
);
const sites = await sitesRes.json();
// GeoJSON FeatureCollection with site name, location, directions

// 2. Get hourly counts for a specific site
const siteId = 1;  // example
const from = '2025-03-31T00:00:00Z';
const to = '2025-04-01T00:00:00Z';

const valuesRes = await fetch(
  `https://tie.digitraffic.fi/api/counting-site/v1/values/${siteId}?from=${from}&to=${to}`,
  { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }
);
const values = await valuesRes.json();
// Contains hourly counts split by direction and user type (pedestrian/cyclist)

// 3. CSV export for data analysis
const csvUrl = `https://tie.digitraffic.fi/api/counting-site/v1/values/${siteId}.csv?from=${from}&to=${to}`;
```

---

# PART 3 — MARINE DEMOS

---

## Demo 16: Live Vessel Map (AIS)

Every vessel in Finnish waters plotted on a marine chart with real-time position updates.

**APIs Used:**
- `GET /api/ais/v1/locations` (all vessel positions — large payload!)
- `GET /api/ais/v1/vessels` (vessel metadata — name, type, dimensions)
- MQTT `vessels-v2/{mmsi}/location` and `vessels-v2/{mmsi}/metadata`

```javascript
// 1. Initial snapshot of all vessel locations
const locRes = await fetch(
  'https://meri.digitraffic.fi/api/ais/v1/locations',
  { headers: { 'Digitraffic-User': 'DemoApp/1.0', 'Accept-Encoding': 'gzip' } }
);
const vesselLocations = await locRes.json();

// Each vessel location:
// { mmsi, time, sog (speed over ground, knots), cog (course), navStat,
//   rot (rate of turn), posAcc, heading, lon, lat }

// 2. Vessel metadata
const metaRes = await fetch(
  'https://meri.digitraffic.fi/api/ais/v1/vessels',
  { headers: { 'Digitraffic-User': 'DemoApp/1.0', 'Accept-Encoding': 'gzip' } }
);
const vesselMeta = await metaRes.json();
const metaMap = Object.fromEntries(vesselMeta.map(v => [v.mmsi, v]));
// { mmsi, name, imo, callSign, type (70=cargo, 80=tanker, 60=passenger),
//   destination, draught, eta, refA/B/C/D (ship dimensions) }

// 3. MQTT for live tracking
const client = new Paho.MQTT.Client('meri.digitraffic.fi', 443, `app-${Date.now()}`);

client.connect({
  useSSL: true,
  onSuccess: () => {
    // Track all vessel locations
    client.subscribe('vessels-v2/+/location');
    // Or single vessel by MMSI: client.subscribe('vessels-v2/230123456/location');
  }
});

client.onMessageArrived = (msg) => {
  const loc = JSON.parse(msg.payloadString);
  // Update map marker for this vessel
  updateVesselMarker(loc.mmsi, { lat: loc.lat, lng: loc.lon, heading: loc.heading, sog: loc.sog });
};

// Vessel type colors
function vesselTypeColor(type) {
  if (type >= 70 && type < 80) return '#3b82f6';  // Cargo: blue
  if (type >= 80 && type < 90) return '#ef4444';  // Tanker: red
  if (type >= 60 && type < 70) return '#22c55e';  // Passenger: green
  if (type >= 30 && type < 40) return '#eab308';  // Fishing: yellow
  return '#94a3b8';                                 // Other: gray
}
```

---

## Demo 17: Port Call Dashboard

Which ships are arriving and departing Finnish harbors, with ETAs and cargo info.

**APIs Used:**
- `GET /api/port-call/v1/port-calls?from={iso}&locode={portCode}`
- `GET /api/port-call/v1/ports` (port metadata)
- `GET /api/port-call/v1/vessel-details` (vessel info)

```javascript
// 1. Fetch port list
const portsRes = await fetch(
  'https://meri.digitraffic.fi/api/port-call/v1/ports',
  { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }
);
const ports = await portsRes.json();
// Ports have UN/LOCODE: FIHEL (Helsinki), FIKTK (Kotka), FIOUL (Oulu), etc.

// 2. Fetch port calls for Helsinki, last 24 hours
const yesterday = new Date(Date.now() - 86400000).toISOString();
const callsRes = await fetch(
  `https://meri.digitraffic.fi/api/port-call/v1/port-calls?from=${yesterday}&locode=FIHEL`,
  { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }
);
const portCalls = await callsRes.json();

portCalls.forEach(pc => {
  console.log({
    vesselName: pc.vesselName,
    mmsi: pc.mmsi,
    imo: pc.imoLloyds,
    nationality: pc.nationality,
    portToVisit: pc.portToVisit,
    eta: pc.portCallTimestamp,
    arrivalTime: pc.arrivalTime,
    departureTime: pc.departureTime,
    agentInfo: pc.agentInfo,
    from: pc.prevPort,
    to: pc.nextPort,
    imoHazardousCargo: pc.imoInformation,
  });
});
```

---

## Demo 18: Nautical Warnings Map

Active marine hazards, exercises, and restrictions.

**APIs Used:**
- `GET /api/nautical-warning/v1/warnings/active`

```javascript
const warningsRes = await fetch(
  'https://meri.digitraffic.fi/api/nautical-warning/v1/warnings/active',
  { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }
);
const warnings = await warningsRes.json();

// GeoJSON FeatureCollection
warnings.features.forEach(w => {
  console.log({
    number: w.properties.number,
    areasFi: w.properties.areasEn,
    type: w.properties.type,                 // COASTAL, LOCAL, BOATING
    description: w.properties.descriptionEn,
    startDate: w.properties.publishingTime,
    geometry: w.geometry,  // Point, Polygon, or MultiPolygon for affected area
  });
});
```

---

## Demo 19: Sea State Monitor (Smart Buoys)

Wave conditions, temperature, and trends from AtoN buoy sensors.

**APIs Used:**
- `GET /api/sse/v1/measurements` (all sites)
- MQTT `sse-v2/site/{siteId}` (live updates every 30 min)

```javascript
// Fetch sea state estimation data from all buoy sites
const sseRes = await fetch(
  'https://meri.digitraffic.fi/api/sse/v1/measurements',
  { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }
);
const sseData = await sseRes.json();

// GeoJSON FeatureCollection
sseData.features.forEach(f => {
  console.log({
    siteNumber: f.properties.siteNumber,
    siteName: f.properties.siteName,
    lat: f.geometry.coordinates[1],
    lng: f.geometry.coordinates[0],
    seaState: f.properties.seaState,         // CALM, LIGHT, MODERATE, BREEZE, GALE, STORM
    trend: f.properties.trend,                // DESCENDING, NO_CHANGE, ASCENDING
    windWaveDir: f.properties.windWaveDir,   // degrees
    confidence: f.properties.confidence,      // GOOD, MODERATE, POOR
    heelAngle: f.properties.heelAngle,       // buoy tilt in degrees
    lightStatus: f.properties.lightStatus,   // ON, OFF
    temperature: f.properties.temperature,   // water/air temperature
  });
});
```

---

## Demo 20: Winter Navigation & Icebreaker Routes

Icebreaker-assisted shipping lanes and port ice restrictions during Finnish winter.

**APIs Used:**
- `GET /api/winter-navigation/v2/dirways` (icebreaker routes)
- `GET /api/winter-navigation/v2/ports` (port restrictions)
- `GET /api/winter-navigation/v2/vessels` (vessels in winter nav system)

```javascript
// 1. Get current icebreaker dirways
const dirwayRes = await fetch(
  'https://meri.digitraffic.fi/api/winter-navigation/v2/dirways',
  { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }
);
const dirways = await dirwayRes.json();
// Contains route geometries for icebreaker-assisted paths

// 2. Get port winter restrictions
const portsRes = await fetch(
  'https://meri.digitraffic.fi/api/winter-navigation/v2/ports',
  { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }
);
const ports = await portsRes.json();
// Ice class requirements, tonnage limits per port

// 3. Get vessels in winter navigation system
const wvRes = await fetch(
  'https://meri.digitraffic.fi/api/winter-navigation/v2/vessels',
  { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }
);
const winterVessels = await wvRes.json();
// Vessel ice class, icebreaker assignments
```

---

# PART 4 — MULTI-MODAL / CROSS-DOMAIN DEMOS

These demos combine data from multiple Digitraffic domains — proving the platform's power as a **unified national transport data layer**.

---

## Demo 21: Finland Transport Pulse — Live Dashboard

A single executive dashboard: how is Finland's entire transport network performing *right now*?

**APIs Combined:**
- Rail: `/api/v1/live-trains/station/HKI`, `/api/v1/train-locations/latest`
- Road: `/api/tms/v1/stations/data`, `/api/traffic-message/v1/messages`
- Marine: `/api/ais/v1/locations`, `/api/port-call/v1/port-calls`

```javascript
// Fetch all dashboarrd data in parallel
async function getTransportPulse() {
  const [trains, trainLocs, tmsData, disruptions, vessels, portCalls] = await Promise.all([
    fetch('https://rata.digitraffic.fi/api/v1/trains/2025-04-01',
      { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }).then(r => r.json()),
    fetch('https://rata.digitraffic.fi/api/v1/train-locations/latest',
      { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }).then(r => r.json()),
    fetch('https://tie.digitraffic.fi/api/tms/v1/stations/data',
      { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }).then(r => r.json()),
    fetch('https://tie.digitraffic.fi/api/traffic-message/v1/messages?situationType=TRAFFIC_ANNOUNCEMENT&inactiveHours=0',
      { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }).then(r => r.json()),
    fetch('https://meri.digitraffic.fi/api/ais/v1/locations',
      { headers: { 'Digitraffic-User': 'DemoApp/1.0', 'Accept-Encoding': 'gzip' } }).then(r => r.json()),
    fetch(`https://meri.digitraffic.fi/api/port-call/v1/port-calls?from=${new Date(Date.now() - 86400000).toISOString()}`,
      { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }).then(r => r.json()),
  ]);

  // Rail metrics
  const activeTrains = trainLocs.length;
  const delayedTrains = trains.filter(t =>
    t.timeTableRows?.some(r => r.differenceInMinutes > 5)
  ).length;
  const avgDelay = trains.reduce((sum, t) => {
    const delays = t.timeTableRows?.filter(r => r.differenceInMinutes > 0) || [];
    return sum + delays.reduce((s, r) => s + r.differenceInMinutes, 0) / (delays.length || 1);
  }, 0) / trains.length;

  // Road metrics
  const activeDisruptions = disruptions.features?.length || 0;
  const tmsStationsReporting = tmsData.stations?.length || 0;

  // Marine metrics
  const vesselsAtSea = vessels.length;
  const recentPortCalls = portCalls.length;

  return {
    rail: { activeTrains, delayedTrains, avgDelayMin: avgDelay.toFixed(1), totalTrains: trains.length },
    road: { activeDisruptions, tmsStationsReporting },
    marine: { vesselsAtSea, recentPortCalls24h: recentPortCalls },
    timestamp: new Date().toISOString()
  };
}

// Returns:
// { rail: { activeTrains: 142, delayedTrains: 23, avgDelayMin: "2.3", totalTrains: 487 },
//   road: { activeDisruptions: 34, tmsStationsReporting: 489 },
//   marine: { vesselsAtSea: 312, recentPortCalls24h: 67 } }
```

---

## Demo 22: Weather Impact on Transport

How do road weather conditions correlate with train delays, traffic speed drops, and vessel routing?

**APIs Combined:**
- Road weather: `/api/weather/v1/stations/data`
- Train delays: `/api/v1/trains/{date}` (rail)
- TMS speeds: `/api/tms/v1/stations/data`
- Nautical warnings: `/api/nautical-warning/v1/warnings/active`

```javascript
// Cross-domain weather impact analysis
async function weatherImpactReport() {
  const [weather, trains, tms, nauticalWarnings] = await Promise.all([
    fetch('https://tie.digitraffic.fi/api/weather/v1/stations/data',
      { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }).then(r => r.json()),
    fetch(`https://rata.digitraffic.fi/api/v1/trains/${new Date().toISOString().slice(0, 10)}`,
      { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }).then(r => r.json()),
    fetch('https://tie.digitraffic.fi/api/tms/v1/stations/data',
      { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }).then(r => r.json()),
    fetch('https://meri.digitraffic.fi/api/nautical-warning/v1/warnings/active',
      { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }).then(r => r.json()),
  ]);

  // Compute average temperatures across road weather stations
  const temps = weather.stations
    .flatMap(s => s.sensorValues.filter(sv => sv.name === 'ILMA'))
    .map(sv => sv.sensorValue)
    .filter(v => v !== null);
  const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;

  // Compute average train delay
  const allDelays = trains.flatMap(t =>
    (t.timeTableRows || [])
      .filter(r => r.differenceInMinutes != null && r.type === 'ARRIVAL')
      .map(r => r.differenceInMinutes)
  );
  const avgTrainDelay = allDelays.reduce((a, b) => a + b, 0) / allDelays.length;

  // Check for icy conditions (road temp < 0) → how does it affect avg speeds?
  const freezingStations = weather.stations.filter(s =>
    s.sensorValues.some(sv => sv.name === 'TIE_1' && sv.sensorValue < 0)
  );

  return {
    conditions: {
      avgAirTemp: avgTemp.toFixed(1),
      freezingRoadStations: freezingStations.length,
      totalWeatherStations: weather.stations.length,
    },
    railImpact: {
      avgDelayMin: avgTrainDelay.toFixed(1),
      totalTrains: trains.length,
      cancelledTrains: trains.filter(t => t.cancelled).length,
    },
    roadImpact: {
      tmsStationsActive: tms.stations.length,
    },
    marineImpact: {
      activeNauticalWarnings: nauticalWarnings.features.length,
    }
  };
}
```

**Visualization idea:** Split-screen with a weather map on the left and three side-by-side impact panels (rail delay chart, road speed chart, marine warning count) that all react to the same weather data.

---

## Demo 23: Intermodal Journey: Ship + Train Connection

"My cargo ship arrives at Turku port at 14:00 — what trains go from Turku to Helsinki after that?"

**APIs Combined:**
- Port calls: `meri.digitraffic.fi/api/port-call/v1/port-calls?locode=FITKU`
- Train connections: `rata.digitraffic.fi/api/v1/live-trains/station/TKU/HKI`
- Road weather along the route: `tie.digitraffic.fi/api/weather/v1/stations/data`

```javascript
// Intermodal: Ship arrival → Train connection
async function findShipTrainConnection(portCode, fromStation, toStation) {
  // 1. Get incoming vessels to port
  const portCallsRes = await fetch(
    `https://meri.digitraffic.fi/api/port-call/v1/port-calls?locode=${portCode}`,
    { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }
  );
  const portCalls = await portCallsRes.json();

  // Find next arriving vessels
  const now = new Date();
  const arrivals = portCalls
    .filter(pc => pc.portCallTimestamp && new Date(pc.portCallTimestamp) > now)
    .sort((a, b) => new Date(a.portCallTimestamp) - new Date(b.portCallTimestamp))
    .slice(0, 5);

  // 2. For each arrival, find connecting trains departing 1+ hours after
  const connections = await Promise.all(arrivals.map(async (arrival) => {
    const arrTime = new Date(arrival.portCallTimestamp);
    const trainsRes = await fetch(
      `https://rata.digitraffic.fi/api/v1/live-trains/station/${fromStation}/${toStation}`,
      { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }
    );
    const trains = await trainsRes.json();

    // Filter trains departing at least 1 hour after vessel arrival
    const connectingTrains = trains
      .map(t => {
        const dep = t.timeTableRows.find(
          r => r.stationShortCode === fromStation && r.type === 'DEPARTURE'
        );
        return dep ? { ...t, departureTime: new Date(dep.scheduledTime) } : null;
      })
      .filter(t => t && t.departureTime > new Date(arrTime.getTime() + 3600000))
      .slice(0, 3);

    return {
      vessel: { name: arrival.vesselName, eta: arrival.portCallTimestamp, from: arrival.prevPort },
      trains: connectingTrains.map(t => ({
        number: t.trainNumber,
        type: t.trainType,
        departure: t.departureTime.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' }),
        waitTimeMin: Math.round((t.departureTime - arrTime) / 60000)
      }))
    };
  }));

  return connections;
}

// Example: Ships arriving Turku → trains to Helsinki
const connections = await findShipTrainConnection('FITKU', 'TKU', 'HKI');
// → [{ vessel: { name: "Viking Grace", eta: "2025-04-01T14:00:00Z", from: "SEMMA" },
//      trains: [{ number: 967, type: "IC", departure: "15:21", waitTimeMin: 81 }, ...] }]
```

---

## Demo 24: National Disruption Map — All Modes

Every active disruption across road, rail, and sea on a single map with a unified timeline.

**APIs Combined:**
- Road: `/api/traffic-message/v1/messages` (all types)
- Rail: GraphQL `passengerInformationMessages` + cancelled trains
- Marine: `/api/nautical-warning/v1/warnings/active` + `/api/bridge-lock/v1/disruptions`

```javascript
// Unified disruption aggregator
async function getAllDisruptions() {
  const [roadMsgs, railTrains, nauticalWarnings, waterwayDisruptions] = await Promise.all([
    // Road disruptions (all types)
    Promise.all(['TRAFFIC_ANNOUNCEMENT', 'ROAD_WORK', 'WEIGHT_RESTRICTION'].map(type =>
      fetch(`https://tie.digitraffic.fi/api/traffic-message/v1/messages?situationType=${type}&inactiveHours=0`,
        { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }).then(r => r.json())
    )),

    // Rail: cancelled or heavily delayed trains
    fetch(`https://rata.digitraffic.fi/api/v1/trains/${new Date().toISOString().slice(0, 10)}`,
      { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }).then(r => r.json()),

    // Marine warnings
    fetch('https://meri.digitraffic.fi/api/nautical-warning/v1/warnings/active',
      { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }).then(r => r.json()),

    // Waterway disruptions (bridges, locks)
    fetch('https://meri.digitraffic.fi/api/bridge-lock/v1/disruptions',
      { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }).then(r => r.json()),
  ]);

  // Normalize into unified format
  const disruptions = [];

  // Road
  roadMsgs.flat().forEach(data => {
    (data.features || []).forEach(f => {
      disruptions.push({
        mode: 'road',
        type: f.properties.situationType,
        severity: f.properties.announcements?.[0]?.severity || 'UNKNOWN',
        title: f.properties.announcements?.[0]?.title || 'Road disruption',
        description: f.properties.announcements?.[0]?.description,
        geometry: f.geometry,
        startTime: f.properties.announcements?.[0]?.timeAndDuration?.startTime,
      });
    });
  });

  // Rail (cancelled trains)
  railTrains.filter(t => t.cancelled).forEach(t => {
    const firstStop = t.timeTableRows?.[0];
    const lastStop = t.timeTableRows?.[t.timeTableRows.length - 1];
    disruptions.push({
      mode: 'rail',
      type: 'CANCELLATION',
      severity: 'HIGH',
      title: `Train ${t.trainType} ${t.trainNumber} cancelled`,
      description: `${firstStop?.stationShortCode} → ${lastStop?.stationShortCode}`,
      geometry: null, // Would need station coords to place on map
      startTime: firstStop?.scheduledTime,
    });
  });

  // Marine
  (nauticalWarnings.features || []).forEach(f => {
    disruptions.push({
      mode: 'marine',
      type: f.properties.type,
      severity: 'MEDIUM',
      title: f.properties.descriptionEn || 'Nautical warning',
      geometry: f.geometry,
      startTime: f.properties.publishingTime,
    });
  });

  // Waterway disruptions
  (waterwayDisruptions || []).forEach(d => {
    disruptions.push({
      mode: 'marine',
      type: 'WATERWAY_DISRUPTION',
      severity: 'MEDIUM',
      title: d.descriptionEn || d.descriptionFi || 'Waterway disruption',
      geometry: d.geometry || null,
      startTime: d.startDate,
    });
  });

  return disruptions.sort((a, b) =>
    new Date(b.startTime || 0) - new Date(a.startTime || 0)
  );
}
```

**Visualization:** Map with color-coded markers by mode (blue=rail, orange=road, teal=marine) and a scrolling sidebar timeline of events.

---

## Demo 25: Smart Commute Advisor

"Based on current conditions, should I drive, take the train, or work from home today?"

**APIs Combined:**
- Road weather + fluency: `tie.digitraffic.fi`
- Train delays for your route: `rata.digitraffic.fi`
- Traffic disruptions: `tie.digitraffic.fi`

```javascript
// Personalized commute recommendation engine
async function commuteAdvisor({ homeStation, workStation, roadRouteLinks }) {
  const today = new Date().toISOString().slice(0, 10);

  const [trains, weather, fluency, disruptions] = await Promise.all([
    // Train option
    fetch(`https://rata.digitraffic.fi/api/v1/live-trains/station/${homeStation}/${workStation}?departure_date=${today}`,
      { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }).then(r => r.json()),

    // Driving conditions
    fetch('https://tie.digitraffic.fi/api/weather/v1/stations/data',
      { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }).then(r => r.json()),

    // Helsinki fluency (if applicable)
    fetch('https://tie.digitraffic.fi/api/v1/data/fluency-current',
      { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }).then(r => r.json()).catch(() => null),

    // Active road disruptions
    fetch('https://tie.digitraffic.fi/api/traffic-message/v1/messages?situationType=TRAFFIC_ANNOUNCEMENT&inactiveHours=0',
      { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }).then(r => r.json()),
  ]);

  // Score train option
  const now = new Date();
  const nextTrains = trains
    .map(t => {
      const dep = t.timeTableRows.find(
        r => r.stationShortCode === homeStation && r.type === 'DEPARTURE'
      );
      return dep ? { ...t, depTime: new Date(dep.scheduledTime), delay: dep.differenceInMinutes || 0 } : null;
    })
    .filter(t => t && t.depTime > now && !t.cancelled)
    .slice(0, 3);

  const avgTrainDelay = nextTrains.length > 0
    ? nextTrains.reduce((s, t) => s + t.delay, 0) / nextTrains.length
    : Infinity;

  // Score road option
  const freezingRoads = weather.stations.some(s =>
    s.sensorValues.some(sv => sv.name === 'TIE_1' && sv.sensorValue < -2)
  );
  const poorVisibility = weather.stations.some(s =>
    s.sensorValues.some(sv => sv.name === 'NAKYVYYS' && sv.sensorValue < 200)
  );
  const disruptionCount = disruptions.features?.length || 0;

  // Generate recommendation
  let recommendation;
  if (avgTrainDelay < 3 && nextTrains.length > 0) {
    recommendation = {
      mode: 'TRAIN',
      confidence: 'HIGH',
      reason: `Next train ${nextTrains[0].trainType} ${nextTrains[0].trainNumber} departs on time`,
      nextDeparture: nextTrains[0].depTime.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' })
    };
  } else if (!freezingRoads && !poorVisibility && disruptionCount < 5) {
    recommendation = {
      mode: 'DRIVE',
      confidence: 'MEDIUM',
      reason: 'Roads are clear, no major disruptions'
    };
  } else {
    recommendation = {
      mode: 'REMOTE',
      confidence: 'HIGH',
      reason: `${freezingRoads ? 'Icy roads. ' : ''}${poorVisibility ? 'Poor visibility. ' : ''}${avgTrainDelay > 10 ? 'Significant train delays. ' : ''}${disruptionCount} active road disruptions.`
    };
  }

  return {
    recommendation,
    trainOption: { nextTrains: nextTrains.length, avgDelayMin: avgTrainDelay.toFixed(0) },
    driveOption: { freezingRoads, poorVisibility, disruptions: disruptionCount },
    timestamp: new Date().toISOString()
  };
}

// Usage: Helsinki (HKI) → Tampere (TPE) commute
const advice = await commuteAdvisor({
  homeStation: 'HKI',
  workStation: 'TPE',
  roadRouteLinks: [101, 102, 103]  // TMS station IDs along E12/Highway 3
});
// → { recommendation: { mode: "TRAIN", confidence: "HIGH",
//     reason: "Next train IC 3 departs on time", nextDeparture: "06:18" }, ... }
```

---

## Demo 26: Logistics Corridor Monitor

Track cargo movement across a Finnish logistics corridor: port arrival → rail transfer → road last-mile.

**APIs Combined:**
- Port calls (marine): vessel arrival at Kotka/HaminaKotka
- Rail freight: trains from Kotka station
- Road maintenance: winter conditions on local roads
- Traffic messages: disruptions along the route

```javascript
// Monitor the Kotka → Helsinki logistics corridor
async function corridorStatus() {
  const now = new Date();
  const yesterday = new Date(now - 86400000);

  const [portCalls, railTrains, maintenance, weather, disruptions] = await Promise.all([
    // Ships arriving at Kotka port
    fetch(`https://meri.digitraffic.fi/api/port-call/v1/port-calls?locode=FIKTK&from=${yesterday.toISOString()}`,
      { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }).then(r => r.json()),

    // Trains from Kotka (KTK)
    fetch('https://rata.digitraffic.fi/api/v1/live-trains/station/KTK?departing_trains=15&arrived_trains=5',
      { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }).then(r => r.json()),

    // Road maintenance along E18 corridor
    fetch(`https://tie.digitraffic.fi/api/maintenance/v1/tracking/routes/latest`,
      { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }).then(r => r.json()),

    // Road weather on the corridor
    fetch('https://tie.digitraffic.fi/api/weather/v1/stations/data',
      { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }).then(r => r.json()),

    // Active disruptions
    fetch('https://tie.digitraffic.fi/api/traffic-message/v1/messages?situationType=TRAFFIC_ANNOUNCEMENT&inactiveHours=0',
      { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }).then(r => r.json()),
  ]);

  return {
    port: {
      vesselsArrived24h: portCalls.filter(pc => pc.arrivalTime).length,
      vesselsExpected: portCalls.filter(pc => !pc.arrivalTime && pc.portCallTimestamp).length,
      nextArrival: portCalls
        .filter(pc => !pc.arrivalTime && new Date(pc.portCallTimestamp) > now)
        .sort((a, b) => new Date(a.portCallTimestamp) - new Date(b.portCallTimestamp))[0]
    },
    rail: {
      activeFrieghtTrains: railTrains.filter(t => t.trainCategory === 'Cargo').length,
      delayedTrains: railTrains.filter(t =>
        t.timeTableRows?.some(r => r.differenceInMinutes > 10)
      ).length,
    },
    road: {
      activeDisruptions: disruptions.features?.length || 0,
      maintenanceActive: maintenance.features?.length || 0,
    },
    corridor: 'Kotka → Helsinki (E18)',
    timestamp: now.toISOString()
  };
}
```

**Visualization:** A horizontal flow diagram showing Port → Rail → Road stages, with live status indicators at each stage. Green/yellow/red health status per segment.

---

# APPENDICES

---

## Appendix A: API Quick Reference

### Rail API Endpoints (`rata.digitraffic.fi`)
| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/trains/{date}` | All trains for a date |
| `GET /api/v1/live-trains/station/{code}` | Live trains at station |
| `GET /api/v1/live-trains/station/{from}/{to}` | Direct connections |
| `GET /api/v1/train-locations/latest` | All train GPS positions |
| `GET /api/v1/compositions/{date}` | Train wagon compositions |
| `GET /api/v1/metadata/stations` | Station list with coords |
| `POST /api/v2/graphql/graphql` | GraphQL (full flexibility) |
| MQTT `train-locations/{date}/{number}` | Live GPS stream |
| MQTT `trains/{date}/{number}` | Timetable changes |

### Road API Endpoints (`tie.digitraffic.fi`)
| Endpoint | Description |
|----------|-------------|
| `GET /api/weathercam/v1/stations` | Camera stations + image URLs |
| `GET /api/weather/v1/stations/data` | Road weather sensor data |
| `GET /api/tms/v1/stations/data` | Traffic volumes & speeds |
| `GET /api/traffic-message/v1/messages` | Disruptions & road works |
| `GET /api/maintenance/v1/tracking/routes` | Maintenance vehicle routes |
| `GET /api/variable-sign/v1/signs/data` | Electronic speed signs |
| `GET /api/counting-site/v1/stations` | Pedestrian/cyclist counters |
| MQTT `weather/observations/{stationId}` | Live weather readings |
| MQTT `tms-v2/{stationId}` | Live traffic counts |

### Marine API Endpoints (`meri.digitraffic.fi`)
| Endpoint | Description |
|----------|-------------|
| `GET /api/ais/v1/locations` | All vessel AIS positions |
| `GET /api/ais/v1/vessels` | Vessel metadata |
| `GET /api/port-call/v1/port-calls` | Harbor schedules |
| `GET /api/nautical-warning/v1/warnings/active` | Marine hazards |
| `GET /api/sse/v1/measurements` | Sea state from buoys |
| `GET /api/winter-navigation/v2/dirways` | Icebreaker routes |
| `GET /api/bridge-lock/v1/disruptions` | Waterway disruptions |
| `GET /api/aton/v1/faults` | Navigation aid faults |
| MQTT `vessels-v2/{mmsi}/location` | Live vessel tracking |
| MQTT `sse-v2/site/{siteId}` | Live buoy readings |

---

## Appendix B: MQTT Connection Template

All three domains use the same MQTT-over-WebSocket pattern:

```javascript
// Universal MQTT connection for any Digitraffic domain
import Paho from 'paho-mqtt';

function connectDigitrafficMQTT(domain, topics, onMessage) {
  // domain: 'rata', 'tie', or 'meri'
  const host = `${domain}.digitraffic.fi`;
  const clientId = `my-app-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const client = new Paho.Client(host, 443, clientId);

  client.onConnectionLost = (res) => {
    console.warn(`MQTT disconnected: ${res.errorMessage}`);
    // Auto-reconnect after 5s
    setTimeout(() => client.connect(connectOptions), 5000);
  };

  client.onMessageArrived = (message) => {
    try {
      const payload = JSON.parse(message.payloadString);
      onMessage(message.destinationName, payload);
    } catch (e) {
      console.error('Failed to parse MQTT message:', e);
    }
  };

  const connectOptions = {
    useSSL: true,
    onSuccess: () => {
      console.log(`Connected to ${host}`);
      topics.forEach(topic => client.subscribe(topic));
    },
    onFailure: (err) => console.error('MQTT connect failed:', err),
    reconnect: true,
  };

  client.connect(connectOptions);
  return client;
}

// Usage examples:
// Track all trains:
connectDigitrafficMQTT('rata', ['train-locations/#'], (topic, data) => {
  console.log(`Train ${data.trainNumber}: ${data.speed} km/h at [${data.location.coordinates}]`);
});

// Track vessels near Helsinki:
connectDigitrafficMQTT('meri', ['vessels-v2/+/location'], (topic, data) => {
  if (data.lat > 59.9 && data.lat < 60.3 && data.lon > 24.5 && data.lon < 25.5) {
    console.log(`Vessel ${data.mmsi} near Helsinki: ${data.sog} knots`);
  }
});

// Track road weather:
connectDigitrafficMQTT('tie', ['weather/observations/#'], (topic, data) => {
  console.log(`Station ${data.id}: ${data.sensorValue}${data.sensorUnit}`);
});
```

---

## Appendix C: Rate Limits & Best Practices

| Rule | Detail |
|------|--------|
| **Header required** | Set `Digitraffic-User: AppName/1.0` for higher rate limits |
| **Default limit** | 60 requests/min per IP without header |
| **Compression** | `Accept-Encoding: gzip` is **mandatory** |
| **Caching** | Most responses cached ~1 min server-side; no benefit to faster polling |
| **Camera ETags** | Use `If-None-Match` for camera images to get `304 Not Modified` |
| **MQTT limit** | Max 5 connections per IP |
| **Large payloads** | AIS locations and full train lists can be 5–20 MB — use MQTT for live updates instead |
| **HTTPS only** | All endpoints require HTTPS |
| **License** | CC 4.0 Attribution — credit Digitraffic/Fintraffic |

---

## Appendix D: Implementation Roadmap

| Phase | Demos | Effort | Impact |
|-------|-------|--------|--------|
| **1 — Quick Wins** | 1 (Departure Board), 7 (Cameras), 16 (Vessel Map), 5 (Journey Finder) | 1–2 days each | High — immediate visual impact |
| **2 — Real-Time** | 2 (Train Tracker), 11 (Snowplows), 8 (Road Weather) | 2–3 days each | Very high — MQTT demos |
| **3 — Analytics** | 3 (Delay Analyzer), 9 (Traffic Volume), 15 (Walking/Cycling) | 2–3 days each | Medium — charts & aggregation |
| **4 — Specialized** | 4 (Compositions), 6 (Passenger Info), 10 (Disruptions), 12 (Speed Signs), 13 (EV Charging), 14 (Fluency) | 1–2 days each | Medium — niche data types |
| **5 — Maritime** | 17 (Port Calls), 18 (Warnings), 19 (Sea State), 20 (Winter Nav) | 1–2 days each | Medium — marine domain |
| **6 — Multi-Modal** | 21 (Pulse), 22 (Weather Impact), 23 (Ship+Train), 24 (All Disruptions), 25 (Commute Advisor), 26 (Logistics Corridor) | 3–5 days each | Very high — differentiating showcases |

---

*Document generated for the Digitraffic product team. All code examples use the public Digitraffic APIs under CC 4.0 BY license.*
