import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Evidence } from "../models/Evidence.supabase.js";
import { AccessLog } from "../models/AccessLog.supabase.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const METRICS_FILE = path.resolve(__dirname, "../data/metrics.json");
const EVIDENCE_DATA_FILE = path.resolve(__dirname, "../data/evidences.json");
const ACCESS_LOG_DATA_FILE = path.resolve(__dirname, "../data/accessLogs.json");
const DEPLOYMENT_INFO_FILE = path.resolve(
  __dirname,
  "../../blockchain/deployment-info.json"
);

function readJsonFile(filePath, fallbackValue) {
  if (!fs.existsSync(filePath)) {
    return fallbackValue;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    console.error(`Failed to read ${filePath}:`, error);
    return fallbackValue;
  }
}

function writeJsonFile(filePath, value) {
  const directory = path.dirname(filePath);
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }

  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

function readMetricSnapshots() {
  const snapshots = readJsonFile(METRICS_FILE, []);
  return Array.isArray(snapshots) ? snapshots : [];
}

function normalizeEvidenceRecord(record) {
  return {
    id: record.id?.toString?.() || String(record.id || record.evidenceId || Date.now()),
    evidenceId: record.evidenceId || record.evidence_id,
    evidenceType: record.evidenceType || record.evidence_type,
    fileName: record.fileName || record.file_name,
    fileHash: record.fileHash || record.file_hash,
    filePath: record.filePath || record.file_path,
    uploadedBy: record.uploadedBy || record.uploaded_by,
    uploadedAt: record.uploadedAt || record.uploaded_at,
    blockchainTxHash: record.blockchainTxHash || record.blockchain_tx_hash || null,
    currentHolder: record.currentHolder || record.current_holder || record.uploaded_by,
  };
}

function normalizeAccessLogRecord(record) {
  return {
    id: record.id?.toString?.() || String(record.id || Date.now()),
    evidenceId: record.evidenceId || record.evidence_id,
    accessedBy: record.accessedBy || record.accessed_by,
    accessedAt: record.accessedAt || record.accessed_at,
    action: record.action,
  };
}

function toBigInt(value) {
  if (value === undefined || value === null || value === "") {
    return 0n;
  }

  try {
    return BigInt(value);
  } catch {
    return 0n;
  }
}

function average(numbers) {
  if (!numbers.length) {
    return 0;
  }

  return numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
}

function formatWeiToEthString(weiValue) {
  const etherBase = 10n ** 18n;
  const whole = weiValue / etherBase;
  const fraction = weiValue % etherBase;

  if (fraction === 0n) {
    return whole.toString();
  }

  const fractionText = fraction.toString().padStart(18, "0").replace(/0+$/, "");
  return `${whole.toString()}.${fractionText}`;
}

function safeStatSize(filePath) {
  try {
    return fs.statSync(filePath).size;
  } catch {
    return 0;
  }
}

function findUploadLatencySamples(evidences, logs) {
  return evidences
    .map((evidence) => {
      const uploadLog = logs.find(
        (log) =>
          log.evidenceId === evidence.evidenceId &&
          String(log.action || "").toLowerCase() === "uploaded"
      );

      if (!uploadLog || !evidence.uploadedAt) {
        return null;
      }

      const evidenceTime = new Date(evidence.uploadedAt).getTime();
      const logTime = new Date(uploadLog.accessedAt).getTime();

      if (Number.isNaN(evidenceTime) || Number.isNaN(logTime)) {
        return null;
      }

      return Math.max(0, Math.abs(logTime - evidenceTime));
    })
    .filter((value) => typeof value === "number");
}

export function appendMetricSnapshot(snapshot) {
  const snapshots = readMetricSnapshots();
  snapshots.push({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    recordedAt: new Date().toISOString(),
    ...snapshot,
  });

  writeJsonFile(METRICS_FILE, snapshots);
  return snapshot;
}

export async function getMetricsSummary() {
  let evidences = [];
  let accessLogs = [];

  try {
    evidences = await Evidence.getAll();
  } catch (error) {
    console.warn("Falling back to backend/data/evidences.json for metrics:", error?.message || error);
    evidences = readJsonFile(EVIDENCE_DATA_FILE, []).map(normalizeEvidenceRecord);
  }

  try {
    accessLogs = await AccessLog.getAll();
  } catch (error) {
    console.warn("Falling back to backend/data/accessLogs.json for metrics:", error?.message || error);
    accessLogs = readJsonFile(ACCESS_LOG_DATA_FILE, []).map(normalizeAccessLogRecord);
  }

  const metricSnapshots = readMetricSnapshots();
  const deploymentInfo = readJsonFile(DEPLOYMENT_INFO_FILE, {});

  const writeSnapshots = metricSnapshots.filter((snapshot) =>
    ["upload", "transfer", "delete"].includes(snapshot.operation)
  );

  const integritySnapshots = metricSnapshots.filter(
    (snapshot) => snapshot.operation === "integrity_check"
  );

  const writeTimestamps = writeSnapshots
    .map((snapshot) => new Date(snapshot.recordedAt || snapshot.timestamp || 0).getTime())
    .filter((timestamp) => !Number.isNaN(timestamp));

  const timeWindowMs =
    writeTimestamps.length > 1
      ? Math.max(...writeTimestamps) - Math.min(...writeTimestamps)
      : 1000;

  const tps = writeSnapshots.length / Math.max(timeWindowMs / 1000, 1);

  const latencySamples = writeSnapshots
    .map((snapshot) =>
      Number(snapshot.blockchainConfirmationMs || snapshot.processingMs || 0)
    )
    .filter((value) => value > 0);

  const gasCostSamplesWei = writeSnapshots
    .map((snapshot) => {
      const gasUsed = toBigInt(snapshot.gasUsed);
      const gasPriceWei = toBigInt(snapshot.gasPriceWei || snapshot.gasPrice);

      if (gasUsed === 0n || gasPriceWei === 0n) {
        return 0n;
      }

      return gasUsed * gasPriceWei;
    })
    .filter((value) => value > 0n);

  const storageBytes = evidences.reduce((total, evidence) => {
    const size = safeStatSize(evidence.filePath);
    return total + size;
  }, 0);

  const onChainBytesEstimate = evidences.length * 96;
  const totalStorageBytes = storageBytes + onChainBytesEstimate;

  const uploadLatencySamples = findUploadLatencySamples(evidences, accessLogs);
  const tamperChecks = integritySnapshots.length;
  const tamperedChecks = integritySnapshots.filter(
    (snapshot) => snapshot.tampered === true
  ).length;
  const falseNegativeChecks = integritySnapshots.filter(
    (snapshot) => snapshot.tampered === false && snapshot.expectedTamper === true
  ).length;

  const validatorCount = Array.isArray(deploymentInfo.accounts)
    ? deploymentInfo.accounts.length
    : 0;
  const byzantineTolerance = validatorCount > 0 ? Math.floor((validatorCount - 1) / 3) : 0;

  const averageGasEth = gasCostSamplesWei.length
    ? formatWeiToEthString(
        gasCostSamplesWei.reduce((sum, value) => sum + value, 0n) /
          BigInt(gasCostSamplesWei.length)
      )
    : "0";

  const rows = [
    {
      metric: "TPS",
      formula: "write transactions / active window (seconds)",
      value: tps.toFixed(4),
      unit: "tx/s",
    },
    {
      metric: "Latency",
      formula: "average(blockchain confirmation or processing time)",
      value: average(latencySamples.length ? latencySamples : uploadLatencySamples).toFixed(2),
      unit: "ms",
    },
    {
      metric: "Gas Cost",
      formula: "average(gasUsed × gasPrice)",
      value: averageGasEth,
      unit: "ETH",
    },
    {
      metric: "Storage",
      formula: "off-chain file bytes + on-chain metadata estimate",
      value: totalStorageBytes.toLocaleString(),
      unit: "bytes",
    },
    {
      metric: "Tamper Detection",
      formula: "tampered detections / integrity checks",
      value: tamperChecks
        ? `${((tamperedChecks / tamperChecks) * 100).toFixed(2)}%`
        : "0.00%",
      unit: "rate",
    },
    {
      metric: "Byzantine Tolerance",
      formula: "floor((validatorCount - 1) / 3)",
      value: byzantineTolerance.toString(),
      unit: "faulty nodes",
    },
    {
      metric: "False Negative",
      formula: "missed tamper detections / tampered cases",
      value: tamperChecks
        ? `${((falseNegativeChecks / Math.max(tamperChecks, 1)) * 100).toFixed(2)}%`
        : "0.00%",
      unit: "rate",
    },
    {
      metric: "Recovery Time",
      formula: "average(ms to quarantine after tamper detection)",
      value: average(
        integritySnapshots
          .filter((snapshot) => snapshot.tampered === true)
          .map((snapshot) => Number(snapshot.recoveryTimeMs || snapshot.durationMs || 0))
      ).toFixed(2),
      unit: "ms",
    },
  ];

  return {
    success: true,
    data: {
      generatedAt: new Date().toISOString(),
      totals: {
        evidences: evidences.length,
        accessLogs: accessLogs.length,
        metricSnapshots: metricSnapshots.length,
      },
      rows,
      raw: {
        evidences,
        accessLogs,
        metricSnapshots,
      },
      notes: {
        uploadLatencySamples,
      },
    },
  };
}