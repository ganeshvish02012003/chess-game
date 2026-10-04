import mongoose from "mongoose";

const gameSchema = new mongoose.Schema(
  {
    gameId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    whitePlayer: {
      type: String,
      default: "White",
    },

    blackPlayer: {
      type: String,
      default: "Black",
    },

    mode: {
      type: String,
      enum: ["computer", "local"],
      default: "local",
    },

    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },

    fen: {
      type: String,
      required: true,
    },

    moves: {
      type: [String],
      default: [],
    },

    status: {
      type: String,
      enum: [
        "playing",
        "check",
        "checkmate",
        "stalemate",
        "draw",
      ],
      default: "playing",
    },

    winner: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Game = mongoose.model("Game", gameSchema);

export default Game;