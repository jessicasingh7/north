import { runPipeline } from "../app/run-pipeline.js";
import { authorizeGoogle } from "../connectors/google/auth.js";
import { fetchGoogleArtifacts } from "../connectors/google/live-sync.js";
import { createNorthWorkspace } from "../storage/north-workspace.js";

async function main() {
  const workspace = createNorthWorkspace();
  const auth = await authorizeGoogle(workspace);
  const artifacts = await fetchGoogleArtifacts(auth);
  const goals = (await workspace.goalStore.load()) ?? [];
  const snapshot = await runPipeline({
    ...artifacts,
    goals,
    now: new Date().toISOString(),
    store: workspace.stateStore,
  });

  process.stdout.write(
    `${JSON.stringify(
      {
        rootDir: workspace.rootDir,
        commitments: snapshot.state.commitments.length,
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
