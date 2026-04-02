import { fetchGraphQL, escapeHtml, formatNumber, formatDateTime, formatMultiline, requestSample } from "./helpers.js";

export default async function demo6() {
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
