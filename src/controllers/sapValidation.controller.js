import { v4 as uuidv4 } from "uuid";
import { supabase } from "../db/supabaseClient.js";

import { getInvoice } from "../services/invoice.service.js";
import { getPO } from "../services/po.service.js";
import { getGRN } from "../services/grn.service.js";
import { getVendor } from "../services/vendor.service.js";
import { getEntitlement } from "../services/entitlementProxy.service.js";

import { validate3WayMatch } from "../services/match3way.service.js";
import { validateTax } from "../services/taxValidation.service.js";
import { validateBankDetails } from "../services/bankValidation.service.js";
import { validateCompliance } from "../services/compliance.service.js";
import { makeDecision } from "../services/decision.service.js";
import { generateReport, getReport } from "../services/reporting.service.js";

import { runValidationAgents } from "../ai/validationOrchestrator.agent.js";

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

    const invoice = await getInvoice(invoiceId);
    const po = await getPO(poId);
    const grn = await getGRN(grnId);
    const vendor = await getVendor(vendorId);
    const entitlement = await getEntitlement(entitlementRef.entitlementId);

    const threeWayMatch = validate3WayMatch(invoice, po, grn);
    const tax = validateTax(invoice);
    const bank = validateBankDetails(vendor, invoice);
    const compliance = validateCompliance(context, invoice, po);

    const exceptions = [
      ...threeWayMatch.exceptions,
      ...tax.exceptions,
      ...bank.exceptions,
      ...compliance.exceptions
    ];

    const decisionResult = makeDecision(exceptions);

    await supabase.from("validation_runs").insert({
      run_id: runId,
      invoice_id: invoiceId,
      po_id: poId,
      grn_id: grnId,
      model_id: entitlementRef.modelId,
      status: "completed",
      decision: decisionResult.decision
    });

    if (exceptions.length > 0) {
      await supabase.from("validation_exceptions").insert(
        exceptions.map(e => ({
          run_id: runId,
          ...e
        }))
      );
    }

    const computedAmounts = {
      netPayable: entitlement.entitlement_json.netPayable,
      gstCalculated: tax.calculatedGST,
      tdsCalculated: tax.calculatedTDS
    };

    // 🔥 ACTUAL AGENT EXECUTION (THIS WAS MISSING)
    const aiAgents = await runValidationAgents({
      decision: decisionResult.decision,
      summary: decisionResult.summary,
      exceptions,
      tax,
      compliance,
      bank,
      threeWayMatch,
      computedAmounts,
      context
    });

    const validationData = {
      runId,
      decision: decisionResult.decision,
      summary: decisionResult.summary,
      tax,
      bank,
      compliance,
      threeWayMatch,
      exceptions,
      computedAmounts,
      reasoning: decisionResult.reasoning,
      routingSuggestions: decisionResult.routingSuggestions,
      recommendations: [
        "Resolve flagged exceptions before proceeding",
        "Coordinate with relevant teams",
        "Update master data if required"
      ],
      aiAgents // ✅ NOW INCLUDED
    };

    await generateReport(runId, validationData);

    res.json(validationData);
  } catch (err) {
    next(err);
  }
};

export const fetchValidationReport = async (req, res, next) => {
  try {
    const report = await getReport(req.params.runId);
    res.json(report);
  } catch (err) {
    next(err);
  }
};
