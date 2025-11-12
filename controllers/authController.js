import User from "../models/User.js";

export const connectWallet = async (req, res) => {
  try {
    const { walletAddress } = req.body;
    if (!walletAddress) return res.status(400).json({ error: "Wallet address required" });

    // Check if user exists
    let user = await User.findOne({ walletAddress });
  

    // Create if not exists
    if (!user) {
      user = await User.create({
        walletAddress,
        username: "Datapunk", // temporary name
        dp: "",
        totalGames: 0,
        totalScore: 0,
        highestScore: 0,
        totalTime: 0,
      });
    }


   
    return res.json({
      success: true,
      message: user ? "Login Successful" : "New user created",
      user
    });
  } catch (err) {
    console.error("Error connecting wallet:", err);
    res.status(500).json({ error: "Server error" });
  }
};
