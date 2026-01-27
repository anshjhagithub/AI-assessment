import { BaseAgent } from "../baseAgent.js";

export class ComplianceAgent extends BaseAgent {
  async analyze(complianceValidation) {
    return this.think(`
You are a SOX & SAP compliance officer.

Analyze:
${JSON.stringify(complianceValidation, null, 2)}

Explain:
- policy violations
- approval implications
- audit impact
`);
  }
}
