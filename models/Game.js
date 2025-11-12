import mongoose from "mongoose";

const gameSchema = new mongoose.Schema({
  walletAddress: { type: String, required: true, index: true },
  username: { type: String, default: "" }, // snapshot of username at time
  score: { type: Number, required: true },
  durationSec: { type: Number, required: true },
  savedAt: { type: Date, default: Date.now },
  irysTxId: { type: String },    // id returned from Irys uploader
  irysUri: { type: String },     // https://gateway.irys.xyz/<id>
}, { timestamps: true });

export default mongoose.model("Game", gameSchema);
