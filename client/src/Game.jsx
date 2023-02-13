import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router";
import { Link } from "react-router-dom";
import io from "socket.io-client";
import { NameContext } from "./App";
import "./Game.css";

const BUTTON_BORDER_STYLE = "5px solid black";
const NUM_ROWS = 3;
const NUM_COLS = 3;
const PLAYER_TOKENS = ["X", "O"];
const EMPTY_SPACE = "";
const SERVER_URL = "http://localhost:5000";

const gameStatusEnum = {
  WAITING: 0,
  IN_PROGRESS: 1,
  ENDED: 2,
};

const connectionOptions = {
  "force new connection": true,
  reconnectionAttempts: "Infinity",
  timeout: 10000,
  transports: ["websocket"],
};

const socket = io.connect(SERVER_URL, connectionOptions);

function Game() {
  const [gameState, setGameState] = useState(
    Array(NUM_ROWS)
      .fill(null)
      .map(() => Array(NUM_COLS).fill(EMPTY_SPACE))
  );

  const { roomId } = useParams();
  const { name } = useContext(NameContext);
  const [isLoading, setIsLoading] = useState(true);
  const [socketError, setSocketError] = useState(null);
  const [turn, setTurn] = useState(0);
  const [turnToMove, setTurnToMove] = useState(null);
  const [gameStatus, setGameStatus] = useState(gameStatusEnum.WAITING);
  const [gameResult, setGameResult] = useState("");
  const [playerNames, setPlayerNames] = useState([]);

  useEffect(() => {
    socket.emit("joinRoom", { name, roomId }, (response) => {
      setIsLoading(false);
      if (response?.error != null) {
        setSocketError(response.error);
      }
    });
  }, [name, roomId]);

  useEffect(() => {
    socket.on("startGame", ({ turnToMove, initTurn, playerNames }) => {
      setTurnToMove(turnToMove);
      setTurn(initTurn);
      setGameStatus(gameStatusEnum.IN_PROGRESS);
      setPlayerNames(playerNames);
    });

    socket.on("updateGame", ({ gameState, turn }) => {
      setGameState(gameState);
      setTurn(turn);
    });

    socket.on("endGame", ({ reason }) => {
      console.log(reason);
      setGameResult(reason);
      setGameStatus(gameStatusEnum.ENDED);
    });
  }, []);

  if (isLoading) {
    return <h1>Loading...</h1>;
  }

  if (socketError != null) {
    return (
      <>
        <h1>There was an error entering the room</h1>
        <section>{socketError}</section>
        <Link to="/">
          <button>BACK TO MENU</button>
        </Link>
      </>
    );
  }

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
    socket.emit("makeMove", { row, col }, ({ error }) => {
      if (error != null) {
        alert(error);
      }
    });
  };
  const hasButtonClick =
    turn === turnToMove && gameStatus === gameStatusEnum.IN_PROGRESS;
  const headerMessage =
    gameStatus === gameStatusEnum.WAITING ? (
      `Room code: ${roomId}`
    ) : (
      <>
        <span class="color-cross font-inherit">{`${playerNames[0]} (${PLAYER_TOKENS[0]})`}</span>{" "}
        vs{" "}
        <span class="color-circle font-inherit">{`${playerNames[1]} (${PLAYER_TOKENS[1]})`}</span>
      </>
    );
  const topMessage =
    gameStatus === gameStatusEnum.ENDED
      ? gameResult
      : gameStatus === gameStatusEnum.WAITING
      ? "Waiting for other player to connect..."
      : `${playerNames[turn]}'s (${
          turnToMove === turn ? "You" : "Opponent"
        }) turn`;
  const topMessageColor =
    gameStatus === gameStatusEnum.IN_PROGRESS
      ? turn === 0
        ? "color-cross"
        : "color-circle"
      : "";

  return (
    <>
      <h1 class="game-header">{headerMessage}</h1>
      <h2 className={`game-message-top ${topMessageColor}`}>{topMessage}</h2>
      <div className="game">
        {Array(NUM_ROWS * NUM_COLS)
          .fill(null)
          .map((_, idx) => {
            const currRow = Math.floor(idx / NUM_ROWS);
            const currCol = idx % NUM_COLS;
            const token = gameState[currRow][currCol];
            const colorClass =
              token === EMPTY_SPACE
                ? ""
                : token === "X"
                ? "color-cross"
                : "color-circle";
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
                className={`game-button ${
                  !hasButtonClick ? "no-hover" : ""
                } ${colorClass}`}
                disabled={!hasButtonClick}
                key={idx}
              >
                {token}
              </button>
            );
          })}
      </div>
      {!(gameStatus === gameStatusEnum.IN_PROGRESS) && (
        <Link to="/">
          <button>BACK TO MENU</button>
        </Link>
      )}
    </>
  );
}

export default Game;
