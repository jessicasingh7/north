# Contributing

North is early. The contribution bar right now is clarity and correctness, not feature volume.

## Principles

- Keep the core local-first.
- Every intervention should have inspectable evidence.
- Prefer narrow, explicit schemas over abstract graph machinery.
- Optimize for high precision. Noise kills trust.

## Good First Contributions

- add a new connector normalizer
- add a new judgment module
- improve commitment extraction rules
- improve fixture coverage
- add export/delete and permission-management surfaces

## Development

Run the demo:

```bash
npm run demo
```

Run tests:

```bash
npm test
```

## Design Rules

- Connectors collect facts. They do not decide what matters.
- North owns canonical state. External tool shapes should not leak into the domain model.
- Judgment modules should be composable and easy to test.
- Avoid autonomous high-risk actions by default.

## Pull Requests

Please keep pull requests small and scoped. Good PRs usually do one of these:

- add one connector
- add one judgment
- improve extraction accuracy
- improve docs or contributor ergonomics

Include:

- a concise summary
- any schema changes
- fixture or test updates
- any trust/privacy implications
