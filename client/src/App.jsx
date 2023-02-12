import { useState } from "react";
import "./style.css";

const BUTTON_BORDER_STYLE = "5px solid black";
const NUM_ROWS = 3;
const NUM_COLS = 3;
const PLAYER_TOKENS = ["X", "O"];
const EMPTY_SPACE = "";

function App() {
  const [gameState, setGameState] = useState(
    Array(NUM_ROWS)
      .fill(null)
      .map(() => Array(NUM_COLS).fill(EMPTY_SPACE))
  );
  const [gameHistory, setGameHistory] = useState([]);
  const [turn, setTurn] = useState(0);

  const onButtonClick = (row, col) => (_) => {
    if (
      row < 0 ||
      row >= NUM_ROWS ||
      col < 0 ||
      col >= NUM_COLS ||
      gameState[row][col] !== EMPTY_SPACE
    ) {
      return;
    }
    const newGameState = gameState.map((rowArr, rowIdx) => {
      return rowArr.map((ele, colIdx) =>
        rowIdx === row && colIdx === col ? PLAYER_TOKENS[turn] : ele
      );
    });
    setGameHistory([...gameHistory, gameState]);
    setGameState(newGameState);
    setTurn(turn === 0 ? 1 : 0);
  };

  return (
    <div className="game-container">
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
                className="game-button"
                key={idx}
              >
                {gameState[currRow][currCol]}
              </button>
            );
          })}
      </div>
    </div>
  );
}

export default App;
