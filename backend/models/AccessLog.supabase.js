import { supabaseAdmin } from "../config/supabase.js";

export const AccessLog = {
  // Create a new access log entry
  async create(data) {
    const logEntry = {
      evidence_id: data.evidenceId,
      accessed_by: data.accessedBy || data.username || 'unknown',
      action: data.action || "viewed",
    };

    const { data: log, error } = await supabaseAdmin
      .from("access_logs")
      .insert([logEntry])
      .select()
      .single();

    if (error) {
      console.error("Supabase create log error:", error);
      throw error;
    }

    return {
      id: log.id.toString(),
      evidenceId: log.evidence_id,
      accessedBy: log.accessed_by,
      accessedAt: log.accessed_at,
      action: log.action,
    };
  },

  // Get all access logs for a specific evidence
  async getByEvidenceId(evidenceId) {
    const { data, error } = await supabaseAdmin
      .from("access_logs")
      .select("*")
      .eq("evidence_id", evidenceId)
      .order("accessed_at", { ascending: false });

    if (error) {
      console.error("Supabase get logs error:", error);
      throw error;
    }

    return data.map((log) => ({
      id: log.id.toString(),
      evidenceId: log.evidence_id,
      accessedBy: log.accessed_by,
      accessedAt: log.accessed_at,
      action: log.action,
    }));
  },

  // Get all access logs
  async getAll() {
    const { data, error } = await supabaseAdmin
      .from("access_logs")
      .select("*")
      .order("accessed_at", { ascending: false });

    if (error) {
      console.error("Supabase getAll logs error:", error);
      throw error;
    }

    return data.map((log) => ({
      id: log.id.toString(),
      evidenceId: log.evidence_id,
      accessedBy: log.accessed_by,
      accessedAt: log.accessed_at,
      action: log.action,
    }));
  },

  // Delete all access logs for a specific evidence
  async deleteByEvidenceId(evidenceId) {
    const { error, count } = await supabaseAdmin
      .from("access_logs")
      .delete({ count: "exact" })
      .eq("evidence_id", evidenceId);

    if (error) {
      console.error("Supabase delete logs error:", error);
      return 0;
    }

    return count || 0;
  },
};
