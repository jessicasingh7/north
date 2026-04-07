import { normalizeGoogleArtifacts } from "./normalize.js";

export const googleWorkspaceConnector = {
  id: "google-workspace",
  collect({ messages, calendarEvents, taskEvents = [] }) {
    const normalized = normalizeGoogleArtifacts({ messages, calendarEvents });
    const events = [...normalized.events, ...taskEvents].sort((left, right) =>
      left.occurredAt.localeCompare(right.occurredAt),
    );

    return {
      events,
      evidence: normalized.evidence,
    };
  },
};
