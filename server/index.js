const express = require("express");
const socketio = require("socket.io");
const http = require("http");
const cors = require("cors");
const { Room } = require("./rooms");
const Player = require("./players");
const { info } = require("console");
const { joinRoom, makeMove, disconnect } = require("./sockets");
const { ROOM_ID_LENGTH } = require("./constants");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(cors());

global.roomIdToRoomMap = new Map();
global.socketToPlayerMap = new Map();

app.get("/createRoom", (req, res) => {
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
  global.roomIdToRoomMap.set(roomId, new Room(roomId));
  res.status(200).json({ roomId });
});

io.on("connection", (socket) => {
  const player = new Player(socket);
  global.socketToPlayerMap.set(socket, player);
  info(`${player.toString()} established a connection.`);

  socket.on("joinRoom", joinRoom(io, socket, player));

  socket.on("makeMove", makeMove(io, socket, player));

  socket.on("disconnect", disconnect(io, socket, player));
});

server.listen(process.env.PORT || 5000, () =>
  console.log(`Listening on port ${process.env.PORT || 5000}.`)
);
