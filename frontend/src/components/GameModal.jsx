function GameModal({
  type,
  result,
  onRestart,
  onClose,
  onPromotion,
}) {
  /*
   * ----------------------------------------------------
   * PROMOTION MODAL
   * ----------------------------------------------------
   */

  if (type === "promotion") {
    const pieces = [
      {
        value: "q",
        symbol: "♕",
        label: "Queen",
      },
      {
        value: "r",
        symbol: "♖",
        label: "Rook",
      },
      {
        value: "b",
        symbol: "♗",
        label: "Bishop",
      },
      {
        value: "n",
        symbol: "♘",
        label: "Knight",
      },
    ];

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
        <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl">
          <div className="mb-5 text-center">
            <h2 className="text-xl font-black text-white">
              Choose Promotion
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Select the piece for your pawn.
            </p>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {pieces.map((piece) => (
              <button
                key={piece.value}
                type="button"
                onClick={() =>
                  onPromotion(piece.value)
                }
                className="group flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 p-3 transition hover:border-yellow-500 hover:bg-zinc-800"
              >
                <span className="text-4xl text-white transition group-hover:scale-110">
                  {piece.symbol}
                </span>

                <span className="mt-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500 group-hover:text-yellow-400">
                  {piece.label}
                </span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-4 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  /*
   * ----------------------------------------------------
   * GAME OVER MODAL
   * ----------------------------------------------------
   */

  if (type === "gameover") {
    const isDraw = !result?.winner;

    let icon = "♔";

    if (result?.type === "checkmate") {
      icon = "♚";
    }

    if (result?.type === "stalemate") {
      icon = "½";
    }

    if (result?.type === "threefold") {
      icon = "↻";
    }

    if (result?.type === "insufficient") {
      icon = "½";
    }

    if (result?.type === "timeout") {
      icon = "⏱";
    }

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
        <div className="w-full max-w-md overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl">
          {/* TOP */}
          <div className="flex flex-col items-center px-6 pb-5 pt-8 text-center">
            <div
              className={`mb-4 flex h-20 w-20 items-center justify-center rounded-full border text-4xl ${
                isDraw
                  ? "border-zinc-700 bg-zinc-900 text-zinc-300"
                  : "border-yellow-700 bg-yellow-950/40 text-yellow-300"
              }`}
            >
              {icon}
            </div>

            <h2 className="text-3xl font-black text-white">
              {result?.title || "Game Over"}
            </h2>

            <p className="mt-2 text-sm text-zinc-500">
              {result?.message ||
                "The game has ended."}
            </p>

            {/* RESULT */}
            {result?.winner && (
              <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Winner
                </p>

                <p className="mt-1 text-lg font-black capitalize text-white">
                  {result.winner}
                </p>
              </div>
            )}

            {isDraw && (
              <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Result
                </p>

                <p className="mt-1 text-lg font-black text-zinc-200">
                  Draw
                </p>
              </div>
            )}
          </div>

          {/* ACTIONS */}
          <div className="grid grid-cols-2 gap-3 border-t border-zinc-800 bg-zinc-900/50 p-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-bold text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
            >
              Close
            </button>

            <button
              type="button"
              onClick={onRestart}
              className="rounded-xl bg-yellow-500 px-4 py-3 text-sm font-black text-black transition hover:bg-yellow-400"
            >
              New Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default GameModal;