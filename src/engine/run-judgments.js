import { detectFollowUpDue } from "./judgments/follow-up-due.js";
import { detectRepeatedDeferral } from "./judgments/repeated-deferral.js";
import { detectPriorityDrift } from "./judgments/priority-drift.js";

export function runJudgments(state) {
  return [
    ...detectFollowUpDue(state),
    ...detectRepeatedDeferral(state),
    ...detectPriorityDrift(state),
  ].sort(compareSeverity);
}

function compareSeverity(left, right) {
  const rank = {
    high: 0,
    medium: 1,
    low: 2,
  };

  return rank[left.severity] - rank[right.severity];
}
