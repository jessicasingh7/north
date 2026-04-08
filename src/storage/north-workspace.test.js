import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { createNorthWorkspace } from "./north-workspace.js";

test("north workspace resolves stores under .north by default", () => {
  const workspace = createNorthWorkspace({ cwd: "/tmp/north-project" });

  assert.equal(workspace.rootDir, "/tmp/north-project/.north");
  assert.equal(
    workspace.stateStore.filePath,
    path.join("/tmp/north-project/.north", "state", "latest.json"),
  );
  assert.equal(
    workspace.feedbackStore.filePath,
    path.join("/tmp/north-project/.north", "state", "feedback.json"),
  );
  assert.equal(
    workspace.googleCredentialsStore.filePath,
    path.join("/tmp/north-project/.north", "config", "google-oauth.json"),
  );
});
