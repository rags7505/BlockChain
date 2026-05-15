const hre = require("hardhat");

/**
 * Grant INVESTIGATOR_ROLE to a specific wallet address
 * Usage: npx hardhat run scripts/grant-role-to-wallet.js --network localhost
 * 
 * You can pass the wallet address as an environment variable:
 * WALLET_ADDRESS=0x... npx hardhat run scripts/grant-role-to-wallet.js --network localhost
 */

async function main() {
  // Get wallet address from command line argument or environment variable
  const walletAddress = process.env.WALLET_ADDRESS || process.argv[2];
  
  if (!walletAddress) {
    console.error("❌ Error: Wallet address required!");
    console.log("\nUsage:");
    console.log("  npx hardhat run scripts/grant-role-to-wallet.js --network localhost 0xYourWalletAddress");
    console.log("  OR");
    console.log("  WALLET_ADDRESS=0xYourWalletAddress npx hardhat run scripts/grant-role-to-wallet.js --network localhost");
    process.exit(1);
  }

  // Validate wallet address format
  if (!hre.ethers.isAddress(walletAddress)) {
    console.error(`❌ Error: Invalid wallet address format: ${walletAddress}`);
    process.exit(1);
  }

  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  
  console.log("🔐 Granting roles to wallet...");
  console.log("Contract:", contractAddress);
  console.log("Wallet:", walletAddress);
  console.log("");

  const ChainOfCustody = await hre.ethers.getContractFactory("ChainOfCustody");
  const contract = ChainOfCustody.attach(contractAddress);

  const [deployer] = await hre.ethers.getSigners();
  console.log("Using judge account:", deployer.address);
  console.log("");

  // Define roles
  const INVESTIGATOR_ROLE = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("INVESTIGATOR_ROLE"));
  const JUDGE_ROLE = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("JUDGE_ROLE"));

  // Check current roles
  const hasInvestigatorRole = await contract.hasRole(INVESTIGATOR_ROLE, walletAddress);
  const hasJudgeRole = await contract.hasRole(JUDGE_ROLE, walletAddress);

  console.log("Current roles:");
  console.log("  INVESTIGATOR_ROLE:", hasInvestigatorRole ? "✅ Already granted" : "❌ Not granted");
  console.log("  JUDGE_ROLE:", hasJudgeRole ? "✅ Already granted" : "❌ Not granted");
  console.log("");

  // Grant INVESTIGATOR_ROLE if not already granted
  if (!hasInvestigatorRole) {
    console.log("⏳ Granting INVESTIGATOR_ROLE...");
    const tx = await contract.grantRole(INVESTIGATOR_ROLE, walletAddress);
    await tx.wait();
    console.log("✅ INVESTIGATOR_ROLE granted successfully!");
  } else {
    console.log("ℹ️  INVESTIGATOR_ROLE already granted, skipping.");
  }

  console.log("");
  console.log("✅ Done! Wallet can now:");
  console.log("   - Register new evidence");
  console.log("   - Transfer custody of evidence they own");
  console.log("   - Log custom actions on evidence");
  console.log("");
  console.log("💡 Note: To grant JUDGE_ROLE (can transfer ANY evidence and change state), modify this script.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
