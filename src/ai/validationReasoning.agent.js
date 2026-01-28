import { llm } from "./llmClient.js";

export async function runValidationReasoningAgent({
  decision,
  summary,
  exceptions,
  tax,
  compliance,
  bank,
  threeWayMatch,
  computedAmounts
}) {
  const prompt = `
You are a senior SAP Finance & Compliance Officer AI.

Invoice validation summary:
Decision: ${decision}
Major issues: ${summary.major}
Minor issues: ${summary.minor}
Critical issues: ${summary.critical}

Tax issues:
${tax.exceptions.map(e => `- ${e.message}`).join("\n")}

Compliance issues:
${compliance.exceptions.map(e => `- ${e.message}`).join("\n")}

Bank issues:
${bank.exceptions.length === 0 ? "None" : bank.exceptions.map(e => `- ${e.message}`).join("\n")}

3-Way match issues:
${threeWayMatch.exceptions.length === 0 ? "None" : threeWayMatch.exceptions.map(e => `- ${e.message}`).join("\n")}

Computed values:
GST Calculated: ${computedAmounts.gstCalculated}
TDS Calculated: ${computedAmounts.tdsCalculated}

Respond ONLY in JSON with keys:
narrative, keyFindings (array), riskLevel, recommendation.
`;

  const response = await llm.invoke(prompt);

  let parsed;
  try {
    parsed = JSON.parse(response.content);
  } catch {
    throw new Error("AI returned non-JSON response");
  }

  return {
    confidence: Math.max(
      0.5,
      1 - (summary.major * 0.15 + summary.critical * 0.25)
    ),
    ...parsed
  };
}
