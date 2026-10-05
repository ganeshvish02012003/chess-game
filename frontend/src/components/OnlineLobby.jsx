import { useEffect, useState } from "react";

function OnlineLobby({
  user,
  socketConnected,
  connectionError,
  onlineRoomCode,
  onlineWaiting,
  onlineError,
  onCreatePrivateRoom,
  onJoinPrivateRoom,
  onQuickMatch,
}) {
  const [roomCode, setRoomCode] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (onlineRoomCode) {
      setCopied(false);
    }
  }, [onlineRoomCode]);

  const handleCopyRoomCode = async () => {
    if (!onlineRoomCode) return;

    try {
      await navigator.clipboard.writeText(
        onlineRoomCode
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error(
        "Failed to copy room code:",
        error
      );
    }
  };

  const handleJoinRoom = () => {
    if (roomCode.length !== 6) return;

    onJoinPrivateRoom(roomCode);
  };

  return (
    <div className="mx-auto w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
      {/* Header */}

      <div className="mb-7 text-center">
        <div className="mb-3 text-5xl">
          ♟
        </div>

        <h2 className="text-2xl font-black text-white">
          Online Chess
        </h2>

        <p className="mt-2 text-sm text-zinc-500">
          Play with another player in real time
        </p>

        {/* Socket status */}

        <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs">
          <span
            className={`h-2 w-2 rounded-full ${
              socketConnected
                ? "bg-emerald-500"
                : "bg-red-500"
            }`}
          />

          {socketConnected
            ? "Connected"
            : "Connecting..."}
        </div>

        {/* Logged in user */}

        {user?.username && (
          <div className="mt-2 text-xs text-zinc-600">
            Playing as{" "}
            <span className="font-semibold text-zinc-400">
              {user.username}
            </span>
          </div>
        )}
      </div>

      {/* Connection Error */}

      {connectionError && (
        <div className="mb-4 rounded-xl border border-red-900/50 bg-red-950/40 px-4 py-3 text-sm text-red-400">
          Socket connection error:{" "}
          {connectionError}
        </div>
      )}

      {/* Online Error */}

      {onlineError && (
        <div className="mb-4 rounded-xl border border-red-900/50 bg-red-950/40 px-4 py-3 text-sm text-red-400">
          {onlineError}
        </div>
      )}

      {/* PRIVATE ROOM CREATED */}

      {onlineRoomCode && (
        <div className="mb-5 rounded-2xl border border-blue-500/30 bg-blue-500/5 p-5">
          <div className="text-center">
            <div className="mb-2 text-xs font-bold uppercase tracking-widest text-blue-400">
              Private Room Created
            </div>

            <p className="mb-4 text-sm text-zinc-500">
              Share this room code with your friend
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <div className="rounded-xl border border-zinc-700 bg-zinc-950 px-5 py-3 font-mono text-2xl font-black tracking-[0.3em] text-white">
                {onlineRoomCode}
              </div>

              <button
                type="button"
                onClick={handleCopyRoomCode}
                className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm font-bold text-zinc-300 transition hover:border-blue-500 hover:text-blue-400"
              >
                {copied
                  ? "Copied!"
                  : "Copy"}
              </button>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-zinc-500">
              <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />

              Waiting for opponent...
            </div>
          </div>
        </div>
      )}

      {/* QUICK MATCH WAITING */}

      {onlineWaiting && (
        <div className="mb-5 rounded-xl border border-blue-900/50 bg-blue-950/30 p-4 text-center">
          <div className="animate-pulse font-semibold text-blue-400">
            Searching for opponent...
          </div>

          <p className="mt-1 text-xs text-zinc-500">
            Keep this page open
          </p>
        </div>
      )}

      {/* LOBBY OPTIONS */}

      {!onlineRoomCode && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Private Room */}

            <button
              type="button"
              onClick={onCreatePrivateRoom}
              disabled={!socketConnected}
              className="rounded-2xl border border-zinc-700 bg-zinc-950 p-6 text-left transition hover:border-blue-500 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <div className="mb-3 text-3xl">
                🔒
              </div>

              <h3 className="font-bold text-white">
                Private Room
              </h3>

              <p className="mt-2 text-sm text-zinc-500">
                Create a room and invite your
                friend with a room code.
              </p>
            </button>

            {/* Quick Match */}

            <button
              type="button"
              onClick={onQuickMatch}
              disabled={
                !socketConnected ||
                onlineWaiting
              }
              className="rounded-2xl border border-zinc-700 bg-zinc-950 p-6 text-left transition hover:border-emerald-500 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <div className="mb-3 text-3xl">
                ⚡
              </div>

              <h3 className="font-bold text-white">
                Quick Match
              </h3>

              <p className="mt-2 text-sm text-zinc-500">
                Find another online player
                automatically.
              </p>
            </button>
          </div>

          {/* OR JOIN */}

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-zinc-800" />

            <span className="text-xs uppercase tracking-widest text-zinc-600">
              or join
            </span>

            <div className="h-px flex-1 bg-zinc-800" />
          </div>

          {/* Join Room */}

          <div className="flex gap-2">
            <input
              value={roomCode}
              onChange={(event) =>
                setRoomCode(
                  event.target.value
                    .toUpperCase()
                    .replace(
                      /[^A-Z0-9]/g,
                      ""
                    )
                    .slice(0, 6)
                )
              }
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  roomCode.length === 6
                ) {
                  handleJoinRoom();
                }
              }}
              placeholder="ROOM CODE"
              maxLength={6}
              className="min-w-0 flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 font-mono uppercase tracking-[0.25em] text-white outline-none focus:border-blue-500"
            />

            <button
              type="button"
              onClick={handleJoinRoom}
              disabled={
                !socketConnected ||
                roomCode.length !== 6
              }
              className="rounded-xl bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Join
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default OnlineLobby;