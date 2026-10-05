function OnlineGameInfo({
  user,
  onlineColor,
  onlineRoomCode,
  onlineOpponent,
}) {
  return (
    <div className="mb-4 flex w-full max-w-3xl items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3">
      <div>
        <p className="text-xs uppercase tracking-wider text-zinc-500">
          You
        </p>

        <p className="font-bold text-white">
          {user.username}
        </p>
      </div>

      <div className="text-center">
        <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-bold uppercase text-zinc-400">
          {onlineColor}
        </span>

        {onlineRoomCode && (
          <p className="mt-1 font-mono text-xs text-zinc-600">
            Room: {onlineRoomCode}
          </p>
        )}
      </div>

      <div className="text-right">
        <p className="text-xs uppercase tracking-wider text-zinc-500">
          Opponent
        </p>

        <p className="font-bold text-white">
          {onlineOpponent?.username ||
            "Waiting..."}
        </p>
      </div>
    </div>
  );
}

export default OnlineGameInfo;