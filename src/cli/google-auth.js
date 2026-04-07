import { authorizeGoogle } from "../connectors/google/auth.js";
import { createNorthWorkspace } from "../storage/north-workspace.js";

async function main() {
  const workspace = createNorthWorkspace();
  await authorizeGoogle(workspace);
  process.stdout.write(`Saved Google tokens under ${workspace.rootDir}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.stack}\n`);
  process.exitCode = 1;
});
