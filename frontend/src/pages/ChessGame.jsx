import { useCallback, useEffect, useRef, useState } from "react";
import { Chess } from "chess.js";

import ChessBoard from "../components/ChessBoard";
import LeftSideBar from "../components/LeftSideBar";
import RightSideBar from "../components/RightSideBar";
import GameModal from "../components/GameModal";
import GameHeader from "../components/GameHeader";
import GameTopBar from "../components/GameTopBar";
import OnlineGameInfo from "../components/OnlineGameInfo";
import OnlineLobby from "../components/OnlineLobby";

import { createStockfish } from "../stockfish/stockfish";
import { useAuth } from "../context/AuthContext";
import { useChessSocket } from "../hooks/useChessSocket";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_BACKEND_DOMAIN || "http://localhost:8080";

const INITIAL_TIME = 10 * 60;

const SOUND_FILES = {
  move: "/sounds/move.mp3",
  capture: "/sounds/capture.mp3",
  check: "/sounds/check.mp3",
  checkmate: "/sounds/checkmate.mp3",
  castle: "/sounds/castle.mp3",
  promotion: "/sounds/promotion.mp3",
  gameStart: "/sounds/game-start.mp3",
};

const DIFFICULTY = {
  easy: {
    skill: 2,
    depth: 8,
    moveTime: 300,
  },

  medium: {
    skill: 10,
    depth: 12,
    moveTime: 700,
  },

  hard: {
    skill: 18,
    depth: 18,
    moveTime: 1200,
  },
};

function ChessGame() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  /* ======================================================
     ONLINE
  ====================================================== */

  const [mode, setMode] = useState("computer");

  const handleOnlineMode = useCallback(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    setMode("online");
  }, [navigate, user]);

  const socketEnabled = mode === "online";

  const {
    connected: socketConnected,
    connectionError,
    emit,
    on,
  } = useChessSocket(socketEnabled);

  const [onlineRoomCode, setOnlineRoomCode] = useState("");
  const [onlineColor, setOnlineColor] = useState(null);
  const [onlineOpponent, setOnlineOpponent] = useState(null);
  const [onlineWaiting, setOnlineWaiting] = useState(false);
  const [onlineStarted, setOnlineStarted] = useState(false);
  const [onlineError, setOnlineError] = useState("");

  /* ======================================================
     GAME REFS
  ====================================================== */

  const gameRef = useRef(new Chess());

  const stockfishRef = useRef(null);

  const aiRequestIdRef = useRef(0);

  const skipNextAiRef = useRef(false);

  const capturedPiecesRef = useRef({
    white: [],
    black: [],
  });

  const whiteTimeRef = useRef(INITIAL_TIME);
  const blackTimeRef = useRef(INITIAL_TIME);

  const snapshotsRef = useRef([]);

  const aiMovePendingRef = useRef(false);

  /* ======================================================
     STATE
  ====================================================== */

  const [game, setGame] = useState(() => new Chess());

  const [history, setHistory] = useState([]);

  const [capturedPieces, setCapturedPieces] = useState({
    white: [],
    black: [],
  });

  const [difficulty, setDifficulty] = useState("medium");

  const [playerColor, setPlayerColor] = useState("white");

  const [soundEnabled, setSoundEnabled] = useState(true);

  const [boardTheme, setBoardTheme] = useState("classic");

  const [thinking, setThinking] = useState(false);

  const [backendStatus, setBackendStatus] = useState("checking");

  const [selectedSquare, setSelectedSquare] = useState(null);

  const [legalMoves, setLegalMoves] = useState([]);

  const [lastMove, setLastMove] = useState(null);

  const [gameResult, setGameResult] = useState(null);

  const [showPromotion, setShowPromotion] = useState(null);

  const [whiteTime, setWhiteTime] = useState(INITIAL_TIME);

  const [blackTime, setBlackTime] = useState(INITIAL_TIME);

  /* ======================================================
     KEEP REFS IN SYNC
  ====================================================== */

  useEffect(() => {
    whiteTimeRef.current = whiteTime;
  }, [whiteTime]);

  useEffect(() => {
    blackTimeRef.current = blackTime;
  }, [blackTime]);

  useEffect(() => {
    capturedPiecesRef.current = capturedPieces;
  }, [capturedPieces]);

  /* ======================================================
     SOUND
  ====================================================== */

  const soundsRef = useRef({});

  const preloadSounds = useCallback(() => {
    Object.entries(SOUND_FILES).forEach(([name, src]) => {
      const audio = new Audio(src);

      audio.preload = "auto";

      soundsRef.current[name] = audio;
    });
  }, []);

  const playSound = useCallback(
    (name) => {
      if (!soundEnabled) return;

      const audio = soundsRef.current[name];

      if (!audio) return;

      try {
        audio.currentTime = 0;

        const promise = audio.play();

        if (promise?.catch) {
          promise.catch(() => {});
        }
      } catch {
        // Ignore browser audio errors
      }
    },
    [soundEnabled],
  );

  useEffect(() => {
    preloadSounds();
  }, [preloadSounds]);

  /* ======================================================
     BACKEND
  ====================================================== */

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch(`${API_URL}/api/health`);

        setBackendStatus(response.ok ? "online" : "offline");
      } catch {
        setBackendStatus("offline");
      }
    };

    checkBackend();
  }, []);

  /* ======================================================
     LAST MOVE
  ====================================================== */

  const createLastMove = useCallback((move) => {
    let rookFrom = null;
    let rookTo = null;

    const kingSide = move.flags?.includes("k");

    const queenSide = move.flags?.includes("q");

    if (kingSide) {
      rookFrom = move.color === "w" ? "h1" : "h8";

      rookTo = move.color === "w" ? "f1" : "f8";
    }

    if (queenSide) {
      rookFrom = move.color === "w" ? "a1" : "a8";

      rookTo = move.color === "w" ? "d1" : "d8";
    }

    return {
      from: move.from,
      to: move.to,
      piece: move.piece,
      color: move.color,
      promotion: move.promotion || null,
      captured: move.captured || null,

      castle: kingSide || queenSide,

      rookFrom,
      rookTo,

      timestamp: Date.now(),
    };
  }, []);

  /* ======================================================
     SNAPSHOT
  ====================================================== */

  const createSnapshot = useCallback(
    (
      currentGame,
      currentHistory,
      currentCaptured,
      currentLastMove,
      currentWhiteTime,
      currentBlackTime,
    ) => {
      return {
        fen: currentGame.fen(),

        history: currentHistory.map((move) => ({ ...move })),

        capturedPieces: {
          white: [...(currentCaptured?.white || [])],

          black: [...(currentCaptured?.black || [])],
        },

        whiteTime: currentWhiteTime,

        blackTime: currentBlackTime,

        lastMove: currentLastMove ? { ...currentLastMove } : null,
      };
    },
    [],
  );

  const saveSnapshot = useCallback(
    (currentGame, currentHistory, currentCaptured, currentLastMove) => {
      const snapshot = createSnapshot(
        currentGame,
        currentHistory,
        currentCaptured,
        currentLastMove,
        whiteTimeRef.current,
        blackTimeRef.current,
      );

      snapshotsRef.current.push(snapshot);
    },
    [createSnapshot],
  );

  /* ======================================================
     RESTORE SNAPSHOT
  ====================================================== */

  const restoreSnapshot = useCallback((snapshot, animate = true) => {
    if (!snapshot) return;

    const restoredGame = new Chess(snapshot.fen);

    gameRef.current = restoredGame;

    setGame(new Chess(snapshot.fen));

    setHistory(snapshot.history.map((move) => ({ ...move })));

    const restoredCaptured = {
      white: [...(snapshot.capturedPieces?.white || [])],

      black: [...(snapshot.capturedPieces?.black || [])],
    };

    capturedPiecesRef.current = restoredCaptured;

    setCapturedPieces(restoredCaptured);

    whiteTimeRef.current = snapshot.whiteTime;

    blackTimeRef.current = snapshot.blackTime;

    setWhiteTime(snapshot.whiteTime);

    setBlackTime(snapshot.blackTime);

    setLastMove(
      snapshot.lastMove
        ? {
            ...snapshot.lastMove,

            timestamp: animate ? Date.now() : snapshot.lastMove.timestamp,
          }
        : null,
    );

    setSelectedSquare(null);

    setLegalMoves([]);

    setShowPromotion(null);

    setGameResult(null);

    setThinking(false);
  }, []);

  /* ======================================================
     INITIAL SNAPSHOT
  ====================================================== */

  useEffect(() => {
    if (snapshotsRef.current.length === 0) {
      snapshotsRef.current = [
        createSnapshot(
          gameRef.current,
          [],
          {
            white: [],
            black: [],
          },
          null,
          INITIAL_TIME,
          INITIAL_TIME,
        ),
      ];
    }
  }, [createSnapshot]);

  /* ======================================================
     GAME RESULT
  ====================================================== */

  const detectGameResult = useCallback(
    (currentGame) => {
      if (currentGame.isCheckmate()) {
        const winner = currentGame.turn() === "w" ? "Black" : "White";

        setGameResult({
          type: "checkmate",
          winner,
        });

        playSound("checkmate");

        return;
      }

      if (currentGame.isStalemate()) {
        setGameResult({
          type: "stalemate",
        });

        return;
      }

      if (currentGame.isThreefoldRepetition()) {
        setGameResult({
          type: "threefold",
        });

        return;
      }

      if (currentGame.isInsufficientMaterial()) {
        setGameResult({
          type: "insufficient",
        });

        return;
      }

      if (currentGame.isDraw()) {
        setGameResult({
          type: "draw",
        });

        return;
      }

      if (currentGame.isCheck()) {
        playSound("check");
      }
    },
    [playSound],
  );

  /* ======================================================
     FINISH MOVE
  ====================================================== */

  const finishMove = useCallback(
    (move) => {
      const currentGame = gameRef.current;

      const newLastMove = createLastMove(move);

      const newHistory = currentGame.history({
        verbose: true,
      });

      const previousCaptured = capturedPiecesRef.current;

      const newCaptured = {
        white: [...previousCaptured.white],

        black: [...previousCaptured.black],
      };

      if (move.captured) {
        if (move.color === "w") {
          newCaptured.white.push(move.captured);
        } else {
          newCaptured.black.push(move.captured);
        }
      }

      capturedPiecesRef.current = newCaptured;

      setCapturedPieces(newCaptured);

      setGame(new Chess(currentGame.fen()));

      setHistory(newHistory);

      setLastMove(newLastMove);

      setSelectedSquare(null);

      setLegalMoves([]);

      saveSnapshot(currentGame, newHistory, newCaptured, newLastMove);

      if (move.flags?.includes("k") || move.flags?.includes("q")) {
        playSound("castle");
      } else if (move.promotion) {
        playSound("promotion");
      } else if (move.captured) {
        playSound("capture");
      } else {
        playSound("move");
      }

      detectGameResult(currentGame);

      /*
       * ONLINE MOVE
       *
       * Existing online functionality is kept here,
       * instead of sitting outside the component.
       */
      if (mode === "online") {
        emit("online_move", {
          fen: currentGame.fen(),
          history: newHistory,
          move: newLastMove,
        });
      }
    },
    [createLastMove, detectGameResult, emit, mode, playSound, saveSnapshot],
  );

  /* ======================================================
     ONLINE ROOM
  ====================================================== */

  const createPrivateRoom = useCallback(() => {
    setOnlineError("");

    emit("create_private_room");
  }, [emit]);

  const joinPrivateRoom = useCallback(
    (roomCode) => {
      setOnlineError("");

      emit("join_private_room", {
        roomCode,
      });
    },
    [emit],
  );

  const startQuickMatch = useCallback(() => {
    setOnlineError("");

    setOnlineWaiting(true);

    emit("quick_match");
  }, [emit]);

  /* ======================================================
     ONLINE RESET
  ====================================================== */

  const resetGameForOnline = useCallback(() => {
    aiRequestIdRef.current += 1;

    aiMovePendingRef.current = false;

    if (stockfishRef.current) {
      stockfishRef.current.postMessage("stop");
    }

    const newGame = new Chess();

    gameRef.current = newGame;

    const emptyCaptured = {
      white: [],
      black: [],
    };

    capturedPiecesRef.current = emptyCaptured;

    whiteTimeRef.current = INITIAL_TIME;

    blackTimeRef.current = INITIAL_TIME;

    setGame(new Chess(newGame.fen()));

    setHistory([]);

    setCapturedPieces(emptyCaptured);

    setSelectedSquare(null);

    setLegalMoves([]);

    setLastMove(null);

    setGameResult(null);

    setShowPromotion(null);

    setWhiteTime(INITIAL_TIME);

    setBlackTime(INITIAL_TIME);

    setThinking(false);

    snapshotsRef.current = [
      createSnapshot(
        newGame,
        [],
        emptyCaptured,
        null,
        INITIAL_TIME,
        INITIAL_TIME,
      ),
    ];
  }, [createSnapshot]);

  /* ======================================================
     ONLINE SOCKET LISTENERS
  ====================================================== */

  useEffect(() => {
    // Online mode nahi hai ya user logged in nahi hai
    if (mode !== "online" || !user) {
      return;
    }

    const cleanupRoom = on("room_state", (data) => {
      setOnlineRoomCode(data.roomCode);

      const me = data.players.find((player) => player.id === user.id);

      const opponent = data.players.find((player) => player.id !== user.id);

      setOnlineColor(me?.color || null);

      setOnlineOpponent(opponent || null);

      setOnlineStarted(data.gameStarted);

      if (data.gameStarted) {
        setOnlineWaiting(false);
      }
    });

    const cleanupStarted = on("match_started", (data) => {
      setOnlineRoomCode(data.roomCode);

      setOnlineWaiting(false);

      const color = data.whitePlayerId === user.id ? "white" : "black";

      setOnlineColor(color);

      setOnlineStarted(true);

      resetGameForOnline();
    });

    const cleanupWaiting = on("quick_match_waiting", () => {
      setOnlineWaiting(true);
    });

    const cleanupError = on("room_error", ({ message }) => {
      setOnlineError(message);
      setOnlineWaiting(false);
    });

    const cleanupOpponentLeft = on(
      "opponent_left",
      ({ winner, winnerId } = {}) => {
        setOnlineOpponent(null);

        setGameResult({
          type: "opponent_left",
          winner: winner === "white" ? "White" : "Black",
          winnerColor: winner,
          winnerId,
          title: "You Win!",
          message: "Your opponent left the game.",
        });

        setOnlineError("");
      },
    );

    const cleanupOpponentResult = on("opponent_game_result", ({ result }) => {
      if (!result) return;

      setGameResult(result);
    });

    const cleanupOpponentDisconnected = on(
      "opponent_disconnected",
      ({ winner, winnerId } = {}) => {
        setOnlineOpponent(null);

        setGameResult({
          type: "opponent_disconnected",
          winner: winner === "white" ? "White" : "Black",
          winnerColor: winner,
          winnerId,
          title: "You Win!",
          message: "Your opponent disconnected.",
        });

        setOnlineError("");
      },
    );

    return () => {
      cleanupRoom();
      cleanupStarted();
      cleanupWaiting();
      cleanupError();
      cleanupOpponentLeft();
      cleanupOpponentDisconnected();
      cleanupOpponentResult();
    };
  }, [mode, on, resetGameForOnline, user?.id]);

  /* ======================================================
     OPPONENT MOVE
  ====================================================== */

  useEffect(() => {
    if (mode !== "online" || !onlineStarted) {
      return;
    }

    return on("opponent_move", ({ fen, history: remoteHistory, move }) => {
      const remoteGame = new Chess(fen);

      gameRef.current = remoteGame;

      setGame(new Chess(remoteGame.fen()));

      setHistory(remoteHistory || []);

      setLastMove(move || null);

      setSelectedSquare(null);

      setLegalMoves([]);

      if (move?.captured) {
        const previous = capturedPiecesRef.current;

        const updated = {
          white: [...previous.white],

          black: [...previous.black],
        };

        if (move.color === "w") {
          updated.black.push(move.captured);
        } else {
          updated.white.push(move.captured);
        }

        capturedPiecesRef.current = updated;

        setCapturedPieces(updated);
      }

      if (move?.flags?.includes("k") || move?.flags?.includes("q")) {
        playSound("castle");
      } else if (move?.promotion) {
        playSound("promotion");
      } else if (move?.captured) {
        playSound("capture");
      } else {
        playSound("move");
      }

      detectGameResult(remoteGame);
    });
  }, [mode, onlineStarted, on, playSound, detectGameResult]);

  /* ======================================================
     STOCKFISH
  ====================================================== */

  useEffect(() => {
    if (mode !== "computer") {
      if (stockfishRef.current) {
        stockfishRef.current.terminate();

        stockfishRef.current = null;
      }

      setThinking(false);

      aiMovePendingRef.current = false;

      return;
    }

    const worker = createStockfish();

    stockfishRef.current = worker;

    worker.onmessage = (event) => {
      const message = String(event.data || "");

      if (!message.startsWith("bestmove")) {
        return;
      }

      const requestId = Number(worker.__requestId);

      if (requestId !== aiRequestIdRef.current) {
        return;
      }

      if (skipNextAiRef.current) {
        return;
      }

      const parts = message.split(" ");

      const bestMove = parts[1];

      if (!bestMove || bestMove === "(none)") {
        setThinking(false);

        aiMovePendingRef.current = false;

        return;
      }

      const from = bestMove.substring(0, 2);

      const to = bestMove.substring(2, 4);

      const promotion = bestMove.substring(4, 5);

      const thisRequestId = requestId;

      setTimeout(() => {
        if (thisRequestId !== aiRequestIdRef.current) {
          return;
        }

        if (skipNextAiRef.current) {
          return;
        }

        const currentGame = gameRef.current;

        try {
          const move = currentGame.move({
            from,
            to,

            ...(promotion
              ? {
                  promotion,
                }
              : {}),
          });

          if (move) {
            finishMove(move);
          }
        } catch {
          // Ignore invalid engine move
        }

        setThinking(false);

        aiMovePendingRef.current = false;
      }, 150);
    };

    worker.postMessage("uci");

    worker.postMessage("isready");

    return () => {
      worker.terminate();

      stockfishRef.current = null;
    };
  }, [mode, finishMove]);

  /* ======================================================
     AI MOVE
  ====================================================== */

  useEffect(() => {
    if (mode !== "computer") {
      return;
    }

    if (gameResult) {
      return;
    }

    if (thinking) {
      return;
    }

    if (aiMovePendingRef.current) {
      return;
    }

    if (skipNextAiRef.current) {
      skipNextAiRef.current = false;

      return;
    }

    const currentGame = gameRef.current;

    const aiColor = playerColor === "white" ? "b" : "w";

    if (currentGame.turn() !== aiColor) {
      return;
    }

    if (currentGame.isGameOver()) {
      return;
    }

    const worker = stockfishRef.current;

    if (!worker) {
      return;
    }

    const config = DIFFICULTY[difficulty];

    aiRequestIdRef.current += 1;

    const requestId = aiRequestIdRef.current;

    worker.__requestId = requestId;

    aiMovePendingRef.current = true;

    setThinking(true);

    worker.postMessage("ucinewgame");

    worker.postMessage("isready");

    worker.postMessage(`setoption name Skill Level value ${config.skill}`);

    worker.postMessage(`position fen ${currentGame.fen()}`);

    worker.postMessage(`go depth ${config.depth} movetime ${config.moveTime}`);
  }, [mode, playerColor, difficulty, game, thinking, gameResult]);

  /* ======================================================
     TIMER
  ====================================================== */

  useEffect(() => {
    if (gameResult) return;

    if (thinking) return;

    const timer = setInterval(() => {
      const currentTurn = gameRef.current.turn();

      if (currentTurn === "w") {
        setWhiteTime((previous) => {
          const next = Math.max(0, previous - 1);

          whiteTimeRef.current = next;

          if (next === 0) {
            clearInterval(timer);

            setGameResult({
              type: "timeout",
              winner: "Black",
            });
          }

          return next;
        });
      } else {
        setBlackTime((previous) => {
          const next = Math.max(0, previous - 1);

          blackTimeRef.current = next;

          if (next === 0) {
            clearInterval(timer);

            setGameResult({
              type: "timeout",
              winner: "White",
            });
          }

          return next;
        });
      }
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [game, thinking, gameResult]);

  /* ======================================================
     HUMAN MOVE
  ====================================================== */

  const handleSquareClick = useCallback(
    (square) => {
      if (gameResult) return;

      if (thinking) return;

      const currentGame = gameRef.current;

      /*
       * Computer turn protection
       */
      if (
        mode === "computer" &&
        currentGame.turn() !== (playerColor === "white" ? "w" : "b")
      ) {
        return;
      }

      /*
       * Online turn protection
       */
      if (mode === "online") {
        const currentTurn = currentGame.turn();

        const myTurn =
          (onlineColor === "white" && currentTurn === "w") ||
          (onlineColor === "black" && currentTurn === "b");

        if (!myTurn) {
          return;
        }
      }

      const clickedPiece = currentGame.get(square);

      if (!selectedSquare) {
        if (clickedPiece && clickedPiece.color === currentGame.turn()) {
          setSelectedSquare(square);

          const moves = currentGame.moves({
            square,
            verbose: true,
          });

          setLegalMoves(moves.map((move) => move.to));
        }

        return;
      }

      if (clickedPiece && clickedPiece.color === currentGame.turn()) {
        setSelectedSquare(square);

        const moves = currentGame.moves({
          square,
          verbose: true,
        });

        setLegalMoves(moves.map((move) => move.to));

        return;
      }

      if (!legalMoves.includes(square)) {
        setSelectedSquare(null);

        setLegalMoves([]);

        return;
      }

      const selectedPiece = currentGame.get(selectedSquare);

      if (
        selectedPiece?.type === "p" &&
        ((selectedPiece.color === "w" && square[1] === "8") ||
          (selectedPiece.color === "b" && square[1] === "1"))
      ) {
        setShowPromotion({
          from: selectedSquare,
          to: square,
        });

        return;
      }

      try {
        const move = currentGame.move({
          from: selectedSquare,
          to: square,
        });

        if (move) {
          finishMove(move);
        }
      } catch {
        setSelectedSquare(null);

        setLegalMoves([]);
      }
    },
    [
      finishMove,
      gameResult,
      legalMoves,
      mode,
      onlineColor,
      playerColor,
      selectedSquare,
      thinking,
    ],
  );

  /* ======================================================
     PROMOTION
  ====================================================== */

  const handlePromotion = useCallback(
    (piece) => {
      if (!showPromotion) {
        return;
      }

      const currentGame = gameRef.current;

      try {
        const move = currentGame.move({
          from: showPromotion.from,

          to: showPromotion.to,

          promotion: piece,
        });

        if (move) {
          finishMove(move);
        }
      } catch {
        // Ignore
      }

      setShowPromotion(null);
    },
    [finishMove, showPromotion],
  );

  /* ======================================================
     RESET
  ====================================================== */

  const resetGame = useCallback(() => {
    aiRequestIdRef.current += 1;

    skipNextAiRef.current = false;

    aiMovePendingRef.current = false;

    if (stockfishRef.current) {
      stockfishRef.current.postMessage("stop");
    }

    const newGame = new Chess();

    gameRef.current = newGame;

    const emptyCaptured = {
      white: [],
      black: [],
    };

    capturedPiecesRef.current = emptyCaptured;

    whiteTimeRef.current = INITIAL_TIME;

    blackTimeRef.current = INITIAL_TIME;

    setGame(new Chess(newGame.fen()));

    setHistory([]);

    setCapturedPieces(emptyCaptured);

    setSelectedSquare(null);

    setLegalMoves([]);

    setLastMove(null);

    setGameResult(null);

    setShowPromotion(null);

    setWhiteTime(INITIAL_TIME);

    setBlackTime(INITIAL_TIME);

    setThinking(false);

    snapshotsRef.current = [
      createSnapshot(
        newGame,
        [],
        emptyCaptured,
        null,
        INITIAL_TIME,
        INITIAL_TIME,
      ),
    ];

    playSound("gameStart");
  }, [createSnapshot, playSound]);

  /* ======================================================
     UNDO
  ====================================================== */

  const undoMove = useCallback(() => {
    if (snapshotsRef.current.length <= 1) {
      return;
    }

    /*
     * Undo online game disable
     */
    if (mode === "online") {
      return;
    }

    aiRequestIdRef.current += 1;

    if (stockfishRef.current) {
      stockfishRef.current.postMessage("stop");
    }

    aiMovePendingRef.current = false;

    setThinking(false);

    const movesToUndo = mode === "computer" ? 2 : 1;

    const currentIndex = snapshotsRef.current.length - 1;

    const targetIndex = Math.max(0, currentIndex - movesToUndo);

    const targetSnapshot = snapshotsRef.current[targetIndex];

    if (!targetSnapshot) {
      return;
    }

    snapshotsRef.current = snapshotsRef.current.slice(0, targetIndex + 1);

    restoreSnapshot(targetSnapshot, true);

    if (mode === "computer") {
      skipNextAiRef.current = true;
    }
  }, [mode, restoreSnapshot]);

  /* ======================================================
     FORMAT TIME
  ====================================================== */

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);

    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds,
    ).padStart(2, "0")}`;
  };

  /* ======================================================
     RENDER
  ====================================================== */

  const leaveOnlineGame = useCallback(() => {
    if (mode !== "online") return;

    emit("leave_room");

    setOnlineRoomCode("");
    setOnlineColor(null);
    setOnlineOpponent(null);
    setOnlineWaiting(false);
    setOnlineStarted(false);
    setOnlineError("");

    setGameResult(null);
    setShowPromotion(null);

    resetGameForOnline();
  }, [mode, emit, resetGameForOnline]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <GameHeader
        thinking={thinking}
        backendStatus={backendStatus}
        user={user}
        logout={logout}
      />

      {mode === "online" && !onlineStarted && (
        <OnlineLobby
          user={user}
          socketConnected={socketConnected}
          connectionError={connectionError}
          onlineRoomCode={onlineRoomCode}
          onlineWaiting={onlineWaiting}
          onlineError={onlineError}
          onCreatePrivateRoom={createPrivateRoom}
          onJoinPrivateRoom={joinPrivateRoom}
          onQuickMatch={startQuickMatch}
        />
      )}

      {mode === "online" && !onlineStarted ? null : (
        <main className="mx-auto grid w-full max-w-[1700px] grid-cols-1 gap-4 px-3 py-2 sm:px-6 lg:grid-cols-[25%_50%_25%] lg:gap-0 lg:px-4">
          {/* ================= LEFT ================= */}

          <section className="order-2 min-w-0 lg:order-1 lg:mr-0 ">
            <div>
              <h1 className="text-2xl font-black hidden md:block tracking-tight sm:text-3xl">
                Chess
              </h1>

              <p className="mt-0.5 text-xs hidden md:block text-zinc-500">
                React + Vite Chess Game
              </p>
            </div>

            <GameTopBar
              mode={mode}
              playerColor={playerColor}
              thinking={thinking}
              gameResult={gameResult}
              turn={game.turn()}
              whiteTime={formatTime(whiteTime)}
              blackTime={formatTime(blackTime)}
            />

            <LeftSideBar
              capturedPieces={capturedPieces}
            />
          </section>

          {/* ================= CENTER ================= */}

          <section className="order-1 lg:px-4 lg:pt-0 flex min-w-0 flex-col items-center lg:order-2">
            {mode === "online" && onlineStarted && (
              <OnlineGameInfo
                user={user}
                onlineColor={onlineColor}
                onlineRoomCode={onlineRoomCode}
                onlineOpponent={onlineOpponent}
                onLeaveGame={leaveOnlineGame}
              />
            )}

            <ChessBoard
              game={game}
              selectedSquare={selectedSquare}
              legalMoves={legalMoves}
              lastMove={lastMove}
              onSquareClick={handleSquareClick}
              boardTheme={boardTheme}
            />
          </section>

          {/* ================= RIGHT ================= */}

          <section className="order-3 min-w-0 ">
            <RightSideBar
              mode={mode}
              setMode={setMode}
              onOnlineMode={handleOnlineMode}
              difficulty={difficulty}
              setDifficulty={setDifficulty}
              playerColor={playerColor}
              setPlayerColor={setPlayerColor}
              soundEnabled={soundEnabled}
              setSoundEnabled={setSoundEnabled}
              thinking={thinking}
              boardTheme={boardTheme}
              setBoardTheme={setBoardTheme}
              backendStatus={backendStatus}
              user={user}
              logout={logout}
              history={history}
              onReset={resetGame}
              onUndo={undoMove}
            />
          </section>
        </main>
      )}

      {gameResult && (
        <GameModal
          type="gameover"
          result={gameResult}
          onRestart={() => {
            if (mode === "online") {
              setGameResult(null);
              resetGameForOnline();
              setOnlineStarted(false);
              setOnlineOpponent(null);
            } else {
              resetGame();
            }
          }}
          onClose={() => setGameResult(null)}
        />
      )}

      {showPromotion && (
        <GameModal
          type="promotion"
          color={gameRef.current.turn()}
          onPromotion={handlePromotion}
          onClose={() => setShowPromotion(null)}
        />
      )}
    </div>
  );
}

export default ChessGame;
