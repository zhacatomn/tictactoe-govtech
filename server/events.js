const { info } = require("console");
const { gameStatusEnum } = require("./rooms");

const joinRoom =
  (io, socket, player) =>
  ({ name, roomId }, callback) => {
    info(`joinRoom request received from ${player.toString()}`);
    const room = global.roomIdToRoomMap.get(roomId);
    if (room == null) {
      return callback({ error: "Room does not exist." });
    }
    if (room.isPlayerInRoom(player)) {
      return callback();
    }
    if (room.isRoomFull()) {
      return callback({ error: "The room is full." });
    }
    if (!(room.gameStatus === gameStatusEnum.WAITING)) {
      return callback({ error: "The game in this room has already started." });
    }

    socket.join(roomId);
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
      const playerNames = room.players.map((ele) => ele.name);
      room.getWaitingPlayer().socket.emit("startGame", {
        initTurn: room.turn,
        turnToMove: room.turn === 1 ? 0 : 1,
        playerNames: playerNames,
      });
      room.getReadyPlayer().socket.emit("startGame", {
        initTurn: room.turn,
        turnToMove: room.turn,
        playerNames: playerNames,
      });
      info(
        `Game started between ${room.getWaitingPlayer().toString()} and ${room
          .getReadyPlayer()
          .toString()} `
      );
    }
  };

const makeMove =
  (io, socket, player) =>
  ({ row, col }, callback) => {
    const room = player.room;
    if (room == null) {
      return callback({ error: "Invalid request." });
    }
    const error = room.makeMove(player, row, col);
    if (error != null) {
      return callback(error);
    }
    io.to(room.id).emit("updateGame", {
      gameState: room.gameState,
      turn: room.turn,
    });
    if (room.hasWinner() || room.hasDrawn()) {
      info(
        `Game ended between ${room.getWaitingPlayer().toString()} and ${room
          .getReadyPlayer()
          .toString()} `
      );
      const reason = room.hasWinner()
        ? `${room.getWaitingPlayer().name} has won.`
        : "Game ended in a draw.";
      io.to(room.id).emit("endGame", {
        reason,
      });
      room.endGame();
      global.roomIdToRoomMap.delete(room.id);
    }

    callback({ message: "Move made successfully." });
  };

const exitRoom = (io, socket, player) => (_, callback) => {
  const room = player.room;
  if (room == null) {
    return callback();
  }
  info(`${player.toString()} exited room ${room.id}.`);
  if (room.gameStatus === gameStatusEnum.WAITING) {
    room.removePlayer(player);
    if (room.isRoomEmpty()) {
      global.roomIdToRoomMap.delete(room.id);
    }
  } else if (room.gameStatus === gameStatusEnum.IN_PROGRESS) {
    info(
      `Game ended between ${room.getWaitingPlayer().toString()} and ${room
        .getReadyPlayer()
        .toString()} via room exiting.`
    );
    room.endGame();
    global.roomIdToRoomMap.delete(room.id);
    io.emit("endGame", {
      reason: `${player.name ?? "Opponent"} has left the room.`,
    });
  }
  callback();
};

const disconnect = (io, socket, player) => () => {
  global.socketToPlayerMap.delete(socket);
  info(`${player.toString()} disconnected.`);
  const room = player.room;
  if (room == null) {
    return;
  }
  if (room.gameStatus === gameStatusEnum.WAITING) {
    room.removePlayer(player);
    if (room.isRoomEmpty()) {
      global.roomIdToRoomMap.delete(room.id);
    }
  } else if (room.gameStatus === gameStatusEnum.IN_PROGRESS) {
    info(
      `Game ended between ${room.getWaitingPlayer().toString()} and ${room
        .getReadyPlayer()
        .toString()} via disconnect`
    );
    room.endGame();
    global.roomIdToRoomMap.delete(room.id);
    io.emit("endGame", {
      reason: `${player.name ?? "Opponent"} has disconnected.`,
    });
  }
};

module.exports = { joinRoom, makeMove, exitRoom, disconnect };
