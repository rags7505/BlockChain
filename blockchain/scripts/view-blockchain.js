const { ethers } = require("hardhat");

async function main() {
  console.log("\n🔍 BLOCKCHAIN EVIDENCE VIEWER\n");
  console.log("=".repeat(60));

  // Get contract
  const contractAddress = process.argv[2] || process.env.CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const ChainOfCustody = await ethers.getContractFactory("ChainOfCustody");
  const contract = ChainOfCustody.attach(contractAddress);

  console.log(`📍 Contract Address: ${contractAddress}\n`);

  // Get past events
  console.log("📋 RECENT EVIDENCE REGISTRATIONS:");
  console.log("-".repeat(60));

  try {
    // Get EvidenceRegistered events
    const registeredFilter = contract.filters.EvidenceRegistered();
    const registeredEvents = await contract.queryFilter(registeredFilter);

    if (registeredEvents.length === 0) {
      console.log("No evidence registered yet.\n");
    } else {
      for (const event of registeredEvents) {
        const { evidenceId, evidenceHash, registeredBy, timestamp } = event.args;
        const date = new Date(Number(timestamp) * 1000);
        
        console.log(`Evidence ID: ${evidenceId}`);
        console.log(`Hash: ${evidenceHash}`);
        console.log(`Registered By: ${registeredBy}`);
        console.log(`Timestamp: ${date.toLocaleString()}`);
        console.log(`Block: ${event.blockNumber}`);
        console.log(`Transaction: ${event.transactionHash}`);
        
        // Get current evidence details
        try {
          const evidence = await contract.getEvidence(evidenceId);
          const states = ['Active', 'Sealed', 'Archived', 'UnderReview'];
          console.log(`Current Holder: ${evidence[1]}`);
          console.log(`State: ${states[Number(evidence[3])]}`);
        } catch (err) {
          console.log(`Could not fetch details: ${err.message}`);
        }
        console.log("-".repeat(60));
      }
    }

    // Get custody transfers
    console.log("\n🔄 CUSTODY TRANSFERS:");
    console.log("-".repeat(60));

    const transferFilter = contract.filters.CustodyTransferred();
    const transferEvents = await contract.queryFilter(transferFilter);

    if (transferEvents.length === 0) {
      console.log("No transfers yet.\n");
    } else {
      for (const event of transferEvents) {
        const { evidenceId, previousHolder, newHolder, timestamp } = event.args;
        const date = new Date(Number(timestamp) * 1000);
        
        console.log(`Evidence ID: ${evidenceId}`);
        console.log(`From: ${previousHolder}`);
        console.log(`To: ${newHolder}`);
        console.log(`Time: ${date.toLocaleString()}`);
        console.log(`Transaction: ${event.transactionHash}`);
        console.log("-".repeat(60));
      }
    }

    // Get state changes
    console.log("\n🔄 STATE CHANGES:");
    console.log("-".repeat(60));

    const stateFilter = contract.filters.EvidenceStateChanged();
    const stateEvents = await contract.queryFilter(stateFilter);

    if (stateEvents.length === 0) {
      console.log("No state changes yet.\n");
    } else {
      const states = ['Active', 'Sealed', 'Archived', 'UnderReview'];
      for (const event of stateEvents) {
        const { evidenceId, newState, changedBy, timestamp } = event.args;
        const date = new Date(Number(timestamp) * 1000);
        
        console.log(`Evidence ID: ${evidenceId}`);
        console.log(`New State: ${states[Number(newState)]}`);
        console.log(`Changed By: ${changedBy}`);
        console.log(`Time: ${date.toLocaleString()}`);
        console.log(`Transaction: ${event.transactionHash}`);
        console.log("-".repeat(60));
      }
    }

    // Get custody action logs
    console.log("\n📝 CUSTODY ACTION LOGS:");
    console.log("-".repeat(60));

    const actionFilter = contract.filters.CustodyActionLogged();
    const actionEvents = await contract.queryFilter(actionFilter);

    if (actionEvents.length === 0) {
      console.log("No actions logged yet.\n");
    } else {
      for (const event of actionEvents) {
        const { evidenceId, handler, action, timestamp } = event.args;
        const date = new Date(Number(timestamp) * 1000);
        
        console.log(`Evidence ID: ${evidenceId}`);
        console.log(`Action: ${action}`);
        console.log(`Handler: ${handler}`);
        console.log(`Time: ${date.toLocaleString()}`);
        console.log(`Transaction: ${event.transactionHash}`);
        console.log("-".repeat(60));
      }
    }

  } catch (error) {
    console.error("\n❌ Error querying blockchain:", error.message);
  }

  console.log("\n✅ Blockchain query complete!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
