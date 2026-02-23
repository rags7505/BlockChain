import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Evidence } from "../models/Evidence.supabase.js";
import { AccessLog } from "../models/AccessLog.supabase.js";
import { supabase } from "../config/supabase.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Storage directories
const STORAGE_BASE = path.resolve(__dirname, "../storage");
const FINGERPRINTS_DIR = path.join(STORAGE_BASE, "fingerprints");
const PDFS_DIR = path.join(STORAGE_BASE, "pdfs");
const IMAGES_DIR = path.join(STORAGE_BASE, "images");
const TEXTS_DIR = path.join(STORAGE_BASE, "texts");

// Ensure directories exist
[FINGERPRINTS_DIR, PDFS_DIR, IMAGES_DIR, TEXTS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

export const uploadEvidence = async (req, res) => {
  try {
    // Validate file
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "File not received",
      });
    }

    // Validate required fields
    const { evidenceId, evidenceType, uploadedBy, blockchainTxHash } = req.body;
    if (!evidenceId) {
      return res.status(400).json({
        success: false,
        error: "evidenceId missing",
      });
    }

    // Check for duplicate evidence ID
    if (await Evidence.exists(evidenceId)) {
      return res.status(400).json({
        success: false,
        error: `Evidence ID "${evidenceId}" already exists in the system. Please use a unique Evidence ID (e.g., ${evidenceId}-NEW or ${evidenceId}-2).`,
        existingId: evidenceId,
        suggestion: `Try: ${evidenceId}-${Date.now().toString().slice(-4)}`
      });
    }

    // Compute SHA-256 hash
    // For text files, hash the text content (not the buffer)
    let hash;
    if (evidenceType === "text" || req.file.mimetype === "text/plain") {
      const text = req.file.buffer.toString('utf8');
      hash = crypto
        .createHash("sha256")
        .update(text)
        .digest("hex");
    } else {
      // For binary files, hash the raw buffer
      hash = crypto
        .createHash("sha256")
        .update(req.file.buffer)
        .digest("hex");
    }

    // Determine storage directory based on evidence type
    let storageDir;
    let fileExtension;
    
    switch (evidenceType) {
      case "fingerprint":
        storageDir = FINGERPRINTS_DIR;
        fileExtension = path.extname(req.file.originalname) || ".jpg";
        break;
      case "pdf":
        storageDir = PDFS_DIR;
        fileExtension = ".pdf";
        break;
      case "text":
        storageDir = TEXTS_DIR;
        fileExtension = ".txt";
        break;
      case "image":
      default:
        storageDir = IMAGES_DIR;
        fileExtension = path.extname(req.file.originalname) || ".jpg";
        break;
    }

    // Create unique filename
    const fileName = `${evidenceId}_${Date.now()}${fileExtension}`;
    const filePath = path.join(storageDir, fileName);

    // Save file to disk
    fs.writeFileSync(filePath, req.file.buffer);

    // Store evidence metadata
    const evidence = await Evidence.create({
      evidenceId,
      evidenceType: evidenceType || "image",
      fileName: req.file.originalname,
      fileHash: hash,
      filePath,
      uploadedBy: uploadedBy || "unknown",
      currentHolder: uploadedBy || "unknown", // Set currentHolder to uploader initially
      blockchainTxHash: blockchainTxHash || null, // Store the blockchain transaction hash
    });

    // Log the upload action
    await AccessLog.create({
      evidenceId,
      accessedBy: uploadedBy || "unknown",
      action: "uploaded",
    });

    // Send response
    return res.status(200).json({
      success: true,
      data: {
        hash,
        evidenceId,
        fileName: req.file.originalname,
      },
    });
  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

export const getAllEvidence = async (req, res) => {
  try {
    const { userRole, userId } = req.query;
    const evidences = await Evidence.getAll();
    
    console.log(`🔍 getAllEvidence - Role: ${userRole}, UserId: ${userId}, Total Evidence: ${evidences.length}`);
    
    // If no role specified, return all
    if (!userRole || !userId) {
      console.log(`⚠️ No role/userId provided, returning all evidence`);
      return res.status(200).json({
        success: true,
        data: evidences,
      });
    }
    
    // Apply role-based filtering
    let filteredEvidences = evidences;
    const userIdLower = userId.toLowerCase();
    
    switch (userRole.toLowerCase()) {
      case 'superadmin':
      case 'judge':
      case 'admin':
      case 'viewer':
      case 'investigator':
        // These roles see everything
        console.log(`✅ ${userRole} sees all ${evidences.length} evidence items`);
        filteredEvidences = evidences;
        break;
      
      default:
        // Unknown role - show only their own uploads
        filteredEvidences = evidences.filter(evidence => {
          const uploadedByLower = (evidence.uploadedBy || '').toLowerCase();
          return uploadedByLower === userIdLower || uploadedByLower.includes(userIdLower);
        });
        break;
    }
    
    return res.status(200).json({
      success: true,
      data: filteredEvidences,
    });
  } catch (err) {
    console.error("GET ALL ERROR:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to retrieve evidence",
    });
  }
};

export const getEvidenceById = async (req, res) => {
  try {
    const { evidenceId } = req.params;
    const evidence = await Evidence.getByEvidenceId(evidenceId);

    if (!evidence) {
      return res.status(404).json({
        success: false,
        error: "Evidence not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: evidence,
    });
  } catch (err) {
    console.error("GET EVIDENCE ERROR:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to retrieve evidence",
    });
  }
};

export const viewEvidence = async (req, res) => {
  try {
    const { evidenceId } = req.params;
    const { viewedBy } = req.query;

    const evidence = await Evidence.getByEvidenceId(evidenceId);

    if (!evidence) {
      return res.status(404).json({
        success: false,
        error: "Evidence not found",
      });
    }

    // Log the view action
    await AccessLog.create({
      evidenceId,
      accessedBy: viewedBy || "unknown",
      action: "viewed",
    });

    // Check if file exists
    if (!fs.existsSync(evidence.filePath)) {
      return res.status(404).json({
        success: false,
        error: "File not found on disk",
      });
    }

    // Send file
    return res.sendFile(evidence.filePath);
  } catch (err) {
    console.error("VIEW ERROR:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to view evidence",
    });
  }
};

export const getAccessLogs = async (req, res) => {
  try {
    const { evidenceId } = req.params;

    if (evidenceId) {
      const logs = await AccessLog.getByEvidenceId(evidenceId);
      return res.status(200).json({
        success: true,
        data: logs,
      });
    } else {
      const logs = await AccessLog.getAll();
      return res.status(200).json({
        success: true,
        data: logs,
      });
    }
  } catch (err) {
    console.error("GET LOGS ERROR:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to retrieve access logs",
    });
  }
};

export const deleteEvidence = async (req, res) => {
  try {
    const { evidenceId } = req.params;
    const { deletedBy, userRole } = req.body;

    // ONLY SUPERADMIN CAN DELETE (Judge cannot delete)
    if (userRole !== 'superadmin') {
      return res.status(403).json({
        success: false,
        error: 'Only superadmin can delete evidence. Judge does not have delete permission.',
      });
    }

    // Check if evidence exists
    const evidence = await Evidence.getByEvidenceId(evidenceId);
    if (!evidence) {
      return res.status(404).json({
        success: false,
        error: `Evidence "${evidenceId}" not found in the system.`,
      });
    }

    // Delete the physical file
    try {
      if (fs.existsSync(evidence.filePath)) {
        fs.unlinkSync(evidence.filePath);
      }
    } catch (fileErr) {
      console.error('Error deleting file:', fileErr);
      // Continue even if file deletion fails
    }

    // Delete all access logs for this evidence
    const deletedLogsCount = await AccessLog.deleteByEvidenceId(evidenceId);
    console.log(`Deleted ${deletedLogsCount} access logs for evidence ${evidenceId}`);

    // Delete from database
    const deleted = await Evidence.delete(evidenceId);
    
    if (!deleted) {
      return res.status(500).json({
        success: false,
        error: 'Failed to delete evidence from database',
      });
    }

    return res.status(200).json({
      success: true,
      message: `Evidence "${evidenceId}" has been permanently deleted.`,
      deletedEvidence: {
        evidenceId: evidence.evidenceId,
        fileName: evidence.fileName,
        evidenceType: evidence.evidenceType,
      }
    });
  } catch (error) {
    console.error('DELETE EVIDENCE ERROR:', error);
    return res.status(500).json({
      success: false,
      error: 'An error occurred while deleting evidence',
    });
  }
};

export const transferCustody = async (req, res) => {
  try {
    const { evidenceId, newHolder, transferredBy, transactionHash, newHolderRole } = req.body;

    if (!evidenceId || !newHolder || !transferredBy) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: evidenceId, newHolder, transferredBy',
      });
    }

    // Validate role - cannot assign admin or superadmin
    if (newHolderRole && ['admin', 'superadmin'].includes(newHolderRole.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: 'Cannot transfer with admin or superadmin role. They already have full access.',
      });
    }

    // If a role is specified, update the user's role
    if (newHolderRole) {
      const { error: roleError } = await supabase
        .from('users')
        .update({ role: newHolderRole })
        .eq('wallet_address', newHolder.toLowerCase());

      if (roleError) {
        console.error('Error updating user role:', roleError);
        // Don't fail the transfer, just log it
      }
    }

    // Check evidence exists
    const evidence = await Evidence.getByEvidenceId(evidenceId);
    if (!evidence) {
      return res.status(404).json({
        success: false,
        error: 'Evidence not found',
      });
    }

    // Auto-register the new holder if they don't exist, or update their role
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', newHolder.toLowerCase())
      .single();

    const roleToAssign = newHolderRole || 'viewer'; // Default to viewer if no role specified
    let addedBy = transferredBy; // Track who added this user

    if (!existingUser) {
      // Automatically add new wallet with specified role
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          wallet_address: newHolder.toLowerCase(),
          role: roleToAssign,
          display_name: `User ${newHolder.slice(0, 6)}...${newHolder.slice(-4)}`,
          added_by: transferredBy, // Track who added this user
        });

      if (insertError) {
        console.error('Error auto-registering wallet:', insertError);
        // Continue anyway - they can still own evidence on blockchain
      } else {
        console.log(`✅ Auto-registered wallet ${newHolder} as ${roleToAssign} (added by ${transferredBy})`);
      }
    } else {
      // Update existing user's role if a role was specified
      if (newHolderRole && existingUser.role !== roleToAssign) {
        const { error: updateError } = await supabase
          .from('users')
          .update({ role: roleToAssign, added_by: transferredBy })
          .eq('wallet_address', newHolder.toLowerCase());

        if (updateError) {
          console.error('Error updating user role:', updateError);
        } else {
          console.log(`✅ Updated wallet ${newHolder} role to ${roleToAssign} (by ${transferredBy})`);
        }
      }
    }

    // Update current holder in evidence table
    // If transferring to investigator: new holder takes full control
    // If transferring to viewer: viewer can view, but original retains some access
    await Evidence.updateCurrentHolder(evidenceId, newHolder);

    // Log the custody transfer with detailed metadata
    await AccessLog.create({
      evidenceId,
      accessedBy: transferredBy,
      action: `TRANSFER_TO_${roleToAssign.toUpperCase()}`,
      metadata: JSON.stringify({ 
        newHolder, 
        newHolderRole: roleToAssign,
        transactionHash,
        transferType: roleToAssign === 'investigator' ? 'full_custody' : 'view_only'
      }),
    });

    return res.status(200).json({
      success: true,
      message: `Custody transferred to ${newHolder} with role: ${roleToAssign}`,
      transferType: roleToAssign === 'investigator' ? 'full_custody' : 'view_only',
    });
  } catch (error) {
    console.error('TRANSFER CUSTODY ERROR:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to record custody transfer',
    });
  }
};

export const verifyIntegrity = async (req, res) => {
  try {
    const { evidenceId } = req.params;

    const evidence = await Evidence.getByEvidenceId(evidenceId);
    if (!evidence) {
      return res.status(404).json({
        success: false,
        error: 'Evidence not found',
      });
    }

    // Recompute hash from stored file
    const currentHash = crypto
      .createHash('sha256')
      .update(fs.readFileSync(evidence.filePath))
      .digest('hex');

    const isIntact = currentHash === evidence.fileHash;

    return res.status(200).json({
      success: true,
      intact: isIntact,
      storedHash: evidence.fileHash,
      currentHash,
      message: isIntact ? 'Evidence integrity verified' : '⚠️ WARNING: File has been tampered with!',
    });
  } catch (error) {
    console.error('VERIFY INTEGRITY ERROR:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to verify integrity',
    });
  }
};
