import { makeIntervention } from "../../domain/entities.js";
import { getTaskDeferralsForThread, getEvidenceForThread } from "../state.js";

export function detectRepeatedDeferral(state) {
  return state.commitments.flatMap((commitment) => {
    const deferrals = getTaskDeferralsForThread(state, commitment.sourceThreadId);

    if (deferrals.length < 3) {
      return [];
    }

    return [
      makeIntervention({
        id: `intervention:deferral:${commitment.id}`,
        type: "repeated_deferral",
        title: `You have pushed "${commitment.title}" ${deferrals.length} times`,
        message: `This is recurring avoidance, not a one-off miss. Decide whether to do it, delegate it, or drop it.`,
        severity: "medium",
        confidence: 0.88,
        evidence: getEvidenceForThread(state, commitment.sourceThreadId),
      }),
    ];
  });
}
