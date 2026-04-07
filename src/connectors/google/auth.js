import http from "node:http";
import { spawn } from "node:child_process";
import { URL } from "node:url";
import { google } from "googleapis";
import { GOOGLE_SCOPES } from "./scopes.js";

const DEFAULT_REDIRECT_URI = "http://127.0.0.1:8787/oauth/google/callback";

export async function loadGoogleOAuthConfig(workspace) {
  const fileConfig = await workspace.googleCredentialsStore.load();

  const config = {
    clientId: process.env.NORTH_GOOGLE_CLIENT_ID ?? fileConfig?.clientId,
    clientSecret: process.env.NORTH_GOOGLE_CLIENT_SECRET ?? fileConfig?.clientSecret,
    redirectUri:
      process.env.NORTH_GOOGLE_REDIRECT_URI ?? fileConfig?.redirectUri ?? DEFAULT_REDIRECT_URI,
  };

  if (!config.clientId || !config.clientSecret) {
    throw new Error(
      "Missing Google OAuth credentials. Set NORTH_GOOGLE_CLIENT_ID/NORTH_GOOGLE_CLIENT_SECRET or create .north/config/google-oauth.json.",
    );
  }

  return config;
}

export function createGoogleOAuthClient(config, tokens) {
  const client = new google.auth.OAuth2(config.clientId, config.clientSecret, config.redirectUri);

  if (tokens) {
    client.setCredentials(tokens);
  }

  return client;
}

export async function authorizeGoogle(workspace) {
  const config = await loadGoogleOAuthConfig(workspace);
  const existingTokens = await workspace.googleTokenStore.load();

  if (existingTokens) {
    return createGoogleOAuthClient(config, existingTokens);
  }

  const client = createGoogleOAuthClient(config);
  const authUrl = client.generateAuthUrl({
    access_type: "offline",
    scope: GOOGLE_SCOPES,
    prompt: "consent",
  });

  process.stdout.write(`Open this URL to connect Google:\n${authUrl}\n`);
  attemptBrowserOpen(authUrl);

  const code = await waitForOAuthCode(config.redirectUri);
  const { tokens } = await client.getToken(code);

  client.setCredentials(tokens);
  await workspace.googleTokenStore.save(tokens);

  return client;
}

function attemptBrowserOpen(url) {
  const command =
    process.platform === "darwin"
      ? "open"
      : process.platform === "win32"
        ? "start"
        : "xdg-open";

  try {
    spawn(command, [url], {
      detached: true,
      stdio: "ignore",
    }).unref();
  } catch {
    return;
  }
}

function waitForOAuthCode(redirectUri) {
  const redirect = new URL(redirectUri);

  return new Promise((resolve, reject) => {
    const server = http.createServer((request, response) => {
      if (!request.url) {
        response.statusCode = 400;
        response.end("Missing URL");
        return;
      }

      const currentUrl = new URL(request.url, redirect.origin);
      const code = currentUrl.searchParams.get("code");
      const error = currentUrl.searchParams.get("error");

      if (currentUrl.pathname !== redirect.pathname) {
        response.statusCode = 404;
        response.end("Not found");
        return;
      }

      if (error) {
        response.statusCode = 400;
        response.end("Google authorization was denied. You can close this tab.");
        server.close(() => reject(new Error(`Google OAuth failed: ${error}`)));
        return;
      }

      if (!code) {
        response.statusCode = 400;
        response.end("Missing authorization code. You can close this tab.");
        server.close(() => reject(new Error("Google OAuth callback did not include a code.")));
        return;
      }

      response.statusCode = 200;
      response.setHeader("content-type", "text/html; charset=utf-8");
      response.end(
        "<html><body><h1>North connected to Google.</h1><p>You can close this tab and return to the terminal.</p></body></html>",
      );
      server.close(() => resolve(code));
    });

    server.on("error", reject);
    server.listen(Number(redirect.port), redirect.hostname);
  });
}
