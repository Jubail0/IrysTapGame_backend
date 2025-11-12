import User from "../models/User.js";
import Game from "../models/Game.js";
import { uploadJSON } from "../utils/irysUpload.js";


// POST /api/game/save
// body: { walletAddress, score, durationSec }
export const saveGameScore = async (req, res) => {
  const durationSec = 30;

  try {
    const { walletAddress, score } = req.body;
    if (!walletAddress || typeof score !== "number") {
      return res.status(400).json({ error: "walletAddress & numeric score required" });
    }

    if(score < 10) return res.status(429).json({
      success:false,
      error: "Score must be above 10 to save."
    })

    const user = await User.findOne({ walletAddress });
    if (!user) return res.status(404).json({ error: "User not found" });

    const now = Date.now();
    const cooldownMs = 60000 * 2; // 5 min cooldown before next save

    if (user.lastPlayedAt && now - new Date(user.lastPlayedAt).getTime() < cooldownMs) {
       const remaining = Math.ceil((cooldownMs - (now - new Date(user.lastPlayedAt).getTime())) / 1000
  );
      return res.status(429).json({
        success: false,
        error: `Please wait ${remaining}s before saving again.`,
      });
    }

    // ✅ Passed cooldown → update immediately
    user.lastPlayedAt = new Date();

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

    // Update stats
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
