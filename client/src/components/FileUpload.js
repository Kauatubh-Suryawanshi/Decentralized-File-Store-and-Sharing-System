import { useState } from "react";
import axios from "axios";
import "./FileUpload.css";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:4000";

function fileToBase64(selectedFile) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const commaIndex = result.indexOf(",");
      resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
    };
    reader.onerror = () => reject(reader.error || new Error("Unable to read file"));
    reader.readAsDataURL(selectedFile);
  });
}

const FileUpload = ({ contract, account }) => {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("No file selected");
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!file || !contract || !account) return;

    try {
      setUploading(true);
      const data = await fileToBase64(file);

      const response = await axios.post(`${API_BASE_URL}/api/upload`, {
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        data,
      });

      const ipfsUrl = response.data?.ipfsUrl;
      if (!ipfsUrl) throw new Error("Upload service did not return an IPFS URL.");

      const transaction = await contract.add(ipfsUrl);
      await transaction.wait();

      alert("File uploaded successfully.");
      setFile(null);
      setFileName("No file selected");
    } catch (error) {
      console.error("File upload failed:", error);
      alert(error?.response?.data?.error || "Unable to upload the file. Check the console for details.");
    } finally {
      setUploading(false);
    }
  };

  const retrieveFile = (event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > 20 * 1024 * 1024) {
      alert("Please select a file smaller than 20 MB.");
      event.target.value = "";
      return;
    }

    setFile(selectedFile);
    setFileName(selectedFile.name);
    event.target.value = "";
  };

  return (
    <div className="top">
      <form className="form" onSubmit={handleSubmit}>
        <label htmlFor="file-upload" className="choose">
          Choose File
        </label>

        <input
          disabled={!account || uploading}
          type="file"
          id="file-upload"
          name="data"
          onChange={retrieveFile}
        />

        <span className="textArea">File: {fileName}</span>

        <button type="submit" className="upload" disabled={!file || uploading}>
          {uploading ? "Uploading..." : "Upload File"}
        </button>
      </form>
    </div>
  );
};

export default FileUpload;
