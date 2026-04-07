import test from "node:test";
import assert from "node:assert/strict";
import { normalizeGoogleArtifacts } from "../connectors/google/normalize.js";
import { makeGoal } from "../domain/entities.js";
import { extractCommitments } from "../engine/extract-commitments.js";
import { runJudgments } from "../engine/run-judgments.js";
import { buildState } from "../engine/state.js";

test("demo pipeline emits the core intervention types", () => {
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

  const normalized = normalizeGoogleArtifacts({ messages, calendarEvents });
  const events = [...normalized.events, ...taskEvents];
  const commitments = extractCommitments(events);
  const state = buildState({
    now: "2026-04-07T16:00:00-07:00",
    goals: [
      makeGoal({
        id: "goal:recruiting",
        title: "Recruiting",
        horizon: "weekly",
        declaredAt: "2026-04-07T08:00:00-07:00",
      }),
    ],
    events,
    evidence: normalized.evidence,
    commitments,
  });

  const interventions = runJudgments(state);
  const interventionTypes = interventions.map((item) => item.type).sort();

  assert.deepEqual(interventionTypes, [
    "follow_up_due",
    "priority_drift",
    "repeated_deferral",
  ]);
});
