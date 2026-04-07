import { makeCommitment } from "../domain/entities.js";

const FOLLOW_UP_SIGNALS = [
  "follow up",
  "send",
  "share",
  "reply",
  "get back",
  "can you",
  "could you",
];

function containsSignal(body) {
  const normalized = body.toLowerCase();
  return FOLLOW_UP_SIGNALS.some((signal) => normalized.includes(signal));
}

export function extractCommitments(events) {
  const commitments = [];

  for (const event of events) {
    if (event.type !== "email_received") {
      continue;
    }

    if (!containsSignal(event.body)) {
      continue;
    }

    commitments.push(
      makeCommitment({
        id: `commitment:${event.threadId}`,
        title: `Follow up on "${event.subject}"`,
        owner: "user",
        sourceThreadId: event.threadId,
        person: event.actor,
        priority: event.labels.includes("important") ? "high" : "medium",
        lastTouchedAt: event.occurredAt,
      }),
    );
  }

  return dedupeCommitments(commitments);
}

function dedupeCommitments(commitments) {
  return Array.from(new Map(commitments.map((commitment) => [commitment.id, commitment])).values());
}
