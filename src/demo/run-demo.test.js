import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { runPipeline } from "../app/run-pipeline.js";
import { LocalStateStore } from "../storage/local-state-store.js";

test("demo pipeline emits the core intervention types", async () => {
  const messages = [
    {
      id: "m1",
      threadId: "t1",
      direction: "inbound",
      from: "recruiter@company.com",
      to: ["user@example.com"],
      subject: "Quick follow up",
      body: "Can you send your availability and resume?",
      occurredAt: "2026-03-31T09:00:00-07:00",
      labels: ["important"],
    },
  ];
  const calendarEvents = [
    {
      id: "c1",
      title: "Team sync",
      startAt: "2026-04-08T10:00:00-07:00",
      endAt: "2026-04-08T10:30:00-07:00",
      linkedGoalIds: [],
    },
  ];
  const taskEvents = [
    { id: "d1", type: "task_deferred", threadId: "t1", occurredAt: "2026-04-02T09:00:00-07:00" },
    { id: "d2", type: "task_deferred", threadId: "t1", occurredAt: "2026-04-03T09:00:00-07:00" },
    { id: "d3", type: "task_deferred", threadId: "t1", occurredAt: "2026-04-04T09:00:00-07:00" },
  ];

  const tempDir = await mkdtemp(path.join(os.tmpdir(), "north-"));
  const store = new LocalStateStore(path.join(tempDir, "state.json"));
  const snapshot = await runPipeline({
    messages,
    calendarEvents,
    goals: [
      {
        id: "goal:recruiting",
        title: "Recruiting",
        horizon: "weekly",
        declaredAt: "2026-04-07T08:00:00-07:00",
      },
    ],
    taskEvents,
    now: "2026-04-07T16:00:00-07:00",
    store,
  });
  const interventions = snapshot.interventions;
  const interventionTypes = interventions.map((item) => item.type).sort();
  const persisted = await store.load();

  assert.deepEqual(interventionTypes, [
    "follow_up_due",
    "priority_drift",
    "repeated_deferral",
  ]);
  assert.equal(persisted.interventions.length, 3);
  assert.equal(persisted.state.commitments.length, 1);
});
