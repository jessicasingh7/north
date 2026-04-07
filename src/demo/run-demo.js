import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { normalizeGoogleArtifacts } from "../connectors/google/normalize.js";
import { makeGoal } from "../domain/entities.js";
import { extractCommitments } from "../engine/extract-commitments.js";
import { runJudgments } from "../engine/run-judgments.js";
import { buildState } from "../engine/state.js";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.resolve(dirname, "../../fixtures/demo");

async function loadJson(name) {
  const fullPath = path.join(fixturesDir, name);
  const contents = await readFile(fullPath, "utf8");
  return JSON.parse(contents);
}

async function main() {
  const [messages, calendarEvents, goals, taskEvents] = await Promise.all([
    loadJson("messages.json"),
    loadJson("calendar-events.json"),
    loadJson("goals.json"),
    loadJson("task-events.json"),
  ]);

  const normalized = normalizeGoogleArtifacts({ messages, calendarEvents });
  const events = [...normalized.events, ...taskEvents].sort((left, right) =>
    left.occurredAt.localeCompare(right.occurredAt),
  );
  const commitments = extractCommitments(events);
  const state = buildState({
    now: "2026-04-07T16:00:00-07:00",
    goals: goals.map(makeGoal),
    events,
    evidence: normalized.evidence,
    commitments,
  });
  const interventions = runJudgments(state);

  process.stdout.write(`${JSON.stringify({ commitments, interventions }, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.stack}\n`);
  process.exitCode = 1;
});
