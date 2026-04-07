export function buildState({ goals, events, evidence, commitments, now }) {
  return {
    now,
    goals,
    events,
    evidence,
    commitments,
  };
}

export function getEvidenceForThread(state, threadId) {
  return state.evidence.filter((item) => item.metadata.threadId === threadId);
}

export function countRecentCalendarBlocksForGoal(state, goalId) {
  return state.events.filter(
    (event) => event.type === "calendar_event" && (event.linkedGoalIds ?? []).includes(goalId),
  ).length;
}

export function getInboundEmailsForThread(state, threadId) {
  return state.events.filter(
    (event) => event.type === "email_received" && event.threadId === threadId,
  );
}

export function getTaskDeferralsForThread(state, threadId) {
  return state.events.filter(
    (event) => event.type === "task_deferred" && event.threadId === threadId,
  );
}
