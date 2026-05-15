const hre = require("hardhat");

async function main() {
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  
  console.log("Granting roles to contract at:", contractAddress);

  const ChainOfCustody = await hre.ethers.getContractFactory("ChainOfCustody");
  const contract = ChainOfCustody.attach(contractAddress);

  const [deployer] = await hre.ethers.getSigners();
  console.log("Using admin account:", deployer.address);

  // Define roles
  const INVESTIGATOR_ROLE = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("INVESTIGATOR_ROLE"));
  const ADMIN_ROLE = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("ADMIN_ROLE"));

  // Accounts to grant roles to
  const accounts = [
    { address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", name: "Superadmin", grantAdmin: true },
    { address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", name: "Admin", grantAdmin: false },
    { address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", name: "Investigator", grantAdmin: false },
    { address: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65", name: "Test Account #4", grantAdmin: false },
    { address: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc", name: "Test Account #5", grantAdmin: false },
    { address: "0x6b236E6C62827e02d49704B91685d8Fd8ee707cf", name: "New Investigator", grantAdmin: false },
  ];

  console.log("\nGranting roles to all accounts...\n");
  
  for (const account of accounts) {
    console.log(`\nGranting roles to ${account.name} (${account.address})`);
    
    // Grant INVESTIGATOR_ROLE to everyone
    const tx1 = await contract.grantRole(INVESTIGATOR_ROLE, account.address);
    await tx1.wait();
    console.log("  ✅ INVESTIGATOR_ROLE granted!");
    
    // Grant ADMIN_ROLE only to superadmin
    if (account.grantAdmin) {
      const tx2 = await contract.grantRole(ADMIN_ROLE, account.address);
      await tx2.wait();
      console.log("  ✅ ADMIN_ROLE granted (can transfer any evidence)!");
    }
  }

  console.log("\n✅ All roles granted!");
  console.log("💡 Superadmin can now transfer ANY evidence, others can only transfer their own.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
