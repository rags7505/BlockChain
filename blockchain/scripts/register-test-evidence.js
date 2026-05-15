const { ethers } = require("hardhat");

async function main() {
  console.log("\n📝 Registering Test Evidence on Blockchain...\n");

  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const ChainOfCustody = await ethers.getContractFactory("ChainOfCustody");
  const contract = ChainOfCustody.attach(contractAddress);

  const [signer1, signer2] = await ethers.getSigners();

  // Register evidence 1
  const evidenceId1 = ethers.id("EVIDENCE-001-WEAPON");
  const evidenceHash1 = ethers.id("SHA256_HASH_OF_WEAPON_IMAGE");
  
  console.log("Registering Evidence 1...");
  let tx = await contract.registerEvidence(evidenceId1, evidenceHash1);
  await tx.wait();
  console.log(`✅ Evidence 1 registered: ${evidenceId1.slice(0, 10)}...`);
  console.log(`   Transaction: ${tx.hash}\n`);

  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Register evidence 2
  const evidenceId2 = ethers.id("EVIDENCE-002-FINGERPRINT");
  const evidenceHash2 = ethers.id("SHA256_HASH_OF_FINGERPRINT");
  
  console.log("Registering Evidence 2...");
  tx = await contract.registerEvidence(evidenceId2, evidenceHash2);
  await tx.wait();
  console.log(`✅ Evidence 2 registered: ${evidenceId2.slice(0, 10)}...`);
  console.log(`   Transaction: ${tx.hash}\n`);

  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Transfer custody of evidence 1
  console.log("Transferring custody of Evidence 1...");
  tx = await contract.transferCustody(evidenceId1, signer2.address);
  await tx.wait();
  console.log(`✅ Custody transferred to: ${signer2.address}`);
  console.log(`   Transaction: ${tx.hash}\n`);

  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Change state to Sealed
  console.log("Sealing Evidence 2 (court sealed)...");
  tx = await contract.updateEvidenceState(evidenceId2, 1); // 1 = Sealed
  await tx.wait();
  console.log(`✅ Evidence 2 sealed`);
  console.log(`   Transaction: ${tx.hash}\n`);

  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Log custom action
  console.log("Logging custom action...");
  tx = await contract.logCustomAction(evidenceId1, "Sent for DNA analysis at forensic lab");
  await tx.wait();
  console.log(`✅ Custom action logged`);
  console.log(`   Transaction: ${tx.hash}\n`);

  console.log("=".repeat(60));
  console.log("✅ Test evidence registered! Run view-blockchain.js to see it.\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
