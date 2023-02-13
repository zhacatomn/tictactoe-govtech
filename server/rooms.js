const { EMPTY_SPACE, NUM_COLS, NUM_ROWS } = require("./constants");
const { info } = require("console");

const gameStatusEnum = {
  WAITING: 0,
  IN_PROGRESS: 1,
  ENDED: 2,
};

const destroyRoom = (roomId) => {
  if (!global.roomIdToRoomMap.has(roomId)) {
    return;
  }
  global.roomIdToRoomMap.delete(roomId);
  info(`Destroyed Room ${roomId}`);
};

const createRoom = (roomId) => {
  if (global.roomIdToRoomMap.has(roomId)) {
    return;
  }
  global.roomIdToRoomMap.set(roomId, new Room(roomId));
  info(`Created Room ${roomId}`);
};

class Room {
  static PLAYER_LIMIT = 2;
  static PLAYER_TOKENS = ["X", "O"];
  constructor(id) {
    this.id = id;
    this.turn = 0;
    this.players = [];
    this.gameState = Array(NUM_ROWS)
      .fill(null)
      .map(() => Array(NUM_COLS).fill(EMPTY_SPACE));
    this.gameStatus = gameStatusEnum.WAITING;
  }

  isRoomFull() {
    return this.players.length >= Room.PLAYER_LIMIT;
  }

  isRoomEmpty() {
    return this.players.length === 0;
  }

  isPlayerInRoom(player) {
    return this.players.find((ele) => ele.isSameAs(player)) != null;
  }

  addPlayer(player) {
    if (this.isRoomFull() || this.isPlayerInRoom(player)) {
      return false;
    }
    this.players.push(player);
    player.room = this;
    player.hasLeftRoom = false;
  }

  removePlayer(player) {
    // Do not remove players once the game starts. This is to keep track
    // of which players were originally in the game.
    if (
      !this.isPlayerInRoom(player) ||
      this.gameStatus !== gameStatusEnum.WAITING
    ) {
      return false;
    }
    player.room = null;
    player.socket.leave(this.id);
    this.players = this.players.filter((ele) => !player.isSameAs(ele));
  }

  getWaitingPlayer() {
    if (this.gameStatus !== gameStatusEnum.IN_PROGRESS) {
      return false;
    }
    return this.players[this.turn === 1 ? 0 : 1];
  }

  getReadyPlayer() {
    if (this.gameStatus !== gameStatusEnum.IN_PROGRESS) {
      return false;
    }
    return this.players[this.turn];
  }

  startGame() {
    if (!this.isRoomFull() || this.gameStatus !== gameStatusEnum.WAITING) {
      return false;
    }
    this.gameStatus = gameStatusEnum.IN_PROGRESS;
    // Randomly assinging the starting player
    this.turn = Math.floor(Math.random() * Room.PLAYER_LIMIT);
  }

  endGame() {
    this.gameStatus = gameStatusEnum.ENDED;
    for (const player of this.players) {
      player.room = null;
      player.socket.leave(this.id);
    }
  }

  switchTurn() {
    this.turn = this.turn === 1 ? 0 : 1;
  }

  makeMove(player, moveRowIdx, moveColIdx) {
    const INVALID_MOVE_ERROR = { error: "Invalid move." };
    if (!player.isSameAs(this.getReadyPlayer())) {
      return INVALID_MOVE_ERROR;
    }

    if (
      moveRowIdx >= NUM_ROWS ||
      moveRowIdx < 0 ||
      moveColIdx >= NUM_COLS ||
      moveColIdx < 0
    ) {
      return INVALID_MOVE_ERROR;
    }
    if (this.gameState[moveRowIdx][moveColIdx] !== EMPTY_SPACE) {
      return INVALID_MOVE_ERROR;
    }
    const playerToken = Room.PLAYER_TOKENS[this.turn];
    // Updating game state
    const newGameState = this.gameState.map((rowArr, rowIdx) => {
      return rowArr.map((ele, colIdx) =>
        rowIdx === moveRowIdx && colIdx === moveColIdx ? playerToken : ele
      );
    });
    this.gameState = newGameState;
    this.switchTurn();
  }

  hasDrawn() {
    if (this.hasWinner()) {
      return false;
    }
    let isFilled = true;
    for (let i = 0; i < NUM_ROWS; i++) {
      for (let j = 0; j < NUM_COLS; j++) {
        isFilled = isFilled && this.gameState[i][j] !== EMPTY_SPACE;
      }
    }
    return isFilled;
  }

  hasWinner() {
    const isConnectedPair = (a, b) => a === b && a !== EMPTY_SPACE;
    const gameState = this.gameState;
    // Checking rows
    for (let i = 0; i < NUM_ROWS; i++) {
      let isConnected = true;
      for (let j = 0; j < NUM_COLS - 1; j++) {
        isConnected =
          isConnected && isConnectedPair(gameState[i][j], gameState[i][j + 1]);
      }
      if (isConnected) {
        return true;
      }
    }
    // Checking columns
    for (let i = 0; i < NUM_COLS; i++) {
      let isConnected = true;
      for (let j = 0; j < NUM_ROWS - 1; j++) {
        isConnected =
          isConnected && isConnectedPair(gameState[j][i], gameState[j + 1][i]);
      }
      if (isConnected) {
        return true;
      }
    }
    // Checking diagonals
    for (let i = 0; i < 2; i++) {
      let isConnected = true;
      if (i == 0) {
        for (let j = 0; j < NUM_ROWS - 1; j++) {
          isConnected =
            isConnected &&
            isConnectedPair(gameState[j][j], gameState[j + 1][j + 1]);
        }
      } else {
        for (let j = 0; j < NUM_ROWS - 1; j++) {
          const colIdx = NUM_COLS - 1 - j;
          isConnected =
            isConnected &&
            isConnectedPair(gameState[j][colIdx], gameState[j + 1][colIdx - 1]);
        }
      }
      if (isConnected) {
        return true;
      }
    }
    return false;
  }
}

module.exports = { Room, gameStatusEnum, destroyRoom, createRoom };
