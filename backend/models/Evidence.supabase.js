import { supabaseAdmin } from "../config/supabase.js";

export const Evidence = {
  // Create new evidence record
  async create(data) {
    // Prepare insert data
    const insertData = {
      evidence_id: data.evidenceId,
      evidence_type: data.evidenceType,
      file_name: data.fileName,
      file_hash: data.fileHash,
      file_path: data.filePath,
      uploaded_by: data.uploadedBy || "unknown",
      blockchain_tx_hash: data.blockchainTxHash || null,
    };
    
    // Only add current_holder if provided (column might not exist yet)
    if (data.currentHolder) {
      insertData.current_holder = data.currentHolder;
    }
    
    const { data: evidence, error } = await supabaseAdmin
      .from("evidences")
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error("Supabase create error:", error);
      throw error;
    }

    return {
      id: evidence.id.toString(),
      evidenceId: evidence.evidence_id,
      evidenceType: evidence.evidence_type,
      fileName: evidence.file_name,
      fileHash: evidence.file_hash,
      filePath: evidence.file_path,
      uploadedBy: evidence.uploaded_by,
      uploadedAt: evidence.uploaded_at,
      blockchainTxHash: evidence.blockchain_tx_hash,
      currentHolder: evidence.current_holder || evidence.uploaded_by,
    };
  },

  // Get evidence by evidenceId
  async getByEvidenceId(evidenceId) {
    const { data, error } = await supabaseAdmin
      .from("evidences")
      .select("*")
      .eq("evidence_id", evidenceId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // Not found
        return null;
      }
      console.error("Supabase get error:", error);
      throw error;
    }

    if (!data) return null;

    return {
      id: data.id.toString(),
      evidenceId: data.evidence_id,
      evidenceType: data.evidence_type,
      fileName: data.file_name,
      fileHash: data.file_hash,
      filePath: data.file_path,
      uploadedBy: data.uploaded_by,
      uploadedAt: data.uploaded_at,
      blockchainTxHash: data.blockchain_tx_hash,
      currentHolder: data.current_holder || data.uploaded_by, // Fallback if column doesn't exist
    };
  },

  // Check if evidence ID exists
  async exists(evidenceId) {
    const { count, error } = await supabaseAdmin
      .from("evidences")
      .select("*", { count: "exact", head: true })
      .eq("evidence_id", evidenceId);

    if (error) {
      console.error("Supabase exists error:", error);
      throw error;
    }

    return count > 0;
  },

  // Get all evidences
  async getAll() {
    const { data, error } = await supabaseAdmin
      .from("evidences")
      .select("*")
      .order("uploaded_at", { ascending: false });

    if (error) {
      console.error("Supabase getAll error:", error);
      throw error;
    }

    return data.map((item) => ({
      id: item.id.toString(),
      evidenceId: item.evidence_id,
      evidenceType: item.evidence_type,
      fileName: item.file_name,
      fileHash: item.file_hash,
      filePath: item.file_path,
      uploadedBy: item.uploaded_by,
      uploadedAt: item.uploaded_at,
      blockchainTxHash: item.blockchain_tx_hash,
      currentHolder: item.current_holder || item.uploaded_by, // Fallback if column doesn't exist
    }));
  },

  // Update current holder after transfer
  async updateCurrentHolder(evidenceId, newHolder) {
    const { error } = await supabaseAdmin
      .from("evidences")
      .update({ current_holder: newHolder })
      .eq("evidence_id", evidenceId);

    if (error) {
      console.error("Supabase update holder error:", error);
      return false;
    }

    return true;
  },

  // Delete evidence by evidenceId
  async delete(evidenceId) {
    const { error } = await supabaseAdmin
      .from("evidences")
      .delete()
      .eq("evidence_id", evidenceId);

    if (error) {
      console.error("Supabase delete error:", error);
      return false;
    }

    return true;
  },
};
