import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { loadGoogleOAuthConfig } from "./auth.js";
import { createNorthWorkspace } from "../../storage/north-workspace.js";

test("loadGoogleOAuthConfig reads credentials from the workspace config file", async () => {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), "north-auth-"));
  const workspace = createNorthWorkspace({ rootDir });

  await workspace.googleCredentialsStore.save({
    clientId: "client-id",
    clientSecret: "client-secret",
    redirectUri: "http://127.0.0.1:8787/oauth/google/callback",
  });

  const config = await loadGoogleOAuthConfig(workspace);

  assert.deepEqual(config, {
    clientId: "client-id",
    clientSecret: "client-secret",
    redirectUri: "http://127.0.0.1:8787/oauth/google/callback",
  });
});
