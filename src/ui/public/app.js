const state = {
  dashboard: null,
};

const statsGrid = document.querySelector("#stats-grid");
const interventionsList = document.querySelector("#interventions-list");
const commitmentsList = document.querySelector("#commitments-list");
const goalsList = document.querySelector("#goals-list");
const integrationsList = document.querySelector("#integrations-list");
const interventionTemplate = document.querySelector("#intervention-template");
const compactCardTemplate = document.querySelector("#compact-card-template");
const integrationCardTemplate = document.querySelector("#integration-card-template");
const sectionTabs = document.querySelectorAll(".section-tab");
const pageSections = document.querySelectorAll(".page-section");

sectionTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    setActiveSection(tab.dataset.sectionTarget);
  });
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
  renderCompactList(integrationsList, state.dashboard.integrations, renderIntegrationCard);
}

function renderStats() {
  const stats = [
    ["Generated", formatGeneratedAt(state.dashboard.generatedAt)],
    ["Prompts needing review", state.dashboard.stats.interventionCount],
    ["Open obligations", state.dashboard.stats.commitmentCount],
    ["Connected sources", countConnectedIntegrations(state.dashboard.integrations)],
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
      buildEmptyState("No state yet. Run `npm run demo` or configure a connector in Integrations and sync it there."),
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

      severityBadge.textContent = intervention.severityLabel;
      severityBadge.classList.add(`severity-${intervention.severity}`);

      statusBadge.textContent = intervention.statusLabel;
      statusBadge.classList.add(`status-${intervention.status}`);

      title.textContent = intervention.title;
      message.textContent = intervention.message;
      meta.textContent = `Prompt type: ${formatType(intervention.type)} · Confidence: ${Math.round(intervention.confidence * 100)}%`;

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
  const card = compactCardTemplate.content.firstElementChild.cloneNode(true);
  card.querySelector(".compact-title").textContent = commitment.title;
  card.querySelector(".compact-detail").textContent =
    `${commitment.statusLabel} · ${commitment.person ?? "Unknown"} · ${commitment.priority ?? "unranked"}`;
  return card;
}

function renderGoalCard(goal) {
  const card = compactCardTemplate.content.firstElementChild.cloneNode(true);
  card.querySelector(".compact-title").textContent = goal.title;
  card.querySelector(".compact-detail").textContent = goal.horizon ?? "current";
  return card;
}

function renderIntegrationCard(integration) {
  const card = integrationCardTemplate.content.firstElementChild.cloneNode(true);
  const title = card.querySelector(".integration-title");
  const status = card.querySelector(".integration-status");
  const detail = card.querySelector(".integration-detail");
  const syncNote = card.querySelector(".integration-sync-note");
  const syncButton = card.querySelector(".integration-sync-button");

  title.textContent = integration.name;
  status.textContent = integration.statusLabel;
  detail.textContent = integration.detail;
  syncNote.textContent = integration.lastSyncedAt
    ? `Last synced ${formatGeneratedAt(integration.lastSyncedAt)}`
    : "Not synced yet.";

  syncButton.disabled = !integration.syncEnabled;
  syncButton.textContent = integration.status === "not_configured" ? "Set up first" : "Sync now";
  syncButton.addEventListener("click", () => triggerIntegrationSync(syncButton));

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

async function triggerIntegrationSync(button) {
  button.disabled = true;
  const originalText = button.textContent;
  button.textContent = "Syncing...";

  try {
    const response = await fetch("/api/sync", { method: "POST" });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error ?? "Sync failed");
    }

    state.dashboard = payload;
    render();
  } catch (error) {
    window.alert(error.message);
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
}

function formatGeneratedAt(value) {
  return value ? new Date(value).toLocaleString() : "No snapshot";
}

function formatTimestamp(value) {
  return new Date(value).toLocaleDateString();
}

function formatType(value) {
  return value.replaceAll("_", " ");
}

function countConnectedIntegrations(integrations) {
  return integrations.filter((item) => item.status === "connected").length;
}

function setActiveSection(sectionName) {
  sectionTabs.forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.sectionTarget === sectionName);
  });
  pageSections.forEach((section) => {
    section.classList.toggle("is-active", section.dataset.section === sectionName);
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
