const state = {
  dashboard: null,
};

const statsGrid = document.querySelector("#stats-grid");
const interventionsList = document.querySelector("#interventions-list");
const commitmentsList = document.querySelector("#commitments-list");
const goalsList = document.querySelector("#goals-list");
const syncButton = document.querySelector("#sync-button");
const syncStatus = document.querySelector("#sync-status");
const interventionTemplate = document.querySelector("#intervention-template");

syncButton.addEventListener("click", async () => {
  syncButton.disabled = true;
  syncStatus.textContent = "Syncing Google...";

  try {
    const response = await fetch("/api/sync", { method: "POST" });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error ?? "Sync failed");
    }

    state.dashboard = payload;
    render();
    syncStatus.textContent = "Google sync complete.";
  } catch (error) {
    syncStatus.textContent = error.message;
  } finally {
    syncButton.disabled = false;
  }
});

loadDashboard();

async function loadDashboard() {
  const response = await fetch("/api/dashboard");
  state.dashboard = await response.json();
  render();
}

function render() {
  renderStats();
  renderInterventions();
  renderCompactList(commitmentsList, state.dashboard.commitments, renderCommitmentCard);
  renderCompactList(goalsList, state.dashboard.goals, renderGoalCard);
}

function renderStats() {
  const stats = [
    ["Generated", formatGeneratedAt(state.dashboard.generatedAt)],
    ["Active interventions", state.dashboard.stats.interventionCount],
    ["Open commitments", state.dashboard.stats.commitmentCount],
  ];

  statsGrid.replaceChildren(
    ...stats.map(([label, value]) => {
      const card = document.createElement("article");
      card.className = "stat-card";
      card.innerHTML = `<p class="stat-label">${label}</p><p class="stat-value">${value}</p>`;
      return card;
    }),
  );
}

function renderInterventions() {
  if (state.dashboard.empty) {
    interventionsList.replaceChildren(
      buildEmptyState("No state yet. Run `npm run demo` or connect Google and press Sync Google."),
    );
    return;
  }

  interventionsList.replaceChildren(
    ...state.dashboard.interventions.map((intervention) => {
      const fragment = interventionTemplate.content.cloneNode(true);
      const severityBadge = fragment.querySelector(".severity-badge");
      const statusBadge = fragment.querySelector(".status-badge");
      const title = fragment.querySelector(".card-title");
      const message = fragment.querySelector(".card-message");
      const meta = fragment.querySelector(".card-meta");
      const evidenceList = fragment.querySelector(".evidence-list");
      const buttons = fragment.querySelectorAll(".action-row button");

      severityBadge.textContent = intervention.severity;
      severityBadge.classList.add(`severity-${intervention.severity}`);

      statusBadge.textContent = intervention.status;
      statusBadge.classList.add(`status-${intervention.status}`);

      title.textContent = intervention.title;
      message.textContent = intervention.message;
      meta.textContent = `Type: ${intervention.type} · Confidence: ${Math.round(intervention.confidence * 100)}%`;

      evidenceList.replaceChildren(
        ...intervention.evidence.map((evidence) => {
          const item = document.createElement("div");
          item.className = "evidence-item";
          item.innerHTML = `<p>${escapeHtml(evidence.excerpt)}</p><small>${evidence.source} · ${formatTimestamp(evidence.occurredAt)}</small>`;
          return item;
        }),
      );

      buttons.forEach((button) => {
        button.addEventListener("click", () => submitFeedback(intervention.id, button.dataset.action));
      });

      return fragment;
    }),
  );
}

function renderCompactList(container, items, renderItem) {
  if (!items || items.length === 0) {
    container.replaceChildren(buildEmptyState("Nothing here yet."));
    return;
  }

  container.replaceChildren(...items.map(renderItem));
}

function renderCommitmentCard(commitment) {
  const card = document.createElement("article");
  card.className = "compact-card";
  card.innerHTML = `<p>${escapeHtml(commitment.title)}</p><small>${escapeHtml(commitment.person ?? "Unknown")} · ${escapeHtml(commitment.priority ?? "unranked")}</small>`;
  return card;
}

function renderGoalCard(goal) {
  const card = document.createElement("article");
  card.className = "compact-card";
  card.innerHTML = `<p>${escapeHtml(goal.title)}</p><small>${escapeHtml(goal.horizon ?? "current")}</small>`;
  return card;
}

function buildEmptyState(message) {
  const empty = document.createElement("div");
  empty.className = "empty-state";
  empty.textContent = message;
  return empty;
}

async function submitFeedback(interventionId, action) {
  const response = await fetch("/api/feedback", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ interventionId, action }),
  });
  state.dashboard = await response.json();
  render();
}

function formatGeneratedAt(value) {
  return value ? new Date(value).toLocaleString() : "No snapshot";
}

function formatTimestamp(value) {
  return new Date(value).toLocaleDateString();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
