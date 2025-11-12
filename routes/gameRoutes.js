import express from "express";
import { saveGameScore } from "../controllers/gameController.js";

const router = express.Router();
router.post("/save", saveGameScore);
export default router;
