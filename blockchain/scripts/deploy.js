const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const CycloneRegistry = await hre.ethers.getContractFactory("CycloneRegistry");
  const registry = await CycloneRegistry.deploy();

  await registry.waitForDeployment();

  const address = await registry.getAddress();
  console.log("CycloneRegistry deployed to:", address);

  // Save deployment info
  const deploymentInfo = {
    address: address,
    network: hre.network.name,
    timestamp: new Date().toISOString()
  };

  const deployFilePath = path.join(__dirname, "..", "deployment.json");
  fs.writeFileSync(deployFilePath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`Deployment info saved to ${deployFilePath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
