import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import evidenceRoutes from "./routes/evidenceRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import walletAuthRoutes from "./routes/walletAuthRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

// Load environment variables
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes); // Old username/password auth (deprecated)
app.use("/api/wallet-auth", walletAuthRoutes); // New MetaMask wallet auth
app.use("/api/evidence", evidenceRoutes);
app.use("/api/admin", adminRoutes);

// Health check endpoint for monitoring
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
