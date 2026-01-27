import { supabase } from '../db/supabaseClient.js';

export const getGRN = async (grnId) => {
  const { data, error } = await supabase
    .from('grns')
    .select('*')
    .eq('grn_id', grnId)
    .single();

  if (error) throw new Error(`GRN not found: ${error.message}`);
  return data;
};