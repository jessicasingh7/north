import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { runPipeline } from "../app/run-pipeline.js";
import { LocalStateStore } from "../storage/local-state-store.js";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.resolve(dirname, "../../fixtures/demo");
const outputPath = path.resolve(dirname, "../../.north/demo-state.json");

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
  const snapshot = await runPipeline({
    messages,
    calendarEvents,
    goals,
    taskEvents,
    now: "2026-04-07T16:00:00-07:00",
    store: new LocalStateStore(outputPath),
  });

  process.stdout.write(
    `${JSON.stringify(
      {
        persistedTo: outputPath,
        commitments: snapshot.state.commitments,
        interventions: snapshot.interventions,
      },
      null,
      2,
    )}\n`,
  );
}

main().catch((error) => {
  process.stderr.write(`${error.stack}\n`);
  process.exitCode = 1;
});
