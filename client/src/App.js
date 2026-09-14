import Upload from "./contracts/Upload.json";
import { useCallback, useEffect, useRef, useState } from "react";
import { ethers } from "ethers";
import FileUpload from "./components/FileUpload";
import Display from "./components/Display";
import Modal from "./components/Modal";
import "./App.css";

const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS || "";
const EXPECTED_CHAIN_ID = process.env.REACT_APP_CHAIN_ID || "1337";

function App() {
  const [account, setAccount] = useState("");
  const [, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [status, setStatus] = useState("");
  const listenersRegistered = useRef(false);

  const connectWallet = useCallback(async () => {
    try {
      if (!window.ethereum) {
        setStatus("MetaMask is not installed. Install MetaMask to continue.");
        return;
      }

      if (!CONTRACT_ADDRESS || !ethers.utils.isAddress(CONTRACT_ADDRESS)) {
        setStatus("Contract address is not configured. Set REACT_APP_CONTRACT_ADDRESS.");
        return;
      }

      const web3Provider = new ethers.providers.Web3Provider(window.ethereum, "any");
      await web3Provider.send("eth_requestAccounts", []);

      const network = await web3Provider.getNetwork();
      if (String(network.chainId) !== String(EXPECTED_CHAIN_ID)) {
        setStatus(`Wrong network. Connect MetaMask to chain ID ${EXPECTED_CHAIN_ID}.`);
        return;
      }

      const signer = web3Provider.getSigner();
      const address = await signer.getAddress();
      const uploadContract = new ethers.Contract(CONTRACT_ADDRESS, Upload.abi, signer);

      setProvider(web3Provider);
      setAccount(address);
      setContract(uploadContract);
      setStatus("");

      if (!listenersRegistered.current) {
        window.ethereum.on("accountsChanged", () => window.location.reload());
        window.ethereum.on("chainChanged", () => window.location.reload());
        listenersRegistered.current = true;
      }
    } catch (error) {
      console.error("MetaMask connection failed:", error);
      setStatus(error?.message || "Unable to connect MetaMask.");
    }
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;

    window.ethereum
      .request({ method: "eth_accounts" })
      .then((accounts) => {
        if (accounts.length > 0) connectWallet();
      })
      .catch((error) => console.error("Unable to check wallet connection:", error));
  }, [connectWallet]);

  return (
    <>
      {!modalOpen && account && (
        <button className="share" onClick={() => setModalOpen(true)}>
          Share
        </button>
      )}

      {modalOpen && <Modal setModalOpen={setModalOpen} contract={contract} />}

      <div className="App">
        <h1 style={{ color: "white" }}>Decentralized File Store &amp; Sharing 🔐</h1>

        <div className="bg"></div>
        <div className="bg bg2"></div>
        <div className="bg bg3"></div>

        <p style={{ color: "white" }}>
          Account: {account ? account : "Not connected"}
        </p>

        {status && <p role="alert" className="status">{status}</p>}

        {!account && (
          <button className="connect" onClick={connectWallet}>
            Connect MetaMask
          </button>
        )}

        {account && contract && (
          <>
            <FileUpload account={account} contract={contract} />
            <Display contract={contract} account={account} />
          </>
        )}
      </div>
    </>
  );
}

export default App;
