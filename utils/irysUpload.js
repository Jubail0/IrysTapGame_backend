import { Uploader } from "@irys/upload";
import { Ethereum } from "@irys/upload-ethereum";
import dotenv from "dotenv";
dotenv.config();

let cachedUploader = null;

export async function getUploader() {
  if (cachedUploader) return cachedUploader;

  cachedUploader = await Uploader(Ethereum)
    .withWallet(process.env.PRIVATE_KEY)
    .withRpc(process.env.IRYS_RPC);

  return cachedUploader;
}

// Upload JSON metadata
export async function uploadJSON(metadata, tags = []) {
  const uploader = await getUploader();
  const payload = JSON.stringify(metadata);
  const result = await uploader.upload(payload, { tags });
  const uri = `https://gateway.irys.xyz/mutable/${result.id}`;
  console.log("📦 JSON uploaded:", uri);
  return { id: result.id, uri };
}

// Upload a file from local path
export async function uploadFile(localPath, tags = []) {
  const uploader = await getUploader();
  console.log("📤 Uploading file:", localPath);
  const result = await uploader.uploadFile(localPath, { tags });
  const uri = `https://gateway.irys.xyz/${result.id}`;
  console.log("✅ File uploaded:", uri);
  return { id: result.id, uri };
}


