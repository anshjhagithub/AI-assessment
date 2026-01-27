import { supabase } from '../db/supabaseClient.js';

export const getVendor = async (vendorId) => {
  const { data, error } = await supabase
    .from('vendor_master')
    .select('*')
    .eq('vendor_id', vendorId)
    .single();

  if (error) throw new Error(`Vendor not found: ${error.message}`);
  return data;
};