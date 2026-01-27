import { BaseAgent } from "../baseAgent.js";

export class RiskAgent extends BaseAgent {
  async analyze(allExceptions, decision) {
    return this.think(`
You are an enterprise risk analyst.

Decision: ${decision}

Exceptions:
${JSON.stringify(allExceptions, null, 2)}

Assess:
- overall risk level
- likelihood of financial loss
- urgency
`);
  }
}
