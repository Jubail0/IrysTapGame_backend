import User from "../models/User.js";
import Game from "../models/Game.js";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { PassThrough } from "stream";
/**
 * GET /api/profile/:walletAddress
 * Fetch user profile and game history
 */

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const getProfile = async (req, res) => {
  try {
    const { walletAddress } = req.params;
   

    if (!walletAddress) {
      return res.status(400).json({ error: "walletAddress is required" });
    }

    const user = await User.findOne({ walletAddress });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const gameHistory = await Game.find({ walletAddress }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      user,
      gameHistory,
    });
  } catch (err) {
    console.error("getProfile error:", err);
    return res.status(500).json({ error: "Failed to fetch profile" });
  }
};

/**
 * PUT /api/profile/update
 * multipart/form-data
 * fields: walletAddress, username (optional), dpFile (optional)**/

// Multer setup for memory storage
export const upload = multer({ storage: multer.memoryStorage() });

export const updateProfile = async (req, res) => {
  try {
    const { walletAddress, username } = req.body;
    const file = req.file; // optional

    if (!walletAddress) {
      return res.status(400).json({ error: "walletAddress is required" });
    }

    const updateData = {};

    // ✅ Upload DP to Cloudinary if file is provided
    if (file) {
      const uploadPromise = new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "TapTap/ProfileDP" },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );

        const bufferStream = new PassThrough();
        bufferStream.end(file.buffer);
        bufferStream.pipe(stream);
      });

      const uploadResult = await uploadPromise;
      updateData.dp = uploadResult.secure_url;
    }

    // ✅ Update username if provided
    if (username && username.trim() !== "") {
      updateData.username = username.trim();
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No update data provided" });
    }

    // ✅ Update user record in MongoDB
    const user = await User.findOneAndUpdate(
      { walletAddress },
      { $set: updateData },
      { new: true, upsert: true }
    );

    return res.json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (err) {
    console.error("updateProfile error:", err);
    return res.status(500).json({ error: "Failed to update profile" });
  }
};