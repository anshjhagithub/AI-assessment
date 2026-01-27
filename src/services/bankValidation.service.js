import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const bankRules = JSON.parse(
  readFileSync(join(__dirname, '../rules/bank.rules.json'), 'utf-8')
);

const calculateStringSimilarity = (str1, str2) => {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1;
  
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1;
  
  const editDistance = (s1, s2) => {
    const costs = [];
    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
  };
  
  return (longer.length - editDistance(longer, shorter)) / longer.length;
};

export const validateBankDetails = (vendor, invoice) => {
  const exceptions = [];

  // IFSC validation
  const ifscRegex = new RegExp(bankRules.ifscPattern);
  if (!ifscRegex.test(vendor.ifsc)) {
    exceptions.push({
      ruleId: 'BANK_IFSC_INVALID',
      severity: 'critical',
      category: 'bank',
      message: 'Invalid IFSC code format',
      evidence: {
        ifsc: vendor.ifsc,
        expectedPattern: bankRules.ifscPattern
      },
      suggestedResolution: 'Verify and correct IFSC code'
    });
  }

  // Account holder name match
  const similarity = calculateStringSimilarity(
    vendor.account_holder_name,
    vendor.vendor_name
  );

  if (similarity < bankRules.minNameMatchScore) {
    exceptions.push({
      ruleId: 'BANK_NAME_MISMATCH',
      severity: 'major',
      category: 'bank',
      message: 'Account holder name does not match vendor name',
      evidence: {
        vendorName: vendor.vendor_name,
        accountHolderName: vendor.account_holder_name,
        matchScore: similarity.toFixed(2),
        threshold: bankRules.minNameMatchScore
      },
      suggestedResolution: 'Verify account holder name or update vendor master'
    });
  }

  // Bank change risk
  if (vendor.bank_last_changed_at) {
    const changeDate = new Date(vendor.bank_last_changed_at);
    const daysSinceChange = (Date.now() - changeDate.getTime()) / (1000 * 60 * 60 * 24);
    const invoiceAmount = invoice.invoice_json.header.total;

    if (daysSinceChange <= bankRules.bankChangeLookbackDays && 
        invoiceAmount >= bankRules.highValueThreshold) {
      exceptions.push({
        ruleId: 'BANK_RECENT_CHANGE_HIGH_VALUE',
        severity: 'major',
        category: 'bank',
        message: 'Bank details changed recently for high-value transaction',
        evidence: {
          daysSinceChange: Math.floor(daysSinceChange),
          invoiceAmount: invoiceAmount,
          threshold: bankRules.highValueThreshold,
          bankChangedAt: vendor.bank_last_changed_at
        },
        suggestedResolution: 'Initiate vendor callback verification'
      });
    }
  }

  return {
    passed: exceptions.length === 0,
    exceptions
  };
};