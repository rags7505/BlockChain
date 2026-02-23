const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting automated development setup...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Using account:", deployer.address);

  // Step 1: Deploy contract
  console.log("\n📝 Step 1: Deploying ChainOfCustody contract...");
  const ChainOfCustody = await hre.ethers.getContractFactory("ChainOfCustody");
  const chainOfCustody = await ChainOfCustody.deploy(deployer.address);
  await chainOfCustody.waitForDeployment();
  const address = await chainOfCustody.getAddress();
  console.log("✅ Contract deployed to:", address);

  // Step 2: Define roles
  const INVESTIGATOR_ROLE = await chainOfCustody.INVESTIGATOR_ROLE();
  const JUDGE_ROLE = await chainOfCustody.JUDGE_ROLE();

  // Step 3: Grant roles to test accounts
  console.log("\n👥 Step 2: Granting roles to test accounts...");
  
  const accounts = [
    { address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", name: "Superadmin", roles: ["JUDGE", "INVESTIGATOR"] },
    { address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", name: "Admin", roles: ["INVESTIGATOR"] },
    { address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", name: "Investigator #1", roles: ["INVESTIGATOR"] },
    { address: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65", name: "Investigator #2", roles: ["INVESTIGATOR"] },
    { address: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc", name: "Investigator #3", roles: ["INVESTIGATOR"] },
  ];

  for (const account of accounts) {
    console.log(`\n  Granting roles to ${account.name} (${account.address})`);
    
    if (account.roles.includes("INVESTIGATOR")) {
      const tx1 = await chainOfCustody.grantRole(INVESTIGATOR_ROLE, account.address);
      await tx1.wait();
      console.log("    ✅ INVESTIGATOR_ROLE granted");
    }
    
    if (account.roles.includes("JUDGE")) {
      const tx2 = await chainOfCustody.grantRole(JUDGE_ROLE, account.address);
      await tx2.wait();
      console.log("    ✅ JUDGE_ROLE granted");
    }
  }

  // Step 4: Update frontend .env
  console.log("\n📄 Step 3: Updating frontend .env file...");
  const frontendEnvPath = path.join(__dirname, "../../frontend/.env");
  
  if (fs.existsSync(frontendEnvPath)) {
    let envContent = fs.readFileSync(frontendEnvPath, "utf8");
    
    // Update or add contract address
    if (envContent.includes("VITE_CONTRACT_ADDRESS=")) {
      envContent = envContent.replace(
        /VITE_CONTRACT_ADDRESS=.*/,
        `VITE_CONTRACT_ADDRESS=${address}`
      );
    } else {
      envContent += `\nVITE_CONTRACT_ADDRESS=${address}\n`;
    }
    
    fs.writeFileSync(frontendEnvPath, envContent);
    console.log("✅ Frontend .env updated");
  } else {
    console.log("⚠️  Frontend .env not found, creating new one...");
    const envContent = `VITE_CONTRACT_ADDRESS=${address}\nVITE_BACKEND_URL=http://localhost:5000\n`;
    fs.writeFileSync(frontendEnvPath, envContent);
    console.log("✅ Created frontend .env");
  }

  // Step 5: Save deployment info
  console.log("\n💾 Step 4: Saving deployment info...");
  const deploymentInfo = {
    contractAddress: address,
    deployedAt: new Date().toISOString(),
    network: "localhost",
    chainId: 31337,
    accounts: accounts
  };
  
  const infoPath = path.join(__dirname, "../deployment-info.json");
  fs.writeFileSync(infoPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("✅ Deployment info saved to deployment-info.json");

  console.log("\n🎉 Development environment setup complete!\n");
  console.log("📋 Summary:");
  console.log(`   Contract Address: ${address}`);
  console.log(`   Roles granted to: ${accounts.length} accounts`);
  console.log(`   Frontend .env: Updated`);
  console.log("\n🚀 Next steps:");
  console.log("   1. Restart your frontend: cd frontend && npm run dev");
  console.log("   2. Restart your backend: cd backend && node server.js");
  console.log("   3. Start uploading evidence!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
