export function makeGoal({ id, title, horizon, declaredAt }) {
  return {
    id,
    kind: "goal",
    title,
    horizon,
    declaredAt,
  };
}

export function makeCommitment({
  id,
  title,
  owner,
  sourceThreadId,
  person,
  priority,
  status = "open",
  lastTouchedAt,
}) {
  return {
    id,
    kind: "commitment",
    title,
    owner,
    sourceThreadId,
    person,
    priority,
    status,
    lastTouchedAt,
  };
}

export function makeEvidence({ id, source, sourceId, excerpt, occurredAt, metadata = {} }) {
  return {
    id,
    source,
    sourceId,
    excerpt,
    occurredAt,
    metadata,
  };
}

export function makeIntervention({
  id,
  type,
  title,
  message,
  severity,
  confidence,
  evidence,
}) {
  return {
    id,
    type,
    title,
    message,
    severity,
    confidence,
    evidence,
  };
}
