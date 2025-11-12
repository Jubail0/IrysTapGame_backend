import fs from "fs";
import User from "../models/User.js";
import { uploadJSON } from "../utils/irysUpload.js";


/**
 * POST /api/nft/mint
 * body: { walletAddress }
 * -> upload stage0 metadata and return metadataUrl (frontend will use to call contract.mint)
 */
export const prepareMint = async (req, res) => {
  try {
    const { walletAddress } = req.body;
    if (!walletAddress)
      return res.status(400).json({ error: "walletAddress required" });

    // Load metadata file
    const metadataList = JSON.parse(
      fs.readFileSync("./assets/metadata.json", "utf-8")
    );

    // Get Stage 1 metadata (Spark)
    const stage1Metadata = metadataList.find((m) =>
      m.attributes.some(
        (a) => a.trait_type === "Stage" && a.value === 1
      )
    );

    if (!stage1Metadata)
      return res.status(400).json({ error: "Stage 1 metadata not found" });

    // Add owner field
    const metadata = {
      ...stage1Metadata,
      owner: walletAddress,
    };

    const tags = [
      { name: "Content-Type", value: "application/json" },
      { name: "App-Name", value: "TapTap" },
      { name: "Type", value: "Metadata" },
      { name: "Stage", value: "1" },
    ];

    // Upload only Stage 1 metadata to Irys
    const upload = await uploadJSON(metadata, tags);

    return res.json({
      metadataUrl: upload.uri,
      rootTxId: upload.id,
      nft: metadata,
    });
  } catch (err) {
    console.error("prepareMint error:", err);
    return res.status(500).json({ error: "Failed to prepare mint" });
  }
};


/**
 * POST /api/nft/mint-success
 * body: { walletAddress, tokenId, txHash, metadataUrl, rootTxId }
 * -> save minted NFT info in DB and return updated user
 */
export const mintSuccess = async (req, res) => {
  try {
    const { walletAddress, tokenId, nftMetadataUrl,mintTxHash ,rootTxId, signature, nftMinted } = req.body;
    console.log(walletAddress, tokenId)
    if (!walletAddress || !tokenId) return res.status(400).json({ error: "Missing fields" });
    const mintedDate = new Date()
    const user = await User.findOneAndUpdate(
      { walletAddress },
      {
        nftMinted,
        nftMetadataUrl,
        nftStage: 1,
        mintTxHash,
        rootTxId: rootTxId || user?.rootTxId,
        signature,
        tokenId,
        mintedDate
      },
      { new: true, upsert: true }
    );

    return res.json({ message: "Mint Successful" });
  } catch (err) {
    console.error("mintSuccess error:", err);
    return res.status(500).json({ error: "Failed to save mint success" });
  }
};

/**
 * Helper used by gameController to auto evolve if thresholds hit
 */
export const evolveOffchain = async (req, res) => {
  const { walletAddress } = req.body;
  if (!walletAddress)
    return res.status(400).json({ error: "walletAddress required" });

  try {
    const user = await User.findOne({ walletAddress });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Stage tracking: 1 → 4
    const currentStage = user.nftStage || 1;
    const bestScore = user.totalScore || 0;

    // Define thresholds for evolving to next stages
    const thresholds = [8000,15000,25000]; // Stage 1→2, 2→3, 3→4

    if (currentStage >= 4) {
      return res.status(200).json({
        message: "🪄 Max Stage Reached",
        nft: {
          stage: currentStage,
          metadataUrl: user.nftMetadataUrl,
        },
      });
    }

    // Check score requirement
    const thresholdIndex = currentStage - 1; // because Stage 1 → thresholds[0]
    if (bestScore < thresholds[thresholdIndex]) {
      return res.status(400).json({
        message: `Need score ${thresholds[thresholdIndex]} to evolve to Stage ${
          currentStage + 1
        }`,
        nft: {
          stage: currentStage,
          metadataUrl: user.nftMetadataUrl,
        },
      });
    }

    const nextStage = currentStage + 1;
    console.log(`⚙️ Evolving ${walletAddress} from Stage ${currentStage} → ${nextStage}`);

    // Load metadata file
    const metadataList = JSON.parse(
      fs.readFileSync("./assets/metadata.json", "utf-8")
    );

    // Get metadata for the next stage
    const nextMetadata = metadataList.find((m) =>
      m.attributes.some(
        (a) => a.trait_type === "Stage" && a.value === nextStage
      )
    );

    if (!nextMetadata)
      return res
        .status(400)
        .json({ error: `Missing metadata for stage ${nextStage}` });

    // Prepare evolved metadata
    const metadata = {
      ...nextMetadata,
      owner: walletAddress,
    };

    const tags = [
      { name: "Content-Type", value: "application/json" },
      { name: "App-Name", value: "TapTap" },
      { name: "Type", value: "Metadata" },
      { name: "Stage", value: `${nextStage}` },
      { name: "Root-TX", value: user.rootTxId },
    ];

    // Upload evolved metadata
    const uploaded = await uploadJSON(metadata, tags);
    console.log(`✅ Uploaded metadata for Stage ${nextStage}:`, uploaded);

    // Update user record
    user.nftStage = nextStage;
    user.nftMetadataUrl = `https://gateway.irys.xyz/mutable/${user.rootTxId}`;
    await user.save();

    console.log(`🎯 User evolved to Stage ${nextStage}`);

    // Respond with updated metadata
    return res.json({
      success: true,
      message: `Evolved to Stage ${nextStage}`,
      nft: {
        stage: nextStage,
        metadataUrl: user.nftMetadataUrl,
        name: metadata.name,
        description: metadata.description,
        image: metadata.image,
        attributes: metadata.attributes,
      },
    });
  } catch (err) {
    console.error("❌ evolveOffchain error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};