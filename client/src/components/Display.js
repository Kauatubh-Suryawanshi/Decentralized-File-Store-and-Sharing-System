import { useState } from "react";
import "./Display.css";

const Display = ({ contract, account }) => {
  const [data, setData] = useState([]);
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  const getData = async () => {
    const targetAddress = address.trim() || account;
    if (!targetAddress) return;

    try {
      setLoading(true);
      const dataArray = await contract.display(targetAddress);

      if (!dataArray || dataArray.length === 0) {
        setData([]);
        alert("No files to display.");
        return;
      }

      setData(dataArray.map((item, index) => ({ url: item, index })));
    } catch (error) {
      console.error("Unable to retrieve files:", error);
      setData([]);
      alert("You don't have access to this address's files.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="image-list">
        {data.map(({ url, index }) => (
          <a key={`${url}-${index}`} href={url} target="_blank" rel="noopener noreferrer">
            Open file {index + 1}
          </a>
        ))}
      </div>

      <input
        type="text"
        placeholder="Enter Ethereum address (optional)"
        className="address"
        aria-label="Ethereum address"
        value={address}
        onChange={(event) => setAddress(event.target.value)}
      />

      <button className="center button" onClick={getData} disabled={loading}>
        {loading ? "Loading..." : "Get Files"}
      </button>
    </>
  );
};

export default Display;
