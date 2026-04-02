// ── Translation module ──
// Finnish is the default language, English is the alternative.

const STORAGE_KEY = "digitraffic-lang";

let currentLang = "fi";

const ui = {
  fi: {
    "brand.title": "Digitraffic-esittely",
    "brand.subtitle": "Live-demoja Digitraffic.fi:n avoimella datalla",

    "hero.eyebrow": "Reaaliaikaista dataa",
    "hero.eyebrowSub": "REST · GraphQL · MQTT",
    "hero.title": "Mitä Digitraffic.fi-datalla voi rakentaa — toimivina demoina.",
    "hero.description":
      "Tämä sivusto sisältää staattisen demoluettelon alkuperäisen briefin pohjalta. Avaa kortti nähdäksesi live-esikatselun, alkuperäisen koodiesimerkin syntaksikorostuksella ja kopiointituella sekä live-API-vastaukset.",
    "hero.stat.count.label": "Demojen määrä",
    "hero.stat.count.note": "Rautatie, tie, meri ja multimodaali",
    "hero.stat.mix.label": "Toimialat",
    "hero.stat.mix.note": "Lisäksi {count} poikkialueellista konseptia",
    "hero.stat.experience.label": "Kokemus",
    "hero.stat.experience.value": "Esikatselu / Koodi / API",
    "hero.stat.experience.note": "Reaaliaikaiset haut live-rajapinnoista",

    "search.placeholder":
      "Hae lähtöjä, kameroita, myöhästymisiä, AIS, häiriöitä, latausta, logistiikkaa...",
    "search.shown": "{count} demoa näytetään",

    "filter.all": "Kaikki",
    "filter.rail": "Rautatie",
    "filter.road": "Tie",
    "filter.marine": "Meri",
    "filter.multi": "Multimodaali",

    "domain.rail": "Rautatie",
    "domain.road": "Tie",
    "domain.marine": "Meri",
    "domain.multi": "Multimodaali",

    "card.viewDemo": "Avaa demo",
    "card.demo": "Demo",

    "detail.back": "Takaisin demoihin",
    "detail.reload": "Lataa uudelleen",
    "detail.copySource": "Kopioi koodi",

    "tab.preview": "Esikatselu",
    "tab.code": "Koodi",
    "tab.api": "API",

    "preview.title": "Live-esikatselu",
    "preview.subtitle": "Haettu reaaliajassa Digitraffic-rajapinnoista.",
    "code.title": "Koodiesimerkki",
    "code.subtitle": "Alkuperäinen koodiesimerkki demoluettelosta.",
    "api.title": "API-rajapinnat",
    "api.subtitle": "Live-esimerkkipyynnöt esikatselutoteutuksesta.",

    "empty": "Yhtään demoa ei löytynyt nykyisellä haulla ja suodattimella.",
    "toast.copied": "Kopioitu leikepöydälle",
    "copy": "Kopioi",
    "copyQuery": "Kopioi kysely",

    "note.title": "Toteutushuomio",
    "error.previewFailed": "Live-esikatselun lataus epäonnistui: {message}",
    "error.noPreview": "Tälle demolle ei ole rekisteröity live-esikatselua.",
    "error.notFound": "Demoa ei löytynyt.",

    "footer.license": "CC BY 4.0 · Digitraffic / Fintraffic -data",
    "footer.brief": "Alkuperäinen briefi",
    "footer.docs": "Digitraffic-dokumentaatio",

    "lang.switch": "EN",
    "lang.switchLabel": "Switch to English",
  },
  en: {
    "brand.title": "Digitraffic Showcase",
    "brand.subtitle": "Live demos powered by Digitraffic.fi open data",

    "hero.eyebrow": "Live data",
    "hero.eyebrowSub": "REST · GraphQL · MQTT patterns",
    "hero.title":
      "What you can build with Digitraffic.fi data, rendered as working demos.",
    "hero.description":
      "This site ships with a static demo catalog based on the original brief. Open any card to see a live preview, the original example code with syntax highlighting and copy support, and the live API payloads used to power the view.",
    "hero.stat.count.label": "Demo count",
    "hero.stat.count.note": "Rail, road, marine, and multi-modal",
    "hero.stat.mix.label": "Domain mix",
    "hero.stat.mix.note": "Plus {count} cross-domain concepts",
    "hero.stat.experience.label": "Experience",
    "hero.stat.experience.value": "Preview / Code / API",
    "hero.stat.experience.note":
      "On-demand live fetches with graceful fallbacks",

    "search.placeholder":
      "Search departures, cameras, delays, AIS, disruptions, charging, logistics...",
    "search.shown": "{count} demos shown",

    "filter.all": "All",
    "filter.rail": "Rail",
    "filter.road": "Road",
    "filter.marine": "Marine",
    "filter.multi": "Multi-modal",

    "domain.rail": "Rail",
    "domain.road": "Road",
    "domain.marine": "Marine",
    "domain.multi": "Multi-modal",

    "card.viewDemo": "View demo",
    "card.demo": "Demo",

    "detail.back": "Back to demos",
    "detail.reload": "Reload preview",
    "detail.copySource": "Copy source",

    "tab.preview": "Preview",
    "tab.code": "Code",
    "tab.api": "API",

    "preview.title": "Live Preview",
    "preview.subtitle":
      "Rendered from the live Digitraffic endpoints at request time.",
    "code.title": "Source Snippet",
    "code.subtitle":
      "The original example snippet captured into the static demo catalog.",
    "api.title": "API Endpoints",
    "api.subtitle": "Live request samples from the preview implementation.",

    "empty": "No demos match the current search and filter.",
    "toast.copied": "Copied to clipboard",
    "copy": "Copy",
    "copyQuery": "Copy query",

    "note.title": "Implementation note",
    "error.previewFailed": "Live preview request failed: {message}",
    "error.noPreview": "No live preview registered for this demo.",
    "error.notFound": "Demo not found.",

    "footer.license": "CC BY 4.0 · Digitraffic / Fintraffic data",
    "footer.brief": "Original brief",
    "footer.docs": "Digitraffic docs",

    "lang.switch": "FI",
    "lang.switchLabel": "Vaihda suomeksi",
  },
};

// ── Demo content translations ──
// Keys: title, description (used for card subtitle / detail description)
// partTitle is derived from domain, not stored per-demo.

const demos = {
  fi: {
    1: {
      title: "Junien reaaliaikainen lähtötaulu",
      description:
        "Reaaliaikaiset lähdöt junanumerolla, määränpäällä, aikataulun mukaisella ajalla, arvioidulla ajalla, raiteella ja värikoodatulla myöhästymisilmaisimella. Päivittyy automaattisesti 30 sekunnin välein.",
    },
    2: {
      title: "Junien reaaliaikainen seurantakartta",
      description:
        "Animoitu kartta Suomesta, jossa värilliset pisteet liikkuvat rataverkolla. Klikkaa pistettä nähdäksesi junanumeron, nopeuden, reitin ja myöhästymisen.",
    },
    3: {
      title: "Junien myöhästymisanalyysi",
      description:
        "Kootut myöhästymistilastot: mitkä asemat ja reitit suoriutuvat huonoiten, vuorokaudenajan mukaiset kaavat.",
    },
    4: {
      title: "Junakoostumuksen visualisointi",
      description:
        "SVG-kaavio junan veturista ja vaunuista — 1. luokka, 2. luokka, ravintolavaunu, lemmikkivaunu.",
    },
    5: {
      title: "Asemien välinen reitinhaku",
      description:
        "Hae kaikki suorat junat kahden aseman välillä tänään reaaliaikaisella myöhästymistiedolla.",
    },
    6: {
      title: "Matkustajatiedotteet",
      description:
        "Reaaliaikaiset asemakuulutukset — häiriöt, laiturimuutokset, myöhästymisten selitykset — kolmella kielellä.",
    },
    7: {
      title: "Tiesääkamerat",
      description:
        "Selattava galleria yli 470 tiesääkamerasta, joissa 24 tunnin historian aikajana.",
    },
    8: {
      title: "Tiesään hallintapaneeli",
      description:
        "Reaaliaikainen pintalämpötila, tuuli, sade ja näkyvyys yli 350 tiesääasemalta.",
    },
    9: {
      title: "Liikennemäärien lämpökartta (LAM)",
      description:
        "Ajoneuvolaskennat ja nopeudet yli 500 liikenteen mittausasemalta.",
    },
    10: {
      title: "Liikennehäiriösyöte",
      description:
        "Aktiiviset onnettomuudet, tietyöt, painorajoitukset ja erikoiskuljetukset suodatettavalla kartalla.",
    },
    11: {
      title: "Aurojen ja kunnossapidon seuranta",
      description:
        "Tiekunnossapitoajoneuvojen reaaliaikaiset sijainnit ja reitit — seuraa aurojen työskentelyä Suomen teillä.",
    },
    12: {
      title: "Muuttuvat nopeusrajoitusmerkit",
      description:
        "Sähköisten nopeusrajoitus- ja varoitusmerkkien nykyiset arvot Suomen valtateillä.",
    },
    13: {
      title: "Sähköautojen latauspistehaku (AFIR)",
      description:
        "Sähköautojen latauspisteet reaaliaikaisella liittimen saatavuudella ja tehotiedoilla.",
    },
    14: {
      title: "Helsingin seudun liikennesujuvuus",
      description:
        "Reaaliaikaiset matka-ajat ja ruuhkatasot Helsingin seudun tieosuuksilla.",
    },
    15: {
      title: "Kävely- ja pyöräilylaskuri",
      description:
        "Jalankulkijoiden ja pyöräilijöiden laskennat automaattisilta laskentapisteiltä ympäri Suomea.",
    },
    16: {
      title: "Alusten reaaliaikainen kartta (AIS)",
      description:
        "Jokainen alus Suomen vesillä merikarttapohjalla reaaliaikaisin sijainnein.",
    },
    17: {
      title: "Satamakäyntitaulu",
      description:
        "Mitkä alukset saapuvat ja lähtevät Suomen satamista, ETA-aikoineen ja rahtitietoineen.",
    },
    18: {
      title: "Merivaroituskartta",
      description:
        "Aktiiviset merialueen vaarat, harjoitukset ja rajoitukset.",
    },
    19: {
      title: "Merenkäynnin seuranta (älypoijut)",
      description:
        "Aallokko-olosuhteet, lämpötila ja trendit AtoN-poijuantureilta.",
    },
    20: {
      title: "Talvimerenkulku ja jäänmurtajareitit",
      description:
        "Jäänmurtaja-avusteiset laivauslinjat ja satamien jäärajoitukset Suomen talvella.",
    },
    21: {
      title: "Suomen liikennepulssi — live-hallintapaneeli",
      description:
        "Yksi johdon näkymä: miten Suomen koko liikenneverkko toimii juuri nyt?",
    },
    22: {
      title: "Sään vaikutus liikenteeseen",
      description:
        "Miten tiesääolosuhteet korreloivat junien myöhästymisten, liikennenopeuksien laskun ja alusten reitityksen kanssa?",
    },
    23: {
      title: "Intermodaalinen matka: laiva + junayhteys",
      description:
        "\"Rahtialukseni saapuu Turun satamaan klo 14:00 — mitkä junat lähtevät Turusta Helsinkiin sen jälkeen?\"",
    },
    24: {
      title: "Kansallinen häiriökartta — kaikki liikennemuodot",
      description:
        "Kaikki aktiiviset häiriöt tiellä, rautateillä ja merellä yhdellä kartalla yhdistetyllä aikajanalla.",
    },
    25: {
      title: "Työmatkan kulkutapasuositus",
      description:
        "\"Nykyisten olosuhteiden perusteella — pitäisikö ajaa, ottaa juna vai tehdä etätöitä tänään?\"",
    },
    26: {
      title: "Logistiikkakäytävän seuranta",
      description:
        "Seuraa rahdin liikkumista Suomen logistiikkakäytävällä: satamaan saapuminen → rautatiekuljetus → maantiejakelu.",
    },
  },
  en: {
    1: {
      title: "Live Train Departure Board",
      description:
        "Real-time departures with train number, destination, scheduled time, estimated time, track number, and a color-coded delay indicator. Auto-refreshes every 30 seconds.",
    },
    2: {
      title: "Live Train Tracker Map",
      description:
        "An animated map of Finland. Colored dots move along rail lines. Click a dot to see train number, speed, route, and delay.",
    },
    3: {
      title: "Train Delay Analyzer",
      description:
        "Aggregated delay statistics: which stations and routes perform worst, time-of-day patterns.",
    },
    4: {
      title: "Train Composition Visualizer",
      description:
        "SVG diagram showing a train's locomotive and wagon layout — 1st class, 2nd class, restaurant car, pet wagon.",
    },
    5: {
      title: "Station-to-Station Journey Finder",
      description:
        "Find all direct trains between two stations today with real-time delay info.",
    },
    6: {
      title: "Passenger Information Messages",
      description:
        "Live station announcements — disruptions, platform changes, delay explanations — in 3 languages.",
    },
    7: {
      title: "Live Road Weather Cameras",
      description:
        "A browsable gallery of 470+ road weather cameras with 24-hour history timelapse.",
    },
    8: {
      title: "Road Weather Dashboard",
      description:
        "Real-time surface temperature, wind, rain, and visibility from 350+ road weather stations.",
    },
    9: {
      title: "Traffic Volume Heatmap (TMS/LAM)",
      description:
        "Vehicle counts and speeds from 500+ Traffic Measurement System stations.",
    },
    10: {
      title: "Traffic Disruption Feed",
      description:
        "Active accidents, road works, weight restrictions, and exempted transports on a filterable map.",
    },
    11: {
      title: "Snowplow & Maintenance Tracker",
      description:
        "Real-time locations and routes of road maintenance vehicles — watch snowplows clear Finnish highways.",
    },
    12: {
      title: "Variable Speed Limit Signs",
      description:
        "Current values of electronic speed limit and warning signs along Finnish highways.",
    },
    13: {
      title: "EV Charging Station Finder (AFIR)",
      description:
        "Electric vehicle charging points with real-time connector availability and power levels.",
    },
    14: {
      title: "Helsinki Commute Fluency",
      description:
        "Real-time travel times and congestion levels for Helsinki metropolitan road links.",
    },
    15: {
      title: "Walking & Cycling Counter",
      description:
        "Pedestrian and cyclist counts from automated counting sites across Finland.",
    },
    16: {
      title: "Live Vessel Map (AIS)",
      description:
        "Every vessel in Finnish waters plotted on a marine chart with real-time position updates.",
    },
    17: {
      title: "Port Call Dashboard",
      description:
        "Which ships are arriving and departing Finnish harbors, with ETAs and cargo info.",
    },
    18: {
      title: "Nautical Warnings Map",
      description:
        "Active marine hazards, exercises, and restrictions.",
    },
    19: {
      title: "Sea State Monitor (Smart Buoys)",
      description:
        "Wave conditions, temperature, and trends from AtoN buoy sensors.",
    },
    20: {
      title: "Winter Navigation & Icebreaker Routes",
      description:
        "Icebreaker-assisted shipping lanes and port ice restrictions during Finnish winter.",
    },
    21: {
      title: "Finland Transport Pulse — Live Dashboard",
      description:
        "A single executive dashboard: how is Finland's entire transport network performing right now?",
    },
    22: {
      title: "Weather Impact on Transport",
      description:
        "How do road weather conditions correlate with train delays, traffic speed drops, and vessel routing?",
    },
    23: {
      title: "Intermodal Journey: Ship + Train Connection",
      description:
        "\"My cargo ship arrives at Turku port at 14:00 — what trains go from Turku to Helsinki after that?\"",
    },
    24: {
      title: "National Disruption Map — All Modes",
      description:
        "Every active disruption across road, rail, and sea on a single map with a unified timeline.",
    },
    25: {
      title: "Smart Commute Advisor",
      description:
        "\"Based on current conditions, should I drive, take the train, or work from home today?\"",
    },
    26: {
      title: "Logistics Corridor Monitor",
      description:
        "Track cargo movement across a Finnish logistics corridor: port arrival → rail transfer → road last-mile.",
    },
  },
};

// ── Public API ──

export function initLang() {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "fi" || saved === "en") {
    currentLang = saved;
  }
  document.documentElement.lang = currentLang;
}

export function getLang() {
  return currentLang;
}

export function setLang(lang) {
  if (lang !== "fi" && lang !== "en") return;
  currentLang = lang;
  window.localStorage.setItem(STORAGE_KEY, lang);
  document.documentElement.lang = lang;
}

/**
 * Translate a UI string key. Supports {param} interpolation.
 * Falls back to the key itself if not found.
 */
export function t(key, params = {}) {
  let value = ui[currentLang]?.[key] ?? ui.fi[key] ?? key;
  for (const [k, v] of Object.entries(params)) {
    value = value.replaceAll(`{${k}}`, String(v));
  }
  return value;
}

/**
 * Get a translated demo field (title or description).
 * Falls back to the original value from demo-data.js.
 */
export function demoT(demoId, field, fallback) {
  return demos[currentLang]?.[demoId]?.[field] ?? fallback ?? "";
}

/**
 * Get translated domain label.
 */
export function domainLabel(domain) {
  return t(`domain.${domain}`);
}

/**
 * Get translated partTitle based on domain.
 */
export function partTitle(domain) {
  const labels = {
    fi: {
      rail: "RAUTATIEDEMOT",
      road: "TIEDEMOT",
      marine: "MERIDEMOT",
      multi: "MULTIMODAALIDEMOT",
    },
    en: {
      rail: "RAIL DEMOS",
      road: "ROAD DEMOS",
      marine: "MARINE DEMOS",
      multi: "MULTI-MODAL DEMOS",
    },
  };
  return labels[currentLang]?.[domain] ?? labels.en[domain] ?? domain;
}
