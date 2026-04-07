export function runJudgmentPipeline({ judgments, state }) {
  return judgments.flatMap((judgment) => judgment.run(state)).sort(compareSeverity);
}

function compareSeverity(left, right) {
  const rank = {
    high: 0,
    medium: 1,
    low: 2,
  };

  return rank[left.severity] - rank[right.severity];
}
