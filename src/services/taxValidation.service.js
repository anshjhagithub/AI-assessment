import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const taxRules = JSON.parse(
  readFileSync(join(__dirname, '../rules/tax.rules.json'), 'utf-8')
);

export const validateTax = (invoice) => {
  const exceptions = [];
  const { lineItems, taxes } = invoice.invoice_json;

  // Calculate expected GST
  let expectedGST = 0;
  let taxableAmount = 0;

  lineItems.forEach(item => {
    const lineTotal = item.qty * item.unitPrice;
    taxableAmount += lineTotal;
    expectedGST += (lineTotal * item.gstRate) / 100;

    // Check HSN presence
    if (taxRules.requireHSN && !item.hsn) {
      exceptions.push({
        ruleId: 'TAX_HSN_MISSING',
        severity: 'major',
        category: 'tax',
        message: `HSN code missing on line ${item.lineNo}`,
        evidence: {
          lineNo: item.lineNo,
          material: item.material
        },
        suggestedResolution: 'Add valid HSN/SAC code to invoice line'
      });
    }

    // Validate GST rate
    if (!taxRules.gstRates.includes(item.gstRate)) {
      exceptions.push({
        ruleId: 'TAX_GST_RATE_INVALID',
        severity: 'major',
        category: 'tax',
        message: `Invalid GST rate ${item.gstRate}% on line ${item.lineNo}`,
        evidence: {
          lineNo: item.lineNo,
          gstRate: item.gstRate,
          validRates: taxRules.gstRates
        },
        suggestedResolution: 'Correct GST rate according to HSN classification'
      });
    }
  });

  // GST amount validation
  const gstVariance = Math.abs(expectedGST - taxes.gstAmount) / expectedGST * 100;
  if (gstVariance > taxRules.gstTolerancePercent) {
    exceptions.push({
      ruleId: 'TAX_GST_AMOUNT_MISMATCH',
      severity: 'major',
      category: 'tax',
      message: 'GST amount calculation mismatch',
      evidence: {
        expectedGST: Math.round(expectedGST),
        actualGST: taxes.gstAmount,
        tolerancePercent: taxRules.gstTolerancePercent,
        variancePercent: gstVariance.toFixed(2)
      },
      suggestedResolution: 'Recalculate GST based on taxable amount and rates'
    });
  }

  // TDS validation
  const expectedTDS = (taxableAmount * taxRules.tdsRatePercent) / 100;
  const tdsVariance = Math.abs(expectedTDS - taxes.tdsAmount) / expectedTDS * 100;
  if (tdsVariance > taxRules.gstTolerancePercent) {
    exceptions.push({
      ruleId: 'TAX_TDS_AMOUNT_MISMATCH',
      severity: 'minor',
      category: 'tax',
      message: 'TDS amount calculation mismatch',
      evidence: {
        expectedTDS: Math.round(expectedTDS),
        actualTDS: taxes.tdsAmount,
        tdsRate: taxRules.tdsRatePercent,
        variancePercent: tdsVariance.toFixed(2)
      },
      suggestedResolution: 'Verify TDS rate and calculation'
    });
  }

  return {
    passed: exceptions.length === 0,
    exceptions,
    calculatedGST: Math.round(expectedGST),
    calculatedTDS: Math.round(expectedTDS)
  };
};