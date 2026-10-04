import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

import gameRoutes from "./routes/gameRoutes.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 8080;

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Chess Game Backend Running",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Chess API is healthy",
  });
});

app.use("/api/games", gameRoutes);

const startServer = async () => {
  try {
    if (process.env.MONGODB_URI) {
      try {
        await mongoose.connect(process.env.MONGODB_URI);

        console.log("MongoDB connected");
      } catch (error) {
        console.log(
          "MongoDB connection failed. Server will continue without database."
        );

        console.log(error.message);
      }
    }

    app.listen(PORT, () => {
      console.log(`Chess backend running on port ${PORT}`);
      console.log(`http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Server startup error:", error);
  }
};

startServer();