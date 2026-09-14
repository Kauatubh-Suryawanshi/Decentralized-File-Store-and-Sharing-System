const fs = require("fs");
const path = require("path");

const artifactPath = path.join(
  __dirname,
  "..",
  "artifacts",
  "contracts",
  "Upload.sol",
  "Upload.json"
);
const destinationDir = path.join(__dirname, "..", "client", "src", "contracts");
const destinationPath = path.join(destinationDir, "Upload.json");

if (!fs.existsSync(artifactPath)) {
  throw new Error("Upload artifact not found. Run `npx hardhat compile` first.");
}

const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
fs.mkdirSync(destinationDir, { recursive: true });
fs.writeFileSync(
  destinationPath,
  JSON.stringify({ contractName: artifact.contractName, abi: artifact.abi }, null, 2) + "\n"
);

console.log(`Synced ABI to ${destinationPath}`);
