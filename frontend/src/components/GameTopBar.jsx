function GameTopBar({
  mode,
  playerColor,
  thinking,
  gameResult,
  turn,
  whiteTime,
  blackTime,
}) {
  return (
    <div className="mb-4 flex w-full max-w-3xl items-center justify-between">
      <div>
        <p className="text-xs uppercase tracking-widest text-zinc-600">
          {mode === "computer"
            ? `${
                playerColor === "white"
                  ? "White"
                  : "Black"
              } vs Computer`
            : mode === "online"
            ? "Online Multiplayer"
            : "Local Multiplayer"}
        </p>

        <p className="mt-1 text-sm font-semibold text-zinc-300">
          {thinking
            ? "Computer is thinking..."
            : gameResult
            ? "Game finished"
            : turn === "w"
            ? "White to move"
            : "Black to move"}
        </p>
      </div>

      <div className="flex gap-2">
        <div
          className={`rounded-xl border px-3 py-2 text-center ${
            turn === "w"
              ? "border-emerald-500/40 bg-emerald-500/10"
              : "border-zinc-800 bg-zinc-900"
          }`}
        >
          <div className="text-[10px] uppercase text-zinc-500">
            White
          </div>

          <div className="font-mono text-sm font-bold">
            {whiteTime}
          </div>
        </div>

        <div
          className={`rounded-xl border px-3 py-2 text-center ${
            turn === "b"
              ? "border-emerald-500/40 bg-emerald-500/10"
              : "border-zinc-800 bg-zinc-900"
          }`}
        >
          <div className="text-[10px] uppercase text-zinc-500">
            Black
          </div>

          <div className="font-mono text-sm font-bold">
            {blackTime}
          </div>
        </div>
      </div>
    </div>
  );
}

export default GameTopBar;