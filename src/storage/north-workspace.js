import path from "node:path";
import { JsonFileStore } from "./json-file-store.js";

export function createNorthWorkspace({ cwd = process.cwd(), rootDir = process.env.NORTH_HOME } = {}) {
  const workspaceRoot = rootDir ?? path.join(cwd, ".north");
  const stateDir = path.join(workspaceRoot, "state");
  const authDir = path.join(workspaceRoot, "auth");
  const configDir = path.join(workspaceRoot, "config");

  return {
    rootDir: workspaceRoot,
    stateStore: new JsonFileStore(path.join(stateDir, "latest.json")),
    goalStore: new JsonFileStore(path.join(configDir, "goals.json")),
    googleCredentialsStore: new JsonFileStore(path.join(configDir, "google-oauth.json")),
    googleTokenStore: new JsonFileStore(path.join(authDir, "google-tokens.json")),
  };
}
