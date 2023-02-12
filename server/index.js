const express = require("express");
const socketio = require("socket.io");
const http = require("http");
const cors = require("cors");
const { Room, gameStatusEnum } = require("./rooms");
const Player = require("./players");
const { info } = require("console");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(cors());

const room = new Room("ABC");
const roomIdToRoomMap = new Map();
roomIdToRoomMap.set("ABC", room);
const socketToPlayerMap = new Map();

io.on("connection", (socket) => {
  const player = new Player(socket);
  socketToPlayerMap.set(socket, player);
  info(`${player.toString()} established a connection.`);

  socket.on("joinRoom", ({ name, roomId }, callback) => {
    const room = roomIdToRoomMap.get(roomId);
    if (room == null) {
      return { error: "Room does not exist." };
    }
    if (!room.gameStatus === gameStatusEnum.WAITING) {
      return callback({ error: "The game in this room has already started." });
    }
    if (room.isPlayerInRoom(player)) {
      return callback();
    } else if (room.isRoomFull()) {
      return callback({ error: "The room is full." });
    }
    room.addPlayer(player);
    player.name = name;
    info(`${player.toString()} joined room ${roomId}`);
    callback({ message: "Room joined successfully." });
    // Automatically starting a game if the room is full
    if (room.isRoomFull()) {
      const success = room.startGame();
      if (success === false) {
        callback({
          message:
            "There was an error starting the game. Trying creating another room instead.",
        });
      }
      room.getWaitingPlayer().socket.emit("startGame", {
        initTurn: room.turn,
        turnToMove: room.turn === 1 ? 0 : 1,
      });
      room.getReadyPlayer().socket.emit("startGame", {
        initTurn: room.turn,
        turnToMove: room.turn,
      });
      info(
        `Game started between ${room.getWaitingPlayer().toString()} and ${room
          .getReadyPlayer()
          .toString()} `
      );
    }
  });

  socket.on("sendMove", ({ row, col }, callback) => {
    const room = player.room;
    if (room == null) {
      return callback({ error: "Invalid request." });
    }
    const error = room.makeMove(player, row, col);
    if (error != null) {
      return callback(error);
    }
    io.emit("updateGame", {
      gameState: room.gameState,
      turn: room.turn,
    });
    if (room.isGameOver()) {
      info(
        `Game ended between ${room.getWaitingPlayer().toString()} and ${room
          .getReadyPlayer()
          .toString()} `
      );
      io.emit("endGame", {
        reason: `${room.getWaitingPlayer().name} has won.`,
      });
      room.endGame();
    }

    callback({ message: "Move made successfully." });
  });

  socket.on("disconnect", () => {
    socketToPlayerMap.delete(socket);
    info(`${player.toString()} disconnected.`);
    const room = player.room;
    if (room == null) {
      return;
    }
    if (room.gameStatus === gameStatusEnum.WAITING) {
      room.removePlayer(player);
      return;
    }
    if (room.gameStatus === gameStatusEnum.IN_PROGRESS) {
      info(
        `Game ended between ${room.getWaitingPlayer().toString()} and ${room
          .getReadyPlayer()
          .toString()} via disconnect`
      );
      room.endGame();
      io.emit("endGame", {
        reason: `Opponent has disconnected.`,
      });
    }
  });
});

server.listen(process.env.PORT || 5000, () =>
  console.log(`Listening on port ${process.env.PORT || 5000}.`)
);

module.exports = { roomIdToRoomMap, socketIdToPlayerMap: socketToPlayerMap };
