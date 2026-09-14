import { useEffect, useState } from "react";
import "./Modal.css";

const Modal = ({ setModalOpen, contract }) => {
  const [address, setAddress] = useState("");
  const [accessList, setAccessList] = useState([]);
  const [sharing, setSharing] = useState(false);
  const [revoking, setRevoking] = useState("");

  const loadAccessList = async () => {
    if (!contract) return;

    try {
      const records = await contract.shareAccess();
      setAccessList(
        records
          .map((record) => ({ user: record.user, access: record.access }))
          .filter((record) => record.user && record.user !== "0x0000000000000000000000000000000000000000")
      );
    } catch (error) {
      console.error("Unable to load access list:", error);
    }
  };

  useEffect(() => {
    loadAccessList();
    // contract identity is stable for a connected wallet.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contract]);

  const handleShare = async () => {
    if (!address.trim() || !contract) return;

    try {
      setSharing(true);
      const transaction = await contract.allow(address.trim());
      await transaction.wait();
      setAddress("");
      await loadAccessList();
    } catch (error) {
      console.error("Sharing failed:", error);
      alert("Unable to grant access. Check the Ethereum address and wallet.");
    } finally {
      setSharing(false);
    }
  };

  const handleRevoke = async (user) => {
    try {
      setRevoking(user);
      const transaction = await contract.disallow(user);
      await transaction.wait();
      await loadAccessList();
    } catch (error) {
      console.error("Revocation failed:", error);
      alert("Unable to revoke access.");
    } finally {
      setRevoking("");
    }
  };

  return (
    <div className="modalBackground">
      <div className="modalContainer">
        <div className="title">Share With</div>

        <div className="body">
          <input
            type="text"
            className="address"
            placeholder="Enter Ethereum address"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
          />
        </div>

        <div className="accessList" aria-label="People with access">
          <strong>People With Access</strong>
          {accessList.length === 0 && <p>No shared addresses yet.</p>}
          {accessList.map((record) => (
            <div className="accessRow" key={record.user}>
              <span>{record.user}</span>
              <button
                type="button"
                onClick={() => handleRevoke(record.user)}
                disabled={!record.access || revoking === record.user}
              >
                {revoking === record.user ? "Revoking..." : record.access ? "Revoke" : "Revoked"}
              </button>
            </div>
          ))}
        </div>

        <div className="footer">
          <button onClick={() => setModalOpen(false)} id="cancelBtn" disabled={sharing || Boolean(revoking)}>
            Close
          </button>
          <button onClick={handleShare} disabled={sharing || Boolean(revoking) || !address.trim()}>
            {sharing ? "Sharing..." : "Share"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
