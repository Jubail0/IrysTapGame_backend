import express from "express";
import Game from "../models/Game.js";
import User from "../models/User.js";
import axios from "axios";

const router = express.Router();

/* -----------------------------------------
   GET /api/public/recent -> latest 10 games
------------------------------------------ */
router.get("/recent", async (req, res) => {
  const games = await Game.find().sort({ savedAt: -1 }).limit(10);
  res.json(games);
});

/* --------------------------------------------------------------
   GET /api/public/leaderboard -> top 100 users by totalScore
--------------------------------------------------------------- */
router.get("/leaderboard", async (req, res) => {
  const users = await User.find()
    .sort({ totalScore: -1 })
    .limit(100)
    .select(
      "username walletAddress dp totalScore totalGamesPlayed totalTimeSec bestScore"
    );

  res.json(users);
});

/* --------------------------------------------------------------
   POST /api/public/irys-rpc -> proxy to avoid CORS issues
--------------------------------------------------------------- */
router.post("/irys-rpc", async (req, res) => {
  try {
    const response = await axios.post(
      "https://testnet-rpc.irys.xyz/v1/execution-rpc",
      req.body, // forward the JSON-RPC request body
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    // Set CORS headers so browser can read the response
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "application/json");

    // Send RPC response back to client
    res.status(200).json(response.data);
  } catch (error) {
    console.error("Irys RPC Proxy Error:", error?.response?.data || error);

    res.setHeader("Access-Control-Allow-Origin", "*");

    res.status(500).json({
      error: "Irys RPC proxy failed",
      details: error?.response?.data || error.toString(),
    });
  }
});

/* --------------------------------------------------------------
   OPTIONS preflight (important for browsers)
--------------------------------------------------------------- */
router.options("/irys-rpc", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.sendStatus(200);
});

export default router;
