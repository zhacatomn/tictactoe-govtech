import { createContext, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./general.css";
import Menu from "./Menu";
import Game from "./Game";

export const NameContext = createContext();

function App() {
  const [name, setName] = useState("Default Name");
  return (
    <NameContext.Provider value={{ name, setName }}>
      <BrowserRouter>
        <main className="main-container">
          <Routes>
            <Route path="/" element={<Menu />} />
            <Route path="/:roomId" element={<Game />} />
          </Routes>
        </main>
      </BrowserRouter>
    </NameContext.Provider>
  );
}

export default App;
