import { useEffect, useState } from "react";
import io from "socket.io-client";
import "./style.css";

const BUTTON_BORDER_STYLE = "5px solid black";
const NUM_ROWS = 3;
const NUM_COLS = 3;
const PLAYER_TOKENS = ["X", "O"];
const EMPTY_SPACE = "";
const SERVER_URL = "http://localhost:5000";

const connectionOptions = {
  "force new connection": true,
  reconnectionAttempts: "Infinity",
  timeout: 10000,
  transports: ["websocket"],
};
const socket = io.connect(SERVER_URL, connectionOptions);

function App() {
  const [gameState, setGameState] = useState(
    Array(NUM_ROWS)
      .fill(null)
      .map(() => Array(NUM_COLS).fill(EMPTY_SPACE))
  );
  const [gameHistory, setGameHistory] = useState([]);
  const [turn, setTurn] = useState(0);
  const [turnToMove, setTurnToMove] = useState(null);
  const [hasGameEnded, setHasGameEnded] = useState(false);
  const [hasGameStarted, setHasGameStarted] = useState(false);
  const [gameEndedReason, setGameEndedReason] = useState(false);

  useEffect(() => {
    socket.emit("joinRoom", { name: "Ducky", roomId: "ABC" }, (response) => {
      if (response?.error != null) {
        alert(response.error);
      }
    });
  }, []);

  useEffect(() => {
    socket.on("startGame", ({ turnToMove, initTurn }) => {
      setTurnToMove(turnToMove);
      setTurn(initTurn);
      setHasGameStarted(true);
    });

    socket.on("updateGame", ({ gameState, turn }) => {
      setGameState(gameState);
      setTurn(turn);
    });

    socket.on("endGame", ({ reason }) => {
      console.log(reason);
      setHasGameEnded(true);
      setGameEndedReason(reason);
    });
  }, []);

  const onButtonClick = (row, col) => (_) => {
    if (
      row < 0 ||
      row >= NUM_ROWS ||
      col < 0 ||
      col >= NUM_COLS ||
      gameState[row][col] !== EMPTY_SPACE ||
      turn !== turnToMove
    ) {
      return;
    }
    socket.emit("sendMove", { row, col }, ({ error }) => {
      if (error != null) {
        alert(error);
      }
    });
  };

  const hasButtonClick = turn === turnToMove && hasGameStarted && !hasGameEnded;

  return (
    <div className="game-container">
      <div className="game-message">
        {hasGameEnded
          ? gameEndedReason
          : !hasGameStarted
          ? "Waiting for other player to connect..."
          : turnToMove !== turn
          ? "Opponent's turn"
          : "Your turn"}
      </div>
      <div className="game">
        {Array(NUM_ROWS * NUM_COLS)
          .fill(null)
          .map((_, idx) => {
            const currRow = Math.floor(idx / NUM_ROWS);
            const currCol = idx % NUM_COLS;
            return (
              <button
                style={{
                  borderRight: currCol === 0 ? BUTTON_BORDER_STYLE : "none",
                  borderLeft:
                    currCol === NUM_COLS - 1 ? BUTTON_BORDER_STYLE : "none",
                  borderBottom: currRow === 0 ? BUTTON_BORDER_STYLE : "none",
                  borderTop:
                    currRow === NUM_ROWS - 1 ? BUTTON_BORDER_STYLE : "none",
                }}
                onClick={onButtonClick(currRow, currCol)}
                className={`game-button ${!hasButtonClick ? "no-hover" : ""}`}
                disabled={!hasButtonClick}
                key={idx}
              >
                {gameState[currRow][currCol]}
              </button>
            );
          })}
      </div>
      {hasGameStarted && (
        <div className="game-message">You are {PLAYER_TOKENS[turnToMove]}</div>
      )}
    </div>
  );
}

export default App;
