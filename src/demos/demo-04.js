import { fetchJson, escapeHtml, todayHelsinki, requestSample } from "./helpers.js";

export default async function demo4() {
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
