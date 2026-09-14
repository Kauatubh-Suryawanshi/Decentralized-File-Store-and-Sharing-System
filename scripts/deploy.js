const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

async function main() {
  const Upload = await hre.ethers.getContractFactory("Upload");
  const upload = await Upload.deploy();
  await upload.deployed();

  const deployment = {
    network: hre.network.name,
    chainId: Number((await hre.ethers.provider.getNetwork()).chainId),
    contractAddress: upload.address,
  };

  const outputPath = path.join(__dirname, "..", "client", "src", "contracts", "deployment.json");
  fs.writeFileSync(outputPath, JSON.stringify(deployment, null, 2) + "\n");

  const envPath = path.join(__dirname, "..", "client", ".env.local");
  const existing = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
  const withoutContract = existing
    .split(/\r?\n/)
    .filter((line) => !line.startsWith("REACT_APP_CONTRACT_ADDRESS=") && !line.startsWith("REACT_APP_CHAIN_ID="))
    .filter(Boolean);
  withoutContract.push(`REACT_APP_CONTRACT_ADDRESS=${upload.address}`);
  withoutContract.push(`REACT_APP_CHAIN_ID=${deployment.chainId}`);
  fs.writeFileSync(envPath, withoutContract.join("\n") + "\n");

  console.log(`Upload deployed to: ${upload.address}`);
  console.log(`Deployment metadata written to: ${outputPath}`);
  console.log(`Frontend environment updated: ${envPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
