export const staticDemos = [
  {
    "id": 1,
    "slug": "live-train-departure-board",
    "title": "Live Train Departure Board",
    "description": "A classic split-flap style departure/arrival board for any Finnish railway station.",
    "whatUserSees": "Real-time departures with train number, destination, scheduled time, estimated time, track number, and a color-coded delay indicator. Auto-refreshes every 30 seconds.",
    "apis": [
      "GET /api/v1/live-trains/station/{stationShortCode}?departing_trains=10&arrived_trains=0&arriving_trains=5",
      "GET /api/v1/metadata/stations (station list)"
    ],
    "language": "javascript",
    "code": "// Fetch departing trains from Helsinki (HKI)\nconst STATION = 'HKI';\n\n// 1. Get station metadata (cache this — updated twice daily)\nconst stationsRes = await fetch(\n  'https://rata.digitraffic.fi/api/v1/metadata/stations',\n  { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }\n);\nconst stations = await stationsRes.json();\nconst stationMap = Object.fromEntries(\n  stations.map(s => [s.stationShortCode, s.stationName])\n);\n\n// 2. Get live departures\nconst trainsRes = await fetch(\n  `https://rata.digitraffic.fi/api/v1/live-trains/station/${STATION}?departing_trains=10&arrived_trains=0&arriving_trains=0`,\n  { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }\n);\nconst trains = await trainsRes.json();\n\n// 3. Parse each train into a departure row\nconst departures = trains.map(train => {\n  // Find the departure row for our station\n  const depRow = train.timeTableRows.find(\n    r => r.stationShortCode === STATION && r.type === 'DEPARTURE'\n  );\n  // Find the final destination (last ARRIVAL row)\n  const arrivals = train.timeTableRows.filter(r => r.type === 'ARRIVAL');\n  const destination = arrivals[arrivals.length - 1];\n\n  const scheduled = new Date(depRow.scheduledTime);\n  const estimated = depRow.liveEstimateTime\n    ? new Date(depRow.liveEstimateTime)\n    : scheduled;\n  const delayMinutes = Math.round((estimated - scheduled) / 60000);\n\n  return {\n    trainNumber: train.trainNumber,\n    trainType: train.trainType,           // IC, S, P, HDM, ...\n    commuterLine: train.commuterLineID,   // A, E, U, K, ... (commuter)\n    destination: stationMap[destination.stationShortCode] || destination.stationShortCode,\n    scheduledTime: scheduled.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' }),\n    estimatedTime: estimated.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' }),\n    track: depRow.commercialTrack,\n    delayMinutes,\n    cancelled: train.cancelled\n  };\n});\n\n// Sort by scheduled departure time\ndepartures.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));\n\nconsole.log(departures);\n// → [{ trainNumber: 71, trainType: \"IC\", destination: \"Oulu\",\n//      scheduledTime: \"14:25\", estimatedTime: \"14:28\",\n//      track: \"8\", delayMinutes: 3, cancelled: false }, ...]\n",
    "domain": "rail",
    "partTitle": "RAIL DEMOS",
    "protocols": [],
    "endpointPreview": "GET /api/v1/live-trains/station/{stationShortCode}?departing_trains=10&arrived_trains=0&arriving_trains=5"
  },
  {
    "id": 2,
    "slug": "live-train-tracker-map",
    "title": "Live Train Tracker Map",
    "description": "Every active train in Finland plotted on a map with real-time GPS updates via MQTT WebSocket.",
    "whatUserSees": "An animated map of Finland. Colored dots move along rail lines. Click a dot to see train number, speed, route, and delay.",
    "apis": [
      "GET /api/v1/train-locations/latest (initial snapshot)",
      "MQTT topic train-locations/# (live updates)",
      "GraphQL for train details on click"
    ],
    "language": "javascript",
    "code": "// === STEP 1: Fetch initial positions for all trains ===\nconst locRes = await fetch(\n  'https://rata.digitraffic.fi/api/v1/train-locations/latest',\n  { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }\n);\nconst locations = await locRes.json();\n// Each: { trainNumber, departureDate, timestamp, speed,\n//         location: { type: \"Point\", coordinates: [lon, lat] } }\n\n// === STEP 2: Connect MQTT for live updates ===\n// Using Eclipse Paho MQTT.js client\nconst client = new Paho.MQTT.Client(\n  'rata.digitraffic.fi', 443, `demo-app-${Date.now()}`\n);\n\nclient.onMessageArrived = (message) => {\n  const payload = JSON.parse(message.payloadString);\n  // payload: { trainNumber, departureDate, timestamp, speed,\n  //            location: { type: \"Point\", coordinates: [lon, lat] } }\n\n  // Update marker on map\n  updateTrainMarker(payload.trainNumber, {\n    lng: payload.location.coordinates[0],\n    lat: payload.location.coordinates[1],\n    speed: payload.speed\n  });\n};\n\nclient.connect({\n  useSSL: true,\n  onSuccess: () => {\n    // Subscribe to all train location updates\n    client.subscribe('train-locations/#');\n    // Or single train: client.subscribe('train-locations/2025-04-01/71');\n  }\n});\n\n// === STEP 3: Get train details via GraphQL (on click) ===\nasync function getTrainDetails(trainNumber, departureDate) {\n  const query = `{\n    trainsByDepartureDate(\n      departureDate: \"${departureDate}\",\n      where: { trainNumber: { equals: ${trainNumber} } }\n    ) {\n      trainNumber\n      trainType\n      commuterLineid\n      operator { shortCode }\n      timeTableRows {\n        station { name shortCode }\n        type\n        scheduledTime\n        liveEstimateTime\n        differenceInMinutes\n        commercialStop\n      }\n    }\n  }`;\n\n  const res = await fetch('https://rata.digitraffic.fi/api/v2/graphql/graphql', {\n    method: 'POST',\n    headers: { 'Content-Type': 'application/json', 'Digitraffic-User': 'DemoApp/1.0' },\n    body: JSON.stringify({ query })\n  });\n  return (await res.json()).data.trainsByDepartureDate[0];\n}\n",
    "domain": "rail",
    "partTitle": "RAIL DEMOS",
    "protocols": [
      "MQTT",
      "POST"
    ],
    "endpointPreview": "GET /api/v1/train-locations/latest (initial snapshot)"
  },
  {
    "id": 3,
    "slug": "train-delay-analyzer",
    "title": "Train Delay Analyzer",
    "description": "Aggregated delay statistics: which stations and routes perform worst, time-of-day patterns.",
    "whatUserSees": "",
    "apis": [
      "GraphQL trainsByDepartureDate with date ranges",
      "GET /api/v1/trains/{date} (all trains for a date)"
    ],
    "language": "javascript",
    "code": "// Fetch all trains for a given date and compute delay stats\nasync function getDelayStats(date) {\n  const res = await fetch(\n    `https://rata.digitraffic.fi/api/v1/trains/${date}`,\n    { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }\n  );\n  const trains = await res.json();\n\n  const stationDelays = {};\n\n  trains.forEach(train => {\n    train.timeTableRows\n      .filter(r => r.type === 'ARRIVAL' && r.differenceInMinutes != null)\n      .forEach(row => {\n        const code = row.stationShortCode;\n        if (!stationDelays[code]) {\n          stationDelays[code] = { totalDelay: 0, count: 0, over5min: 0, over15min: 0 };\n        }\n        stationDelays[code].count++;\n        stationDelays[code].totalDelay += row.differenceInMinutes;\n        if (row.differenceInMinutes > 5) stationDelays[code].over5min++;\n        if (row.differenceInMinutes > 15) stationDelays[code].over15min++;\n      });\n  });\n\n  // Rank stations by average delay\n  return Object.entries(stationDelays)\n    .map(([code, stats]) => ({\n      station: code,\n      avgDelay: (stats.totalDelay / stats.count).toFixed(1),\n      punctuality: (((stats.count - stats.over5min) / stats.count) * 100).toFixed(1),\n      totalTrains: stats.count\n    }))\n    .sort((a, b) => b.avgDelay - a.avgDelay);\n}\n\n// Usage\nconst stats = await getDelayStats('2025-04-01');\n// → [{ station: \"TPE\", avgDelay: \"4.2\", punctuality: \"78.3\", totalTrains: 312 }, ...]\n",
    "domain": "rail",
    "partTitle": "RAIL DEMOS",
    "protocols": [
      "POST"
    ],
    "endpointPreview": "GraphQL trainsByDepartureDate with date ranges"
  },
  {
    "id": 4,
    "slug": "train-composition-visualizer",
    "title": "Train Composition Visualizer",
    "description": "SVG diagram showing a train's locomotive and wagon layout — 1st class, 2nd class, restaurant car, pet wagon.",
    "whatUserSees": "",
    "apis": [
      "GET /api/v1/compositions/{date}?train_number={number}",
      "GraphQL compositions query"
    ],
    "language": "javascript",
    "code": "// Fetch train composition\nasync function getComposition(trainNumber, date) {\n  const res = await fetch(\n    `https://rata.digitraffic.fi/api/v1/compositions/${date}?train_number=${trainNumber}`,\n    { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }\n  );\n  const data = await res.json();\n  const train = data[0]; // first match\n\n  // journeySections contain wagon orders at different parts of route\n  return train.journeySections.map(section => ({\n    fromStation: section.beginTimeTableRow.stationShortCode,\n    toStation: section.endTimeTableRow.stationShortCode,\n    locomotives: section.locomotives.map(l => ({\n      location: l.location,        // position in train\n      powerType: l.locomotivePowerType,  // \"Sm3\" (Pendolino), \"Dr16\", etc.\n    })),\n    wagons: section.wagons.map(w => ({\n      location: w.location,\n      salesNumber: w.salesNumber,  // wagon number visible to passengers\n      wagonType: w.wagonType,      // \"Ed\", \"Edfs\", \"Gfot\", etc.\n      catering: w.catering,        // true if restaurant / café\n      disabled: w.disabled,        // wheelchair accessible\n      pet: w.pet,                  // pet-friendly wagon\n      playground: w.playground,    // children's play area\n      video: w.video,              // video screens\n      luggage: w.luggage,\n    }))\n  }));\n}\n\n// Render as SVG: each wagon is a rounded rectangle with icons\nfunction renderCompositionSVG(composition) {\n  const section = composition[0]; // first section of journey\n  const allUnits = [\n    ...section.locomotives.map(l => ({ ...l, type: 'locomotive' })),\n    ...section.wagons.map(w => ({ ...w, type: 'wagon' }))\n  ].sort((a, b) => a.location - b.location);\n\n  // Return SVG string with wagon rectangles, labels, and amenity icons\n  const wagonWidth = 80, gap = 4, height = 40;\n  const svgWidth = allUnits.length * (wagonWidth + gap);\n\n  return `<svg viewBox=\"0 0 ${svgWidth} ${height + 30}\" xmlns=\"http://www.w3.org/2000/svg\">\n    ${allUnits.map((unit, i) => `\n      <rect x=\"${i * (wagonWidth + gap)}\" y=\"0\" width=\"${wagonWidth}\" height=\"${height}\"\n        rx=\"4\" fill=\"${unit.type === 'locomotive' ? '#334155' : '#3b82f6'}\" />\n      <text x=\"${i * (wagonWidth + gap) + wagonWidth/2}\" y=\"${height/2 + 5}\"\n        text-anchor=\"middle\" fill=\"white\" font-size=\"12\">\n        ${unit.type === 'locomotive' ? '🚂' : unit.salesNumber || unit.location}\n      </text>\n      <text x=\"${i * (wagonWidth + gap) + wagonWidth/2}\" y=\"${height + 16}\"\n        text-anchor=\"middle\" font-size=\"9\" fill=\"#64748b\">\n        ${[unit.catering && '🍽️', unit.pet && '🐾', unit.playground && '🧒', unit.disabled && '♿']\n          .filter(Boolean).join(' ')}\n      </text>\n    `).join('')}\n  </svg>`;\n}\n",
    "domain": "rail",
    "partTitle": "RAIL DEMOS",
    "protocols": [
      "POST"
    ],
    "endpointPreview": "GET /api/v1/compositions/{date}?train_number={number}"
  },
  {
    "id": 5,
    "slug": "station-to-station-journey-finder",
    "title": "Station-to-Station Journey Finder",
    "description": "Find all direct trains between two stations today with real-time delay info.",
    "whatUserSees": "",
    "apis": [
      "GET /api/v1/live-trains/station/{from}/{to}?departure_date={date}"
    ],
    "language": "javascript",
    "code": "async function findJourneys(from, to, date) {\n  const res = await fetch(\n    `https://rata.digitraffic.fi/api/v1/live-trains/station/${from}/${to}?departure_date=${date}`,\n    { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }\n  );\n  const trains = await res.json();\n\n  return trains.map(train => {\n    const depRow = train.timeTableRows.find(\n      r => r.stationShortCode === from && r.type === 'DEPARTURE' && r.commercialStop\n    );\n    const arrRow = train.timeTableRows.find(\n      r => r.stationShortCode === to && r.type === 'ARRIVAL' && r.commercialStop\n    );\n    if (!depRow || !arrRow) return null;\n\n    const depTime = new Date(depRow.scheduledTime);\n    const arrTime = new Date(arrRow.scheduledTime);\n    const durationMin = Math.round((arrTime - depTime) / 60000);\n    const stops = train.timeTableRows.filter(r =>\n      r.commercialStop && r.type === 'ARRIVAL' &&\n      new Date(r.scheduledTime) > depTime &&\n      new Date(r.scheduledTime) < arrTime\n    ).length;\n\n    return {\n      trainNumber: train.trainNumber,\n      trainType: train.trainType,\n      commuterLine: train.commuterLineID,\n      departure: depTime.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' }),\n      arrival: arrTime.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' }),\n      durationMin,\n      stops,\n      depDelay: depRow.differenceInMinutes || 0,\n      arrDelay: arrRow.differenceInMinutes || 0,\n      cancelled: train.cancelled\n    };\n  }).filter(Boolean).sort((a, b) => a.departure.localeCompare(b.departure));\n}\n\n// Helsinki → Tampere\nconst journeys = await findJourneys('HKI', 'TPE', '2025-04-01');\n// → [{ trainNumber: 3, trainType: \"IC\", departure: \"06:18\",\n//      arrival: \"08:03\", durationMin: 105, stops: 2, arrDelay: 0 }, ...]\n",
    "domain": "rail",
    "partTitle": "RAIL DEMOS",
    "protocols": [],
    "endpointPreview": "GET /api/v1/live-trains/station/{from}/{to}?departure_date={date}"
  },
  {
    "id": 6,
    "slug": "passenger-information-messages",
    "title": "Passenger Information Messages",
    "description": "Live station announcements — disruptions, platform changes, delay explanations — in 3 languages.",
    "whatUserSees": "",
    "apis": [
      "GraphQL passengerInformationMessages"
    ],
    "language": "javascript",
    "code": "// Fetch active passenger information messages\nasync function getPassengerMessages(stationCode) {\n  const query = `{\n    passengerInformationMessages(\n      where: {\n        station: { shortCode: { equals: \"${stationCode}\" } }\n      }\n    ) {\n      id\n      version\n      creationDateTime\n      startValidity\n      endValidity\n      trainNumber\n      trainDepartureDate\n      stations { shortCode }\n      video { text { fi sv en } deliveryRules { startDateTime endDateTime } }\n      audio { text { fi sv en } deliveryRules { startDateTime endDateTime } }\n    }\n  }`;\n\n  const res = await fetch('https://rata.digitraffic.fi/api/v2/graphql/graphql', {\n    method: 'POST',\n    headers: { 'Content-Type': 'application/json', 'Digitraffic-User': 'DemoApp/1.0' },\n    body: JSON.stringify({ query })\n  });\n\n  const data = await res.json();\n  return data.data.passengerInformationMessages.map(msg => ({\n    id: msg.id,\n    trainNumber: msg.trainNumber,\n    textFi: msg.video?.text?.fi || msg.audio?.text?.fi || '',\n    textSv: msg.video?.text?.sv || msg.audio?.text?.sv || '',\n    textEn: msg.video?.text?.en || msg.audio?.text?.en || '',\n    validFrom: msg.startValidity,\n    validTo: msg.endValidity,\n  }));\n}\n\nconst messages = await getPassengerMessages('HKI');\n// → [{ id: \"...\", trainNumber: 71,\n//      textEn: \"IC 71 to Oulu is delayed approximately 15 minutes...\", ... }]\n",
    "domain": "rail",
    "partTitle": "RAIL DEMOS",
    "protocols": [
      "POST"
    ],
    "endpointPreview": "GraphQL passengerInformationMessages"
  },
  {
    "id": 7,
    "slug": "live-road-weather-cameras",
    "title": "Live Road Weather Cameras",
    "description": "A browsable gallery/map of 470+ road weather cameras with 24-hour history timelapse.",
    "whatUserSees": "",
    "apis": [
      "GET /api/weathercam/v1/stations (metadata with camera positions)",
      "GET /api/weathercam/v1/stations/{id}/history (24h history)",
      "Image URL: https://weathercam.digitraffic.fi/{presetId}.jpg"
    ],
    "language": "javascript",
    "code": "// 1. Fetch all camera stations with presets\nconst camRes = await fetch(\n  'https://tie.digitraffic.fi/api/weathercam/v1/stations',\n  { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }\n);\nconst camData = await camRes.json();\n\n// 2. Filter to active cameras and extract image URLs\nconst cameras = camData.features\n  .filter(f => f.properties.state === 'OK' && f.properties.collectionStatus === 'GATHERING')\n  .map(f => ({\n    id: f.properties.id,\n    name: f.properties.name,\n    lat: f.geometry.coordinates[1],\n    lng: f.geometry.coordinates[0],\n    presets: f.properties.presets\n      .filter(p => p.inCollection)\n      .map(p => ({\n        presetId: p.id,\n        imageUrl: `https://weathercam.digitraffic.fi/${p.id}.jpg`,\n        thumbUrl: `https://weathercam.digitraffic.fi/${p.id}.jpg?thumbnail=true`,\n        direction: p.presentationName,\n      }))\n  }));\n\n// 3. Get 24-hour history for a specific preset\nasync function getCameraHistory(presetId) {\n  const res = await fetch(\n    `https://tie.digitraffic.fi/api/weathercam/v1/stations/${presetId}/history`,\n    { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }\n  );\n  const data = await res.json();\n  // Returns array of { presetId, imageUrl, lastModified }\n  return data.presetHistories?.[0]?.history || [];\n}\n\n// Timelapse: cycle through history images at 200ms intervals\nasync function playTimelapse(presetId, imgElement) {\n  const history = await getCameraHistory(presetId);\n  for (const frame of history) {\n    imgElement.src = frame.imageUrl;\n    await new Promise(r => setTimeout(r, 200));\n  }\n}\n",
    "domain": "road",
    "partTitle": "ROAD DEMOS",
    "protocols": [],
    "endpointPreview": "GET /api/weathercam/v1/stations (metadata with camera positions)"
  },
  {
    "id": 8,
    "slug": "road-weather-dashboard",
    "title": "Road Weather Dashboard",
    "description": "Real-time surface temperature, wind, rain, and visibility from 350+ road weather stations.",
    "whatUserSees": "",
    "apis": [
      "GET /api/weather/v1/stations (station metadata)",
      "GET /api/weather/v1/stations/data (latest readings)",
      "GET /api/weather/v1/stations/{id}/data/{sensorId}/history?from={iso}&to={iso} (24h history)"
    ],
    "language": "javascript",
    "code": "// 1. Fetch latest readings from all road weather stations\nconst weatherRes = await fetch(\n  'https://tie.digitraffic.fi/api/weather/v1/stations/data',\n  { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }\n);\nconst weatherData = await weatherRes.json();\n\n// 2. Parse sensor values (each station has many sensors)\nconst stations = weatherData.stations.map(station => {\n  const sensors = {};\n  station.sensorValues.forEach(s => {\n    sensors[s.name] = { value: s.sensorValue, unit: s.sensorUnit, measuredTime: s.measuredTime };\n  });\n\n  return {\n    id: station.id,\n    name: station.name,\n    lat: station.lat,\n    lng: station.lon,\n    airTemperature: sensors['ILMA']?.value,         // Air temp (°C)\n    roadTemperature: sensors['TIE_1']?.value,       // Road surface temp (°C)\n    humidity: sensors['ILMAN_KOSTEUS']?.value,       // Relative humidity (%)\n    windSpeed: sensors['TUULENNOPEUSKESKIARVO']?.value,  // Avg wind speed (m/s)\n    windDirection: sensors['TUULENSUUNTA']?.value,        // Wind dir (degrees)\n    precipitation: sensors['SADE']?.value,            // Rain/snow\n    visibility: sensors['NAKYVYYS']?.value,           // Visibility (m)\n    roadCondition: sensors['TIEN_SUOLA']?.value,      // Road salt status\n  };\n});\n\n// 3. Color-code for map: road surface temp thresholds\nfunction tempColor(roadTemp) {\n  if (roadTemp === null || roadTemp === undefined) return '#94a3b8';\n  if (roadTemp < -5) return '#7c3aed';   // Very cold: purple\n  if (roadTemp < 0)  return '#3b82f6';   // Freezing: blue\n  if (roadTemp < 5)  return '#06b6d4';   // Cold: cyan\n  if (roadTemp < 15) return '#22c55e';   // Mild: green\n  if (roadTemp < 25) return '#eab308';   // Warm: yellow\n  return '#ef4444';                       // Hot: red\n}\n\n// 4. MQTT real-time updates (optional — for live dashboard)\n// Topic: weather/observations/{stationId}\n",
    "domain": "road",
    "partTitle": "ROAD DEMOS",
    "protocols": [],
    "endpointPreview": "GET /api/weather/v1/stations (station metadata)"
  },
  {
    "id": 9,
    "slug": "traffic-volume-heatmap-tms-lam",
    "title": "Traffic Volume Heatmap (TMS/LAM)",
    "description": "Vehicle counts and speeds from 500+ Traffic Measurement System stations.",
    "whatUserSees": "",
    "apis": [
      "GET /api/tms/v1/stations (station metadata with road info)",
      "GET /api/tms/v1/stations/data (latest measurements)",
      "GET /api/tms/v1/history/raw/lamraw_{id}_{YY}_{dayNum}.csv (raw historical CSV)"
    ],
    "language": "javascript",
    "code": "// 1. Fetch latest TMS sensor data\nconst tmsRes = await fetch(\n  'https://tie.digitraffic.fi/api/tms/v1/stations/data',\n  { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }\n);\nconst tmsData = await tmsRes.json();\n\n// 2. Parse key sensors\n// Sensor IDs: 5122 = avg speed (dir1), 5119 = traffic volume (dir1),\n//             5164 = avg speed (dir2), 5168 = traffic volume (dir2)\nconst trafficData = tmsData.stations.map(station => {\n  const vals = {};\n  station.sensorValues.forEach(s => { vals[s.id] = s.sensorValue; });\n\n  return {\n    id: station.id,\n    name: station.name,\n    lat: station.lat,\n    lng: station.lon,\n    avgSpeedDir1: vals[5122],      // km/h\n    volumeDir1: vals[5119],        // vehicles / time period\n    avgSpeedDir2: vals[5164],      // km/h\n    volumeDir2: vals[5168],        // vehicles / time period\n    totalVolume: (vals[5119] || 0) + (vals[5168] || 0),\n    measuredTime: station.measuredTime\n  };\n});\n\n// 3. Historical raw CSV data (for analytics demos)\n// Vehicle classes in CSV: 1=car, 2=truck, 3=bus, 4=semi-trailer,\n//                         5=truck+trailer, 6=car+trailer, 7=car+camper, 8=motorcycle\nconst csvUrl = 'https://tie.digitraffic.fi/api/tms/v1/history/raw/lamraw_101_25_91.csv';\n// Fields: id;year;day;hour;minute;second;1/100s;length(m);lane;direction;\n//         class;speed(km/h);faulty;totalTime(ms);timeInterval(ms);queueStart\n",
    "domain": "road",
    "partTitle": "ROAD DEMOS",
    "protocols": [],
    "endpointPreview": "GET /api/tms/v1/stations (station metadata with road info)"
  },
  {
    "id": 10,
    "slug": "traffic-disruption-feed",
    "title": "Traffic Disruption Feed",
    "description": "Active accidents, road works, weight restrictions, and exempted transports on a filterable map.",
    "whatUserSees": "",
    "apis": [
      "GET /api/traffic-message/v1/messages?situationType={type}&inactiveHours=0",
      "Types: TRAFFIC_ANNOUNCEMENT, ROAD_WORK, WEIGHT_RESTRICTION, EXEMPTED_TRANSPORT"
    ],
    "language": "javascript",
    "code": "// Fetch all active traffic announcements\nasync function getTrafficMessages(type = 'TRAFFIC_ANNOUNCEMENT') {\n  const res = await fetch(\n    `https://tie.digitraffic.fi/api/traffic-message/v1/messages?situationType=${type}&inactiveHours=0`,\n    { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }\n  );\n  const data = await res.json();\n\n  return data.features.map(f => ({\n    id: f.properties.situationId,\n    type: f.properties.situationType,\n    severity: f.properties.announcements?.[0]?.severity,          // LOW, MEDIUM, HIGH\n    title: f.properties.announcements?.[0]?.title,\n    description: f.properties.announcements?.[0]?.description,\n    location: f.properties.announcements?.[0]?.locationDescription,\n    startTime: f.properties.announcements?.[0]?.timeAndDuration?.startTime,\n    endTime: f.properties.announcements?.[0]?.timeAndDuration?.endTime,\n    geometry: f.geometry,  // GeoJSON Point, LineString, or Polygon\n    // Render on map using f.geometry directly\n  }));\n}\n\n// Fetch all types in parallel\nconst [accidents, roadworks, restrictions, transports] = await Promise.all([\n  getTrafficMessages('TRAFFIC_ANNOUNCEMENT'),\n  getTrafficMessages('ROAD_WORK'),\n  getTrafficMessages('WEIGHT_RESTRICTION'),\n  getTrafficMessages('EXEMPTED_TRANSPORT'),\n]);\n\n// MQTT real-time: topic traffic-message-v2/simple/{situationType}\n// Payload is gzipped + base64 encoded\n",
    "domain": "road",
    "partTitle": "ROAD DEMOS",
    "protocols": [],
    "endpointPreview": "GET /api/traffic-message/v1/messages?situationType={type}&inactiveHours=0"
  },
  {
    "id": 11,
    "slug": "snowplow-maintenance-tracker",
    "title": "Snowplow & Maintenance Tracker",
    "description": "Real-time locations and routes of road maintenance vehicles — watch snowplows clear Finnish highways.",
    "whatUserSees": "",
    "apis": [
      "GET /api/maintenance/v1/tracking/routes?endFrom={iso}&endBefore={iso}&taskId={id}",
      "GET /api/maintenance/v1/tracking/routes/latest?taskId={id}",
      "GET /api/maintenance/v1/tracking/tasks (task type list)",
      "GET /api/maintenance/v1/tracking/domains (data source domains)"
    ],
    "language": "javascript",
    "code": "// 1. Get available task types\nconst tasksRes = await fetch(\n  'https://tie.digitraffic.fi/api/maintenance/v1/tracking/tasks',\n  { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }\n);\nconst tasks = await tasksRes.json();\n// Common tasks: PLOUGHING, SALTING, SANDING, BRUSHING, LEVELLING_GRAVEL,\n//               LINE_SANDING, PAVING, CRACK_FILLING, OTHER\n\n// 2. Get latest routes for ploughing vehicles (last 4 hours)\nconst now = new Date();\nconst fourHoursAgo = new Date(now - 4 * 3600000);\n\nconst routesRes = await fetch(\n  `https://tie.digitraffic.fi/api/maintenance/v1/tracking/routes?endFrom=${fourHoursAgo.toISOString()}&endBefore=${now.toISOString()}&taskId=PLOUGHING&domain=state-roads`,\n  { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }\n);\nconst routeData = await routesRes.json();\n\n// GeoJSON FeatureCollection — each feature is a route segment\nrouteData.features.forEach(feature => {\n  console.log({\n    tasks: feature.properties.tasks,          // [\"PLOUGHING\", \"SALTING\"]\n    startTime: feature.properties.startTime,\n    endTime: feature.properties.endTime,\n    direction: feature.properties.direction,\n    domain: feature.properties.domain,        // \"state-roads\" or municipal\n    geometry: feature.geometry                // LineString or Point\n  });\n});\n\n// 3. MQTT for real-time updates\n// Topic: maintenance/routes/{domain}\n// Message contains GeoJSON route with task list\n",
    "domain": "road",
    "partTitle": "ROAD DEMOS",
    "protocols": [],
    "endpointPreview": "GET /api/maintenance/v1/tracking/routes?endFrom={iso}&endBefore={iso}&taskId={id}"
  },
  {
    "id": 12,
    "slug": "variable-speed-limit-signs",
    "title": "Variable Speed Limit Signs",
    "description": "Current values of electronic speed limit and warning signs along Finnish highways.",
    "whatUserSees": "",
    "apis": [
      "GET /api/variable-sign/v1/signs (sign metadata)",
      "GET /api/variable-sign/v1/signs/data (current values)",
      "SVG images: /api/variable-sign/v1/images/tie_{number} and /api/variable-sign/v1/images/ramppi_{number}"
    ],
    "language": "javascript",
    "code": "// Fetch current variable sign values\nconst signsRes = await fetch(\n  'https://tie.digitraffic.fi/api/variable-sign/v1/signs/data',\n  { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }\n);\nconst signsData = await signsRes.json();\n\nconst signs = signsData.map(sign => ({\n  id: sign.id,\n  type: sign.type,                 // \"SPEEDLIMIT\" or \"WARNING\"\n  roadNumber: sign.roadAddress?.roadNumber,\n  direction: sign.direction,\n  lat: sign.lat,\n  lng: sign.lon,\n  // For speed limits:\n  displayedValue: sign.displayedValue,  // e.g. \"80\"\n  // For warnings: text content\n  effectDate: sign.effectDate,\n  cause: sign.cause,\n  reliability: sign.reliability,\n}));\n\n// Render speed limit as SVG road sign\nfunction speedLimitSVG(value) {\n  return `<svg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\">\n    <circle cx=\"30\" cy=\"30\" r=\"28\" fill=\"white\" stroke=\"red\" stroke-width=\"4\"/>\n    <text x=\"30\" y=\"37\" text-anchor=\"middle\" font-size=\"22\"\n          font-weight=\"bold\" font-family=\"Arial\">${value}</text>\n  </svg>`;\n}\n",
    "domain": "road",
    "partTitle": "ROAD DEMOS",
    "protocols": [],
    "endpointPreview": "GET /api/variable-sign/v1/signs (sign metadata)"
  },
  {
    "id": 13,
    "slug": "ev-charging-station-finder-afir",
    "title": "EV Charging Station Finder (AFIR)",
    "description": "Electric vehicle charging points with real-time connector availability and power levels.",
    "whatUserSees": "",
    "apis": [
      "AFIR endpoints under tie.digitraffic.fi/api/afir/v1/...",
      "Swagger: https://tie.digitraffic.fi/swagger/ → Alternative Fuels section"
    ],
    "language": "javascript",
    "code": "// Note: AFIR API specifics — check Swagger for exact current endpoints.\n// The AFIR dataset follows EU Alternative Fuels Infrastructure Regulation format.\n\n// Conceptual structure (verify endpoint paths against current Swagger docs):\nconst stationsRes = await fetch(\n  'https://tie.digitraffic.fi/api/afir/v1/stations',\n  { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }\n);\nconst stations = await stationsRes.json();\n\n// Each station typically contains:\n// - location (lat/lon)\n// - operator info\n// - connectors: type (CCS, CHAdeMO, Type2), power (kW), availability status\n// - pricing info\n// - opening hours\n\n// Filter high-power DC chargers\nconst dcFast = stations.filter(s =>\n  s.connectors?.some(c => c.powerKW >= 50 && c.connectorType === 'CCS')\n);\n",
    "domain": "road",
    "partTitle": "ROAD DEMOS",
    "protocols": [],
    "endpointPreview": "AFIR endpoints under tie.digitraffic.fi/api/afir/v1/..."
  },
  {
    "id": 14,
    "slug": "helsinki-commute-fluency",
    "title": "Helsinki Commute Fluency",
    "description": "Real-time travel times and congestion levels for Helsinki metropolitan road links.",
    "whatUserSees": "",
    "apis": [
      "GET /api/v1/data/fluency-current (live fluency)",
      "GET /api/v1/data/fluency-history-previous-day (yesterday's data)",
      "GET /api/v1/data/free-flow-speeds (reference free-flow speeds)"
    ],
    "language": "javascript",
    "code": "// Fetch current fluency (Helsinki metro area only, link IDs < 1000)\nconst fluencyRes = await fetch(\n  'https://tie.digitraffic.fi/api/v1/data/fluency-current',\n  { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }\n);\nconst fluency = await fluencyRes.json();\n\n// Each link has: medianTravelTime, averageSpeed, fluencyClass, timestamp\nconst links = fluency.travelTimes?.links || [];\nlinks.forEach(link => {\n  console.log({\n    linkId: link.id,\n    medianTravelTimeSec: link.travelTime?.median,\n    avgSpeedKmh: link.travelTime?.averageSpeed,\n    fluencyClass: link.travelTime?.fluencyClass,\n    // FLUENCY_CLASS_FREE, FLUENCY_CLASS_HEAVY, FLUENCY_CLASS_CONGESTED\n  });\n});\n\n// Color by fluency class\nfunction fluencyColor(cls) {\n  switch (cls) {\n    case 'FLUENCY_CLASS_FREE': return '#22c55e';       // Green\n    case 'FLUENCY_CLASS_HEAVY': return '#eab308';       // Yellow\n    case 'FLUENCY_CLASS_CONGESTED': return '#ef4444';   // Red\n    default: return '#94a3b8';                          // Gray\n  }\n}\n",
    "domain": "road",
    "partTitle": "ROAD DEMOS",
    "protocols": [],
    "endpointPreview": "GET /api/v1/data/fluency-current (live fluency)"
  },
  {
    "id": 15,
    "slug": "walking-cycling-counter",
    "title": "Walking & Cycling Counter",
    "description": "Pedestrian and cyclist counts from automated counting sites across Finland.",
    "whatUserSees": "",
    "apis": [
      "GET /api/counting-site/v1/stations (GeoJSON with all sites)",
      "GET /api/counting-site/v1/stations/{id} (single site metadata)",
      "GET /api/counting-site/v1/values/{id}?from={iso}&to={iso} (count values)",
      "GET /api/counting-site/v1/values/{id}.csv?from={iso}&to={iso} (CSV export)"
    ],
    "language": "javascript",
    "code": "// 1. Get all counting sites\nconst sitesRes = await fetch(\n  'https://tie.digitraffic.fi/api/counting-site/v1/stations',\n  { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }\n);\nconst sites = await sitesRes.json();\n// GeoJSON FeatureCollection with site name, location, directions\n\n// 2. Get hourly counts for a specific site\nconst siteId = 1;  // example\nconst from = '2025-03-31T00:00:00Z';\nconst to = '2025-04-01T00:00:00Z';\n\nconst valuesRes = await fetch(\n  `https://tie.digitraffic.fi/api/counting-site/v1/values/${siteId}?from=${from}&to=${to}`,\n  { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }\n);\nconst values = await valuesRes.json();\n// Contains hourly counts split by direction and user type (pedestrian/cyclist)\n\n// 3. CSV export for data analysis\nconst csvUrl = `https://tie.digitraffic.fi/api/counting-site/v1/values/${siteId}.csv?from=${from}&to=${to}`;\n",
    "domain": "road",
    "partTitle": "ROAD DEMOS",
    "protocols": [],
    "endpointPreview": "GET /api/counting-site/v1/stations (GeoJSON with all sites)"
  },
  {
    "id": 16,
    "slug": "live-vessel-map-ais",
    "title": "Live Vessel Map (AIS)",
    "description": "Every vessel in Finnish waters plotted on a marine chart with real-time position updates.",
    "whatUserSees": "",
    "apis": [
      "GET /api/ais/v1/locations (all vessel positions — large payload!)",
      "GET /api/ais/v1/vessels (vessel metadata — name, type, dimensions)",
      "MQTT vessels-v2/{mmsi}/location and vessels-v2/{mmsi}/metadata"
    ],
    "language": "javascript",
    "code": "// 1. Initial snapshot of all vessel locations\nconst locRes = await fetch(\n  'https://meri.digitraffic.fi/api/ais/v1/locations',\n  { headers: { 'Digitraffic-User': 'DemoApp/1.0', 'Accept-Encoding': 'gzip' } }\n);\nconst vesselLocations = await locRes.json();\n\n// Each vessel location:\n// { mmsi, time, sog (speed over ground, knots), cog (course), navStat,\n//   rot (rate of turn), posAcc, heading, lon, lat }\n\n// 2. Vessel metadata\nconst metaRes = await fetch(\n  'https://meri.digitraffic.fi/api/ais/v1/vessels',\n  { headers: { 'Digitraffic-User': 'DemoApp/1.0', 'Accept-Encoding': 'gzip' } }\n);\nconst vesselMeta = await metaRes.json();\nconst metaMap = Object.fromEntries(vesselMeta.map(v => [v.mmsi, v]));\n// { mmsi, name, imo, callSign, type (70=cargo, 80=tanker, 60=passenger),\n//   destination, draught, eta, refA/B/C/D (ship dimensions) }\n\n// 3. MQTT for live tracking\nconst client = new Paho.MQTT.Client('meri.digitraffic.fi', 443, `app-${Date.now()}`);\n\nclient.connect({\n  useSSL: true,\n  onSuccess: () => {\n    // Track all vessel locations\n    client.subscribe('vessels-v2/+/location');\n    // Or single vessel by MMSI: client.subscribe('vessels-v2/230123456/location');\n  }\n});\n\nclient.onMessageArrived = (msg) => {\n  const loc = JSON.parse(msg.payloadString);\n  // Update map marker for this vessel\n  updateVesselMarker(loc.mmsi, { lat: loc.lat, lng: loc.lon, heading: loc.heading, sog: loc.sog });\n};\n\n// Vessel type colors\nfunction vesselTypeColor(type) {\n  if (type >= 70 && type < 80) return '#3b82f6';  // Cargo: blue\n  if (type >= 80 && type < 90) return '#ef4444';  // Tanker: red\n  if (type >= 60 && type < 70) return '#22c55e';  // Passenger: green\n  if (type >= 30 && type < 40) return '#eab308';  // Fishing: yellow\n  return '#94a3b8';                                 // Other: gray\n}\n",
    "domain": "marine",
    "partTitle": "MARINE DEMOS",
    "protocols": [
      "MQTT"
    ],
    "endpointPreview": "GET /api/ais/v1/locations (all vessel positions — large payload!)"
  },
  {
    "id": 17,
    "slug": "port-call-dashboard",
    "title": "Port Call Dashboard",
    "description": "Which ships are arriving and departing Finnish harbors, with ETAs and cargo info.",
    "whatUserSees": "",
    "apis": [
      "GET /api/port-call/v1/port-calls?from={iso}&locode={portCode}",
      "GET /api/port-call/v1/ports (port metadata)",
      "GET /api/port-call/v1/vessel-details (vessel info)"
    ],
    "language": "javascript",
    "code": "// 1. Fetch port list\nconst portsRes = await fetch(\n  'https://meri.digitraffic.fi/api/port-call/v1/ports',\n  { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }\n);\nconst ports = await portsRes.json();\n// Ports have UN/LOCODE: FIHEL (Helsinki), FIKTK (Kotka), FIOUL (Oulu), etc.\n\n// 2. Fetch port calls for Helsinki, last 24 hours\nconst yesterday = new Date(Date.now() - 86400000).toISOString();\nconst callsRes = await fetch(\n  `https://meri.digitraffic.fi/api/port-call/v1/port-calls?from=${yesterday}&locode=FIHEL`,\n  { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }\n);\nconst portCalls = await callsRes.json();\n\nportCalls.forEach(pc => {\n  console.log({\n    vesselName: pc.vesselName,\n    mmsi: pc.mmsi,\n    imo: pc.imoLloyds,\n    nationality: pc.nationality,\n    portToVisit: pc.portToVisit,\n    eta: pc.portCallTimestamp,\n    arrivalTime: pc.arrivalTime,\n    departureTime: pc.departureTime,\n    agentInfo: pc.agentInfo,\n    from: pc.prevPort,\n    to: pc.nextPort,\n    imoHazardousCargo: pc.imoInformation,\n  });\n});\n",
    "domain": "marine",
    "partTitle": "MARINE DEMOS",
    "protocols": [],
    "endpointPreview": "GET /api/port-call/v1/port-calls?from={iso}&locode={portCode}"
  },
  {
    "id": 18,
    "slug": "nautical-warnings-map",
    "title": "Nautical Warnings Map",
    "description": "Active marine hazards, exercises, and restrictions.",
    "whatUserSees": "",
    "apis": [
      "GET /api/nautical-warning/v1/warnings/active"
    ],
    "language": "javascript",
    "code": "const warningsRes = await fetch(\n  'https://meri.digitraffic.fi/api/nautical-warning/v1/warnings/active',\n  { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }\n);\nconst warnings = await warningsRes.json();\n\n// GeoJSON FeatureCollection\nwarnings.features.forEach(w => {\n  console.log({\n    number: w.properties.number,\n    areasFi: w.properties.areasEn,\n    type: w.properties.type,                 // COASTAL, LOCAL, BOATING\n    description: w.properties.descriptionEn,\n    startDate: w.properties.publishingTime,\n    geometry: w.geometry,  // Point, Polygon, or MultiPolygon for affected area\n  });\n});\n",
    "domain": "marine",
    "partTitle": "MARINE DEMOS",
    "protocols": [],
    "endpointPreview": "GET /api/nautical-warning/v1/warnings/active"
  },
  {
    "id": 19,
    "slug": "sea-state-monitor-smart-buoys",
    "title": "Sea State Monitor (Smart Buoys)",
    "description": "Wave conditions, temperature, and trends from AtoN buoy sensors.",
    "whatUserSees": "",
    "apis": [
      "GET /api/sse/v1/measurements (all sites)",
      "MQTT sse-v2/site/{siteId} (live updates every 30 min)"
    ],
    "language": "javascript",
    "code": "// Fetch sea state estimation data from all buoy sites\nconst sseRes = await fetch(\n  'https://meri.digitraffic.fi/api/sse/v1/measurements',\n  { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }\n);\nconst sseData = await sseRes.json();\n\n// GeoJSON FeatureCollection\nsseData.features.forEach(f => {\n  console.log({\n    siteNumber: f.properties.siteNumber,\n    siteName: f.properties.siteName,\n    lat: f.geometry.coordinates[1],\n    lng: f.geometry.coordinates[0],\n    seaState: f.properties.seaState,         // CALM, LIGHT, MODERATE, BREEZE, GALE, STORM\n    trend: f.properties.trend,                // DESCENDING, NO_CHANGE, ASCENDING\n    windWaveDir: f.properties.windWaveDir,   // degrees\n    confidence: f.properties.confidence,      // GOOD, MODERATE, POOR\n    heelAngle: f.properties.heelAngle,       // buoy tilt in degrees\n    lightStatus: f.properties.lightStatus,   // ON, OFF\n    temperature: f.properties.temperature,   // water/air temperature\n  });\n});\n",
    "domain": "marine",
    "partTitle": "MARINE DEMOS",
    "protocols": [
      "MQTT"
    ],
    "endpointPreview": "GET /api/sse/v1/measurements (all sites)"
  },
  {
    "id": 20,
    "slug": "winter-navigation-icebreaker-routes",
    "title": "Winter Navigation & Icebreaker Routes",
    "description": "Icebreaker-assisted shipping lanes and port ice restrictions during Finnish winter.",
    "whatUserSees": "",
    "apis": [
      "GET /api/winter-navigation/v2/dirways (icebreaker routes)",
      "GET /api/winter-navigation/v2/ports (port restrictions)",
      "GET /api/winter-navigation/v2/vessels (vessels in winter nav system)"
    ],
    "language": "javascript",
    "code": "// 1. Get current icebreaker dirways\nconst dirwayRes = await fetch(\n  'https://meri.digitraffic.fi/api/winter-navigation/v2/dirways',\n  { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }\n);\nconst dirways = await dirwayRes.json();\n// Contains route geometries for icebreaker-assisted paths\n\n// 2. Get port winter restrictions\nconst portsRes = await fetch(\n  'https://meri.digitraffic.fi/api/winter-navigation/v2/ports',\n  { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }\n);\nconst ports = await portsRes.json();\n// Ice class requirements, tonnage limits per port\n\n// 3. Get vessels in winter navigation system\nconst wvRes = await fetch(\n  'https://meri.digitraffic.fi/api/winter-navigation/v2/vessels',\n  { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }\n);\nconst winterVessels = await wvRes.json();\n// Vessel ice class, icebreaker assignments\n",
    "domain": "marine",
    "partTitle": "MARINE DEMOS",
    "protocols": [],
    "endpointPreview": "GET /api/winter-navigation/v2/dirways (icebreaker routes)"
  },
  {
    "id": 21,
    "slug": "finland-transport-pulse-live-dashboard",
    "title": "Finland Transport Pulse — Live Dashboard",
    "description": "A single executive dashboard: how is Finland's entire transport network performing *right now*?",
    "whatUserSees": "",
    "apis": [
      "Rail: /api/v1/live-trains/station/HKI, /api/v1/train-locations/latest",
      "Road: /api/tms/v1/stations/data, /api/traffic-message/v1/messages",
      "Marine: /api/ais/v1/locations, /api/port-call/v1/port-calls"
    ],
    "language": "javascript",
    "code": "// Fetch all dashboarrd data in parallel\nasync function getTransportPulse() {\n  const [trains, trainLocs, tmsData, disruptions, vessels, portCalls] = await Promise.all([\n    fetch('https://rata.digitraffic.fi/api/v1/trains/2025-04-01',\n      { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }).then(r => r.json()),\n    fetch('https://rata.digitraffic.fi/api/v1/train-locations/latest',\n      { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }).then(r => r.json()),\n    fetch('https://tie.digitraffic.fi/api/tms/v1/stations/data',\n      { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }).then(r => r.json()),\n    fetch('https://tie.digitraffic.fi/api/traffic-message/v1/messages?situationType=TRAFFIC_ANNOUNCEMENT&inactiveHours=0',\n      { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }).then(r => r.json()),\n    fetch('https://meri.digitraffic.fi/api/ais/v1/locations',\n      { headers: { 'Digitraffic-User': 'DemoApp/1.0', 'Accept-Encoding': 'gzip' } }).then(r => r.json()),\n    fetch(`https://meri.digitraffic.fi/api/port-call/v1/port-calls?from=${new Date(Date.now() - 86400000).toISOString()}`,\n      { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }).then(r => r.json()),\n  ]);\n\n  // Rail metrics\n  const activeTrains = trainLocs.length;\n  const delayedTrains = trains.filter(t =>\n    t.timeTableRows?.some(r => r.differenceInMinutes > 5)\n  ).length;\n  const avgDelay = trains.reduce((sum, t) => {\n    const delays = t.timeTableRows?.filter(r => r.differenceInMinutes > 0) || [];\n    return sum + delays.reduce((s, r) => s + r.differenceInMinutes, 0) / (delays.length || 1);\n  }, 0) / trains.length;\n\n  // Road metrics\n  const activeDisruptions = disruptions.features?.length || 0;\n  const tmsStationsReporting = tmsData.stations?.length || 0;\n\n  // Marine metrics\n  const vesselsAtSea = vessels.length;\n  const recentPortCalls = portCalls.length;\n\n  return {\n    rail: { activeTrains, delayedTrains, avgDelayMin: avgDelay.toFixed(1), totalTrains: trains.length },\n    road: { activeDisruptions, tmsStationsReporting },\n    marine: { vesselsAtSea, recentPortCalls24h: recentPortCalls },\n    timestamp: new Date().toISOString()\n  };\n}\n\n// Returns:\n// { rail: { activeTrains: 142, delayedTrains: 23, avgDelayMin: \"2.3\", totalTrains: 487 },\n//   road: { activeDisruptions: 34, tmsStationsReporting: 489 },\n//   marine: { vesselsAtSea: 312, recentPortCalls24h: 67 } }\n",
    "domain": "multi",
    "partTitle": "MULTI-MODAL / CROSS-DOMAIN DEMOS",
    "protocols": [],
    "endpointPreview": "Rail: /api/v1/live-trains/station/HKI, /api/v1/train-locations/latest"
  },
  {
    "id": 22,
    "slug": "weather-impact-on-transport",
    "title": "Weather Impact on Transport",
    "description": "How do road weather conditions correlate with train delays, traffic speed drops, and vessel routing?",
    "whatUserSees": "",
    "apis": [
      "Road weather: /api/weather/v1/stations/data",
      "Train delays: /api/v1/trains/{date} (rail)",
      "TMS speeds: /api/tms/v1/stations/data",
      "Nautical warnings: /api/nautical-warning/v1/warnings/active"
    ],
    "language": "javascript",
    "code": "// Cross-domain weather impact analysis\nasync function weatherImpactReport() {\n  const [weather, trains, tms, nauticalWarnings] = await Promise.all([\n    fetch('https://tie.digitraffic.fi/api/weather/v1/stations/data',\n      { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }).then(r => r.json()),\n    fetch(`https://rata.digitraffic.fi/api/v1/trains/${new Date().toISOString().slice(0, 10)}`,\n      { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }).then(r => r.json()),\n    fetch('https://tie.digitraffic.fi/api/tms/v1/stations/data',\n      { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }).then(r => r.json()),\n    fetch('https://meri.digitraffic.fi/api/nautical-warning/v1/warnings/active',\n      { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }).then(r => r.json()),\n  ]);\n\n  // Compute average temperatures across road weather stations\n  const temps = weather.stations\n    .flatMap(s => s.sensorValues.filter(sv => sv.name === 'ILMA'))\n    .map(sv => sv.sensorValue)\n    .filter(v => v !== null);\n  const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;\n\n  // Compute average train delay\n  const allDelays = trains.flatMap(t =>\n    (t.timeTableRows || [])\n      .filter(r => r.differenceInMinutes != null && r.type === 'ARRIVAL')\n      .map(r => r.differenceInMinutes)\n  );\n  const avgTrainDelay = allDelays.reduce((a, b) => a + b, 0) / allDelays.length;\n\n  // Check for icy conditions (road temp < 0) → how does it affect avg speeds?\n  const freezingStations = weather.stations.filter(s =>\n    s.sensorValues.some(sv => sv.name === 'TIE_1' && sv.sensorValue < 0)\n  );\n\n  return {\n    conditions: {\n      avgAirTemp: avgTemp.toFixed(1),\n      freezingRoadStations: freezingStations.length,\n      totalWeatherStations: weather.stations.length,\n    },\n    railImpact: {\n      avgDelayMin: avgTrainDelay.toFixed(1),\n      totalTrains: trains.length,\n      cancelledTrains: trains.filter(t => t.cancelled).length,\n    },\n    roadImpact: {\n      tmsStationsActive: tms.stations.length,\n    },\n    marineImpact: {\n      activeNauticalWarnings: nauticalWarnings.features.length,\n    }\n  };\n}\n",
    "domain": "multi",
    "partTitle": "MULTI-MODAL / CROSS-DOMAIN DEMOS",
    "protocols": [],
    "endpointPreview": "Road weather: /api/weather/v1/stations/data"
  },
  {
    "id": 23,
    "slug": "intermodal-journey-ship-train-connection",
    "title": "Intermodal Journey: Ship + Train Connection",
    "description": "\"My cargo ship arrives at Turku port at 14:00 — what trains go from Turku to Helsinki after that?\"",
    "whatUserSees": "",
    "apis": [
      "Port calls: meri.digitraffic.fi/api/port-call/v1/port-calls?locode=FITKU",
      "Train connections: rata.digitraffic.fi/api/v1/live-trains/station/TKU/HKI",
      "Road weather along the route: tie.digitraffic.fi/api/weather/v1/stations/data"
    ],
    "language": "javascript",
    "code": "// Intermodal: Ship arrival → Train connection\nasync function findShipTrainConnection(portCode, fromStation, toStation) {\n  // 1. Get incoming vessels to port\n  const portCallsRes = await fetch(\n    `https://meri.digitraffic.fi/api/port-call/v1/port-calls?locode=${portCode}`,\n    { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }\n  );\n  const portCalls = await portCallsRes.json();\n\n  // Find next arriving vessels\n  const now = new Date();\n  const arrivals = portCalls\n    .filter(pc => pc.portCallTimestamp && new Date(pc.portCallTimestamp) > now)\n    .sort((a, b) => new Date(a.portCallTimestamp) - new Date(b.portCallTimestamp))\n    .slice(0, 5);\n\n  // 2. For each arrival, find connecting trains departing 1+ hours after\n  const connections = await Promise.all(arrivals.map(async (arrival) => {\n    const arrTime = new Date(arrival.portCallTimestamp);\n    const trainsRes = await fetch(\n      `https://rata.digitraffic.fi/api/v1/live-trains/station/${fromStation}/${toStation}`,\n      { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }\n    );\n    const trains = await trainsRes.json();\n\n    // Filter trains departing at least 1 hour after vessel arrival\n    const connectingTrains = trains\n      .map(t => {\n        const dep = t.timeTableRows.find(\n          r => r.stationShortCode === fromStation && r.type === 'DEPARTURE'\n        );\n        return dep ? { ...t, departureTime: new Date(dep.scheduledTime) } : null;\n      })\n      .filter(t => t && t.departureTime > new Date(arrTime.getTime() + 3600000))\n      .slice(0, 3);\n\n    return {\n      vessel: { name: arrival.vesselName, eta: arrival.portCallTimestamp, from: arrival.prevPort },\n      trains: connectingTrains.map(t => ({\n        number: t.trainNumber,\n        type: t.trainType,\n        departure: t.departureTime.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' }),\n        waitTimeMin: Math.round((t.departureTime - arrTime) / 60000)\n      }))\n    };\n  }));\n\n  return connections;\n}\n\n// Example: Ships arriving Turku → trains to Helsinki\nconst connections = await findShipTrainConnection('FITKU', 'TKU', 'HKI');\n// → [{ vessel: { name: \"Viking Grace\", eta: \"2025-04-01T14:00:00Z\", from: \"SEMMA\" },\n//      trains: [{ number: 967, type: \"IC\", departure: \"15:21\", waitTimeMin: 81 }, ...] }]\n",
    "domain": "multi",
    "partTitle": "MULTI-MODAL / CROSS-DOMAIN DEMOS",
    "protocols": [],
    "endpointPreview": "Port calls: meri.digitraffic.fi/api/port-call/v1/port-calls?locode=FITKU"
  },
  {
    "id": 24,
    "slug": "national-disruption-map-all-modes",
    "title": "National Disruption Map — All Modes",
    "description": "Every active disruption across road, rail, and sea on a single map with a unified timeline.",
    "whatUserSees": "",
    "apis": [
      "Road: /api/traffic-message/v1/messages (all types)",
      "Rail: GraphQL passengerInformationMessages + cancelled trains",
      "Marine: /api/nautical-warning/v1/warnings/active + /api/bridge-lock/v1/disruptions"
    ],
    "language": "javascript",
    "code": "// Unified disruption aggregator\nasync function getAllDisruptions() {\n  const [roadMsgs, railTrains, nauticalWarnings, waterwayDisruptions] = await Promise.all([\n    // Road disruptions (all types)\n    Promise.all(['TRAFFIC_ANNOUNCEMENT', 'ROAD_WORK', 'WEIGHT_RESTRICTION'].map(type =>\n      fetch(`https://tie.digitraffic.fi/api/traffic-message/v1/messages?situationType=${type}&inactiveHours=0`,\n        { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }).then(r => r.json())\n    )),\n\n    // Rail: cancelled or heavily delayed trains\n    fetch(`https://rata.digitraffic.fi/api/v1/trains/${new Date().toISOString().slice(0, 10)}`,\n      { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }).then(r => r.json()),\n\n    // Marine warnings\n    fetch('https://meri.digitraffic.fi/api/nautical-warning/v1/warnings/active',\n      { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }).then(r => r.json()),\n\n    // Waterway disruptions (bridges, locks)\n    fetch('https://meri.digitraffic.fi/api/bridge-lock/v1/disruptions',\n      { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }).then(r => r.json()),\n  ]);\n\n  // Normalize into unified format\n  const disruptions = [];\n\n  // Road\n  roadMsgs.flat().forEach(data => {\n    (data.features || []).forEach(f => {\n      disruptions.push({\n        mode: 'road',\n        type: f.properties.situationType,\n        severity: f.properties.announcements?.[0]?.severity || 'UNKNOWN',\n        title: f.properties.announcements?.[0]?.title || 'Road disruption',\n        description: f.properties.announcements?.[0]?.description,\n        geometry: f.geometry,\n        startTime: f.properties.announcements?.[0]?.timeAndDuration?.startTime,\n      });\n    });\n  });\n\n  // Rail (cancelled trains)\n  railTrains.filter(t => t.cancelled).forEach(t => {\n    const firstStop = t.timeTableRows?.[0];\n    const lastStop = t.timeTableRows?.[t.timeTableRows.length - 1];\n    disruptions.push({\n      mode: 'rail',\n      type: 'CANCELLATION',\n      severity: 'HIGH',\n      title: `Train ${t.trainType} ${t.trainNumber} cancelled`,\n      description: `${firstStop?.stationShortCode} → ${lastStop?.stationShortCode}`,\n      geometry: null, // Would need station coords to place on map\n      startTime: firstStop?.scheduledTime,\n    });\n  });\n\n  // Marine\n  (nauticalWarnings.features || []).forEach(f => {\n    disruptions.push({\n      mode: 'marine',\n      type: f.properties.type,\n      severity: 'MEDIUM',\n      title: f.properties.descriptionEn || 'Nautical warning',\n      geometry: f.geometry,\n      startTime: f.properties.publishingTime,\n    });\n  });\n\n  // Waterway disruptions\n  (waterwayDisruptions || []).forEach(d => {\n    disruptions.push({\n      mode: 'marine',\n      type: 'WATERWAY_DISRUPTION',\n      severity: 'MEDIUM',\n      title: d.descriptionEn || d.descriptionFi || 'Waterway disruption',\n      geometry: d.geometry || null,\n      startTime: d.startDate,\n    });\n  });\n\n  return disruptions.sort((a, b) =>\n    new Date(b.startTime || 0) - new Date(a.startTime || 0)\n  );\n}\n",
    "domain": "multi",
    "partTitle": "MULTI-MODAL / CROSS-DOMAIN DEMOS",
    "protocols": [
      "POST"
    ],
    "endpointPreview": "Road: /api/traffic-message/v1/messages (all types)"
  },
  {
    "id": 25,
    "slug": "smart-commute-advisor",
    "title": "Smart Commute Advisor",
    "description": "\"Based on current conditions, should I drive, take the train, or work from home today?\"",
    "whatUserSees": "",
    "apis": [
      "Road weather + fluency: tie.digitraffic.fi",
      "Train delays for your route: rata.digitraffic.fi",
      "Traffic disruptions: tie.digitraffic.fi"
    ],
    "language": "javascript",
    "code": "// Personalized commute recommendation engine\nasync function commuteAdvisor({ homeStation, workStation, roadRouteLinks }) {\n  const today = new Date().toISOString().slice(0, 10);\n\n  const [trains, weather, fluency, disruptions] = await Promise.all([\n    // Train option\n    fetch(`https://rata.digitraffic.fi/api/v1/live-trains/station/${homeStation}/${workStation}?departure_date=${today}`,\n      { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }).then(r => r.json()),\n\n    // Driving conditions\n    fetch('https://tie.digitraffic.fi/api/weather/v1/stations/data',\n      { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }).then(r => r.json()),\n\n    // Helsinki fluency (if applicable)\n    fetch('https://tie.digitraffic.fi/api/v1/data/fluency-current',\n      { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }).then(r => r.json()).catch(() => null),\n\n    // Active road disruptions\n    fetch('https://tie.digitraffic.fi/api/traffic-message/v1/messages?situationType=TRAFFIC_ANNOUNCEMENT&inactiveHours=0',\n      { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }).then(r => r.json()),\n  ]);\n\n  // Score train option\n  const now = new Date();\n  const nextTrains = trains\n    .map(t => {\n      const dep = t.timeTableRows.find(\n        r => r.stationShortCode === homeStation && r.type === 'DEPARTURE'\n      );\n      return dep ? { ...t, depTime: new Date(dep.scheduledTime), delay: dep.differenceInMinutes || 0 } : null;\n    })\n    .filter(t => t && t.depTime > now && !t.cancelled)\n    .slice(0, 3);\n\n  const avgTrainDelay = nextTrains.length > 0\n    ? nextTrains.reduce((s, t) => s + t.delay, 0) / nextTrains.length\n    : Infinity;\n\n  // Score road option\n  const freezingRoads = weather.stations.some(s =>\n    s.sensorValues.some(sv => sv.name === 'TIE_1' && sv.sensorValue < -2)\n  );\n  const poorVisibility = weather.stations.some(s =>\n    s.sensorValues.some(sv => sv.name === 'NAKYVYYS' && sv.sensorValue < 200)\n  );\n  const disruptionCount = disruptions.features?.length || 0;\n\n  // Generate recommendation\n  let recommendation;\n  if (avgTrainDelay < 3 && nextTrains.length > 0) {\n    recommendation = {\n      mode: 'TRAIN',\n      confidence: 'HIGH',\n      reason: `Next train ${nextTrains[0].trainType} ${nextTrains[0].trainNumber} departs on time`,\n      nextDeparture: nextTrains[0].depTime.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' })\n    };\n  } else if (!freezingRoads && !poorVisibility && disruptionCount < 5) {\n    recommendation = {\n      mode: 'DRIVE',\n      confidence: 'MEDIUM',\n      reason: 'Roads are clear, no major disruptions'\n    };\n  } else {\n    recommendation = {\n      mode: 'REMOTE',\n      confidence: 'HIGH',\n      reason: `${freezingRoads ? 'Icy roads. ' : ''}${poorVisibility ? 'Poor visibility. ' : ''}${avgTrainDelay > 10 ? 'Significant train delays. ' : ''}${disruptionCount} active road disruptions.`\n    };\n  }\n\n  return {\n    recommendation,\n    trainOption: { nextTrains: nextTrains.length, avgDelayMin: avgTrainDelay.toFixed(0) },\n    driveOption: { freezingRoads, poorVisibility, disruptions: disruptionCount },\n    timestamp: new Date().toISOString()\n  };\n}\n\n// Usage: Helsinki (HKI) → Tampere (TPE) commute\nconst advice = await commuteAdvisor({\n  homeStation: 'HKI',\n  workStation: 'TPE',\n  roadRouteLinks: [101, 102, 103]  // TMS station IDs along E12/Highway 3\n});\n// → { recommendation: { mode: \"TRAIN\", confidence: \"HIGH\",\n//     reason: \"Next train IC 3 departs on time\", nextDeparture: \"06:18\" }, ... }\n",
    "domain": "multi",
    "partTitle": "MULTI-MODAL / CROSS-DOMAIN DEMOS",
    "protocols": [],
    "endpointPreview": "Road weather + fluency: tie.digitraffic.fi"
  },
  {
    "id": 26,
    "slug": "logistics-corridor-monitor",
    "title": "Logistics Corridor Monitor",
    "description": "Track cargo movement across a Finnish logistics corridor: port arrival → rail transfer → road last-mile.",
    "whatUserSees": "",
    "apis": [
      "Port calls (marine): vessel arrival at Kotka/HaminaKotka",
      "Rail freight: trains from Kotka station",
      "Road maintenance: winter conditions on local roads",
      "Traffic messages: disruptions along the route"
    ],
    "language": "javascript",
    "code": "// Monitor the Kotka → Helsinki logistics corridor\nasync function corridorStatus() {\n  const now = new Date();\n  const yesterday = new Date(now - 86400000);\n\n  const [portCalls, railTrains, maintenance, weather, disruptions] = await Promise.all([\n    // Ships arriving at Kotka port\n    fetch(`https://meri.digitraffic.fi/api/port-call/v1/port-calls?locode=FIKTK&from=${yesterday.toISOString()}`,\n      { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }).then(r => r.json()),\n\n    // Trains from Kotka (KTK)\n    fetch('https://rata.digitraffic.fi/api/v1/live-trains/station/KTK?departing_trains=15&arrived_trains=5',\n      { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }).then(r => r.json()),\n\n    // Road maintenance along E18 corridor\n    fetch(`https://tie.digitraffic.fi/api/maintenance/v1/tracking/routes/latest`,\n      { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }).then(r => r.json()),\n\n    // Road weather on the corridor\n    fetch('https://tie.digitraffic.fi/api/weather/v1/stations/data',\n      { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }).then(r => r.json()),\n\n    // Active disruptions\n    fetch('https://tie.digitraffic.fi/api/traffic-message/v1/messages?situationType=TRAFFIC_ANNOUNCEMENT&inactiveHours=0',\n      { headers: { 'Digitraffic-User': 'DemoApp/1.0' } }).then(r => r.json()),\n  ]);\n\n  return {\n    port: {\n      vesselsArrived24h: portCalls.filter(pc => pc.arrivalTime).length,\n      vesselsExpected: portCalls.filter(pc => !pc.arrivalTime && pc.portCallTimestamp).length,\n      nextArrival: portCalls\n        .filter(pc => !pc.arrivalTime && new Date(pc.portCallTimestamp) > now)\n        .sort((a, b) => new Date(a.portCallTimestamp) - new Date(b.portCallTimestamp))[0]\n    },\n    rail: {\n      activeFrieghtTrains: railTrains.filter(t => t.trainCategory === 'Cargo').length,\n      delayedTrains: railTrains.filter(t =>\n        t.timeTableRows?.some(r => r.differenceInMinutes > 10)\n      ).length,\n    },\n    road: {\n      activeDisruptions: disruptions.features?.length || 0,\n      maintenanceActive: maintenance.features?.length || 0,\n    },\n    corridor: 'Kotka → Helsinki (E18)',\n    timestamp: now.toISOString()\n  };\n}\n",
    "domain": "multi",
    "partTitle": "MULTI-MODAL / CROSS-DOMAIN DEMOS",
    "protocols": [],
    "endpointPreview": "Port calls (marine): vessel arrival at Kotka/HaminaKotka"
  }
];
