import express from "express";

import {
  signup,
  login,
  getCurrentUser,
  logout,
} from "../controllers/authController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/signup", signup);

router.post("/login", login);

router.get("/me", authMiddleware, getCurrentUser);

router.post("/logout", authMiddleware, logout);

export default router;