import { supabase } from '../db/supabaseClient.js';

export const getInvoice = async (invoiceId) => {
  if (!invoiceId) {
    throw new Error('invoiceId is required');
  }

  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('invoice_id', invoiceId);

  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error(`Invoice not found: ${invoiceId}`);
  }
  if (data.length > 1) {
    throw new Error(`Multiple invoices found for ${invoiceId}`);
  }

  return data[0];
};
