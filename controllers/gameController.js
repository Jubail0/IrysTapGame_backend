import User from "../models/User.js";
import Game from "../models/Game.js";
import Nonce from "../models/Nonce.js"; // <-- new
import { uploadJSON } from "../utils/irysUpload.js";
import { ethers } from "ethers";

// GET /api/game/nonce?walletAddress=0x...
export const getNonce = async (req, res) => {
  const { walletAddress } = req.query;
  if (!walletAddress) return res.status(400).json({ error: "Wallet address required" });

  try {
    const nonceValue = Math.floor(Math.random() * 1_000_000); // random 6-digit number
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min expiry

    // Upsert nonce for this wallet
    await Nonce.findOneAndUpdate(
      { walletAddress: walletAddress.toLowerCase() },
      { nonce: nonceValue, expiresAt },
      { upsert: true, new: true }
    );

    res.json({ nonce: nonceValue });
  } catch (err) {
    console.error("getNonce error:", err);
    res.status(500).json({ error: "Failed to generate nonce" });
  }
};

// POST /api/game/save
export const saveGameScore = async (req, res) => {
  const durationSec = 30;

  try {
    const { walletAddress, score, signature } = req.body;
    if (!walletAddress || typeof score !== "number" || !signature) {
      return res.status(400).json({ error: "walletAddress, numeric score, and signature required" });
    }

    // ✅ Fetch nonce from DB
    const nonceDoc = await Nonce.findOne({ walletAddress: walletAddress.toLowerCase() });
    if (!nonceDoc) return res.status(400).json({ error: "Nonce not found. Please request a new nonce." });

    if (nonceDoc.expiresAt < new Date()) {
      // Expired
      await Nonce.deleteOne({ walletAddress: walletAddress.toLowerCase() });
      return res.status(400).json({ error: "Nonce expired. Please request a new one." });
    }

    // ✅ Verify signature
    const message = `Submit score ${score} - nonce: ${nonceDoc.nonce}`;
    let signer;
    try {
      signer = ethers.verifyMessage(message, signature);
    } catch {
      return res.status(401).json({ error: "Invalid signature" });
    }

    if (signer.toLowerCase() !== walletAddress.toLowerCase()) {
      return res.status(401).json({ error: "Signature does not match wallet" });
    }

    // ✅ Signature valid → remove nonce
    await Nonce.deleteOne({ walletAddress: walletAddress.toLowerCase() });

    // Minimum score check
    if (score < 10) return res.status(429).json({
      success: false,
      error: "Score must be above 10 to save."
    });

    const user = await User.findOne({ walletAddress });
    if (!user) return res.status(404).json({ error: "User not found" });

    const now = Date.now();
    const cooldownMs = 2 * 60 * 1000; // 2 min cooldown
    if (user.lastPlayedAt && now - new Date(user.lastPlayedAt).getTime() < cooldownMs) {
      const remaining = Math.ceil((cooldownMs - (now - new Date(user.lastPlayedAt).getTime())) / 1000);
      return res.status(429).json({
        success: false,
        error: `Please wait ${remaining}s before saving again.`,
      });
    }

    // Passed cooldown → update immediately
    user.lastPlayedAt = new Date();

    // Upload metadata to Irys
    const metadata = {
      name: `TapTap Score`,
      description: `Score saved on Irys for ${user.username}`,
      score,
      durationSec,
      walletAddress,
      savedAt: new Date().toISOString(),
    };

    const tags = [
      { name: "Content-Type", value: "application/json" },
      { name: "App-Name", value: "TapTap" },
      { name: "Type", value: "GameScore" },
    ];

    const upload = await uploadJSON(metadata, tags);
    const irysTxId = upload.id;
    const irysUri = upload.uri;

    // Create Game record
    await Game.create({
      walletAddress,
      username: user.username || "",
      score,
      durationSec,
      irysTxId,
      irysUri,
    });

    // Update user stats
    user.totalGamesPlayed = (user.totalGamesPlayed || 0) + 1;
    user.totalScore = (user.totalScore || 0) + score;
    user.bestScore = Math.max(user.bestScore || 0, score);
    user.totalTimeSec = (user.totalTimeSec || 0) + durationSec;
    await user.save();

    return res.json({ success: true, message: "Score saved on Irys!" });

  } catch (err) {
    console.error("saveGameScore error:", err);
    return res.status(500).json({ error: "Failed to save score" });
  }
};