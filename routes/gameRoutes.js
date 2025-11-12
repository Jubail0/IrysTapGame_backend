import express from "express";
import { saveGameScore, getNonce } from "../controllers/gameController.js";

const router = express.Router();

// Get nonce for signing
router.get("/nonce", getNonce);

// Save game score (with signature verification)
router.post("/save", saveGameScore);

export default router;
