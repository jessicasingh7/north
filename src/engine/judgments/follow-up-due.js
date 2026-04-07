import { makeIntervention } from "../../domain/entities.js";
import { getEvidenceForThread, getInboundEmailsForThread } from "../state.js";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export function detectFollowUpDue(state) {
  const interventions = [];

  for (const commitment of state.commitments) {
    const threadEvents = getInboundEmailsForThread(state, commitment.sourceThreadId);
    const latestInbound = threadEvents.at(-1);

    if (!latestInbound) {
      continue;
    }

    const ageInDays = Math.floor(
      (Date.parse(state.now) - Date.parse(latestInbound.occurredAt)) / DAY_IN_MS,
    );

    if (ageInDays < 4) {
      continue;
    }

    interventions.push(
      makeIntervention({
        id: `intervention:follow-up:${commitment.id}`,
        type: "follow_up_due",
        title: `Follow up with ${commitment.person}`,
        message: `${commitment.person} asked for a response ${ageInDays} days ago and the thread is still open.`,
        severity: commitment.priority === "high" ? "high" : "medium",
        confidence: 0.83,
        evidence: getEvidenceForThread(state, commitment.sourceThreadId),
      }),
    );
  }

  return interventions;
}
