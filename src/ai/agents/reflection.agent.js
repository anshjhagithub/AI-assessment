import { BaseAgent } from "../baseAgent.js";

export class ReflectionAgent extends BaseAgent {
  async reflect(agentOutputs) {
    return this.think(`
You are a senior SAP finance reviewer.

Below are analyses from multiple agents:
${JSON.stringify(agentOutputs, null, 2)}

Tasks:
1. Identify contradictions
2. Prioritize issues
3. Produce a final coherent narrative
4. Suggest next actions

Do NOT change system decision.
`);
  }
}
