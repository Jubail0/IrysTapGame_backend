import express from "express";
import { connectWallet } from "../controllers/authController.js";

const router = express.Router();

router.post("/connect-wallet", connectWallet);

export default router;
