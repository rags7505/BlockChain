const { ethers } = require("hardhat");

async function main() {
  const evidenceId = process.argv[2];

  if (!evidenceId) {
    console.log("Usage: npx hardhat run scripts/query-evidence.js <evidenceId>");
    console.log("Example: npx hardhat run scripts/query-evidence.js 0x123abc...");
    process.exit(1);
  }

  console.log(`\n🔍 Querying Evidence: ${evidenceId}\n`);

  const contractAddress = process.env.CONTRACT_ADDRESS;
  const ChainOfCustody = await ethers.getContractFactory("ChainOfCustody");
  const contract = ChainOfCustody.attach(contractAddress);

  try {
    // Get evidence details
    const evidence = await contract.getEvidence(evidenceId);
    const states = ['Active', 'Sealed', 'Archived', 'UnderReview'];

    console.log("📄 EVIDENCE DETAILS:");
    console.log("=".repeat(60));
    console.log(`Evidence Hash: ${evidence[0]}`);
    console.log(`Current Holder: ${evidence[1]}`);
    console.log(`Created At: ${new Date(Number(evidence[2]) * 1000).toLocaleString()}`);
    console.log(`State: ${states[Number(evidence[3])]}`);
    console.log("");

    // Get custody history
    console.log("📜 CUSTODY HISTORY:");
    console.log("=".repeat(60));
    
    const history = await contract.getCustodyHistory(evidenceId);
    
    if (history.length === 0) {
      console.log("No history available.");
    } else {
      history.forEach((log, index) => {
        console.log(`\n${index + 1}. ${log.action}`);
        console.log(`   Handler: ${log.handler}`);
        console.log(`   Time: ${new Date(Number(log.timestamp) * 1000).toLocaleString()}`);
      });
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ Query complete!\n");

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    if (error.message.includes("Evidence not found")) {
      console.log("\n💡 This evidence ID doesn't exist on the blockchain.");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
