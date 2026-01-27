import { supabase } from '../db/supabaseClient.js';

export const getEntitlement = async (entitlementId) => {
  const { data, error } = await supabase
    .from('entitlements')
    .select('*')
    .eq('entitlement_id', entitlementId)
    .single();

  if (error) throw new Error(`Entitlement not found: ${error.message}`);
  return data;
};

export const calculateNetPayable = (entitlement) => {
  const ent = entitlement.entitlement_json;
  return ent.netPayable || 0;
};