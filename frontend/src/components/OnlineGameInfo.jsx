function OnlineGameInfo({
  user,
  onlineColor,
  onlineRoomCode,
  onlineOpponent,
  onLeaveGame,
}) {
  return (
    <div className="mb-4 flex w-full max-w-3xl items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3">
      {/* You */}
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wider text-zinc-500">
          You
        </p>

        <p className="truncate font-bold text-white">
          {user.username}
        </p>
      </div>

      {/* Center */}
      <div className="text-center">
        <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-bold uppercase text-zinc-400">
          {onlineColor || "—"}
        </span>

        {onlineRoomCode && (
          <p className="mt-1 font-mono text-xs text-zinc-600">
            Room: {onlineRoomCode}
          </p>
        )}
      </div>

      {/* Opponent */}
      <div className="min-w-0 text-right">
        <p className="text-xs uppercase tracking-wider text-zinc-500">
          Opponent
        </p>

        <p className="truncate font-bold text-white">
          {onlineOpponent?.username || "Waiting..."}
        </p>
      </div>

      {/* Leave */}
      {onlineRoomCode && (
        <button
          type="button"
          onClick={onLeaveGame}
          className="shrink-0 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-400 transition hover:bg-red-500 hover:text-white"
        >
          Leave
        </button>
      )}
    </div>
  );
}

export default OnlineGameInfo;

