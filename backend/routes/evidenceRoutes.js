import express from "express";
import multer from "multer";
import {
  uploadEvidence,
  getAllEvidence,
  getEvidenceById,
  viewEvidence,
  getAccessLogs,
  deleteEvidence,
  transferCustody,
  verifyIntegrity,
} from "../controllers/evidenceController.js";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Upload evidence
router.post("/upload", upload.single("file"), uploadEvidence);

// Get all evidences
router.get("/", getAllEvidence);

// Get specific evidence by ID
router.get("/:evidenceId", getEvidenceById);

// View evidence file
router.get("/:evidenceId/view", viewEvidence);

// Get access logs
router.get("/:evidenceId/logs", getAccessLogs);

// Get all access logs
router.get("/logs/all", getAccessLogs);

// Transfer custody
router.post("/:evidenceId/transfer", transferCustody);

// Verify integrity
router.get("/:evidenceId/verify-integrity", verifyIntegrity);

// Delete evidence (superadmin only)
router.delete("/:evidenceId", deleteEvidence);

export default router;
