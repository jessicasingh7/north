import { googleWorkspaceConnector } from "../connectors/google/index.js";
import { makeGoal } from "../domain/entities.js";
import { extractCommitments } from "../engine/extract-commitments.js";
import { defaultJudgments } from "../engine/judgments/index.js";
import { runConnectorPipeline } from "../engine/run-connector-pipeline.js";
import { runJudgmentPipeline } from "../engine/run-judgment-pipeline.js";
import { buildState } from "../engine/state.js";

export async function runPipeline({
  messages,
  calendarEvents,
  goals,
  taskEvents,
  now,
  store,
  connectors = [googleWorkspaceConnector],
  judgments = defaultJudgments,
}) {
  const collected = runConnectorPipeline({
    connectors,
    input: {
      messages,
      calendarEvents,
      taskEvents,
    },
  });
  const events = collected.events;
  const commitments = extractCommitments(events);
  const state = buildState({
    now,
    goals: goals.map(makeGoal),
    events,
    evidence: collected.evidence,
    commitments,
  });
  const interventions = runJudgmentPipeline({ judgments, state });
  const snapshot = {
    generatedAt: now,
    state,
    interventions,
  };

  if (store) {
    await store.save(snapshot);
  }

  return snapshot;
}
