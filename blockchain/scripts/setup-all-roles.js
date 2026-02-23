const hre = require("hardhat");

/**
 * Grant roles to all default test accounts
 * Usage: npx hardhat run scripts/setup-all-roles.js --network localhost
 */

async function main() {
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  
  console.log("🔐 Setting up blockchain roles for all test accounts...");
  console.log("Contract:", contractAddress);
  console.log("");

  const ChainOfCustody = await hre.ethers.getContractFactory("ChainOfCustody");
  const contract = ChainOfCustody.attach(contractAddress);

  const [deployer] = await hre.ethers.getSigners();
  console.log("Using deployer/judge account:", deployer.address);
  console.log("");

  // Define roles
  const INVESTIGATOR_ROLE = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("INVESTIGATOR_ROLE"));
  const JUDGE_ROLE = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("JUDGE_ROLE"));

  // Default test accounts (matching database)
  const accounts = [
    { address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", role: "superadmin", name: "Superadmin" },
    { address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", role: "judge", name: "Judge" },
    { address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", role: "investigator", name: "Investigator" },
    { address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906", role: "viewer", name: "Viewer" },
  ];

  for (const account of accounts) {
    console.log(`\n👤 Setting up: ${account.name} (${account.address})`);
    
    // Check and grant INVESTIGATOR_ROLE
    if (account.role === "investigator" || account.role === "judge" || account.role === "superadmin") {
      const hasInvestigatorRole = await contract.hasRole(INVESTIGATOR_ROLE, account.address);
      if (!hasInvestigatorRole) {
        console.log("  ⏳ Granting INVESTIGATOR_ROLE...");
        const tx1 = await contract.grantRole(INVESTIGATOR_ROLE, account.address);
        await tx1.wait();
        console.log("  ✅ INVESTIGATOR_ROLE granted");
      } else {
        console.log("  ✓ Already has INVESTIGATOR_ROLE");
      }
    }

    // Check and grant JUDGE_ROLE (only for judge and superadmin)
    if (account.role === "judge" || account.role === "superadmin") {
      const hasJudgeRole = await contract.hasRole(JUDGE_ROLE, account.address);
      if (!hasJudgeRole) {
        console.log("  ⏳ Granting JUDGE_ROLE...");
        const tx2 = await contract.grantRole(JUDGE_ROLE, account.address);
        await tx2.wait();
        console.log("  ✅ JUDGE_ROLE granted");
      } else {
        console.log("  ✓ Already has JUDGE_ROLE");
      }
    }
  }

  console.log("\n✅ All roles have been set up successfully!");
  console.log("\nRole Summary:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  for (const account of accounts) {
    const hasInvestigator = await contract.hasRole(INVESTIGATOR_ROLE, account.address);
    const hasJudge = await contract.hasRole(JUDGE_ROLE, account.address);
    
    console.log(`\n${account.name}:`);
    console.log(`  Address: ${account.address}`);
    console.log(`  INVESTIGATOR_ROLE: ${hasInvestigator ? "✓" : "✗"}`);
    console.log(`  JUDGE_ROLE: ${hasJudge ? "✓" : "✗"}`);
  }
  
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
