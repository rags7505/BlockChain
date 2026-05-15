import { ethers } from "ethers";
import contractJson from "../abi/Evidence.json";

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
const abi = contractJson.abi;

declare global {
  interface Window {
    ethereum?: any;
  }
}

// Helper function to detect MetaMask with proper waiting
const detectEthereumProvider = async (timeout = 3000): Promise<any> => {
  // If already available, return immediately
  if (window.ethereum) {
    return window.ethereum;
  }

  // Wait for ethereum#initialized event or timeout
  return new Promise((resolve, reject) => {
    let handled = false;

    const handleInitialized = () => {
      if (!handled) {
        handled = true;
        resolve(window.ethereum);
      }
    };

    // Listen for initialization event
    window.addEventListener('ethereum#initialized', handleInitialized, { once: true });

    // Set timeout
    setTimeout(() => {
      if (!handled) {
        handled = true;
        window.removeEventListener('ethereum#initialized', handleInitialized);
        if (window.ethereum) {
          resolve(window.ethereum);
        } else {
          reject(new Error('MetaMask not detected'));
        }
      }
    }, timeout);
  });
};

async function getContract() {
  // Properly detect MetaMask with timeout
  let ethereum;
  try {
    ethereum = await detectEthereumProvider();
  } catch (error) {
    throw new Error("MetaMask is not installed. Please install MetaMask extension from metamask.io and refresh the page.");
  }

  if (!CONTRACT_ADDRESS) {
    throw new Error("Contract address not configured. Check VITE_CONTRACT_ADDRESS in .env");
  }

  try {
    // Request account access
    await ethereum.request({ method: 'eth_requestAccounts' });
    
    const provider = new ethers.BrowserProvider(ethereum);
    const network = await provider.getNetwork();
    
    // Check if on correct network (localhost chainId: 31337)
    if (network.chainId !== BigInt(31337)) {
      throw new Error(`Wrong network! Please switch MetaMask to "Localhost 8545" (Chain ID: 31337). Currently on Chain ID: ${network.chainId}`);
    }
    
    const signer = await provider.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
  } catch (error: any) {
    if (error.code === 4001) {
      throw new Error("MetaMask connection rejected by user");
    }
    throw error;
  }
}

export async function registerEvidenceOnChain(
  evidenceId: string,
  hash: string
): Promise<{
  transactionHash: string;
  blockNumber: number;
  gasUsed: string;
}> {
  const contract = await getContract();
  
  // Trim evidenceId to ensure no whitespace issues
  const cleanEvidenceId = evidenceId.trim();
  console.log('📝 Registering evidence on blockchain...');
  console.log('Evidence ID:', cleanEvidenceId);
  
  // Convert evidenceId string to bytes32 (hash it to ensure it fits in 32 bytes)
  const evidenceIdBytes32 = ethers.id(cleanEvidenceId); // keccak256 hash
  console.log('Evidence ID bytes32:', evidenceIdBytes32);
  
  // Ensure hash is proper bytes32 format (should already be 0x + 64 hex chars)
  const hashBytes32 = hash.startsWith('0x') ? hash : `0x${hash}`;
  console.log('Hash bytes32:', hashBytes32);
  
  try {
    const tx = await contract.registerEvidence(evidenceIdBytes32, hashBytes32);
    console.log('⏳ Waiting for transaction confirmation...');
    const receipt = await tx.wait();
    console.log('✅ Evidence registered successfully on blockchain');
    
    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed ? receipt.gasUsed.toString() : '0',
    };
  } catch (error: any) {
    console.error('❌ Register evidence error:', error);
    
    // Handle access control errors
    if (error.message?.includes("AccessControl") || error.message?.includes("INVESTIGATOR_ROLE")) {
      const ethereum = await detectEthereumProvider();
      const provider = new ethers.BrowserProvider(ethereum);
      const signer = await provider.getSigner();
      const signerAddress = await signer.getAddress();
      throw new Error(
        `Your wallet (${signerAddress.slice(0, 10)}...${signerAddress.slice(-8)}) does not have INVESTIGATOR_ROLE on the blockchain contract. ` +
        `Contact the admin to grant you blockchain permissions using: npx hardhat run scripts/grant-role-to-wallet.js --network localhost ${signerAddress}`
      );
    }
    
    if (error.code === 4001 || error.message?.includes("user rejected")) {
      throw new Error("Transaction rejected by user");
    }
    
    throw error;
  }
}

export async function getStoredHash(
  evidenceId: string
): Promise<string> {
  const contract = await getContract();
  const cleanEvidenceId = evidenceId.trim();
  const evidenceIdBytes32 = ethers.id(cleanEvidenceId);
  
  try {
    const evidence = await contract.getEvidence(evidenceIdBytes32);
    return evidence.evidenceHash; // Returns first element (evidenceHash)
  } catch (error: any) {
    if (error.message?.includes("Evidence not found")) {
      throw new Error(`Evidence "${cleanEvidenceId}" not found on blockchain`);
    }
    throw error;
  }
}

// New helper function to check if evidence exists on blockchain
export async function evidenceExistsOnChain(evidenceId: string): Promise<boolean> {
  try {
    const contract = await getContract();
    const cleanEvidenceId = evidenceId.trim();
    const evidenceIdBytes32 = ethers.id(cleanEvidenceId);
    await contract.getEvidence(evidenceIdBytes32);
    return true;
  } catch (error: any) {
    if (error.message?.includes("Evidence not found")) {
      return false;
    }
    throw error; // Re-throw other errors
  }
}

export async function transferCustody(
  evidenceId: string,
  newHolderAddress: string
): Promise<{
  transactionHash: string;
  blockNumber: number;
}> {
  const contract = await getContract();
  
  // Trim and validate evidenceId
  const cleanEvidenceId = evidenceId.trim();
  console.log('🔍 Transferring custody for evidence:', cleanEvidenceId);
  
  const evidenceIdBytes32 = ethers.id(cleanEvidenceId);
  console.log('📋 Evidence ID bytes32:', evidenceIdBytes32);
  
  try {
    // First check if evidence exists and get current holder
    console.log('🔎 Fetching evidence from blockchain...');
    const evidence = await contract.getEvidence(evidenceIdBytes32);
    console.log('✅ Evidence found on blockchain');
    console.log('Current holder:', evidence.currentHolder);
    
    const currentHolder = evidence.currentHolder;
    
    // Get the signer's address
    const ethereum = await detectEthereumProvider();
    const provider = new ethers.BrowserProvider(ethereum);
    const signer = await provider.getSigner();
    const signerAddress = await signer.getAddress();
    console.log('👤 Your address:', signerAddress);
    
    // Check if signer is the current holder
    if (currentHolder.toLowerCase() !== signerAddress.toLowerCase()) {
      throw new Error(
        `You are not the current holder of this evidence. Current holder: ${currentHolder.slice(0, 10)}...${currentHolder.slice(-8)}`
      );
    }
    
    console.log('📤 Initiating custody transfer...');
    const tx = await contract.transferCustody(evidenceIdBytes32, newHolderAddress);
    const receipt = await tx.wait();
    console.log('✅ Custody transferred successfully');
    
    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
    };
  } catch (error: any) {
    console.error('❌ Transfer custody error:', error);
    
    // Handle specific blockchain errors
    if (error.message?.includes("AccessControl") || error.message?.includes("INVESTIGATOR_ROLE")) {
      throw new Error(
        `Your wallet does not have INVESTIGATOR_ROLE on the blockchain contract. ` +
        `Contact the admin to grant you blockchain permissions. Your address: ${signerAddress}`
      );
    }
    if (error.message?.includes("Not current holder")) {
      throw new Error("You are not the current holder of this evidence. Only the current holder can transfer custody.");
    }
    if (error.message?.includes("Evidence not found")) {
      throw new Error(`Evidence ID "${cleanEvidenceId}" not found on blockchain. This evidence may not have been properly registered. Please verify the evidence was uploaded successfully.`);
    }
    if (error.message?.includes("Evidence must be active")) {
      throw new Error("Evidence must be in Active state to transfer custody.");
    }
    if (error.code === 4001 || error.message?.includes("user rejected")) {
      throw new Error("Transaction rejected by user");
    }
    
    // Re-throw with original message if we already have a custom message
    throw error;
  }
}

export function formatTxHash(txHash: string): string {
  if (!txHash) return "";
  return txHash.slice(0, 10) + "..." + txHash.slice(-6);
}
