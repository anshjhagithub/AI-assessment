import { runValidationReasoningAgent } from "./validationReasoning.agent.js";

export async function runValidationAgents(payload) {
  try {
    const reasoning = await runValidationReasoningAgent(payload);

    return {
      status: "generated",
      agent: "Validation-Orchestrator-v1",
      generatedAt: new Date().toISOString(),
      ...reasoning
    };
  } catch (err) {
    console.error("Agentic orchestration failed:", err.message);

    return {
      status: "failed",
      agent: "Validation-Orchestrator-v1",
      error: err.message,
      fallbackNarrative:
        "AI reasoning could not be generated. Deterministic validation remains authoritative."
    };
  }
}
