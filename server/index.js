const fs = require("fs");
const http = require("http");
const path = require("path");

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv(path.join(__dirname, "..", ".env"));

const PORT = Number(process.env.PORT || 4000);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:3000";
const MAX_FILE_BYTES = 20 * 1024 * 1024;

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": CLIENT_ORIGIN,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(body);
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;

    req.on("data", (chunk) => {
      total += chunk.length;
      if (total > MAX_FILE_BYTES * 1.4) {
        reject(Object.assign(new Error("Request too large"), { code: "LIMIT" }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": CLIENT_ORIGIN,
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    return res.end();
  }

  if (req.method === "GET" && req.url === "/api/health") {
    return sendJson(res, 200, { ok: true, service: "decentrashare-api" });
  }

  if (req.method !== "POST" || req.url !== "/api/upload") {
    return sendJson(res, 404, { error: "Not found" });
  }

  const apiKey = process.env.PINATA_API_KEY;
  const secretApiKey = process.env.PINATA_SECRET_API_KEY;
  if (!apiKey || !secretApiKey) {
    return sendJson(res, 503, { error: "Pinata credentials are not configured on the server." });
  }

  try {
    const rawBody = await readRequestBody(req);
    const payload = JSON.parse(rawBody);
    const { fileName, mimeType, data } = payload;

    if (!fileName || !data) {
      return sendJson(res, 400, { error: "fileName and data are required." });
    }

    const fileBuffer = Buffer.from(data, "base64");
    if (fileBuffer.length === 0) {
      return sendJson(res, 400, { error: "The uploaded file is empty." });
    }
    if (fileBuffer.length > MAX_FILE_BYTES) {
      return sendJson(res, 413, { error: "File exceeds the 20 MB upload limit." });
    }

    const form = new FormData();
    form.append("file", new Blob([fileBuffer], { type: mimeType || "application/octet-stream" }), fileName);

    const pinataResponse = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        pinata_api_key: apiKey,
        pinata_secret_api_key: secretApiKey,
      },
      body: form,
    });

    if (!pinataResponse.ok) {
      console.error("Pinata response:", await pinataResponse.text());
      return sendJson(res, 502, { error: "Unable to upload the file to IPFS." });
    }

    const result = await pinataResponse.json();
    const cid = result?.IpfsHash;
    if (!cid) return sendJson(res, 502, { error: "Pinata did not return an IPFS CID." });

    return sendJson(res, 200, {
      cid,
      ipfsUrl: `https://gateway.pinata.cloud/ipfs/${cid}`,
    });
  } catch (error) {
    console.error("Upload service error:", error);
    const status = error.code === "LIMIT" ? 413 : 500;
    return sendJson(res, status, {
      error: status === 413 ? "Request exceeds the 20 MB upload limit." : "Unexpected server error.",
    });
  }
});

server.listen(PORT, () => {
  console.log(`DecentraShare API listening on http://localhost:${PORT}`);
});
