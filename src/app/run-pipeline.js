import { normalizeGoogleArtifacts } from "../connectors/google/normalize.js";
import { makeGoal } from "../domain/entities.js";
import { extractCommitments } from "../engine/extract-commitments.js";
import { runJudgments } from "../engine/run-judgments.js";
import { buildState } from "../engine/state.js";

export async function runPipeline({
  messages,
  calendarEvents,
  goals,
  taskEvents,
  now,
  store,
}) {
  const normalized = normalizeGoogleArtifacts({ messages, calendarEvents });
  const events = [...normalized.events, ...taskEvents].sort((left, right) =>
    left.occurredAt.localeCompare(right.occurredAt),
  );
  const commitments = extractCommitments(events);
  const state = buildState({
    now,
    goals: goals.map(makeGoal),
    events,
    evidence: normalized.evidence,
    commitments,
  });
  const interventions = runJudgments(state);
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
