import { detectFollowUpDue } from "./follow-up-due.js";
import { detectRepeatedDeferral } from "./repeated-deferral.js";
import { detectPriorityDrift } from "./priority-drift.js";

export const defaultJudgments = [
  {
    id: "follow_up_due",
    run: detectFollowUpDue,
  },
  {
    id: "repeated_deferral",
    run: detectRepeatedDeferral,
  },
  {
    id: "priority_drift",
    run: detectPriorityDrift,
  },
];
