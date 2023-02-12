const express = require("express");
const socketio = require("socket.io");
const http = require("http");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(
  cors({
    credentials: true,
    origin: "http://localhost:3000",
  })
);

const PLAYER_TOKENS = ["X", "O"];
const EMPTY_SPACE = "";
const NUM_ROWS = 3;
const NUM_COLS = 3;
const INIT_ROOM_STATE = {
  turn: 0, // Turn 0: playerX's turn. Turn 1: playerO's turn.
  playerX: null,
  playerO: null,
  gameState: Array(NUM_ROWS)
    .fill(null)
    .map(() => Array(NUM_COLS).fill(EMPTY_SPACE)),
  gameHistory: [],
  hasGameEnded: false,
  hasGameStarted: false,
};

const roomState = { ...INIT_ROOM_STATE };

function isGameOver({ ...gameState }) {
  // Checking rows
  for (let i = 0; i < NUM_ROWS; i++) {
    let isConnected = true;
    for (let j = 0; j < NUM_COLS - 1; j++) {
      isConnected = isConnected && gameState[i][j] == gameState[i][j + 1];
    }
    if (isConnected) {
      return true;
    }
  }
  // Checking columns
  for (let i = 0; i < NUM_COLS; i++) {
    let isConnected = true;
    for (let j = 0; j < NUM_ROWS - 1; j++) {
      isConnected = isConnected && gameState[j][i] == gameState[j + 1][i];
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
        isConnected = isConnected && gameState[j][j] == gameState[j + 1][j + 1];
      }
    } else {
      for (let j = NUM_ROWS - 1; i > 0; j--) {
        let isConnected = true;
        isConnected = isConnected && gameState[j][j] == gameState[j - 1][i - 1];
      }
    }
    if (isConnected) {
      return true;
    }
  }
  return false;
}

function isRoomFull(roomState) {
  return roomState.playerX != null && roomState.playerO != null;
}

function isClientInRoom(socket, roomState) {
  return (
    roomState.playerX?.socketId == socket.id ||
    roomState.playerO?.socketId == socket.Id
  );
}

function makeMove(playerToken, row, col, roomState) {
  const INVALID_MOVE_ERROR = { error: "Invalid move." };
  if (playerToken != PLAYER_TOKENS[roomState.turn]) {
    return INVALID_MOVE_ERROR;
  }
  if (
    row >= NUM_ROWS ||
    row < 0 ||
    col >= NUM_COLS ||
    col < 0 ||
    roomState[row][col] !== EMPTY_SPACE
  ) {
    return INVALID_MOVE_ERROR;
  }
  // Updating game state
  const newGameState = roomState.gameState.map((rowArr, rowIdx) => {
    return rowArr.map((ele, colIdx) =>
      rowIdx === row && colIdx === col ? playerToken : ele
    );
  });
  roomState.gameState = newGameState;
  roomState.turn = roomState.turn === 1 ? 0 : 1;
}

io.on("connection", (socket) => {
  socket.on("joinGame", ({ name }, callback) => {
    if (isRoomFull(roomState)) {
      return callback({ error: "Room is full." });
    }
    if (roomState.playerX.socketId != null) {
      roomState.playerX = { socketId: socket.id, name: name };
    } else {
      roomState.playerO = { socketId: socket.id, name: name };
    }
    // Emitting a message once all the players have
    if (isRoomFull(roomState)) {
      io.sockets.socket(roomState.playerX.socketId).emit("startGame", {
        canMove: true,
        playerToken: "X",
      });
      io.sockets.socket(roomState.playerO.socketId).emit("startGame", {
        canMove: false,
        playerToken: "O",
      });
    }
    callback({ message: "Room joined successfully." });
  });

  socket.on("makeMove", ({ row, col }, callback) => {
    if (!isClientInRoom(socket, roomState)) {
      return callback({ error: "Unauthorised move." });
    }
    const playerToken = roomState.playerO.socketId == socket.Id ? "O" : "X";
    const { error } = makeMove(playerToken, row, col, roomState);
    if (error != null) {
      return callback(error);
    }
    io.emit("updateGame", {
      gameState: roomState.gameState,
    });
    if (isGameOver(roomState)) {
      roomState.hasGameEnded = true;
      io.emit("endGame", {
        reason: `Player ${playerToken} has won.`,
      });
    }
  });
  socket.on("disconnect", () => {
    if (!isClientInRoom(socket, roomState) || roomState.hasGameEnded) {
      return;
    }
    if (!roomState.hasGameStarted) {
      if (roomState.playerO?.socketId === socket.id) {
        roomState.playerO = null;
      } else {
        roomState.playerX = null;
      }
      return;
    }
    io.emit("endGame", {
      reason: "Opponent has disconnecterd",
    });
  });
});

server.listen(process.env.PORT || 5000, () =>
  console.log(`Listening on port ${process.env.PORT || 5000}.`)
);
