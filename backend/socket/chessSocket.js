import jwt from "jsonwebtoken";
import User from "../models/User.js";

const rooms = new Map();
const quickMatchQueue = [];

const generateRoomCode = () => {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let code = "";

  for (let i = 0; i < 6; i++) {
    code += chars[
      Math.floor(Math.random() * chars.length)
    ];
  }

  return code;
};

const createRoom = () => {
  let roomCode;

  do {
    roomCode = generateRoomCode();
  } while (rooms.has(roomCode));

  return roomCode;
};

const getRoomPlayers = (room) => {
  return [...room.players.values()];
};

const emitRoomState = (io, roomCode) => {
  const room = rooms.get(roomCode);

  if (!room) return;

  io.to(roomCode).emit("room_state", {
    roomCode,
    players: getRoomPlayers(room),
    gameStarted: room.gameStarted,
    fen: room.fen,
    history: room.history,
    whitePlayerId: room.whitePlayerId,
    blackPlayerId: room.blackPlayerId,
  });
};

const removeFromQueue = (socketId) => {
  const index = quickMatchQueue.findIndex(
    (item) => item.socketId === socketId
  );

  if (index !== -1) {
    quickMatchQueue.splice(index, 1);
  }
};

const leaveRoom = (socket) => {
  const roomCode = socket.data.roomCode;

  if (!roomCode) return;

  const room = rooms.get(roomCode);

  if (!room) {
    socket.data.roomCode = null;
    return;
  }

  // Find the player who is leaving
  const leavingPlayer = room.players.get(socket.id);

  // Find the remaining player BEFORE deleting the leaving player
  const remainingPlayer = [...room.players.values()].find(
    (player) => player.socketId !== socket.id
  );

  room.players.delete(socket.id);

  socket.leave(roomCode);
  socket.data.roomCode = null;

  // Nobody remains
  if (room.players.size === 0) {
    rooms.delete(roomCode);
    return;
  }

  // Update player colors
  if (
    room.whitePlayerId ===
    socket.data.userId
  ) {
    room.whitePlayerId = null;
  }

  if (
    room.blackPlayerId ===
    socket.data.userId
  ) {
    room.blackPlayerId = null;
  }

  room.gameStarted = false;

  // Remaining player automatically wins
  if (remainingPlayer) {
    socket.to(roomCode).emit(
      "opponent_left",
      {
        winner: remainingPlayer.color,
        winnerId: remainingPlayer.id,
        reason: "opponent_left",
        leavingPlayer: leavingPlayer
          ? {
              id: leavingPlayer.id,
              username: leavingPlayer.username,
              color: leavingPlayer.color,
            }
          : null,
      }
    );
  }

  emitRoomState(io, roomCode);
};

let io;

export const setupChessSocket = (serverIo) => {
  io = serverIo;

  io.use(async (socket, next) => {
    try {
      const cookieHeader =
        socket.handshake.headers.cookie || "";

      const tokenMatch = cookieHeader.match(
        /(?:^|;\s*)token=([^;]+)/
      );

      if (!tokenMatch) {
        return next(
          new Error("Authentication required")
        );
      }

      const token = decodeURIComponent(
        tokenMatch[1]
      );

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );

      const user = await User.findById(
        decoded.userId
      ).select("_id username email rating");

      if (!user) {
        return next(
          new Error("User not found")
        );
      }

      socket.data.userId =
        user._id.toString();

      socket.data.user = {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        rating: user.rating,
      };

      next();
    } catch (error) {
      next(
        new Error(
          "Invalid authentication"
        )
      );
    }
  });

  io.on("connection", (socket) => {
    console.log(
      "Chess socket connected:",
      socket.data.user?.username
    );

    socket.emit("socket_ready", {
      user: socket.data.user,
    });

    // ---------------------------------------
    // CREATE PRIVATE ROOM
    // ---------------------------------------

    socket.on(
      "create_private_room",
      () => {
        leaveRoom(socket);

        const roomCode = createRoom();

        const room = {
          roomCode,
          hostId: socket.data.userId,
          players: new Map(),
          whitePlayerId:
            socket.data.userId,
          blackPlayerId: null,
          gameStarted: false,
          fen: "start",
          history: [],
        };

        room.players.set(socket.id, {
          id: socket.data.userId,
          socketId: socket.id,
          username:
            socket.data.user.username,
          rating:
            socket.data.user.rating,
          color: "white",
        });

        rooms.set(roomCode, room);

        socket.join(roomCode);
        socket.data.roomCode =
          roomCode;

        emitRoomState(
          io,
          roomCode
        );
      }
    );

    // ---------------------------------------
    // JOIN PRIVATE ROOM
    // ---------------------------------------

    socket.on(
      "join_private_room",
      ({ roomCode }) => {
        const normalizedCode =
          String(roomCode || "")
            .trim()
            .toUpperCase();

        const room =
          rooms.get(normalizedCode);

        if (!room) {
          socket.emit(
            "room_error",
            {
              message:
                "Room not found",
            }
          );

          return;
        }

        if (room.players.size >= 2) {
          socket.emit(
            "room_error",
            {
              message:
                "Room is already full",
            }
          );

          return;
        }

        if (
          room.players.has(socket.id)
        ) {
          return;
        }

        room.players.set(
          socket.id,
          {
            id: socket.data.userId,
            socketId: socket.id,
            username:
              socket.data.user.username,
            rating:
              socket.data.user.rating,
            color: "black",
          }
        );

        room.blackPlayerId =
          socket.data.userId;

        room.gameStarted = true;

        socket.join(normalizedCode);

        socket.data.roomCode =
          normalizedCode;

        io.to(normalizedCode).emit(
          "match_started",
          {
            roomCode:
              normalizedCode,
            whitePlayerId:
              room.whitePlayerId,
            blackPlayerId:
              room.blackPlayerId,
          }
        );

        emitRoomState(
          io,
          normalizedCode
        );
      }
    );

    // ---------------------------------------
    // QUICK MATCH
    // ---------------------------------------

    socket.on(
      "quick_match",
      () => {
        removeFromQueue(
          socket.id
        );

        leaveRoom(socket);

        const availableIndex =
          quickMatchQueue.findIndex(
            (item) =>
              item.userId !==
              socket.data.userId
          );

        if (
          availableIndex === -1
        ) {
          quickMatchQueue.push({
            socketId:
              socket.id,
            userId:
              socket.data.userId,
          });

          socket.emit(
            "quick_match_waiting"
          );

          return;
        }

        const opponent =
          quickMatchQueue.splice(
            availableIndex,
            1
          )[0];

        const opponentSocket =
          io.sockets.sockets.get(
            opponent.socketId
          );

        if (!opponentSocket) {
          socket.emit(
            "quick_match_waiting"
          );

          quickMatchQueue.push({
            socketId:
              socket.id,
            userId:
              socket.data.userId,
          });

          return;
        }

        const roomCode =
          createRoom();

        const whiteFirst =
          Math.random() >= 0.5;

        const whiteSocket =
          whiteFirst
            ? socket
            : opponentSocket;

        const blackSocket =
          whiteFirst
            ? opponentSocket
            : socket;

        const room = {
          roomCode,
          hostId:
            whiteSocket.data.userId,
          players: new Map(),
          whitePlayerId:
            whiteSocket.data.userId,
          blackPlayerId:
            blackSocket.data.userId,
          gameStarted: true,
          fen: "start",
          history: [],
        };

        room.players.set(
          whiteSocket.id,
          {
            id:
              whiteSocket.data
                .userId,
            socketId:
              whiteSocket.id,
            username:
              whiteSocket.data
                .user.username,
            rating:
              whiteSocket.data
                .user.rating,
            color: "white",
          }
        );

        room.players.set(
          blackSocket.id,
          {
            id:
              blackSocket.data
                .userId,
            socketId:
              blackSocket.id,
            username:
              blackSocket.data
                .user.username,
            rating:
              blackSocket.data
                .user.rating,
            color: "black",
          }
        );

        rooms.set(
          roomCode,
          room
        );

        whiteSocket.join(
          roomCode
        );

        blackSocket.join(
          roomCode
        );

        whiteSocket.data.roomCode =
          roomCode;

        blackSocket.data.roomCode =
          roomCode;

        io.to(roomCode).emit(
          "match_started",
          {
            roomCode,
            whitePlayerId:
              room.whitePlayerId,
            blackPlayerId:
              room.blackPlayerId,
          }
        );

        emitRoomState(
          io,
          roomCode
        );
      }
    );

    // ---------------------------------------
    // ONLINE MOVE
    // ---------------------------------------

    socket.on(
      "online_move",
      ({
        fen,
        history,
        move,
      }) => {
        const roomCode =
          socket.data.roomCode;

        const room =
          rooms.get(roomCode);

        if (!room) return;

        if (
          !room.players.has(
            socket.id
          )
        ) {
          return;
        }

        room.fen = fen;
        room.history =
          history || [];

        socket
          .to(roomCode)
          .emit(
            "opponent_move",
            {
              fen,
              history:
                room.history,
              move,
            }
          );
      }
    );

    // ---------------------------------------
    // ONLINE GAME RESULT
    // ---------------------------------------

    socket.on(
      "online_game_result",
      ({ result }) => {
        const roomCode =
          socket.data.roomCode;

        if (!roomCode) return;

        const room =
          rooms.get(roomCode);

        if (!room) return;

        if (
          !room.players.has(
            socket.id
          )
        ) {
          return;
        }

        socket
          .to(roomCode)
          .emit(
            "opponent_game_result",
            {
              result,
            }
          );
      }
    );

    // ---------------------------------------
    // LEAVE ROOM
    // ---------------------------------------

    socket.on(
      "leave_room",
      () => {
        leaveRoom(socket);
      }
    );

    // ---------------------------------------
    // DISCONNECT
    // ---------------------------------------

    socket.on(
      "disconnect",
      () => {
        removeFromQueue(
          socket.id
        );

        const roomCode =
          socket.data.roomCode;

        if (roomCode) {
          const room =
            rooms.get(roomCode);

          if (room) {
            const leavingPlayer =
              room.players.get(
                socket.id
              );

            const remainingPlayer =
              [
                ...room.players.values(),
              ].find(
                (player) =>
                  player.socketId !==
                  socket.id
              );

            room.players.delete(
              socket.id
            );

            if (
              room.players.size ===
              0
            ) {
              rooms.delete(
                roomCode
              );
            } else {
              room.gameStarted =
                false;

              if (
                room.whitePlayerId ===
                socket.data.userId
              ) {
                room.whitePlayerId =
                  null;
              }

              if (
                room.blackPlayerId ===
                socket.data.userId
              ) {
                room.blackPlayerId =
                  null;
              }

              if (remainingPlayer) {
                socket
                  .to(roomCode)
                  .emit(
                    "opponent_disconnected",
                    {
                      winner:
                        remainingPlayer.color,
                      winnerId:
                        remainingPlayer.id,
                      reason:
                        "opponent_disconnected",
                      leavingPlayer:
                        leavingPlayer
                          ? {
                              id:
                                leavingPlayer.id,
                              username:
                                leavingPlayer.username,
                              color:
                                leavingPlayer.color,
                            }
                          : null,
                    }
                  );
              }

              emitRoomState(
                io,
                roomCode
              );
            }
          }
        }

        console.log(
          "Chess socket disconnected:",
          socket.data.user
            ?.username
        );
      }
    );
  });
};

