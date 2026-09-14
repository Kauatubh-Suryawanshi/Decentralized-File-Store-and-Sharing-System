<div align="center">

# 🔐 DecentraShare

### Decentralized File Storage & Sharing System

**React + Ethereum + Solidity + IPFS + MetaMask + Hardhat**

<p>
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/Ethereum-DApp-3C3C3D?style=for-the-badge&logo=ethereum&logoColor=white" alt="Ethereum">
  <img src="https://img.shields.io/badge/Solidity-0.8.9-363636?style=for-the-badge&logo=solidity&logoColor=white" alt="Solidity">
  <img src="https://img.shields.io/badge/IPFS-Pinata-65C2CB?style=for-the-badge" alt="IPFS">
  <img src="https://img.shields.io/badge/MetaMask-Wallet-E2761B?style=for-the-badge&logo=metamask&logoColor=white" alt="MetaMask">
  <img src="https://img.shields.io/badge/Hardhat-Development-F7F7F7?style=for-the-badge&logo=hardhat&logoColor=black" alt="Hardhat">
  <img src="https://img.shields.io/badge/CI-GitHub%20Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white" alt="GitHub Actions">
</p>

</div>

---

## 🎯 What is DecentraShare?

**DecentraShare** is a Web3 application for storing files on IPFS and managing ownership and sharing permissions through an Ethereum smart contract.

The application deliberately keeps large file content **off-chain**. IPFS stores the file, while the blockchain stores the file reference and access-control state. A React frontend connects a user's MetaMask wallet to the Ethereum-compatible network through `ethers.js`.

> **Core principle:** store file content off-chain and use the blockchain as the ownership and permission layer.

### What the application does

- Connects users through MetaMask
- Uploads files to IPFS through a server-side Pinata integration
- Stores the resulting IPFS URL against the connected wallet
- Allows an owner to grant and revoke access for another Ethereum address
- Enforces access checks inside the Solidity contract
- Retrieves permitted file references from the blockchain
- Provides a React interface for upload, retrieval and sharing
- Runs locally with Hardhat and includes automated contract/frontend checks

---

## ⭐ Why this project stands out

This project demonstrates a complete DApp workflow rather than using blockchain as a decorative feature.

### Off-chain file storage

The actual file is not stored inside Ethereum. IPFS is used for content-addressed file storage, keeping blockchain data small and inexpensive.

### On-chain permissions

The `Upload` contract controls who can read an owner's stored IPFS references. Access can be granted and revoked by the owner.

### Wallet-based identity

The connected Ethereum address acts as the application's identity. No centralized username/password database is required for the current DApp.

### Security-conscious upload architecture

Pinata credentials are kept on the server rather than shipped inside the React browser bundle. The browser receives only the resulting IPFS URL.

### Automated quality checks

The repository includes Solidity tests, React tests, contract compilation, production build verification and GitHub Actions CI.

---

## 🔄 End-to-end workflow

```text
User
  │
  ▼
MetaMask Wallet
  │
  ▼
React DApp
  │
  ├─────────────────────────────┐
  │                             │
  ▼                             ▼
Upload File                  Read / Share
  │                             │
  ▼                             ▼
Backend API                 Ethereum Contract
  │                             │
  ▼                             ├── Owner check
Pinata → IPFS                   ├── Grant access
  │                             └── Revoke access
  ▼
CID / IPFS URL
  │
  ▼
Smart Contract
  │
  ▼
Owner's file references
```

### Upload flow

1. The user connects MetaMask.
2. The user selects a file.
3. The React application sends the file to the local API server.
4. The server forwards the file to Pinata/IPFS using server-side credentials.
5. Pinata returns a CID.
6. The server returns the IPFS gateway URL to the browser.
7. The browser calls `Upload.add(ipfsUrl)` using the connected wallet.
8. The transaction is mined and the file reference becomes associated with the wallet.

### Sharing flow

1. The owner opens **Share**.
2. The owner enters another Ethereum address.
3. The frontend calls `allow(address)`.
4. The contract records the permission.
5. The recipient can call `display(owner)`.
6. The contract allows the request only when the caller is the owner or has active permission.
7. The owner can later call `disallow(address)` to revoke access.

---

## 🧠 Application capabilities

| Capability | Implementation |
|---|---|
| Wallet identity | MetaMask + ethers.js |
| Frontend | React |
| Blockchain | Ethereum-compatible network |
| Smart contract | Solidity 0.8.9 |
| Development | Hardhat |
| File storage | IPFS through Pinata |
| Upload security | Server-side Pinata credentials |
| Ownership | Wallet address |
| Access control | Solidity mappings |
| Retrieval | IPFS gateway URLs |
| Contract testing | Hardhat + Chai |
| Frontend testing | React Testing Library |
| CI | GitHub Actions |

---

## 🔗 Smart contract

The main contract is located at:

```text
contracts/Upload.sol
```

### Data model

```solidity
mapping(address => string[]) private value;
mapping(address => mapping(address => bool)) private ownership;
mapping(address => Access[]) private accessList;
mapping(address => mapping(address => bool)) private previousData;
```

| Structure | Purpose |
|---|---|
| `value` | Stores IPFS references owned by an Ethereum address |
| `ownership` | Tracks active sharing permissions |
| `accessList` | Keeps the owner's share history and current status |
| `previousData` | Prevents duplicate access-list entries after re-granting |

### Contract functions

#### `add(string calldata url)`

Adds a file reference **only for `msg.sender`**. This prevents one wallet from inserting file references into another user's collection.

#### `allow(address user)`

Grants another address access to the caller's stored references.

#### `disallow(address user)`

Revokes an existing permission without creating duplicate records.

#### `display(address owner)`

Returns stored references when the caller is either:

- the owner, or
- an address with active permission.

Otherwise the transaction reverts with `You don't have access`.

#### `shareAccess()`

Returns the caller's access records so the UI can display active and revoked addresses.

### Contract events

The contract emits:

- `FileAdded`
- `AccessGranted`
- `AccessRevoked`

These make the state-changing operations easier to observe and integrate with future event-driven features.

---

## 🏗️ Architecture

```text
                         ┌─────────────────────┐
                         │       Browser       │
                         │     React DApp      │
                         └──────────┬──────────┘
                                    │
                          MetaMask / ethers.js
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
             Ethereum Contract                Upload API
                    │                               │
                    │                         Server-side
                    │                         Pinata credentials
                    │                               │
                    │                               ▼
                    │                         Pinata / IPFS
                    │                               │
                    │                               ▼
                    └──────────────►          CID / URL
```

### Repository structure

```text
Decentralized-File-Store-and-Sharing-System/
├── client/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── contracts/
│       │   └── Upload.json
│       ├── App.js
│       └── App.test.js
├── contracts/
│   └── Upload.sol
├── docs/
│   └── Blockchain-Project-Report.pdf
├── scripts/
│   ├── deploy.js
│   └── sync-abi.js
├── server/
│   └── index.js
├── test/
│   └── Upload.test.js
├── .github/
│   └── workflows/
│       └── ci.yml
├── .env.example
├── client/.env.example
├── hardhat.config.js
├── package.json
└── README.md
```

---

## 🧰 Technology stack and rationale

| Technology | Why it is used |
|---|---|
| React | Component-based DApp user interface |
| ethers.js | Wallet, provider and smart-contract interaction |
| MetaMask | User-controlled Ethereum wallet and transaction signing |
| Solidity | Ethereum smart-contract implementation |
| Hardhat | Local blockchain development, compilation and testing |
| IPFS | Content-addressed, off-chain file storage |
| Pinata | Managed IPFS pinning service |
| Node.js | Lightweight upload API and local tooling |
| GitHub Actions | Automated compile, test and build verification |

---

## 🔐 Security model

### Fixed in this version

- File references can only be added by the caller's own wallet.
- Empty IPFS URLs are rejected.
- Zero-address and self-sharing targets are rejected.
- Access checks execute inside the smart contract.
- Revocation is enforced by the contract.
- Pinata credentials are not embedded in the React application.
- The upload API limits files to 20 MB.
- Secrets are excluded through `.gitignore`.
- Hardhat development private keys are not stored in the repository.

### Important limitation

IPFS provides decentralized/content-addressed storage, **not confidentiality**. Anyone who obtains a file's CID may potentially retrieve that content.

For sensitive production data, the next security layer should be **client-side encryption before IPFS upload**, followed by secure key management.

---

## 💻 Local setup

### Requirements

- Node.js 20+
- npm
- MetaMask
- A Pinata account for real file uploads

### 1. Install dependencies

```bash
npm install
npm install --prefix client
```

### 2. Configure server credentials

Create a root `.env` file:

```env
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_API_KEY=your_pinata_secret_api_key
PORT=4000
CLIENT_ORIGIN=http://localhost:3000
```

**Never put these Pinata credentials in `client/.env.local`.**

### 3. Start the local Ethereum node

Terminal 1:

```bash
npm run node
```

Keep this terminal running.

### 4. Compile and deploy

Terminal 2:

```bash
npm run deploy:local
```

The deployment script automatically writes the deployed contract address and chain ID into:

```text
client/.env.local
```

### 5. Start the upload API

Terminal 3:

```bash
npm run server
```

Health check:

```text
http://localhost:4000/api/health
```

### 6. Start React

Terminal 4:

```bash
npm start --prefix client
```

Open:

```text
http://localhost:3000
```

### 7. Connect MetaMask

Import one of the development accounts printed by `hardhat node` into MetaMask **only for the local development network**.

Connect MetaMask to:

```text
Network: Localhost 8545
Chain ID: 1337
RPC: http://127.0.0.1:8545
```

Never reuse Hardhat development keys on a public network.

---

## 🧪 Testing

### Solidity tests

```bash
npm run test:contracts
```

The test suite covers:

- file ownership
- empty URL rejection
- unauthorized retrieval
- access granting
- access revocation
- re-granting without duplicate records
- invalid sharing addresses
- caller-only file insertion
- repeated revocation safety

### React tests

```bash
npm run test:client
```

### Full test pipeline

```bash
npm test
```

### Production build

```bash
npm run build
```

The build performs contract compilation, ABI synchronization and a production React build.

---

## 🔄 ABI synchronization

The frontend does not depend on an ignored Hardhat artifact directory.

Running:

```bash
npm run compile
```

performs:

```text
Hardhat compile
      ↓
artifacts/contracts/Upload.sol/Upload.json
      ↓
scripts/sync-abi.js
      ↓
client/src/contracts/Upload.json
```

This keeps the ABI synchronized in the repository and prevents the previous missing-artifact problem. Dependencies are installed with `npm install` so npm can resolve a fresh, consistent dependency tree.

---

## 🤖 Continuous Integration

GitHub Actions runs on pushes and pull requests to `main`.

```text
Checkout
   ↓
Node.js 20
   ↓
npm install
   ↓
npm install --prefix client
   ↓
Hardhat compile
   ↓
Solidity tests
   ↓
React tests
   ↓
React production build
   ↓
🟢 Passing check
```

Workflow:

```text
.github/workflows/ci.yml
```

---

## ⚠️ Current limitations

- The current local configuration targets Hardhat Network.
- IPFS files are not encrypted by default.
- The upload API is intentionally lightweight and should be hardened before public deployment.
- The current contract stores IPFS gateway URLs directly on-chain; a CID-only representation could reduce unnecessary URL data.
- Authentication is wallet-based rather than application-account based.
- Production deployment would require a persistent API service, secure secret storage, HTTPS, rate limiting and monitoring.

---

## 🗺️ Future improvements

1. Client-side file encryption and secure key sharing
2. CID-only on-chain storage with gateway abstraction
3. Event-driven file/share history
4. File deletion/unpinning workflow
5. File metadata and MIME-type support
6. Multi-network deployment
7. Testnet deployment with verified contracts
8. Backend authentication/rate limiting and structured logging
9. Dockerized API + frontend deployment
10. Security audit and gas optimization

---

## 📄 Project report

The project report is available at:

```text
docs/Blockchain-Project-Report.pdf
```

---

## 👨‍💻 Author

### Kaustubh Suryawanshi

**Computer Science Engineering Student · Data Science / AI-ML · Blockchain / Web3**

This project demonstrates practical work across:

**React · Solidity · Ethereum · IPFS · Smart Contracts · Web3 · Hardhat · Node.js · GitHub Actions**

GitHub: [Kauatubh-Suryawanshi](https://github.com/Kauatubh-Suryawanshi)

---

## 📄 License

This project is distributed under the **MIT License**.

**Copyright © 2026 Kaustubh Suryawanshi**

---

<div align="center">

### ⭐ DecentraShare

**Store off-chain. Control access on-chain.**

Built with **React · Ethereum · Solidity · IPFS · MetaMask · Hardhat**

</div>
