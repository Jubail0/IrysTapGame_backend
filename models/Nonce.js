import mongoose from "mongoose";

const nonceSchema = new mongoose.Schema({
  walletAddress: { type: String, required: true, unique: true },
  nonce: { type: Number, required: true },
  expiresAt: { type: Date, required: true },
});

export default mongoose.model("Nonce", nonceSchema);
