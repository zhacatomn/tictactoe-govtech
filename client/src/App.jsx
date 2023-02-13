import { createContext, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./general.css";
import Menu from "./Menu";
import Game from "./Game";

const ADJECTIVE_LIST = [
  "Dancing",
  "Happy",
  "Excited",
  "Thrilled",
  "Glowing",
  "Dashing",
  "Delighted",
  "Contented",
];
const NOUN_LIST = [
  "Unicorn",
  "Puppy",
  "Kitten",
  "Dragon",
  "Pony",
  "Bunny",
  "Parrot",
  "Giraffe",
];

export const NameContext = createContext();
const generateRandomName = () => {
  const adjectiveIdx = Math.floor(Math.random() * ADJECTIVE_LIST.length);
  const nounIdx = Math.floor(Math.random() * NOUN_LIST.length);
  return ADJECTIVE_LIST[adjectiveIdx] + NOUN_LIST[nounIdx];
};

const App = () => {
  const [name, setName] = useState(generateRandomName());
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
};

export default App;
