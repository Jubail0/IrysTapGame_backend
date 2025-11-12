import express from "express";
import { prepareMint, mintSuccess, evolveOffchain } from "../controllers/nftController.js";

const router = express.Router();
router.post("/mint", prepareMint);         // backend uploads metadata & returns metadataUrl
router.post("/mint-success", mintSuccess); // save minted token info after frontend on-chain mint
router.post("/evolve", evolveOffchain);    // manual evolve endpoint (free)
export default router;
