import MoveHistory from "./MoveHistory";

const PIECES = {
  p: {
    white: "♙",
    black: "♟",
  },
  n: {
    white: "♘",
    black: "♞",
  },
  b: {
    white: "♗",
    black: "♝",
  },
  r: {
    white: "♖",
    black: "♜",
  },
  q: {
    white: "♕",
    black: "♛",
  },
  k: {
    white: "♔",
    black: "♚",
  },
};

const PIECE_VALUES = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

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

function CapturedPieces({
  title,
  pieces = [],
  color,
}) {
  const material = pieces.reduce(
    (total, piece) =>
      total + (PIECE_VALUES[piece] || 0),
    0
  );

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${
              color === "white"
                ? "bg-white"
                : "bg-zinc-700"
            }`}
          />

          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            {title}
          </span>
        </div>

        <span className="text-xs text-zinc-600">
          {material > 0
            ? `+${material}`
            : ""}
        </span>
      </div>

      {pieces.length === 0 ? (
        <div className="text-xs text-zinc-700">
          No captures
        </div>
      ) : (
        <div className="flex min-h-8 flex-wrap items-center gap-0.5">
          {pieces.map((piece, index) => (
            <span
              key={`${piece}-${index}`}
              className={`text-2xl leading-none ${
                color === "white"
                  ? "text-white"
                  : "text-zinc-900"
              }`}
              style={{
                fontFamily:
                  '"Noto Sans Symbols 2", "Segoe UI Symbol", serif',
                textShadow:
                  color === "black"
                    ? "0 1px 2px rgba(255,255,255,.25)"
                    : "0 2px 2px rgba(0,0,0,.35)",
              }}
              title={piece}
            >
              {PIECES[piece]?.[
                color
              ] || ""}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function GameSidebar({
  mode,
  setMode,
  difficulty,
  setDifficulty,
  playerColor,
  setPlayerColor,
  capturedPieces,
  soundEnabled,
  setSoundEnabled,
  thinking,
  backendStatus,
  boardTheme,
  setBoardTheme,
  history = [],
  onReset,
  onUndo,
}) {
  return (
    <aside className="flex min-h-0 flex-col gap-4">
      {/* Game settings */}

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 shadow-xl shadow-black/10">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-zinc-100">
              Game Settings
            </h2>

            <p className="mt-0.5 text-xs text-zinc-600">
              Configure your game
            </p>
          </div>

          {thinking && (
            <div className="flex items-center gap-1.5 text-xs text-amber-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
              Thinking
            </div>
          )}
        </div>

        {/* Mode */}

        <div className="mb-4">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-600">
            Game Mode
          </label>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMode("computer")}
              className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
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
              className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                mode === "local"
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                  : "border-zinc-800 bg-zinc-950 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
              }`}
            >
              2 Players
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
              {["easy", "medium", "hard"].map(
                (level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() =>
                      setDifficulty(level)
                    }
                    className={`rounded-xl border px-2 py-2 text-xs font-bold capitalize transition ${
                      difficulty === level
                        ? "border-blue-500/40 bg-blue-500/10 text-blue-400"
                        : "border-zinc-800 bg-zinc-950 text-zinc-500 hover:border-zinc-700"
                    }`}
                  >
                    {level}
                  </button>
                )
              )}
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
                onClick={() =>
                  setPlayerColor("white")
                }
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
                onClick={() =>
                  setPlayerColor("black")
                }
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

        {/* Board themes */}

        <div className="mb-4">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-600">
            Board Theme
          </label>

          <div className="grid grid-cols-2 gap-2">
            {THEME_OPTIONS.map((theme) => (
              <button
                key={theme.id}
                type="button"
                onClick={() =>
                  setBoardTheme(theme.id)
                }
                className={`group flex items-center gap-2 rounded-xl border p-2 transition ${
                  boardTheme === theme.id
                    ? "border-emerald-500/50 bg-emerald-500/5"
                    : "border-zinc-800 bg-zinc-950 hover:border-zinc-700"
                }`}
              >
                <span className="grid h-7 w-7 grid-cols-2 overflow-hidden rounded-md border border-black/20">
                  <span
                    className={
                      theme.light
                    }
                  />
                  <span
                    className={
                      theme.dark
                    }
                  />
                  <span
                    className={
                      theme.dark
                    }
                  />
                  <span
                    className={
                      theme.light
                    }
                  />
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
            onClick={() =>
              setSoundEnabled((value) => !value)
            }
            className={`relative h-6 w-11 rounded-full transition ${
              soundEnabled
                ? "bg-emerald-500"
                : "bg-zinc-700"
            }`}
            aria-label="Toggle sound"
          >
            <span
              className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${
                soundEnabled
                  ? "left-6"
                  : "left-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Captured pieces */}

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
        <div className="mb-3">
          <h2 className="font-bold text-zinc-100">
            Captured Pieces
          </h2>

          <p className="mt-0.5 text-xs text-zinc-600">
            Material captured during this game
          </p>
        </div>

        <div className="space-y-2">
          <CapturedPieces
            title="White Captured"
            pieces={
              capturedPieces?.white || []
            }
            color="white"
          />

          <CapturedPieces
            title="Black Captured"
            pieces={
              capturedPieces?.black || []
            }
            color="black"
          />
        </div>
      </div>

      {/* Actions */}

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onReset}
          className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-400 transition hover:bg-emerald-500/20"
        >
          New Game
        </button>

        <button
          type="button"
          onClick={onUndo}
          disabled={
            thinking || history.length === 0
          }
          className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-bold text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Undo
        </button>
      </div>

      {/* Move History */}

      <div className="flex min-h-72 flex-1 flex-col rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
        <MoveHistory history={history} />
      </div>

      {/* Backend */}

      <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2">
        <span className="text-xs text-zinc-600">
          Server
        </span>

        <span
          className={`text-xs font-semibold ${
            backendStatus === "online"
              ? "text-emerald-400"
              : backendStatus === "offline"
              ? "text-red-400"
              : "text-zinc-500"
          }`}
        >
          {backendStatus === "online"
            ? "Connected"
            : backendStatus === "offline"
            ? "Offline"
            : "Checking"}
        </span>
      </div>
    </aside>
  );
}

export default GameSidebar;