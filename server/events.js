const { info } = require("console");
const { gameStatusEnum, destroyRoom } = require("./rooms");

const joinRoom =
  (io, socket, player) =>
  ({ name, roomId }, callback) => {
    info(`joinRoom request received from ${player.toString()}`);
    const room = global.roomIdToRoomMap.get(roomId);
    if (room == null) {
      return callback({ error: "Room does not exist." });
    }
    if (room.isPlayerInRoom(player)) {
      info(`${player.toString()} re-joined room ${roomId}`);
      player.hasLeftRoom = false;
      if (room.gameStatus === gameStatusEnum.IN_PROGRESS) {
        const playerNames = room.players.map((ele) => ele.name);
        socket.emit("startGame", {
          initTurn: room.turn,
          playerNames: playerNames,
          turnToMove: room.players.findIndex((ele) => ele.isSameAs(player)),
        });
        socket.emit("updateGame", {
          gameState: room.gameState,
          turn: room.turn,
        });
      }
      return callback();
    }
    if (player.room != null) {
      return callback({ error: "You are already in an existing room." });
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
      destroyRoom(room.id);
    }

    callback({ message: "Move made successfully." });
  };

const exitRoom = (io, socket, player) => (_, callback) => {
  const room = player.room;
  if (room == null) {
    return callback();
  }
  info(`${player.toString()} exited room ${room.id}.`);
  player.hasLeftRoom = true;
  if (room.gameStatus === gameStatusEnum.WAITING) {
    setTimeout(() => {
      if (!player.hasLeftRoom) {
        return;
      }
      room.removePlayer(player);
      if (room.isRoomEmpty()) {
        destroyRoom(room.id);
      }
    }, 1000);
    return;
  }
  let countdown = 10;
  const abortCountdown = setInterval(() => {
    if (room.gameStatus === gameStatusEnum.ENDED) {
      clearInterval(abortCountdown);
      return;
    }
    if (
      !player.hasLeftRoom &&
      player.room !== null &&
      player.room.id === room.id
    ) {
      io.to(room.id).emit("alertGame", { alert: null });
      clearInterval(abortCountdown);
      return;
    }
    io.to(room.id).emit("alertGame", {
      alert: `${player.name} has left the room. Aborting in ${countdown}s...`,
    });
    countdown--;
    if (countdown <= 0) {
      info(
        `Game ended between ${room.getWaitingPlayer().toString()} and ${room
          .getReadyPlayer()
          .toString()} via room exiting.`
      );
      info(`Destroyed Room ${room.id}`);
      io.to(room.id).emit("alertGame", { alert: null });
      io.to(room.id).emit("endGame", {
        reason: `Game aborted. ${player.name ?? "Opponent"} has left the room.`,
      });
      room.endGame();
      destroyRoom(room.id);
      clearInterval(abortCountdown);
    }
  }, 1000);
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
    io.to(room.id).emit("endGame", {
      reason: `${player.name ?? "Opponent"} has disconnected.`,
    });
    room.endGame();
    destroyRoom(room.id);
  }
};

module.exports = { joinRoom, makeMove, exitRoom, disconnect };
