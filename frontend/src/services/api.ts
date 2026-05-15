import axios from "axios";

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

interface UploadEvidencePayload {
  evidenceId: string;
  evidenceType: string;
  file: File;
  uploadedBy?: string;
  blockchainTxHash?: string;
}

interface Evidence {
  id: string;
  evidenceId: string;
  evidenceType: string;
  fileName: string;
  fileHash: string;
  filePath: string;
  uploadedBy: string;
  uploadedAt: string;
  blockchainTxHash: string | null;
}

interface AccessLog {
  id: string;
  evidenceId: string;
  accessedBy: string;
  accessedAt: string;
  action: string;
}

export const evidenceApi = {
  uploadEvidence: async (payload: UploadEvidencePayload) => {
    const formData = new FormData();
    formData.append("evidenceId", payload.evidenceId);
    formData.append("evidenceType", payload.evidenceType);
    formData.append("file", payload.file);
    formData.append("uploadedBy", payload.uploadedBy || "unknown");
    if (payload.blockchainTxHash) {
      formData.append("blockchainTxHash", payload.blockchainTxHash);
    }

    try {
      const res = await axios.post(
        `${BASE_URL}/api/evidence/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return res.data;
    } catch (error: any) {
      // Handle axios error and extract backend error message
      if (error.response && error.response.data) {
        const errorData = error.response.data;
        // Throw error with backend message so it can be caught and displayed
        throw new Error(errorData.error || 'Upload failed');
      }
      throw new Error('Network error occurred during upload');
    }
  },

  getAllEvidence: async (userRole?: string, userId?: string): Promise<{ success: boolean; data: Evidence[] }> => {
    let url = `${BASE_URL}/api/evidence`;
    const params = new URLSearchParams();
    if (userRole) params.append('userRole', userRole);
    if (userId) params.append('userId', userId);
    if (params.toString()) url += `?${params.toString()}`;
    
    const res = await axios.get(url);
    return res.data;
  },

  getEvidenceById: async (evidenceId: string): Promise<{ success: boolean; data: Evidence }> => {
    const res = await axios.get(`${BASE_URL}/api/evidence/${evidenceId}`);
    return res.data;
  },

  getEvidenceByEvidenceId: async (evidenceId: string): Promise<{ success: boolean; data: Evidence | null }> => {
    try {
      const res = await axios.get(`${BASE_URL}/api/evidence/${evidenceId}`);
      return res.data;
    } catch (error) {
      return { success: false, data: null };
    }
  },

  viewEvidence: (evidenceId: string, viewedBy: string = "unknown") => {
    return `${BASE_URL}/api/evidence/${evidenceId}/view?viewedBy=${encodeURIComponent(viewedBy)}`;
  },

  getAccessLogs: async (evidenceId?: string): Promise<{ success: boolean; data: AccessLog[] }> => {
    const url = evidenceId 
      ? `${BASE_URL}/api/evidence/${evidenceId}/logs`
      : `${BASE_URL}/api/evidence/logs/all`;
    const res = await axios.get(url);
    return res.data;
  },

  deleteEvidence: async (evidenceId: string, deletedBy: string, userRole?: string): Promise<{ success: boolean; message: string }> => {
    const res = await axios.delete(`${BASE_URL}/api/evidence/${evidenceId}`, {
      data: { deletedBy, userRole }
    });
    return res.data;
  },

  transferCustody: async (
    evidenceId: string, 
    newHolder: string, 
    transferredBy: string, 
    transactionHash: string,
    newHolderRole?: string
  ): Promise<{ success: boolean; message: string }> => {
    const res = await axios.post(`${BASE_URL}/api/evidence/${evidenceId}/transfer`, {
      evidenceId,
      newHolder,
      transferredBy,
      transactionHash,
      newHolderRole,
    });
    return res.data;
  },

  verifyIntegrity: async (evidenceId: string): Promise<{ 
    success: boolean; 
    intact: boolean; 
    storedHash: string; 
    currentHash: string; 
    message: string 
  }> => {
    const res = await axios.get(`${BASE_URL}/api/evidence/${evidenceId}/verify-integrity`);
    return res.data;
  },
};
