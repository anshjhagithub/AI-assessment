import { supabase } from "../db/supabaseClient.js";

/**
 * Create or update (merge) a validation report.
 * Used both for initial deterministic report
 * and later agentic AI enrichment.
 */
export const generateReport = async (runId, payload) => {
  // 1️⃣ Fetch existing report (if any)
  const { data: existing, error: fetchError } = await supabase
    .from("validation_reports")
    .select("report_json")
    .eq("run_id", runId)
    .single();

  if (fetchError && fetchError.code !== "PGRST116") {
    throw fetchError;
  }

  // 2️⃣ Merge old + new (AI-safe merge)
  const mergedReport = {
    ...(existing?.report_json || {}),
    ...payload
  };

  // 3️⃣ Upsert merged report
  const { error } = await supabase
    .from("validation_reports")
    .upsert({
      run_id: runId,
      report_json: mergedReport
    });

  if (error) {
    throw error;
  }

  return mergedReport;
};

/**
 * Fetch a validation report by runId
 */
export const getReport = async (runId) => {
  const { data, error } = await supabase
    .from("validation_reports")
    .select("report_json")
    .eq("run_id", runId)
    .single();

  if (error) {
    throw error;
  }

  return data.report_json;
};
