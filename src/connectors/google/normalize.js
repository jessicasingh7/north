import { makeEvidence } from "../../domain/entities.js";

function buildEmailEvent(message) {
  return {
    id: `email:${message.id}`,
    type: message.direction === "inbound" ? "email_received" : "email_sent",
    source: "gmail",
    occurredAt: message.occurredAt,
    threadId: message.threadId,
    actor: message.from,
    recipients: message.to,
    subject: message.subject,
    body: message.body,
    labels: message.labels ?? [],
    raw: message,
  };
}

function buildCalendarEvent(event) {
  return {
    id: `calendar:${event.id}`,
    type: "calendar_event",
    source: "google_calendar",
    occurredAt: event.startAt,
    endsAt: event.endAt,
    title: event.title,
    linkedGoalIds: event.linkedGoalIds ?? [],
    attendees: event.attendees ?? [],
    raw: event,
  };
}

export function normalizeGoogleArtifacts({ messages, calendarEvents }) {
  const events = [
    ...messages.map(buildEmailEvent),
    ...calendarEvents.map(buildCalendarEvent),
  ].sort((left, right) => left.occurredAt.localeCompare(right.occurredAt));

  const evidence = events.map((event) =>
    makeEvidence({
      id: `evidence:${event.id}`,
      source: event.source,
      sourceId: event.id,
      occurredAt: event.occurredAt,
      excerpt: event.subject ?? event.title ?? event.type,
      metadata: {
        threadId: event.threadId,
      },
    }),
  );

  return { events, evidence };
}
