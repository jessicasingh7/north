# Google Setup

North currently supports direct Gmail and Google Calendar ingestion through a local OAuth flow.

## 1. Create Google OAuth Credentials

Create an OAuth client in Google Cloud Console for a desktop or web application.

North expects this redirect URI by default:

```text
http://127.0.0.1:8787/oauth/google/callback
```

## 2. Provide Credentials To North

Either set environment variables:

```bash
export NORTH_GOOGLE_CLIENT_ID="..."
export NORTH_GOOGLE_CLIENT_SECRET="..."
```

Or create `.north/config/google-oauth.json`:

```json
{
  "clientId": "YOUR_CLIENT_ID",
  "clientSecret": "YOUR_CLIENT_SECRET",
  "redirectUri": "http://127.0.0.1:8787/oauth/google/callback"
}
```

## 3. Authorize Google

```bash
npm run google:auth
```

North will print the Google authorization URL, attempt to open your browser, and then store tokens locally under `.north/auth/google-tokens.json`.

## 4. Sync Real Data

```bash
npm run google:sync
```

This pulls recent Gmail primary messages and upcoming Google Calendar events, runs them through North's pipeline, and writes the latest snapshot to `.north/state/latest.json`.

## Notes

- Tokens and credentials are intentionally stored under `.north`, which is gitignored.
- The current Gmail integration uses message metadata and snippets, not full thread bodies.
- Goal declarations can be stored in `.north/config/goals.json` using the same shape as the demo fixture file.
