// Persistent storage using JSON files
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, "../data");
const LOGS_FILE = path.join(DATA_DIR, "accessLogs.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Load existing data or initialize empty array
let accessLogs = [];
if (fs.existsSync(LOGS_FILE)) {
  try {
    const data = fs.readFileSync(LOGS_FILE, "utf8");
    accessLogs = JSON.parse(data);
  } catch (err) {
    console.error("Error loading access logs:", err);
    accessLogs = [];
  }
}

// Save data to file
function saveData() {
  try {
    fs.writeFileSync(LOGS_FILE, JSON.stringify(accessLogs, null, 2), "utf8");
  } catch (err) {
    console.error("Error saving access logs:", err);
  }
}

export const AccessLog = {
  // Create a new access log entry
  create(data) {
    const log = {
      id: Date.now().toString(),
      evidenceId: data.evidenceId,
      accessedBy: data.accessedBy,
      accessedAt: new Date().toISOString(),
      action: data.action || "viewed", // viewed, uploaded, verified
    };
    accessLogs.push(log);
    saveData();
    return log;
  },

  // Get all access logs for a specific evidence
  getByEvidenceId(evidenceId) {
    return accessLogs.filter((log) => log.evidenceId === evidenceId);
  },

  // Get all access logs
  getAll() {
    return accessLogs;
  },

  // Delete all access logs for a specific evidence
  deleteByEvidenceId(evidenceId) {
    const initialLength = accessLogs.length;
    accessLogs = accessLogs.filter((log) => log.evidenceId !== evidenceId);
    const deletedCount = initialLength - accessLogs.length;
    if (deletedCount > 0) {
      saveData();
    }
    return deletedCount;
  },
};
