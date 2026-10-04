import { Chess } from "chess.js";
import Game from "../models/Game.js";

export const createGame = async (req, res) => {
  try {
    const {
      whitePlayer = "White",
      blackPlayer = "Black",
      mode = "local",
      difficulty = "medium",
    } = req.body;

    const chess = new Chess();

    const gameId =
      Date.now().toString(36) +
      Math.random().toString(36).substring(2, 8);

    let savedGame = null;

    if (Game.db.readyState === 1) {
      savedGame = await Game.create({
        gameId,
        whitePlayer,
        blackPlayer,
        mode,
        difficulty,
        fen: chess.fen(),
        moves: [],
        status: "playing",
      });
    }

    res.status(201).json({
      success: true,

      game: {
        gameId,

        whitePlayer,

        blackPlayer,

        mode,

        difficulty,

        fen: chess.fen(),

        moves: [],

        status: "playing",
      },

      databaseSaved: Boolean(savedGame),
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Unable to create game",
    });
  }
};

export const saveGame = async (req, res) => {
  try {
    const {
      gameId,
      fen,
      moves = [],
      status = "playing",
      winner = null,
    } = req.body;

    if (!gameId || !fen) {
      return res.status(400).json({
        success: false,
        message: "gameId and fen are required",
      });
    }

    if (Game.db.readyState !== 1) {
      return res.json({
        success: true,
        message: "Game received but database is not connected",
        databaseSaved: false,
      });
    }

    const game = await Game.findOneAndUpdate(
      { gameId },
      {
        fen,
        moves,
        status,
        winner,
      },
      {
        new: true,
        upsert: true,
      }
    );

    res.json({
      success: true,
      message: "Game saved successfully",
      databaseSaved: true,
      game,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Unable to save game",
    });
  }
};

export const getGame = async (req, res) => {
  try {
    const { gameId } = req.params;

    if (Game.db.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: "Database is not connected",
      });
    }

    const game = await Game.findOne({ gameId });

    if (!game) {
      return res.status(404).json({
        success: false,
        message: "Game not found",
      });
    }

    res.json({
      success: true,
      game,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Unable to get game",
    });
  }
};

export const validateMove = async (req, res) => {
  try {
    const { fen, from, to, promotion } = req.body;

    if (!fen || !from || !to) {
      return res.status(400).json({
        success: false,
        message: "fen, from and to are required",
      });
    }

    const chess = new Chess(fen);

    try {
      const move = chess.move({
        from,
        to,
        promotion: promotion || "q",
      });

      res.json({
        success: true,

        legal: true,

        move,

        fen: chess.fen(),

        history: chess.history(),

        turn: chess.turn(),

        check: chess.inCheck(),

        checkmate: chess.isCheckmate(),

        stalemate: chess.isStalemate(),

        draw: chess.isDraw(),

        gameOver: chess.isGameOver(),
      });
    } catch {
      res.json({
        success: true,
        legal: false,
        message: "Illegal move",
      });
    }
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Move validation failed",
    });
  }
};