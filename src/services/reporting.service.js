import { supabase } from '../db/supabaseClient.js';

export const generateReport = async (runId, payload) => {
  const report = {
    runId,
    createdAt: new Date().toISOString(),
    ...payload
  };

  const { error } = await supabase
    .from('validation_reports')
    .upsert({
      run_id: runId,
      report_json: report
    }, { onConflict: 'run_id' });

  if (error) throw error;

  return report;
};

export const getReport = async (runId) => {
  const { data, error } = await supabase
    .from('validation_reports')
    .select('report_json')
    .eq('run_id', runId)
    .single();

  if (error) throw error;

  return data.report_json;
};
