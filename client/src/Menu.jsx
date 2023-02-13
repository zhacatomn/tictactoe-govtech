import { useContext } from "react";
import { useNavigate } from "react-router";
import { NameContext } from "./App";
import "./Menu.css";

const Menu = () => {
  const { name, setName } = useContext(NameContext);
  const navigate = useNavigate();
  const createRoom = (e) => {
    fetch("http://localhost:5000/createRoom", {
      method: "GET",
      credentials: "omit",
    })
      .then(async (res) => {
        const data = await res.json();
        navigate(`/${data.roomId}`);
      })
      .catch((err) => {
        console.error(new Error(err));
        alert("There was an error getting the room ID");
      });
  };
  const joinRoom = (e) => {
    e.preventDefault();
    navigate(`/${e.target.roomId.value}`);
  };
  return (
    <>
      <h1>Tic Tac Toe</h1>
      <section className="section-name">
        <label htmlFor="name">Name</label>
        <br />
        <input
          type="text"
          id="name"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => {
            e.preventDefault();
            setName(e.target.value);
          }}
        />
      </section>
      <hr className="section-divider" />
      <section className="section-enter-game">
        <button onClick={createRoom}>CREATE NEW GAME</button>
        <h2>OR</h2>
        <form onSubmit={joinRoom}>
          <input type="text" placeholder="Enter room code" name="roomId" />
          <button type="submit">JOIN GAME</button>
        </form>
      </section>
    </>
  );
};

export default Menu;
