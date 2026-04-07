import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { LocalStateStore } from "./local-state-store.js";

test("local state store saves and reloads snapshots", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "north-store-"));
  const filePath = path.join(tempDir, "snapshot.json");
  const store = new LocalStateStore(filePath);
  const snapshot = {
    generatedAt: "2026-04-07T16:00:00-07:00",
    state: { commitments: [] },
    interventions: [{ id: "i1", type: "follow_up_due" }],
  };

  await store.save(snapshot);
  const loaded = await store.load();

  assert.deepEqual(loaded, snapshot);
});
