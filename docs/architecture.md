# Architecture Notes

North is structured around four layers.

## 1. Capture

Connectors ingest raw activity from external systems such as Gmail, Google Calendar, browsers, tasks, and chat.

Rules:

- connectors emit facts
- raw source references are preserved
- permissions stay explicit

## 2. Structured State

The normalizer and extractor layers translate source-specific data into North's internal model:

- goals
- commitments
- events
- evidence
- interventions

This lets North stay stable even if an external integration changes.

## 3. Judgment

Judgment modules evaluate structured state and emit high-signal interventions.

Current modules:

- `follow_up_due`
- `repeated_deferral`
- `priority_drift`

The long-term design should combine:

- deterministic rules for precision
- optional model-assisted extraction and explanation

## 4. Interface

North can surface interventions through:

- its own UI
- a CLI/demo surface
- future agent runtimes such as OpenClaw

Important boundary:

- OpenClaw can be an integration layer or runtime surface.
- North should still make sense without OpenClaw installed.

## Why Not Start With A Graph Database

The product needs judgment before it needs graph complexity.

For the near-term MVP, a boring, explicit schema is better:

- easier to test
- easier to inspect
- easier for contributors to understand
- easier to evolve safely

Graph semantics can be represented later through linked entities and evidence once the product loop is proven.
