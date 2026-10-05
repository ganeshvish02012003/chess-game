import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";

import connectDB from "./config/db.js";
import gameRoutes from "./routes/gameRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { setupChessSocket } from "./socket/chessSocket.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 8080;

const server = http.createServer(app);

const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
};

// CORS
app.use(cors(corsOptions));

// Body parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Cookies
app.use(cookieParser());

// Socket.io
const io = new Server(server, {
  cors: corsOptions,
});

// Health
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Chess API is healthy",
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/games", gameRoutes);

// Socket
setupChessSocket(io);

// Start server
const startServer = async () => {
  try {
    await connectDB();

    server.listen(PORT, () => {
      console.log(`♟️ Chess backend running on port ${PORT}`);
      console.log(`http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();