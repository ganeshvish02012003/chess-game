function GameHeader({
  thinking,
  backendStatus,
  user,
  logout,
}) {
  return (
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
              backendStatus === "online"
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                : backendStatus === "offline"
                ? "border-red-500/20 bg-red-500/10 text-red-400"
                : "border-zinc-700 bg-zinc-900 text-zinc-500"
            }`}
          >
            {backendStatus === "online"
              ? "Backend Online"
              : backendStatus === "offline"
              ? "Backend Offline"
              : "Checking..."}
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            <span className="text-sm text-zinc-400">
              {user?.username}
            </span>

            <button
              type="button"
              onClick={logout}
              className="rounded-xl border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-zinc-800"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default GameHeader;