import { supabase } from './supabaseClient.js';

const seed = async () => {
  console.log('🌱 Seeding started...');

  await supabase.from('vendor_master').upsert({
    vendor_id: 'VEND-22',
    vendor_name: 'ABC Construction Ltd',
    bank_account: '1234567890',
    ifsc: 'HDFC0001234',
    account_holder_name: 'ABC Construction Limited',
    bank_last_changed_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
    risk_flags: []
  }, { onConflict: 'vendor_id' });

  await supabase.from('purchase_orders').upsert({
    po_id: 'PO-10091',
    vendor_id: 'VEND-22',
    po_json: {
      header: { ceiling: 5200000 },
      lineItems: [{ lineNo: 1, material: 'Cement Bags', qty: 1000, unitPrice: 4500 }]
    }
  }, { onConflict: 'po_id' });

  await supabase.from('grns').upsert({
    grn_id: 'GRN-0091',
    po_id: 'PO-10091',
    grn_json: {
      lineItems: [{ lineNo: 1, material: 'Cement Bags', receivedQty: 980 }]
    }
  }, { onConflict: 'grn_id' });

  await supabase.from('invoices').upsert({
    invoice_id: 'INV-7788',
    vendor_id: 'VEND-22',
    po_id: 'PO-10091',
    grn_id: 'GRN-0091',
    invoice_json: {
      header: { total: 5000000 },
      lineItems: [{ lineNo: 1, material: 'Cement Bags', qty: 1000, unitPrice: 4500 }],
      taxes: { gstAmount: 1260000, tdsAmount: 90000 }
    }
  }, { onConflict: 'invoice_id' });

  await supabase.from('entitlements').upsert({
    entitlement_id: 'ENT-001',
    model_id: 'CPM-001',
    po_id: 'PO-10091',
    invoice_id: 'INV-7788',
    entitlement_json: { netPayable: 3700000 }
  }, { onConflict: 'entitlement_id' });

  console.log('✅ Seeding completed');
  process.exit(0);
};

seed().catch(console.error);
