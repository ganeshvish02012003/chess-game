import { useCallback, useEffect, useRef, useState } from "react";
import ChessBoard from "./components/ChessBoard";
import GameSidebar from "./components/GameSidebar";
import GameModal from "./components/GameModal";
import { createStockfish } from "./stockfish/stockfish";
import { Chess } from "chess.js";

const API_URL =
  import.meta.env.VITE_BACKEND_DOMAIN || "http://localhost:8080";

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

function App() {
  /* ======================================================
     GAME
  ====================================================== */

  const gameRef = useRef(new Chess());

  const stockfishRef = useRef(null);

  /*
   * This ID changes whenever a new AI request starts,
   * or when Undo / Reset happens.
   *
   * Old Stockfish responses are ignored.
   */
  const aiRequestIdRef = useRef(0);

  /*
   * Prevents the AI effect from immediately moving
   * after Undo.
   */
  const skipNextAiRef = useRef(false);

  /*
   * Captured pieces ref keeps the latest value synchronously.
   */
  const capturedPiecesRef = useRef({
    white: [],
    black: [],
  });

  /*
   * Timers refs keep latest timer values synchronously.
   */
  const whiteTimeRef = useRef(INITIAL_TIME);
  const blackTimeRef = useRef(INITIAL_TIME);

  /*
   * Every position is stored here.
   */
  const snapshotsRef = useRef([]);

  const aiMovePendingRef = useRef(false);

  /* ======================================================
     STATE
  ====================================================== */

  const [game, setGame] = useState(() => new Chess());

  const [history, setHistory] = useState([]);

  const [capturedPieces, setCapturedPieces] =
    useState({
      white: [],
      black: [],
    });

  const [mode, setMode] =
    useState("computer");

  const [difficulty, setDifficulty] =
    useState("medium");

  const [playerColor, setPlayerColor] =
    useState("white");

  const [soundEnabled, setSoundEnabled] =
    useState(true);

  const [boardTheme, setBoardTheme] =
    useState("classic");

  const [thinking, setThinking] =
    useState(false);

  const [backendStatus, setBackendStatus] =
    useState("checking");

  const [selectedSquare, setSelectedSquare] =
    useState(null);

  const [legalMoves, setLegalMoves] =
    useState([]);

  const [lastMove, setLastMove] =
    useState(null);

  const [gameResult, setGameResult] =
    useState(null);

  const [showPromotion, setShowPromotion] =
    useState(null);

  const [whiteTime, setWhiteTime] =
    useState(INITIAL_TIME);

  const [blackTime, setBlackTime] =
    useState(INITIAL_TIME);

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
    capturedPiecesRef.current =
      capturedPieces;
  }, [capturedPieces]);

  /* ======================================================
     SOUND
  ====================================================== */

  const soundsRef = useRef({});

  const preloadSounds = useCallback(() => {
    Object.entries(SOUND_FILES).forEach(
      ([name, src]) => {
        const audio = new Audio(src);

        audio.preload = "auto";

        soundsRef.current[name] = audio;
      }
    );
  }, []);

  const playSound = useCallback(
    (name) => {
      if (!soundEnabled) return;

      const audio =
        soundsRef.current[name];

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
    [soundEnabled]
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
        const response = await fetch(
          `${API_URL}/api/health`
        );

        setBackendStatus(
          response.ok ? "online" : "offline"
        );
      } catch {
        setBackendStatus("offline");
      }
    };

    checkBackend();
  }, []);

  /* ======================================================
     LAST MOVE
  ====================================================== */

  const createLastMove = useCallback(
    (move) => {
      let rookFrom = null;
      let rookTo = null;

      const kingSide =
        move.flags?.includes("k");

      const queenSide =
        move.flags?.includes("q");

      if (kingSide) {
        rookFrom =
          move.color === "w"
            ? "h1"
            : "h8";

        rookTo =
          move.color === "w"
            ? "f1"
            : "f8";
      }

      if (queenSide) {
        rookFrom =
          move.color === "w"
            ? "a1"
            : "a8";

        rookTo =
          move.color === "w"
            ? "d1"
            : "d8";
      }

      return {
        from: move.from,
        to: move.to,
        piece: move.piece,
        color: move.color,
        promotion: move.promotion || null,
        captured: move.captured || null,

        castle:
          kingSide || queenSide,

        rookFrom,
        rookTo,

        timestamp: Date.now(),
      };
    },
    []
  );

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
      currentBlackTime
    ) => {
      return {
        fen: currentGame.fen(),

        history: currentHistory.map(
          (move) => ({ ...move })
        ),

        capturedPieces: {
          white: [
            ...(currentCaptured?.white || []),
          ],

          black: [
            ...(currentCaptured?.black || []),
          ],
        },

        whiteTime: currentWhiteTime,

        blackTime: currentBlackTime,

        lastMove: currentLastMove
          ? { ...currentLastMove }
          : null,
      };
    },
    []
  );

  const saveSnapshot = useCallback(
    (
      currentGame,
      currentHistory,
      currentCaptured,
      currentLastMove
    ) => {
      const snapshot =
        createSnapshot(
          currentGame,
          currentHistory,
          currentCaptured,
          currentLastMove,
          whiteTimeRef.current,
          blackTimeRef.current
        );

      snapshotsRef.current.push(
        snapshot
      );
    },
    [createSnapshot]
  );

  /* ======================================================
     RESTORE SNAPSHOT
  ====================================================== */

  const restoreSnapshot = useCallback(
    (snapshot, animate = true) => {
      if (!snapshot) return;

      const restoredGame =
        new Chess(snapshot.fen);

      gameRef.current =
        restoredGame;

      setGame(
        new Chess(snapshot.fen)
      );

      setHistory(
        snapshot.history.map(
          (move) => ({ ...move })
        )
      );

      const restoredCaptured = {
        white: [
          ...(snapshot.capturedPieces
            ?.white || []),
        ],

        black: [
          ...(snapshot.capturedPieces
            ?.black || []),
        ],
      };

      capturedPiecesRef.current =
        restoredCaptured;

      setCapturedPieces(
        restoredCaptured
      );

      whiteTimeRef.current =
        snapshot.whiteTime;

      blackTimeRef.current =
        snapshot.blackTime;

      setWhiteTime(
        snapshot.whiteTime
      );

      setBlackTime(
        snapshot.blackTime
      );

      setLastMove(
        snapshot.lastMove
          ? {
              ...snapshot.lastMove,

              /*
               * New timestamp makes the board
               * animate the restored last move.
               */
              timestamp: animate
                ? Date.now()
                : snapshot.lastMove
                    .timestamp,
            }
          : null
      );

      setSelectedSquare(null);

      setLegalMoves([]);

      setShowPromotion(null);

      setGameResult(null);

      setThinking(false);
    },
    []
  );

  /* ======================================================
     INITIAL SNAPSHOT
  ====================================================== */

  useEffect(() => {
    if (
      snapshotsRef.current.length === 0
    ) {
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
          INITIAL_TIME
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
        const winner =
          currentGame.turn() === "w"
            ? "Black"
            : "White";

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

      if (
        currentGame.isThreefoldRepetition()
      ) {
        setGameResult({
          type: "threefold",
        });

        return;
      }

      if (
        currentGame.isInsufficientMaterial()
      ) {
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
    [playSound]
  );

  /* ======================================================
     FINISH MOVE
  ====================================================== */

  const finishMove = useCallback(
    (move) => {
      const currentGame =
        gameRef.current;

      const newLastMove =
        createLastMove(move);

      const newHistory =
        currentGame.history({
          verbose: true,
        });

      /*
       * IMPORTANT:
       *
       * Calculate captured pieces synchronously
       * BEFORE React state update.
       */
      const previousCaptured =
        capturedPiecesRef.current;

      const newCaptured = {
        white: [
          ...previousCaptured.white,
        ],

        black: [
          ...previousCaptured.black,
        ],
      };

      if (move.captured) {
        if (move.color === "w") {
          newCaptured.white.push(
            move.captured
          );
        } else {
          newCaptured.black.push(
            move.captured
          );
        }
      }

      /*
       * Update ref FIRST.
       */
      capturedPiecesRef.current =
        newCaptured;

      /*
       * Then update React state.
       */
      setCapturedPieces(
        newCaptured
      );

      setGame(
        new Chess(currentGame.fen())
      );

      setHistory(newHistory);

      setLastMove(newLastMove);

      setSelectedSquare(null);

      setLegalMoves([]);

      /*
       * SAVE EXACT SNAPSHOT
       *
       * No async setState callback here.
       */
      saveSnapshot(
        currentGame,
        newHistory,
        newCaptured,
        newLastMove
      );

      /*
       * Sound
       */
      if (
        move.flags?.includes("k") ||
        move.flags?.includes("q")
      ) {
        playSound("castle");
      } else if (move.promotion) {
        playSound("promotion");
      } else if (move.captured) {
        playSound("capture");
      } else {
        playSound("move");
      }

      detectGameResult(
        currentGame
      );
    },
    [
      createLastMove,
      detectGameResult,
      playSound,
      saveSnapshot,
    ]
  );

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

      aiMovePendingRef.current =
        false;

      return;
    }

    const worker =
      createStockfish();

    stockfishRef.current =
      worker;

    worker.onmessage = (event) => {
      const message = String(
        event.data || ""
      );

      if (
        !message.startsWith(
          "bestmove"
        )
      ) {
        return;
      }

      /*
       * Ignore any AI response which
       * belongs to an old request.
       */
      const requestId =
        Number(
          worker.__requestId
        );

      if (
        requestId !==
        aiRequestIdRef.current
      ) {
        return;
      }

      /*
       * If Undo happened, completely
       * ignore this result.
       */
      if (skipNextAiRef.current) {
        return;
      }

      const parts =
        message.split(" ");

      const bestMove =
        parts[1];

      if (
        !bestMove ||
        bestMove === "(none)"
      ) {
        setThinking(false);

        aiMovePendingRef.current =
          false;

        return;
      }

      const from =
        bestMove.substring(
          0,
          2
        );

      const to =
        bestMove.substring(
          2,
          4
        );

      const promotion =
        bestMove.substring(
          4,
          5
        );

      /*
       * Capture the current request ID.
       */
      const thisRequestId =
        requestId;

      setTimeout(() => {
        /*
         * Undo/Reset happened while
         * Stockfish was thinking.
         */
        if (
          thisRequestId !==
          aiRequestIdRef.current
        ) {
          return;
        }

        if (
          skipNextAiRef.current
        ) {
          return;
        }

        const currentGame =
          gameRef.current;

        try {
          const move =
            currentGame.move({
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

        aiMovePendingRef.current =
          false;
      }, 150);
    };

    worker.postMessage("uci");

    worker.postMessage(
      "isready"
    );

    return () => {
      worker.terminate();

      stockfishRef.current =
        null;
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

    if (
      aiMovePendingRef.current
    ) {
      return;
    }

    /*
     * Undo restored a human turn.
     * Do NOT start AI immediately.
     */
    if (skipNextAiRef.current) {
      skipNextAiRef.current =
        false;

      return;
    }

    const currentGame =
      gameRef.current;

    const aiColor =
      playerColor === "white"
        ? "b"
        : "w";

    if (
      currentGame.turn() !==
      aiColor
    ) {
      return;
    }

    if (
      currentGame.isGameOver()
    ) {
      return;
    }

    const worker =
      stockfishRef.current;

    if (!worker) {
      return;
    }

    const config =
      DIFFICULTY[difficulty];

    /*
     * Create new request ID.
     */
    aiRequestIdRef.current += 1;

    const requestId =
      aiRequestIdRef.current;

    worker.__requestId =
      requestId;

    aiMovePendingRef.current =
      true;

    setThinking(true);

    worker.postMessage(
      "ucinewgame"
    );

    worker.postMessage(
      "isready"
    );

    worker.postMessage(
      `setoption name Skill Level value ${config.skill}`
    );

    worker.postMessage(
      `position fen ${currentGame.fen()}`
    );

    worker.postMessage(
      `go depth ${config.depth} movetime ${config.moveTime}`
    );
  }, [
    mode,
    playerColor,
    difficulty,
    game,
    thinking,
    gameResult,
  ]);

  /* ======================================================
     TIMER
  ====================================================== */

  useEffect(() => {
    if (gameResult) return;

    if (thinking) return;

    const timer =
      setInterval(() => {
        const currentTurn =
          gameRef.current.turn();

        if (currentTurn === "w") {
          setWhiteTime(
            (previous) => {
              const next =
                Math.max(
                  0,
                  previous - 1
                );

              whiteTimeRef.current =
                next;

              if (next === 0) {
                clearInterval(
                  timer
                );

                setGameResult({
                  type: "timeout",
                  winner: "Black",
                });
              }

              return next;
            }
          );
        } else {
          setBlackTime(
            (previous) => {
              const next =
                Math.max(
                  0,
                  previous - 1
                );

              blackTimeRef.current =
                next;

              if (next === 0) {
                clearInterval(
                  timer
                );

                setGameResult({
                  type: "timeout",
                  winner: "White",
                });
              }

              return next;
            }
          );
        }
      }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [
    game,
    thinking,
    gameResult,
  ]);

  /* ======================================================
     HUMAN MOVE
  ====================================================== */

  const handleSquareClick =
    useCallback(
      (square) => {
        if (gameResult) return;

        if (thinking) return;

        const currentGame =
          gameRef.current;

        if (
          mode === "computer" &&
          currentGame.turn() !==
            (playerColor ===
            "white"
              ? "w"
              : "b")
        ) {
          return;
        }

        const clickedPiece =
          currentGame.get(square);

        /*
         * First click
         */
        if (!selectedSquare) {
          if (
            clickedPiece &&
            clickedPiece.color ===
              currentGame.turn()
          ) {
            setSelectedSquare(
              square
            );

            const moves =
              currentGame.moves({
                square,
                verbose: true,
              });

            setLegalMoves(
              moves.map(
                (move) =>
                  move.to
              )
            );
          }

          return;
        }

        /*
         * Another own piece
         */
        if (
          clickedPiece &&
          clickedPiece.color ===
            currentGame.turn()
        ) {
          setSelectedSquare(
            square
          );

          const moves =
            currentGame.moves({
              square,
              verbose: true,
            });

          setLegalMoves(
            moves.map(
              (move) =>
                move.to
            )
          );

          return;
        }

        /*
         * Invalid destination
         */
        if (
          !legalMoves.includes(
            square
          )
        ) {
          setSelectedSquare(null);

          setLegalMoves([]);

          return;
        }

        const selectedPiece =
          currentGame.get(
            selectedSquare
          );

        /*
         * Promotion
         */
        if (
          selectedPiece?.type ===
            "p" &&
          ((selectedPiece.color ===
            "w" &&
            square[1] === "8") ||
            (selectedPiece.color ===
              "b" &&
              square[1] === "1"))
        ) {
          setShowPromotion({
            from: selectedSquare,
            to: square,
          });

          return;
        }

        /*
         * Normal move
         */
        try {
          const move =
            currentGame.move({
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
        playerColor,
        selectedSquare,
        thinking,
      ]
    );

  /* ======================================================
     PROMOTION
  ====================================================== */

  const handlePromotion =
    useCallback(
      (piece) => {
        if (!showPromotion) {
          return;
        }

        const currentGame =
          gameRef.current;

        try {
          const move =
            currentGame.move({
              from:
                showPromotion.from,

              to:
                showPromotion.to,

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
      [finishMove, showPromotion]
    );

  /* ======================================================
     RESET
  ====================================================== */

  const resetGame =
    useCallback(() => {
      /*
       * Invalidate all old AI responses.
       */
      aiRequestIdRef.current += 1;

      /*
       * Prevent old AI result.
       */
      skipNextAiRef.current =
        false;

      aiMovePendingRef.current =
        false;

      if (stockfishRef.current) {
        stockfishRef.current.postMessage(
          "stop"
        );
      }

      const newGame =
        new Chess();

      gameRef.current =
        newGame;

      const emptyCaptured = {
        white: [],
        black: [],
      };

      capturedPiecesRef.current =
        emptyCaptured;

      whiteTimeRef.current =
        INITIAL_TIME;

      blackTimeRef.current =
        INITIAL_TIME;

      setGame(
        new Chess(newGame.fen())
      );

      setHistory([]);

      setCapturedPieces(
        emptyCaptured
      );

      setSelectedSquare(null);

      setLegalMoves([]);

      setLastMove(null);

      setGameResult(null);

      setShowPromotion(null);

      setWhiteTime(
        INITIAL_TIME
      );

      setBlackTime(
        INITIAL_TIME
      );

      setThinking(false);

      /*
       * Reset complete snapshot history.
       */
      snapshotsRef.current = [
        createSnapshot(
          newGame,
          [],
          emptyCaptured,
          null,
          INITIAL_TIME,
          INITIAL_TIME
        ),
      ];

      playSound("gameStart");
    }, [
      createSnapshot,
      playSound,
    ]);

  /* ======================================================
     FULL UNDO
  ====================================================== */

  const undoMove =
    useCallback(() => {
      if (thinking) {
        /*
         * We still allow Undo if AI is thinking.
         * This is important because otherwise user
         * cannot cancel a pending AI response.
         */
      }

      /*
       * No move available.
       */
      if (
        snapshotsRef.current
          .length <= 1
      ) {
        return;
      }

      /*
       * INVALIDATE OLD AI REQUEST
       *
       * This is the most important fix.
       */
      aiRequestIdRef.current += 1;

      /*
       * Stop Stockfish immediately.
       */
      if (stockfishRef.current) {
        stockfishRef.current.postMessage(
          "stop"
        );
      }

      /*
       * Any old bestmove must be ignored.
       */
      aiMovePendingRef.current =
        false;

      setThinking(false);

      /*
       * Computer mode:
       *
       * Human + Computer = undo 2 moves.
       *
       * Local mode:
       *
       * undo 1 move.
       */
      const movesToUndo =
        mode === "computer"
          ? 2
          : 1;

      const currentIndex =
        snapshotsRef.current
          .length - 1;

      /*
       * Never go before initial position.
       */
      const targetIndex =
        Math.max(
          0,
          currentIndex -
            movesToUndo
        );

      const targetSnapshot =
        snapshotsRef.current[
          targetIndex
        ];

      if (!targetSnapshot) {
        return;
      }

      /*
       * Remove future states.
       */
      snapshotsRef.current =
        snapshotsRef.current.slice(
          0,
          targetIndex + 1
        );

      /*
       * Restore exact state.
       */
      restoreSnapshot(
        targetSnapshot,
        true
      );

      /*
       * IMPORTANT:
       *
       * Don't let AI immediately move
       * after the restored position.
       *
       * The AI effect will consume this
       * flag and return once.
       */
      if (mode === "computer") {
        skipNextAiRef.current =
          true;
      }
    }, [
      mode,
      restoreSnapshot,
      thinking,
    ]);

  /* ======================================================
     FORMAT TIME
  ====================================================== */

  const formatTime = (seconds) => {
    const minutes =
      Math.floor(seconds / 60);

    const remainingSeconds =
      seconds % 60;

    return `${String(
      minutes
    ).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  };

  /* ======================================================
     UI
  ====================================================== */

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800 bg-zinc-950/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
              Chess
            </h1>

            <p className="mt-0.5 text-xs text-zinc-500">
              React + Vite Chess Game
            </p>
          </div>

          <div className="flex items-center gap-3">
            {thinking && (
              <div className="hidden items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-400 sm:flex">
                <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
                AI Thinking
              </div>
            )}

            <div
              className={`rounded-full border px-3 py-1.5 text-xs ${
                backendStatus ===
                "online"
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                  : backendStatus ===
                    "offline"
                  ? "border-red-500/20 bg-red-500/10 text-red-400"
                  : "border-zinc-700 bg-zinc-900 text-zinc-500"
              }`}
            >
              {backendStatus ===
              "online"
                ? "Backend Online"
                : backendStatus ===
                  "offline"
                ? "Backend Offline"
                : "Checking..."}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-5 px-3 py-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:py-6">
        <section className="flex min-w-0 flex-col items-center">
          <div className="mb-4 flex w-full max-w-3xl items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-zinc-600">
                {mode ===
                "computer"
                  ? `${
                      playerColor ===
                      "white"
                        ? "White"
                        : "Black"
                    } vs Computer`
                  : "Local Multiplayer"}
              </p>

              <p className="mt-1 text-sm font-semibold text-zinc-300">
                {thinking
                  ? "Computer is thinking..."
                  : gameResult
                  ? "Game finished"
                  : game.turn() ===
                    "w"
                  ? "White to move"
                  : "Black to move"}
              </p>
            </div>

            <div className="flex gap-2">
              <div
                className={`rounded-xl border px-3 py-2 text-center ${
                  game.turn() ===
                  "w"
                    ? "border-emerald-500/40 bg-emerald-500/10"
                    : "border-zinc-800 bg-zinc-900"
                }`}
              >
                <div className="text-[10px] uppercase text-zinc-500">
                  White
                </div>

                <div className="font-mono text-sm font-bold">
                  {formatTime(
                    whiteTime
                  )}
                </div>
              </div>

              <div
                className={`rounded-xl border px-3 py-2 text-center ${
                  game.turn() ===
                  "b"
                    ? "border-emerald-500/40 bg-emerald-500/10"
                    : "border-zinc-800 bg-zinc-900"
                }`}
              >
                <div className="text-[10px] uppercase text-zinc-500">
                  Black
                </div>

                <div className="font-mono text-sm font-bold">
                  {formatTime(
                    blackTime
                  )}
                </div>
              </div>
            </div>
          </div>

          <ChessBoard
            game={game}
            selectedSquare={
              selectedSquare
            }
            legalMoves={legalMoves}
            lastMove={lastMove}
            onSquareClick={
              handleSquareClick
            }
            boardTheme={boardTheme}
          />
        </section>

        <GameSidebar
          mode={mode}
          setMode={setMode}
          difficulty={difficulty}
          setDifficulty={
            setDifficulty
          }
          playerColor={playerColor}
          setPlayerColor={
            setPlayerColor
          }
          capturedPieces={
            capturedPieces
          }
          soundEnabled={
            soundEnabled
          }
          setSoundEnabled={
            setSoundEnabled
          }
          thinking={thinking}
          backendStatus={
            backendStatus
          }
          boardTheme={boardTheme}
          setBoardTheme={
            setBoardTheme
          }
          history={history}
          onReset={resetGame}
          onUndo={undoMove}
        />
      </main>

      {gameResult && (
        <GameModal
          result={gameResult}
          onRestart={resetGame}
          onClose={() =>
            setGameResult(null)
          }
        />
      )}

      {showPromotion && (
        <GameModal
          promotion
          color={
            gameRef.current.turn()
          }
          onPromotion={
            handlePromotion
          }
          onClose={() =>
            setShowPromotion(null)
          }
        />
      )}
    </div>
  );
}

export default App;