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
    <div className="my-4 w-full max-w-2xl px-1 rounded-2xl border border-zinc-800 bg-zinc-900/80">
      {/* ================= GAME STATUS ================= */}
      {/* Game Mode */}

      <p className="mt-2 text-[12px] font-bold text-center pb-1 uppercase tracking-[0.2em] text-zinc-600">
        {mode === "computer"
          ? `${playerColor === "white" ? "White" : "Black"} vs Computer`
          : mode === "online"
            ? "Online Multiplayer"
            : "Local Multiplayer"}
      </p>

      <div className="flex w-full flex-col items-center pb-2 px-2 justify-center">
        {/* Turn / Status */}

        <p
          className={`text-md font-semibold transition ${
            gameResult
              ? "text-zinc-500"
              : thinking
                ? "text-amber-400"
                : "text-zinc-300"
          }`}
        >
          {thinking
            ? "AI is thinking..."
            : gameResult
              ? "Game finished"
              : turn === "w"
                ? "White to move"
                : "Black to move"}
        </p>
      </div>

      {/*  Timer */}
      <div className="mb-1.5 flex w-full items-center justify-center gap-2">
        {/* White Timer */}
        <div
          className={`min-w-24 rounded-xl border px-3 py-1.5 mb-2 text-center transition ${
            turn === "w"
              ? "border-emerald-500/30 bg-emerald-500/10 shadow-sm shadow-emerald-500/10"
              : "border-zinc-800 bg-zinc-900"
          }`}
        >
          {/* Label - Top */}
          <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            White
          </div>

          {/* Timer - Bottom */}
          <div
            className={`font-mono text-lg font-bold leading-5 ${
              turn === "w" ? "text-emerald-400" : "text-zinc-300"
            }`}
          >
            {whiteTime}
          </div>
        </div>

        {/* VS */}
        <span className="text-[10px] font-bold text-zinc-700">VS</span>

        {/* Black Timer */}
        <div
          className={`min-w-24 rounded-xl border px-3 py-1.5 text-center transition ${
            turn === "b"
              ? "border-emerald-500/30 bg-emerald-500/10 shadow-sm shadow-emerald-500/10"
              : "border-zinc-800 bg-zinc-900"
          }`}
        >
          {/* Label - Top */}
          <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            Black
          </div>

          {/* Timer - Bottom */}
          <div
            className={`font-mono text-lg font-bold leading-5 ${
              turn === "b" ? "text-emerald-400" : "text-zinc-300"
            }`}
          >
            {blackTime}
          </div>
        </div>
      </div>
    </div>
  );
}

export default GameTopBar;
