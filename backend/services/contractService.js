import { Contract } from "ethers";
import { wallet } from "../config/blockchain.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load ABI safely using fs
const abiPath = path.resolve(
  __dirname,
  "../../blockchain/artifacts/contracts/ChainOfCustody.sol/ChainOfCustody.json"
);

const contractJson = JSON.parse(fs.readFileSync(abiPath, "utf8"));

const contractAddress = process.env.CONTRACT_ADDRESS;

const contract = new Contract(
  contractAddress,
  contractJson.abi,
  wallet
);

export async function registerEvidence(evidenceId, evidenceHash) {
  const tx = await contract.registerEvidence(evidenceId, evidenceHash);
  await tx.wait();
  return tx.hash;
}

export async function transferCustody(evidenceId, newHolder) {
  const tx = await contract.transferCustody(evidenceId, newHolder);
  await tx.wait();
  return tx.hash;
}

export async function getEvidence(evidenceId) {
  const evidence = await contract.getEvidence(evidenceId);
  return {
    evidenceHash: evidence[0],
    currentHolder: evidence[1],
    createdAt: Number(evidence[2]),
    state: Number(evidence[3]), // 0: Active, 1: Sealed, 2: Archived, 3: UnderReview
  };
}

// New enhanced functions

export async function updateEvidenceState(evidenceId, newState) {
  const tx = await contract.updateEvidenceState(evidenceId, newState);
  await tx.wait();
  return tx.hash;
}

export async function getCustodyHistory(evidenceId) {
  const history = await contract.getCustodyHistory(evidenceId);
  return history.map(log => ({
    handler: log.handler,
    timestamp: Number(log.timestamp),
    action: log.action
  }));
}

export async function getAllEvidenceByHolder(holderAddress) {
  const evidenceIds = await contract.getAllEvidenceByHolder(holderAddress);
  return evidenceIds;
}

export async function logCustomAction(evidenceId, action) {
  const tx = await contract.logCustomAction(evidenceId, action);
  await tx.wait();
  return tx.hash;
}

// Helper to convert state number to string
export function getStateString(stateNum) {
  const states = ['Active', 'Sealed', 'Archived', 'UnderReview'];
  return states[stateNum] || 'Unknown';
}
