import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import nftRoutes from "./routes/nftRoutes.js";
import gameRoutes from "./routes/gameRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import publicRoutes from "./routes/publicRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import bodyParser from "body-parser";

await connectDB();

const app = express();
app.use(cors({
  origin: process.env.FRONT_END_URL,
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());
app.use(bodyParser.json());

app.use("/api/auth", authRoutes);
app.use("/api/nft", nftRoutes);
app.use("/api/game", gameRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/public", publicRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
