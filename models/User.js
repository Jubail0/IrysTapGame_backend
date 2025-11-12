import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  walletAddress: { type: String, unique: true, required: true },
  username: { type: String, default: "" },
  dp: { type: String, default: "" }, // Irys URL
  nftMinted: { type: Boolean, default: false },
  nftMetadataUrl: { type: String, default: "" },
  nftStage: { type: Number, default: 0 },
  mintTxHash: { type: String, default: "" },
  rootTxId: { type: String, default: "" },
  signature : {type:String, default: ""},
  tokenId : {type:String, default: ""},
  mintedDate: { type: Date },

  // aggregated game stats
  totalScore: { type: Number, default: 0 },
  bestScore: { type: Number, default: 0 },
  totalGamesPlayed: { type: Number, default: 0 },
  totalTimeSec: { type: Number, default: 0 }, // time spent in seconds
  lastPlayedAt: { type: Date },
}, { timestamps: true });

export default mongoose.model("User", userSchema);
