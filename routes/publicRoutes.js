import express from "express";
import Game from "../models/Game.js";
import User from "../models/User.js";

const router = express.Router();

// GET /api/public/recent -> latest 3 global scores
router.get("/recent", async (req, res) => {
  const games = await Game.find().sort({ savedAt: -1 }).limit(10);
  res.json(games);
});

// GET /api/public/leaderboard -> ranked by totalScore desc, include dp/username
router.get("/leaderboard", async (req, res) => {
  // top 100 maybe
  const users = await User.find().sort({ totalScore: -1 }).limit(100).select("username walletAddress dp totalScore totalGamesPlayed totalTimeSec bestScore");
  res.json(users);
});

export default router;
