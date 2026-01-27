import { supabase } from '../db/supabaseClient.js';

export const getPO = async (poId) => {
  const { data, error } = await supabase
    .from('purchase_orders')
    .select('*')
    .eq('po_id', poId)
    .single();

  if (error) throw new Error(`PO not found: ${error.message}`);
  return data;
};

export const getPOTolerance = (po) => {
  return {
    priceTolerancePercent: po.po_json.terms?.priceTolerancePercent || 2,
    qtyTolerancePercent: po.po_json.terms?.qtyTolerancePercent || 5
  };
};