export const makeDecision = (exceptions) => {
  const critical = exceptions.filter(e => e.severity === 'critical').length;
  const major = exceptions.filter(e => e.severity === 'major').length;
  const minor = exceptions.filter(e => e.severity === 'minor').length;

  if (critical > 0) {
    return {
      decision: 'REJECT',
      summary: { critical, major, minor },
      reasoning: [`${critical} critical exception(s) found`],
      routingSuggestions: ['Route to Compliance Officer']
    };
  }

  if (major > 0) {
    return {
      decision: 'HOLD',
      summary: { critical, major, minor },
      reasoning: [`${major} major exception(s) require resolution`],
      routingSuggestions: ['Route to Procurement / Finance']
    };
  }

  return {
    decision: 'OKAY',
    summary: { critical, major, minor },
    reasoning: ['All validations passed'],
    routingSuggestions: []
  };
};
