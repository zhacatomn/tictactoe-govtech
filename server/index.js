const express = require("express");
const socketio = require("socket.io");
const http = require("http");
const cors = require("cors");
const path = require("path");
const { createRoom } = require("./rooms");
const Player = require("./players");
const { info } = require("console");
const { joinRoom, makeMove, disconnect, exitRoom } = require("./events");
const { ROOM_ID_LENGTH } = require("./constants");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = socketio(server);

global.roomIdToRoomMap = new Map();
global.socketToPlayerMap = new Map();

if (process.env.NODE_ENV === "development") {
  app.use(cors());
}

app.get("/server/createRoom", (req, res) => {
  // Generating random roon code
  info("Received createRoom GET request");
  let roomId = "";
  do {
    roomId = "";
    for (let i = 0; i < ROOM_ID_LENGTH; i++) {
      roomId =
        roomId + String.fromCharCode(Math.floor(Math.random() * 26) + 65);
    }
  } while (global.roomIdToRoomMap.has(roomId));
  createRoom(roomId);
  res.status(200).json({ roomId });
});

io.on("connection", (socket) => {
  const player = new Player(socket);
  global.socketToPlayerMap.set(socket, player);
  info(`${player.toString()} established a connection.`);

  socket.on("joinRoom", joinRoom(io, socket, player));

  socket.on("makeMove", makeMove(io, socket, player));

  socket.on("exitRoom", exitRoom(io, socket, player));

  socket.on("disconnect", disconnect(io, socket, player));
});

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.resolve(__dirname, "../client/build")));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../client/build", "index.html"));
  });
}

server.listen(process.env.PORT || 5000, () =>
  console.log(`Listening on port ${process.env.PORT || 5000}.`)
);
