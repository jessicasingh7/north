const DAY_IN_MS = 24 * 60 * 60 * 1000;

export async function buildDashboardData(workspace) {
  const [snapshot, goals, feedbackEntries, googleCredentials, googleTokens, syncState] = await Promise.all([
    workspace.stateStore.load(),
    workspace.goalStore.load(),
    workspace.feedbackStore.load(),
    workspace.googleCredentialsStore.load(),
    workspace.googleTokenStore.load(),
    workspace.syncStateStore.load(),
  ]);
  const feedback = feedbackEntries ?? [];
  const integrations = buildIntegrations({ googleCredentials, googleTokens, syncState: syncState ?? {} });

  if (!snapshot) {
    return {
      generatedAt: null,
      interventions: [],
      commitments: [],
      goals: goals ?? [],
      integrations,
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
    const statusCode = deriveInterventionStatus(currentFeedback);

    return {
      ...intervention,
      feedback: currentFeedback,
      status: statusCode,
      statusLabel: interventionStatusLabel(statusCode),
      severityLabel: severityLabel(intervention.severity),
    };
  });
  const activeInterventions = interventions.filter((item) => item.status === "active");
  const commitments = snapshot.state.commitments.map((commitment) => ({
    ...commitment,
    statusLabel: commitmentStatusLabel(commitment),
  }));

  return {
    generatedAt: snapshot.generatedAt,
    interventions,
    commitments,
    goals: snapshot.state.goals,
    integrations,
    stats: {
      interventionCount: activeInterventions.length,
      totalInterventionCount: interventions.length,
      commitmentCount: commitments.length,
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

function interventionStatusLabel(status) {
  const labels = {
    active: "Needs review",
    snoozed: "Snoozed",
    dismissed: "Dismissed prompt",
    wrong: "Marked incorrect",
  };

  return labels[status] ?? "Needs review";
}

function severityLabel(severity) {
  const labels = {
    high: "High urgency",
    medium: "Medium urgency",
    low: "Low urgency",
  };

  return labels[severity] ?? "Unknown urgency";
}

function commitmentStatusLabel(commitment) {
  if (commitment.status === "completed") {
    return "Completed";
  }

  if (commitment.status === "dropped") {
    return "Dropped";
  }

  return "Needs response";
}

function buildIntegrations({ googleCredentials, googleTokens, syncState }) {
  const gmailSync = syncState.gmail ?? null;
  const calendarSync = syncState["google-calendar"] ?? null;

  return [
    {
      id: "gmail",
      name: "Gmail",
      status: googleTokens ? "connected" : googleCredentials ? "ready" : "not_configured",
      statusLabel: googleTokens
        ? "Connected"
        : googleCredentials
          ? "Credentials ready"
          : "Not configured",
      detail: googleTokens
        ? "North can read recent primary inbox metadata."
        : googleCredentials
          ? "Credentials are present. Finish OAuth to enable sync."
          : "Add Google OAuth credentials to enable Gmail sync.",
      lastSyncedAt: gmailSync?.lastSyncedAt ?? null,
      syncEnabled: Boolean(googleCredentials || googleTokens),
    },
    {
      id: "google-calendar",
      name: "Google Calendar",
      status: googleTokens ? "connected" : googleCredentials ? "ready" : "not_configured",
      statusLabel: googleTokens
        ? "Connected"
        : googleCredentials
          ? "Credentials ready"
          : "Not configured",
      detail: googleTokens
        ? "North can read upcoming primary calendar events."
        : googleCredentials
          ? "Credentials are present. Finish OAuth to enable calendar sync."
          : "Add Google OAuth credentials to enable calendar sync.",
      lastSyncedAt: calendarSync?.lastSyncedAt ?? null,
      syncEnabled: Boolean(googleCredentials || googleTokens),
    },
  ];
}
