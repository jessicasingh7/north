import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildDashboardData, createSnoozeUntil, recordFeedback } from "./dashboard-data.js";
import { createNorthWorkspace } from "../storage/north-workspace.js";
import { authorizeGoogle } from "../connectors/google/auth.js";
import { fetchGoogleArtifacts } from "../connectors/google/live-sync.js";
import { recordIntegrationSync } from "../integrations/sync-state.js";
import { runPipeline } from "../app/run-pipeline.js";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(dirname, "public");
const port = Number(process.env.NORTH_UI_PORT ?? 4310);
const workspace = createNorthWorkspace();

const server = http.createServer(async (request, response) => {
  try {
    if (!request.url) {
      return respondJson(response, 400, { error: "Missing URL" });
    }

    const url = new URL(request.url, `http://${request.headers.host ?? `127.0.0.1:${port}`}`);

    if (request.method === "GET" && url.pathname === "/api/dashboard") {
      return respondJson(response, 200, await buildDashboardData(workspace));
    }

    if (request.method === "POST" && url.pathname === "/api/feedback") {
      const body = await readJsonBody(request);
      const action = body.action;

      if (!body.interventionId || !["dismiss", "wrong", "snooze"].includes(action)) {
        return respondJson(response, 400, { error: "Invalid feedback payload" });
      }

      await recordFeedback(workspace, {
        interventionId: body.interventionId,
        action,
        until: action === "snooze" ? createSnoozeUntil(1) : null,
      });

      return respondJson(response, 200, await buildDashboardData(workspace));
    }

    if (request.method === "POST" && url.pathname === "/api/sync") {
      try {
        const auth = await authorizeGoogle(workspace);
        const artifacts = await fetchGoogleArtifacts(auth);
        const goals = (await workspace.goalStore.load()) ?? [];
        const now = new Date().toISOString();

        await runPipeline({
          ...artifacts,
          goals,
          now,
          store: workspace.stateStore,
        });
        await recordIntegrationSync(workspace, ["gmail", "google-calendar"], now);

        return respondJson(response, 200, await buildDashboardData(workspace));
      } catch (error) {
        return respondJson(response, 500, { error: error.message });
      }
    }

    if (request.method === "GET" && (url.pathname === "/" || url.pathname.startsWith("/assets/"))) {
      return serveStatic(response, url.pathname);
    }

    return respondJson(response, 404, { error: "Not found" });
  } catch (error) {
    return respondJson(response, 500, { error: error.message });
  }
});

server.listen(port, "127.0.0.1", () => {
  process.stdout.write(`North UI running at http://127.0.0.1:${port}\n`);
});

async function serveStatic(response, pathname) {
  const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^\/assets\//, "");
  const filePath = path.join(publicDir, relativePath);
  const body = await readFile(filePath);
  const contentType = getContentType(filePath);
  response.writeHead(200, { "content-type": contentType });
  response.end(body);
}

function getContentType(filePath) {
  if (filePath.endsWith(".css")) {
    return "text/css; charset=utf-8";
  }

  if (filePath.endsWith(".js")) {
    return "application/javascript; charset=utf-8";
  }

  return "text/html; charset=utf-8";
}

function respondJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "content-type": "application/json; charset=utf-8" });
  response.end(`${JSON.stringify(payload, null, 2)}\n`);
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let data = "";

    request.on("data", (chunk) => {
      data += chunk;
    });

    request.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (error) {
        reject(error);
      }
    });

    request.on("error", reject);
  });
}
