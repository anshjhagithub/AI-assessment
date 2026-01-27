import { BaseAgent } from "../baseAgent.js";

export class TaxAgent extends BaseAgent {
  async analyze(taxValidation) {
    return this.think(`
You are a GST & TDS expert.

Analyze the following tax validation output:
${JSON.stringify(taxValidation, null, 2)}

Return:
- key tax risks
- severity
- what must be fixed
`);
  }
}
