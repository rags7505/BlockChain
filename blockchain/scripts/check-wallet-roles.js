const hre = require("hardhat");

/**
 * Check if a wallet address has blockchain roles
 * Usage: npx hardhat run scripts/check-wallet-roles.js --network localhost 0xYourWalletAddress
 */

async function main() {
  const walletAddress = process.env.WALLET_ADDRESS || process.argv[2];
  
  if (!walletAddress) {
    console.error("❌ Error: Wallet address required!");
    console.log("\nUsage:");
    console.log("  npx hardhat run scripts/check-wallet-roles.js --network localhost 0xYourWalletAddress");
    process.exit(1);
  }

  if (!hre.ethers.isAddress(walletAddress)) {
    console.error(`❌ Error: Invalid wallet address format: ${walletAddress}`);
    process.exit(1);
  }

  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  
  console.log("🔍 Checking blockchain roles for wallet...");
  console.log("Contract:", contractAddress);
  console.log("Wallet:", walletAddress);
  console.log("");

  const ChainOfCustody = await hre.ethers.getContractFactory("ChainOfCustody");
  const contract = ChainOfCustody.attach(contractAddress);

  // Define roles
  const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
  const INVESTIGATOR_ROLE = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("INVESTIGATOR_ROLE"));
  const JUDGE_ROLE = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("JUDGE_ROLE"));

  // Check roles
  const hasDefaultAdminRole = await contract.hasRole(DEFAULT_ADMIN_ROLE, walletAddress);
  const hasInvestigatorRole = await contract.hasRole(INVESTIGATOR_ROLE, walletAddress);
  const hasJudgeRole = await contract.hasRole(JUDGE_ROLE, walletAddress);

  console.log("📋 Blockchain Roles:");
  console.log("  DEFAULT_ADMIN_ROLE:", hasDefaultAdminRole ? "✅ Yes (can grant/revoke roles)" : "❌ No");
  console.log("  JUDGE_ROLE:", hasJudgeRole ? "✅ Yes (can transfer ANY evidence and manage states)" : "❌ No");
  console.log("  INVESTIGATOR_ROLE:", hasInvestigatorRole ? "✅ Yes (can register & transfer evidence)" : "❌ No");
  console.log("");

  // Provide recommendations
  if (!hasInvestigatorRole && !hasJudgeRole && !hasDefaultAdminRole) {
    console.log("⚠️  Warning: This wallet has NO blockchain roles!");
    console.log("");
    console.log("🔧 To fix, run:");
    console.log(`   npx hardhat run scripts/grant-role-to-wallet.js --network localhost ${walletAddress}`);
    console.log("");
  } else if (hasInvestigatorRole || hasJudgeRole) {
    console.log("✅ This wallet can interact with the blockchain contract!");
    console.log("");
    console.log("Capabilities:");
    if (hasInvestigatorRole) {
      console.log("  ✓ Register new evidence");
      console.log("  ✓ Transfer custody of evidence they own");
      console.log("  ✓ Log custom actions");
    }
    if (hasJudgeRole) {
      console.log("  ✓ Transfer custody of ANY evidence");
      console.log("  ✓ Update evidence state");
    }
    if (hasDefaultAdminRole) {
      console.log("  ✓ Grant roles to other wallets");
      console.log("  ✓ Revoke roles from wallets");
    }
    console.log("");
  }

  console.log("💡 Note: This only checks blockchain roles.");
  console.log("   Also verify database role in Supabase users table.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
