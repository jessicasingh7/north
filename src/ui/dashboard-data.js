const DAY_IN_MS = 24 * 60 * 60 * 1000;

export async function buildDashboardData(workspace) {
  const [snapshot, goals, feedbackEntries] = await Promise.all([
    workspace.stateStore.load(),
    workspace.goalStore.load(),
    workspace.feedbackStore.load(),
  ]);
  const feedback = feedbackEntries ?? [];

  if (!snapshot) {
    return {
      generatedAt: null,
      interventions: [],
      commitments: [],
      goals: goals ?? [],
      stats: {
        interventionCount: 0,
        totalInterventionCount: 0,
        commitmentCount: 0,
        highSeverityCount: 0,
      },
      feedback,
      empty: true,
    };
  }

  const feedbackByIntervention = new Map(feedback.map((entry) => [entry.interventionId, entry]));
  const interventions = snapshot.interventions.map((intervention) => {
    const currentFeedback = feedbackByIntervention.get(intervention.id) ?? null;

    return {
      ...intervention,
      feedback: currentFeedback,
      status: deriveInterventionStatus(currentFeedback),
    };
  });
  const activeInterventions = interventions.filter((item) => item.status === "active");

  return {
    generatedAt: snapshot.generatedAt,
    interventions,
    commitments: snapshot.state.commitments,
    goals: snapshot.state.goals,
    stats: {
      interventionCount: activeInterventions.length,
      totalInterventionCount: interventions.length,
      commitmentCount: snapshot.state.commitments.length,
      highSeverityCount: activeInterventions.filter((item) => item.severity === "high").length,
    },
    feedback,
    empty: false,
  };
}

export async function recordFeedback(workspace, entry) {
  const current = (await workspace.feedbackStore.load()) ?? [];
  const next = current.filter((item) => item.interventionId !== entry.interventionId);
  next.push({
    ...entry,
    recordedAt: entry.recordedAt ?? new Date().toISOString(),
  });
  await workspace.feedbackStore.save(next);
  return next;
}

export function createSnoozeUntil(days = 1) {
  return new Date(Date.now() + days * DAY_IN_MS).toISOString();
}

function deriveInterventionStatus(feedback) {
  if (!feedback) {
    return "active";
  }

  if (feedback.action === "snooze" && feedback.until) {
    return Date.parse(feedback.until) > Date.now() ? "snoozed" : "active";
  }

  if (feedback.action === "dismiss") {
    return "dismissed";
  }

  if (feedback.action === "wrong") {
    return "wrong";
  }

  return "active";
}
