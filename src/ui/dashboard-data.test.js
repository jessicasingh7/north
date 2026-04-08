import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { createNorthWorkspace } from "../storage/north-workspace.js";
import { buildDashboardData, createSnoozeUntil, recordFeedback } from "./dashboard-data.js";

test("dashboard data merges snapshot and feedback state", async () => {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), "north-ui-"));
  const workspace = createNorthWorkspace({ rootDir });

  await workspace.stateStore.save({
    generatedAt: "2026-04-07T16:00:00-07:00",
    state: {
      commitments: [{ id: "c1", title: "Follow up" }],
      goals: [{ id: "g1", title: "Recruiting" }],
    },
    interventions: [
      {
        id: "i1",
        type: "follow_up_due",
        title: "Follow up with recruiter",
        message: "You owe a reply.",
        severity: "high",
        confidence: 0.8,
        evidence: [],
      },
    ],
  });

  await recordFeedback(workspace, {
    interventionId: "i1",
    action: "dismiss",
  });
  await workspace.syncStateStore.save({
    gmail: { lastSyncedAt: "2026-04-07T16:05:00-07:00" },
  });

  const dashboard = await buildDashboardData(workspace);

  assert.equal(dashboard.stats.interventionCount, 0);
  assert.equal(dashboard.stats.totalInterventionCount, 1);
  assert.equal(dashboard.interventions[0].status, "dismissed");
  assert.equal(dashboard.interventions[0].statusLabel, "Dismissed prompt");
  assert.equal(dashboard.commitments[0].statusLabel, "Needs response");
  assert.equal(dashboard.integrations[0].lastSyncedAt, "2026-04-07T16:05:00-07:00");
  assert.equal(dashboard.integrations[0].syncEnabled, false);
});

test("createSnoozeUntil returns a future timestamp", () => {
  assert.ok(Date.parse(createSnoozeUntil(1)) > Date.now());
});
