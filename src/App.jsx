import { useState } from "react";
import "./style.css";

const BUTTON_BORDER_STYLE = "5px solid black";
const NUM_ROWS = 3;
const NUM_COLS = 3;
const GAME_CHARS = ["X", "O"];
const EMPTY_SPACE = "";

function App() {
  const [gameState, setGameState] = useState(
    Array(3)
      .fill(null)
      .map(() => Array.of("", "", ""))
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
        rowIdx === row && colIdx === col ? GAME_CHARS[turn] : ele
      );
    });
    setGameHistory([...gameHistory, gameState]);
    setGameState(newGameState);
    setTurn(turn === 0 ? 1 : 0);
  };

  return (
    <div className="game-container">
      <div className="game">
        {Array(9)
          .fill(null)
          .map((_, idx) => {
            const currRow = Math.floor(idx / 3);
            const currCol = idx % 3;
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
