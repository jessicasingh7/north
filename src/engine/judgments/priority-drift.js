import { makeIntervention } from "../../domain/entities.js";
import { countRecentCalendarBlocksForGoal } from "../state.js";

export function detectPriorityDrift(state) {
  return state.goals.flatMap((goal) => {
    const alignedBlocks = countRecentCalendarBlocksForGoal(state, goal.id);

    if (alignedBlocks >= 2) {
      return [];
    }

    return [
      makeIntervention({
        id: `intervention:priority:${goal.id}`,
        type: "priority_drift",
        title: `Calendar drift on ${goal.title}`,
        message: `You declared "${goal.title}" as a ${goal.horizon} priority, but only ${alignedBlocks} calendar block(s) map to it.`,
        severity: "high",
        confidence: 0.79,
        evidence: state.evidence.filter((item) => item.metadata.threadId == null).slice(0, 2),
      }),
    ];
  });
}
