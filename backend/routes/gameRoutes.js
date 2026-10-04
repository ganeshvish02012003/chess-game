import express from "express";

import {
  createGame,
  saveGame,
  getGame,
  validateMove,
} from "../controllers/gameController.js";

const router = express.Router();

router.post("/create", createGame);

router.post("/save", saveGame);

router.get("/:gameId", getGame);

router.post("/validate-move", validateMove);

export default router;