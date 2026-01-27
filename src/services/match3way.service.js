import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const toleranceRules = JSON.parse(
  readFileSync(join(__dirname, '../rules/tolerance.rules.json'), 'utf-8')
);

export const validate3WayMatch = (invoice, po, grn) => {
  const exceptions = [];
  const invoiceLines = invoice.invoice_json.lineItems;
  const poLines = po.po_json.lineItems;
  const grnLines = grn.grn_json.lineItems;

  // Check if GRN exists
  if (!grnLines || grnLines.length === 0) {
    if (!toleranceRules.allowMissingGRN) {
      exceptions.push({
        ruleId: '3WAY_GRN_MISSING',
        severity: 'critical',
        category: '3way_match',
        message: 'GRN is missing',
        evidence: {
          invoiceId: invoice.invoice_id,
          grnId: grn.grn_id
        },
        suggestedResolution: 'Create GRN before processing invoice'
      });
    }
  }

  // Line-by-line validation
  invoiceLines.forEach(invLine => {
    const poLine = poLines.find(p => p.lineNo === invLine.lineNo);
    const grnLine = grnLines?.find(g => g.lineNo === invLine.lineNo);

    if (!poLine) {
      exceptions.push({
        ruleId: '3WAY_PO_LINE_MISSING',
        severity: 'critical',
        category: '3way_match',
        message: `PO line ${invLine.lineNo} not found`,
        evidence: { lineNo: invLine.lineNo },
        suggestedResolution: 'Verify invoice line items match PO'
      });
      return;
    }

    // Price validation
    const priceVariance = Math.abs(invLine.unitPrice - poLine.unitPrice) / poLine.unitPrice * 100;
    if (priceVariance > toleranceRules.priceTolerancePercent) {
      exceptions.push({
        ruleId: '3WAY_PRICE_TOL_01',
        severity: 'major',
        category: '3way_match',
        message: `Price exceeds tolerance on line ${invLine.lineNo}`,
        evidence: {
          lineNo: invLine.lineNo,
          invoicePrice: invLine.unitPrice,
          poPrice: poLine.unitPrice,
          tolerancePercent: toleranceRules.priceTolerancePercent,
          variancePercent: priceVariance.toFixed(2)
        },
        suggestedResolution: 'Create debit note for excess price or verify pricing'
      });
    }

    // Quantity validation
    if (grnLine) {
      const qtyVariance = Math.abs(invLine.qty - grnLine.receivedQty) / grnLine.receivedQty * 100;
      if (qtyVariance > toleranceRules.qtyTolerancePercent) {
        exceptions.push({
          ruleId: '3WAY_QTY_TOL_01',
          severity: 'major',
          category: '3way_match',
          message: `Quantity exceeds GRN tolerance on line ${invLine.lineNo}`,
          evidence: {
            lineNo: invLine.lineNo,
            invoiceQty: invLine.qty,
            grnQty: grnLine.receivedQty,
            tolerancePercent: toleranceRules.qtyTolerancePercent,
            variancePercent: qtyVariance.toFixed(2)
          },
          suggestedResolution: 'Confirm partial receipt or update GRN if additional qty received'
        });
      }
    }

    // Material match
    if (invLine.material !== poLine.material) {
      exceptions.push({
        ruleId: '3WAY_MATERIAL_MISMATCH',
        severity: 'major',
        category: '3way_match',
        message: `Material description mismatch on line ${invLine.lineNo}`,
        evidence: {
          lineNo: invLine.lineNo,
          invoiceMaterial: invLine.material,
          poMaterial: poLine.material
        },
        suggestedResolution: 'Verify material codes and descriptions'
      });
    }
  });

  return {
    passed: exceptions.length === 0,
    exceptions
  };
};