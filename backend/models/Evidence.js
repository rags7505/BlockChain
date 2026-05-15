// Persistent storage using JSON files
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, "../data");
const EVIDENCE_FILE = path.join(DATA_DIR, "evidences.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Load existing data or initialize empty array
let evidences = [];
if (fs.existsSync(EVIDENCE_FILE)) {
  try {
    const data = fs.readFileSync(EVIDENCE_FILE, "utf8");
    evidences = JSON.parse(data);
  } catch (err) {
    console.error("Error loading evidence data:", err);
    evidences = [];
  }
}

// Save data to file
function saveData() {
  try {
    fs.writeFileSync(EVIDENCE_FILE, JSON.stringify(evidences, null, 2), "utf8");
  } catch (err) {
    console.error("Error saving evidence data:", err);
  }
}

export const Evidence = {
  // Create new evidence record
  create(data) {
    const evidence = {
      id: Date.now().toString(),
      evidenceId: data.evidenceId,
      evidenceType: data.evidenceType,
      fileName: data.fileName,
      fileHash: data.fileHash,
      filePath: data.filePath,
      uploadedBy: data.uploadedBy || "unknown",
      uploadedAt: new Date().toISOString(),
      blockchainTxHash: data.blockchainTxHash || null,
    };
    evidences.push(evidence);
    saveData();
    return evidence;
  },

  // Get evidence by evidenceId
  getByEvidenceId(evidenceId) {
    return evidences.find((e) => e.evidenceId === evidenceId);
  },

  // Check if evidence ID exists
  exists(evidenceId) {
    return evidences.some((e) => e.evidenceId === evidenceId);
  },

  // Get all evidences
  getAll() {
    return evidences;
  },

  // Delete evidence by evidenceId
  delete(evidenceId) {
    const index = evidences.findIndex((e) => e.evidenceId === evidenceId);
    if (index !== -1) {
      evidences.splice(index, 1);
      saveData();
      return true;
    }
    return false;
  },
};
