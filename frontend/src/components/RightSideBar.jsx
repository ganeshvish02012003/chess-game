import { useNavigate } from "react-router-dom";

const THEME_OPTIONS = [
  {
    id: "classic",
    name: "Classic",
    light: "bg-[#f0d9b5]",
    dark: "bg-[#b58863]",
  },
  {
    id: "green",
    name: "Green",
    light: "bg-[#eeeed2]",
    dark: "bg-[#769656]",
  },
  {
    id: "blue",
    name: "Blue",
    light: "bg-[#dbeafe]",
    dark: "bg-[#3b82f6]",
  },
  {
    id: "dark",
    name: "Dark",
    light: "bg-[#52525b]",
    dark: "bg-[#27272a]",
  },
];

function RightSideBar({
  mode,
  setMode,
  onOnlineMode,
  difficulty,
  setDifficulty,
  playerColor,
  setPlayerColor,
  soundEnabled,
  setSoundEnabled,
  boardTheme,
  setBoardTheme,
  history = [],
  onReset,
  onUndo,
  thinking,
  handleOnlineMode,

  backendStatus,
  user,
  logout,
}) {
  const navigate = useNavigate();
  return (
    <aside className="flex min-h-0 w-full flex-col gap-4">
      <div className="hidden md:flex items-center justify-end">
        <div className="flex items-center gap-3">
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
              ? "Online"
              : backendStatus === "offline"
                ? "Offline"
                : "Checking..."}
          </div>

          {user ? (
            <div className="items-center gap-2 justify-items-start">
              <span className="text-sm text-zinc-400 mr-4">
                {user.username}
              </span>

              <button
                type="button"
                onClick={logout}
                className="rounded-xl border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-zinc-800"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="rounded-xl border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-zinc-800"
            >
              Login
            </button>
          )}
        </div>
      </div>
      {/* Actions */}

      <div className="grid grid-cols-2 gap-2 ">
        <button
          type="button"
          onClick={onReset}
          className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-3 text-sm font-bold text-emerald-400 transition hover:bg-emerald-500/20"
        >
          New Game
        </button>

        <button
          type="button"
          onClick={onUndo}
          disabled={thinking || history.length === 0 || mode === "online"}
          className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-3 text-sm font-bold text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {mode === "online" ? "Undo Disabled" : "Undo"}
        </button>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 shadow-xl shadow-black/10">
        {/* Header */}

        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-zinc-100">Game Settings</h2>

            <p className="mt-0.5 text-xs text-zinc-600">Configure your game</p>
          </div>
        </div>

        {/* Game Mode */}

        <div className="mb-4">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-600">
            Game Mode
          </label>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setMode("computer")}
              className={`rounded-xl border px-2 py-2.5 text-sm font-semibold transition ${
                mode === "computer"
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                  : "border-zinc-800 bg-zinc-950 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
              }`}
            >
              Computer
            </button>

            <button
              type="button"
              onClick={() => setMode("local")}
              className={`rounded-xl border px-2 py-2.5 text-sm font-semibold transition ${
                mode === "local"
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                  : "border-zinc-800 bg-zinc-950 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
              }`}
            >
              2 Players
            </button>

            <button
              type="button"
              onClick={onOnlineMode}
              className={`rounded-xl border px-2 py-2.5 text-sm font-semibold transition ${
                mode === "online"
                  ? "border-blue-500/40 bg-blue-500/10 text-blue-400"
                  : "border-zinc-800 bg-zinc-950 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
              }`}
            >
              Online
            </button>
          </div>
        </div>

        {/* Difficulty */}

        {mode === "computer" && (
          <div className="mb-4">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-600">
              Difficulty
            </label>

            <div className="grid grid-cols-3 gap-2">
              {["easy", "medium", "hard"].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setDifficulty(level)}
                  className={`rounded-xl border px-2 py-2 text-xs font-bold capitalize transition ${
                    difficulty === level
                      ? "border-blue-500/40 bg-blue-500/10 text-blue-400"
                      : "border-zinc-800 bg-zinc-950 text-zinc-500 hover:border-zinc-700"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Player Color */}

        {mode === "computer" && (
          <div className="mb-4">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-600">
              Play As
            </label>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPlayerColor("white")}
                className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                  playerColor === "white"
                    ? "border-white/30 bg-white/10 text-white"
                    : "border-zinc-800 bg-zinc-950 text-zinc-500"
                }`}
              >
                ♔ White
              </button>

              <button
                type="button"
                onClick={() => setPlayerColor("black")}
                className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                  playerColor === "black"
                    ? "border-white/30 bg-white/10 text-white"
                    : "border-zinc-800 bg-zinc-950 text-zinc-500"
                }`}
              >
                ♚ Black
              </button>
            </div>
          </div>
        )}

        {/* Board Theme */}

        <div className="mb-4">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-600">
            Board Theme
          </label>

          <div className="grid grid-cols-2 gap-2">
            {THEME_OPTIONS.map((theme) => (
              <button
                key={theme.id}
                type="button"
                onClick={() => setBoardTheme(theme.id)}
                className={`group flex items-center gap-2 rounded-xl border p-2 transition ${
                  boardTheme === theme.id
                    ? "border-emerald-500/50 bg-emerald-500/5"
                    : "border-zinc-800 bg-zinc-950 hover:border-zinc-700"
                }`}
              >
                <span className="grid h-7 w-7 shrink-0 grid-cols-2 overflow-hidden rounded-md border border-black/20">
                  <span className={theme.light} />
                  <span className={theme.dark} />
                  <span className={theme.dark} />
                  <span className={theme.light} />
                </span>

                <span
                  className={`text-xs font-semibold ${
                    boardTheme === theme.id
                      ? "text-emerald-400"
                      : "text-zinc-500 group-hover:text-zinc-300"
                  }`}
                >
                  {theme.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Sound */}

        <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5">
          <div>
            <div className="text-sm font-semibold text-zinc-300">
              Sound Effects
            </div>

            <div className="text-xs text-zinc-600">
              Move, capture and check sounds
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSoundEnabled((value) => !value)}
            className={`relative h-6 w-11 rounded-full transition ${
              soundEnabled ? "bg-emerald-500" : "bg-zinc-700"
            }`}
            aria-label="Toggle sound"
          >
            <span
              className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${
                soundEnabled ? "left-6" : "left-1"
              }`}
            />
          </button>
        </div>
      </div>
    </aside>
  );
}

export default RightSideBar;
