import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const complianceRules = JSON.parse(
  readFileSync(join(__dirname, "../rules/compliance.rules.json"), "utf-8")
);

export const validateCompliance = (context, invoice, po) => {
  const exceptions = [];

  // Segregation of Duties
  if (complianceRules.requireSeparationOfDuties) {
    if (context.requesterUserId === context.approverUserId) {
      exceptions.push({
        ruleId: "COMP_SOD_VIOLATION",
        severity: "critical",
        category: "compliance",
        message: "Requester and Approver cannot be same",
        evidence: {
          requester: context.requesterUserId,
          approver: context.approverUserId
        },
        suggestedResolution: "Assign a different approver"
      });
    }
  }

  const invoiceAmount = invoice.invoice_json.header.total;

  // Budget check
  if (invoiceAmount > context.budgetAvailable) {
    const exceedPercent =
      ((invoiceAmount - context.budgetAvailable) / context.budgetAvailable) * 100;

    exceptions.push({
      ruleId: "COMP_BUDGET_EXCEEDED",
      severity: exceedPercent > 10 ? "critical" : "major",
      category: "compliance",
      message: "Invoice exceeds available budget",
      evidence: {
        invoiceAmount,
        budgetAvailable: context.budgetAvailable,
        exceedPercent: exceedPercent.toFixed(2)
      },
      suggestedResolution: "Request budget reallocation or split invoice"
    });
  }

  // PO ceiling check
  const poCeiling = po.po_json.header.ceiling;
  if (invoiceAmount > poCeiling) {
    exceptions.push({
      ruleId: "COMP_PO_CEILING_EXCEEDED",
      severity: "critical",
      category: "compliance",
      message: "Invoice exceeds PO ceiling",
      evidence: {
        invoiceAmount,
        poCeiling,
        excess: invoiceAmount - poCeiling
      },
      suggestedResolution: "Amend PO or reject invoice"
    });
  }

  // High-value approval requirement
  if (invoiceAmount > complianceRules.maxInvoiceAmountWithoutApproval) {
    exceptions.push({
      ruleId: "COMP_HIGH_VALUE_APPROVAL_REQUIRED",
      severity: "minor",
      category: "compliance",
      message: "High value invoice needs additional approval",
      evidence: {
        invoiceAmount,
        threshold: complianceRules.maxInvoiceAmountWithoutApproval
      },
      suggestedResolution: "Route to senior management"
    });
  }

  return {
    passed: exceptions.filter((e) => e.severity === "critical").length === 0,
    exceptions
  };
};
