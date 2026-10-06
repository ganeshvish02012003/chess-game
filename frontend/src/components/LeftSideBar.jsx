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

function CapturedPieces({ title, pieces = [], color }) {
  const material = pieces.reduce(
    (total, piece) => total + (PIECE_VALUES[piece] || 0),
    0,
  );

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${
              color === "white" ? "bg-white" : "bg-zinc-700"
            }`}
          />

          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            {title}
          </span>
        </div>

        <span className="text-xs text-zinc-600">
          {material > 0 ? `+${material}` : ""}
        </span>
      </div>

      {pieces.length === 0 ? (
        <div className="text-xs text-zinc-700">No captures</div>
      ) : (
        <div className="flex min-h-8 flex-wrap items-center gap-0.5">
          {pieces.map((piece, index) => (
            <span
              key={`${piece}-${index}`}
              className={`text-2xl leading-none ${
                color === "white" ? "text-white" : "text-zinc-900"
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
              {PIECES[piece]?.[color] || ""}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function LeftSideBar({
  capturedPieces,
  history = []
}) {
  return (
    <aside className="flex min-h-0 w-full flex-col gap-4">
      {/* Captured Pieces */}

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
        <div className="mb-3">
          <h2 className="font-bold text-zinc-100">Captured Pieces</h2>

          <p className="mt-0.5 text-xs text-zinc-600">
            Material captured during this game
          </p>
        </div>

        <div className="space-y-2">
          <CapturedPieces
            title="White Captured"
            pieces={capturedPieces?.white || []}
            color="white"
          />

          <CapturedPieces
            title="Black Captured"
            pieces={capturedPieces?.black || []}
            color="black"
          />
        </div>
      </div>



      {/* Move History */}

      <div className="flex min-h-72 flex-1 flex-col rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
        <MoveHistory history={history} />
      </div>
    </aside>
  );
}

export default LeftSideBar;

