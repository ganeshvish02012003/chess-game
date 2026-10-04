import { useEffect, useMemo, useState } from "react";

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];

const PIECES = {
  wp: "♙",
  wr: "♖",
  wn: "♘",
  wb: "♗",
  wq: "♕",
  wk: "♔",

  bp: "♟",
  br: "♜",
  bn: "♞",
  bb: "♝",
  bq: "♛",
  bk: "♚",
};

const BOARD_THEMES = {
  classic: {
    light: "bg-[#f0d9b5]",
    dark: "bg-[#b58863]",
    coordinateLight: "text-[#b58863]",
    coordinateDark: "text-[#f0d9b5]",
  },

  green: {
    light: "bg-[#eeeed2]",
    dark: "bg-[#769656]",
    coordinateLight: "text-[#769656]",
    coordinateDark: "text-[#eeeed2]",
  },

  blue: {
    light: "bg-[#dbeafe]",
    dark: "bg-[#3b82f6]",
    coordinateLight: "text-[#3b82f6]",
    coordinateDark: "text-[#dbeafe]",
  },

  dark: {
    light: "bg-[#52525b]",
    dark: "bg-[#27272a]",
    coordinateLight: "text-zinc-900",
    coordinateDark: "text-zinc-300",
  },
};

function getSquarePosition(square) {
  const file = FILES.indexOf(square[0]);
  const rank = Number(square[1]);

  const row = 8 - rank;

  return {
    x: file * 12.5 + 6.25,
    y: row * 12.5 + 6.25,
  };
}

function ChessPiece({ piece }) {
  if (!piece) return null;

  const symbol =
    PIECES[
      `${piece.color}${piece.type}`
    ];

  const isWhite = piece.color === "w";

  return (
    <span
      className={`select-none text-[clamp(2rem,7vw,4.2rem)] leading-none drop-shadow-[0_3px_2px_rgba(0,0,0,0.45)] ${
        isWhite
          ? "text-white"
          : "text-zinc-950"
      }`}
      style={{
        fontFamily:
          '"Noto Sans Symbols 2", "Segoe UI Symbol", serif',
      }}
    >
      {symbol}
    </span>
  );
}

function AnimatedPiece({
  piece,
  from,
  to,
  delay = 0,
}) {
  const fromPosition = getSquarePosition(from);
  const toPosition = getSquarePosition(to);

  const [position, setPosition] = useState(fromPosition);

  useEffect(() => {
    setPosition(fromPosition);

    const frame = requestAnimationFrame(() => {
      setPosition(toPosition);
    });

    return () => cancelAnimationFrame(frame);
  }, [
    from,
    to,
    fromPosition.x,
    fromPosition.y,
    toPosition.x,
    toPosition.y,
  ]);

  return (
    <div
      className="pointer-events-none absolute z-30 flex h-[12.5%] w-[12.5%] items-center justify-center"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: "translate(-50%, -50%)",
        transitionProperty: "left, top",
        transitionDuration: "220ms",
        transitionTimingFunction:
          "cubic-bezier(0.22, 1, 0.36, 1)",
        transitionDelay: `${delay}ms`,
      }}
    >
      <ChessPiece piece={piece} />
    </div>
  );
}

function ChessBoard({
  game,
  selectedSquare,
  legalMoves = [],
  lastMove,
  onSquareClick,
  boardTheme = "classic",
}) {
  const theme =
    BOARD_THEMES[boardTheme] ||
    BOARD_THEMES.classic;

  const [animationKey, setAnimationKey] =
    useState(null);

  useEffect(() => {
    if (!lastMove?.timestamp) {
      setAnimationKey(null);
      return;
    }

    setAnimationKey(lastMove.timestamp);

    const timeout = setTimeout(() => {
      setAnimationKey(null);
    }, 280);

    return () => clearTimeout(timeout);
  }, [lastMove]);

  const board = useMemo(() => {
    return Array.from({ length: 8 }, (_, row) =>
      Array.from({ length: 8 }, (_, col) => {
        const file = FILES[col];
        const rank = 8 - row;

        const square = `${file}${rank}`;

        return {
          square,
          row,
          col,
          piece: game.get(square),
        };
      })
    );
  }, [game]);

  const isKingInCheck = (square) => {
    if (!game.isCheck()) return false;

    const piece = game.get(square);

    if (!piece || piece.type !== "k") {
      return false;
    }

    return piece.color === game.turn();
  };

  const isLastMoveSquare = (square) => {
    if (!lastMove) return false;

    return (
      square === lastMove.from ||
      square === lastMove.to
    );
  };

  const shouldHidePiece = (square) => {
    if (!animationKey || !lastMove) {
      return false;
    }

    if (
      square === lastMove.from ||
      square === lastMove.to
    ) {
      return true;
    }

    if (
      lastMove.rookFrom &&
      square === lastMove.rookFrom
    ) {
      return true;
    }

    if (
      lastMove.rookTo &&
      square === lastMove.rookTo
    ) {
      return true;
    }

    return false;
  };

  const getAnimatedMainPiece = () => {
    if (!lastMove) return null;

    return {
      color: lastMove.color,
      type: lastMove.promotion || lastMove.piece,
    };
  };

  const getAnimatedRook = () => {
    if (!lastMove?.rookFrom) return null;

    return {
      color: lastMove.color,
      type: "r",
    };
  };

  const animatedMainPiece =
    getAnimatedMainPiece();

  const animatedRook = getAnimatedRook();

  return (
    <div className="w-full max-w-3xl select-none">
      <div className="relative overflow-hidden rounded-xl border-4 border-zinc-900 bg-zinc-900 shadow-2xl shadow-black/40">
        <div className="relative aspect-square w-full">
          {board.map((row) =>
            row.map(
              ({
                square,
                row: rowIndex,
                col,
                piece,
              }) => {
                const isLight =
                  (rowIndex + col) % 2 === 0;

                const selected =
                  selectedSquare === square;

                const legal =
                  legalMoves.includes(square);

                const lastMoveSquare =
                  isLastMoveSquare(square);

                const check =
                  isKingInCheck(square);

                return (
                  <button
                    key={square}
                    type="button"
                    onClick={() =>
                      onSquareClick(square)
                    }
                    className={`absolute flex aspect-square w-[12.5%] items-center justify-center overflow-hidden transition-[filter] duration-150 ${
                      isLight
                        ? theme.light
                        : theme.dark
                    } ${
                      selected
                        ? "brightness-125"
                        : ""
                    }`}
                    style={{
                      left: `${col * 12.5}%`,
                      top: `${rowIndex * 12.5}%`,
                    }}
                  >
                    {/* Last move */}

                    {lastMoveSquare && (
                      <span className="pointer-events-none absolute inset-0 bg-yellow-300/30" />
                    )}

                    {/* Selected square */}

                    {selected && (
                      <span className="pointer-events-none absolute inset-0 border-4 border-yellow-300/80" />
                    )}

                    {/* Check */}

                    {check && (
                      <span className="pointer-events-none absolute inset-[7%] animate-pulse rounded-full bg-red-500/80 shadow-[0_0_30px_rgba(239,68,68,0.9)]" />
                    )}

                    {/* Legal move */}

                    {legal && !piece && (
                      <span className="pointer-events-none absolute h-[25%] w-[25%] rounded-full bg-black/25" />
                    )}

                    {/* Capture target */}

                    {legal && piece && (
                      <span className="pointer-events-none absolute inset-[8%] rounded-full border-[5px] border-black/25" />
                    )}

                    {/* Coordinates */}

                    {col === 0 && (
                      <span
                        className={`pointer-events-none absolute left-1 top-0.5 text-[10px] font-black sm:text-xs ${
                          isLight
                            ? theme.coordinateLight
                            : theme.coordinateDark
                        }`}
                      >
                        {8 - rowIndex}
                      </span>
                    )}

                    {rowIndex === 7 && (
                      <span
                        className={`pointer-events-none absolute bottom-0.5 right-1 text-[10px] font-black sm:text-xs ${
                          isLight
                            ? theme.coordinateLight
                            : theme.coordinateDark
                        }`}
                      >
                        {FILES[col]}
                      </span>
                    )}

                    {/* Normal piece */}

                    {!shouldHidePiece(square) && (
                      <span
                        className={`relative z-10 flex h-full w-full items-center justify-center ${
                          piece
                            ? "transition-transform duration-100 hover:scale-105"
                            : ""
                        }`}
                      >
                        <ChessPiece piece={piece} />
                      </span>
                    )}
                  </button>
                );
              }
            )
          )}

          {/* Smooth moving main piece */}

          {animationKey &&
            lastMove &&
            animatedMainPiece && (
              <AnimatedPiece
                key={`main-${animationKey}`}
                piece={animatedMainPiece}
                from={lastMove.from}
                to={lastMove.to}
              />
            )}

          {/* Smooth moving rook during castle */}

          {animationKey &&
            lastMove?.rookFrom &&
            lastMove?.rookTo &&
            animatedRook && (
              <AnimatedPiece
                key={`rook-${animationKey}`}
                piece={animatedRook}
                from={lastMove.rookFrom}
                to={lastMove.rookTo}
                delay={20}
              />
            )}

          {/* Board edge shine */}

          <div className="pointer-events-none absolute inset-0 z-40 rounded-lg ring-1 ring-inset ring-white/10" />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-center gap-2 text-xs text-zinc-600">
        <span>Click a piece</span>
        <span>•</span>
        <span>Choose a highlighted square</span>
      </div>
    </div>
  );
}

export default ChessBoard;