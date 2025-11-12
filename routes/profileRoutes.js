import express from "express";
import { getProfile, updateProfile, upload } from "../controllers/profileController.js";


const router = express.Router();

router.get("/:walletAddress", getProfile);
router.put("/update",upload.single("file"), updateProfile);


export default router;
