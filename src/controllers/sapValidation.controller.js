import { supabase } from '../db/supabaseClient.js';
import { getInvoice } from '../services/invoice.service.js';
import { getPO } from '../services/po.service.js';
import { getGRN } from '../services/grn.service.js';
import { getVendor } from '../services/vendor.service.js';
import { getEntitlement } from '../services/entitlementProxy.service.js';
import { runAgenticAnalysis } from "../ai/validationOrchestrator.agent.js";



import { validate3WayMatch } from '../services/match3way.service.js';
import { validateTax } from '../services/taxValidation.service.js';
import { validateBankDetails } from '../services/bankValidation.service.js';
import { validateCompliance } from '../services/compliance.service.js';
import { makeDecision } from '../services/decision.service.js';
import { generateReport, getReport } from '../services/reporting.service.js';

export const runValidation = async (req, res, next) => {
  try {
    const {
      invoiceId,
      poId,
      grnId,
      vendorId,
      entitlementRef,
      context
    } = req.body;

    const runId = `VAL-${Date.now()}`;

    // ===============================
    // Fetch master data
    // ===============================
    const invoice = await getInvoice(invoiceId);
    const po = await getPO(poId);
    const grn = await getGRN(grnId);
    const vendor = await getVendor(vendorId);
    const entitlement = await getEntitlement(entitlementRef.entitlementId);

    // ===============================
    // Run validations
    // ===============================
    const threeWayMatch = validate3WayMatch(invoice, po, grn);
    const taxValidation = validateTax(invoice);
    const bankValidation = validateBankDetails(vendor, invoice);
    const complianceValidation = validateCompliance(context, invoice, po);

    // ===============================
    // Collect exceptions (IMPORTANT)
    // ===============================
    const allExceptions = [
      ...threeWayMatch.exceptions,
      ...taxValidation.exceptions,
      ...bankValidation.exceptions,
      ...complianceValidation.exceptions
    ];

    // ===============================
    // Final decision
    // ===============================
    const decisionResult = makeDecision(allExceptions);
    // ===============================
// Agentic AI analysis
// ===============================
// ===============================
// 🤖 Agentic AI (BACKGROUND, NON-BLOCKING)
// ===============================
// ===============================
// 🤖 Agentic AI (BACKGROUND, NON-BLOCKING)
// ===============================
setTimeout(async () => {
  try {
    const agenticAnalysis = await runAgenticAnalysis({
      decision: decisionResult.decision,
      tax: taxValidation,
      compliance: complianceValidation,
      exceptions: allExceptions
    });

    const existingReport = await getReport(runId);

    await generateReport(runId, {
      ...existingReport,
      aiAgents: agenticAnalysis
    });

    console.log("Agentic AI completed for", runId);
  } catch (err) {
    console.error("Agentic AI failed:", err.message);
  }
}, 0);





    // ===============================
    // Persist validation run
    // ===============================
    await supabase.from('validation_runs').insert({
      run_id: runId,
      invoice_id: invoiceId,
      po_id: poId,
      grn_id: grnId,
      model_id: entitlementRef.modelId,
      status: 'completed',
      decision: decisionResult.decision
    });

    // ===============================
    // Persist exceptions
    // ===============================
    if (allExceptions.length > 0) {
      await supabase.from('validation_exceptions').insert(
        allExceptions.map(ex => ({
          run_id: runId,
          rule_id: ex.ruleId,
          severity: ex.severity,
          category: ex.category,
          message: ex.message,
          evidence: ex.evidence,
          suggested_resolution: ex.suggestedResolution
        }))
      );
    }

    // ===============================
    // Persist report
    // ===============================
    const reportPayload = {
  runId,
  decision: decisionResult.decision,
  summary: decisionResult.summary,

  computedAmounts: {
    netPayable: entitlement.entitlement_json.netPayable,
    gstCalculated: taxValidation.calculatedGST,
    tdsCalculated: taxValidation.calculatedTDS
  },

  threeWayMatch,
  tax: taxValidation,
  bank: bankValidation,
  compliance: complianceValidation,

  exceptions: allExceptions,
  reasoning: decisionResult.reasoning,
  routingSuggestions: decisionResult.routingSuggestions,

  // ❌ NO aiAgents HERE

  recommendations: generateRecommendations(
    decisionResult.decision,
    allExceptions
  )
};


    await generateReport(runId, reportPayload);

    // ===============================
    // 🔥 FIXED RESPONSE (THIS WAS MISSING)
    // ===============================
    res.json({
      runId,
      decision: decisionResult.decision,
      summary: decisionResult.summary,

      // REQUIRED BY PDF
      exceptions: allExceptions,
      reasoning: decisionResult.reasoning,
      routingSuggestions: decisionResult.routingSuggestions
    });

  } catch (error) {
    next(error);
  }
};

export const fetchValidationReport = async (req, res, next) => {
  try {
    const { runId } = req.params;
    const report = await getReport(runId);
    res.json(report);
  } catch (error) {
    next(error);
  }
};

const generateRecommendations = (decision, exceptions) => {
  if (decision === 'OKAY') {
    return [
      'Proceed with payment processing',
      'Archive validation report for audit'
    ];
  }

  if (decision === 'HOLD') {
    return [
      'Resolve flagged exceptions before proceeding',
      'Coordinate with relevant teams',
      'Update master data if required'
    ];
  }

  return [
    'Return invoice to vendor for correction',
    'Do not process payment',
    'Document rejection reason'
  ];
};
