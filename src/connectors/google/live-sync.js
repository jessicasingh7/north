import { google } from "googleapis";

const DEFAULT_GMAIL_LIMIT = 25;
const DEFAULT_CALENDAR_LIMIT = 25;

export async function fetchGoogleArtifacts(
  auth,
  { now = new Date(), gmailLimit = DEFAULT_GMAIL_LIMIT, calendarLimit = DEFAULT_CALENDAR_LIMIT } = {},
) {
  const gmail = google.gmail({ version: "v1", auth });
  const calendar = google.calendar({ version: "v3", auth });

  const [messages, calendarEvents] = await Promise.all([
    fetchGmailMessages(gmail, gmailLimit),
    fetchCalendarEvents(calendar, now, calendarLimit),
  ]);

  return {
    messages,
    calendarEvents,
    taskEvents: [],
  };
}

async function fetchGmailMessages(gmail, limit) {
  const listResponse = await gmail.users.messages.list({
    userId: "me",
    maxResults: limit,
    q: "category:primary newer_than:14d",
  });
  const messageRefs = listResponse.data.messages ?? [];
  const messages = await Promise.all(
    messageRefs.map(async (messageRef) => {
      const detail = await gmail.users.messages.get({
        userId: "me",
        id: messageRef.id,
        format: "metadata",
        metadataHeaders: ["From", "To", "Subject"],
      });

      return mapGmailMessage(detail.data);
    }),
  );

  return messages.filter(Boolean);
}

function mapGmailMessage(message) {
  if (!message.id || !message.threadId || !message.internalDate) {
    return null;
  }

  const headers = new Map(
    (message.payload?.headers ?? []).map((header) => [header.name?.toLowerCase(), header.value ?? ""]),
  );

  return {
    id: message.id,
    threadId: message.threadId,
    direction: "inbound",
    from: headers.get("from") ?? "unknown",
    to: splitAddresses(headers.get("to")),
    subject: headers.get("subject") ?? "(no subject)",
    body: message.snippet ?? "",
    occurredAt: new Date(Number(message.internalDate)).toISOString(),
    labels: message.labelIds?.includes("IMPORTANT") ? ["important"] : [],
  };
}

async function fetchCalendarEvents(calendar, now, limit) {
  const response = await calendar.events.list({
    calendarId: "primary",
    singleEvents: true,
    orderBy: "startTime",
    timeMin: now.toISOString(),
    maxResults: limit,
  });

  return (response.data.items ?? []).map((event) => ({
    id: event.id,
    title: event.summary ?? "(untitled event)",
    startAt: event.start?.dateTime ?? `${event.start?.date}T00:00:00.000Z`,
    endAt: event.end?.dateTime ?? `${event.end?.date}T00:00:00.000Z`,
    linkedGoalIds: [],
    attendees: (event.attendees ?? []).map((attendee) => attendee.email).filter(Boolean),
  }));
}

function splitAddresses(value) {
  if (!value) {
    return [];
  }

  return value.split(",").map((item) => item.trim()).filter(Boolean);
}
