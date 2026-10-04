function MoveHistory({ history = [] }) {
  const safeHistory = Array.isArray(history) ? history : [];

  const moves = [];

  for (let i = 0; i < safeHistory.length; i += 2) {
    const whiteMove = safeHistory[i];
    const blackMove = safeHistory[i + 1];

    moves.push({
      number: Math.floor(i / 2) + 1,

      white:
        typeof whiteMove === "string"
          ? whiteMove
          : whiteMove?.san || "",

      black:
        typeof blackMove === "string"
          ? blackMove
          : blackMove?.san || "",
    });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
          Move History
        </h3>

        <span className="rounded-full bg-zinc-800 px-2.5 py-1 text-xs text-zinc-400">
          {safeHistory.length}{" "}
          {safeHistory.length === 1 ? "move" : "moves"}
        </span>
      </div>

      <div className="min-h-37.5 flex-1 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950/70">
        {moves.length === 0 ? (
          <div className="flex h-full min-h-37.5 items-center justify-center px-5 text-center text-sm text-zinc-600">
            No moves yet
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {moves.map((move) => (
              <div
                key={move.number}
                className="grid grid-cols-[40px_1fr_1fr] items-center px-3 py-2 text-sm"
              >
                <span className="font-mono text-xs text-zinc-600">
                  {move.number}.
                </span>

                <span className="truncate font-medium text-zinc-200">
                  {move.white || "-"}
                </span>

                <span className="truncate font-medium text-zinc-400">
                  {move.black || "-"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MoveHistory;