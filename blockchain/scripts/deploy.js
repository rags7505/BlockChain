const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying ChainOfCustody contract...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const ChainOfCustody = await hre.ethers.getContractFactory("ChainOfCustody");
  const chainOfCustody = await ChainOfCustody.deploy(deployer.address);

  await chainOfCustody.waitForDeployment();

  const address = await chainOfCustody.getAddress();
  console.log("\n✅ ChainOfCustody deployed to:", address);
  
  // Grant INVESTIGATOR_ROLE to deployer
  const INVESTIGATOR_ROLE = await chainOfCustody.INVESTIGATOR_ROLE();
  await chainOfCustody.grantRole(INVESTIGATOR_ROLE, deployer.address);
  console.log("✅ Granted INVESTIGATOR_ROLE to:", deployer.address);
  
  // Auto-update frontend/.env
  const frontendEnvPath = path.join(__dirname, "../../frontend/.env");
  if (fs.existsSync(frontendEnvPath)) {
    let envContent = fs.readFileSync(frontendEnvPath, "utf8");
    envContent = envContent.replace(
      /VITE_CONTRACT_ADDRESS=.*/,
      `VITE_CONTRACT_ADDRESS=${address}`
    );
    fs.writeFileSync(frontendEnvPath, envContent);
    console.log("✅ Auto-updated frontend/.env with contract address");
  }
  
  console.log("\n✅ Deployment complete! Start backend and frontend now.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
