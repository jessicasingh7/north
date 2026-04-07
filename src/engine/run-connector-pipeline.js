export function runConnectorPipeline({ connectors, input }) {
  return connectors.reduce(
    (accumulator, connector) => {
      const result = connector.collect(input);

      return {
        events: [...accumulator.events, ...(result.events ?? [])],
        evidence: [...accumulator.evidence, ...(result.evidence ?? [])],
      };
    },
    {
      events: [],
      evidence: [],
    },
  );
}
