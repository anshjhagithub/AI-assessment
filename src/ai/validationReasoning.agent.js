import { llm } from "./llmClient.js";
import { ChatPromptTemplate } from "@langchain/core/prompts";

const prompt = ChatPromptTemplate.fromTemplate(`
You are a senior SAP Finance & Compliance Analyst.

Given the following validation results from a payment validation system,
generate a professional explanation that includes:

1. Overall risk assessment
2. Why the decision was taken
3. Key problem areas (if any)
4. What the finance team should do next

Decision: {decision}

Exceptions:
{exceptions}

Rules:
- Do NOT invent data
- Do NOT change the decision
- Only explain what is provided
- Keep it audit-friendly
`);

export const generateAIReasoning = async ({ decision, exceptions }) => {
  if (!exceptions || exceptions.length === 0) {
    return {
      summary: "No exceptions detected. Invoice is safe for processing.",
      riskLevel: "LOW",
      explanation: "All validation checks passed successfully.",
    };
  }

  const response = await llm.invoke(
    await prompt.format({
      decision,
      exceptions: JSON.stringify(exceptions, null, 2),
    })
  );

  return {
    summary: response.content,
    riskLevel:
      decision === "REJECT"
        ? "HIGH"
        : decision === "HOLD"
        ? "MEDIUM"
        : "LOW",
    explanation: response.content,
  };
};
