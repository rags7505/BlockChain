const hre = require("hardhat");

/**
 * Deploy contract and set up all roles in one command
 * Usage: npx hardhat run scripts/deploy-and-setup.js --network localhost
 */

async function main() {
  console.log("🚀 Starting deployment and setup...\n");

  // STEP 1: Deploy contract
  console.log("📝 Step 1: Deploying ChainOfCustody contract...");
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const ChainOfCustody = await hre.ethers.getContractFactory("ChainOfCustody");
  const contract = await ChainOfCustody.deploy(deployer.address);
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log("✅ Contract deployed to:", contractAddress);
  console.log("");

  // STEP 2: Grant roles
  console.log("🔐 Step 2: Granting blockchain roles to test accounts...\n");

  const INVESTIGATOR_ROLE = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("INVESTIGATOR_ROLE"));
  const JUDGE_ROLE = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("JUDGE_ROLE"));

  const accounts = [
    { address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", role: "superadmin", name: "Superadmin (Account #0)" },
    { address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", role: "judge", name: "Judge (Account #1)" },
    { address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", role: "investigator", name: "Investigator (Account #2)" },
    { address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906", role: "viewer", name: "Viewer (Account #3)" },
  ];

  for (const account of accounts) {
    console.log(`👤 ${account.name}`);
    console.log(`   ${account.address}`);
    
    if (account.role === "investigator" || account.role === "judge" || account.role === "superadmin") {
      console.log("   ⏳ Granting INVESTIGATOR_ROLE...");
      const tx1 = await contract.grantRole(INVESTIGATOR_ROLE, account.address);
      await tx1.wait();
      console.log("   ✅ INVESTIGATOR_ROLE granted");
    }

    if (account.role === "judge" || account.role === "superadmin") {
      console.log("   ⏳ Granting JUDGE_ROLE...");
      const tx2 = await contract.grantRole(JUDGE_ROLE, account.address);
      await tx2.wait();
      console.log("   ✅ JUDGE_ROLE granted");
    }
    console.log("");
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("✅ DEPLOYMENT AND SETUP COMPLETE!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("");
  console.log("📋 Contract Address:", contractAddress);
  console.log("");
  console.log("⚠️  IMPORTANT: Update this address in your .env files:");
  console.log("   - backend/.env → CONTRACT_ADDRESS=" + contractAddress);
  console.log("   - frontend/.env → VITE_CONTRACT_ADDRESS=" + contractAddress);
  console.log("");
  console.log("🎉 You can now use the application!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
