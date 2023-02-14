# Tic Tac Toe App for GovTech Assessment

## Quick Start (Running Production)

First, clone this repository locally, and navigate to the folder on your command line.

This repository has been set to the production environment by default. To run the application, first we need to enter into the server folder:

```
$ cd server
```

If this is your **first time** running the application, we need to install the relevant node modules:

```
$ npm install
```

Now we just have to run the server:

```
$ npm start
```

**Leave the command line active**. Now you should be able to access the app at `http://localhost:5000/`

## Running Development

If you wish to run development, some extra steps have to be taken.

First, we need to re-configure the `.env` file on the server side. Edit the `server/.env` file on the server side to the following:

```
PORT = 5000
NODE_ENV = "development"
```

Next, we need to run both the server and client. Starting from the root directory of your local folder containing this repository:

```
$ cd server // navigate into the server folder
$ npm install // run this only if it's your FIRST TIME running the application
$ npm start
```

**Leave the command line active**.

On a **separate** command line, navigate to the repository folder again. Now, we need run the client:

```
$ cd client // navigate into the client folder
$ npm install // run this only if it's your FIRST TIME running the application
$ npm start
```

**Leave the command line active**.

Now you should be able to access the app at `http://localhost:3000/`

## Playing a Game

This app uses the idea of "rooms" to facillitate game sessions.
When you first load up the app, you should be greeted with this screen:
![](img/menu.png)
Here, a randomly generated name has been given to you, and you are free to change it to whatever you like.

To create a game, click the "CREATE NEW GAME" button. It should bring you to this page:
![](img/create_room.png)
Here, you are greeted with a blank tic-tac-toe grid, as well as a randomly generated **room code**.

On a **separate browser window**, load up the app again. (`http://localhost:5000/` if you're on production, `http://localhost:3000/` if you're on development). Copy and paste the earlier room code into the "Room code" text field and click the "JOIN GAME" button.

If done successfully, both players should see a room similar to this (the name's will likely be different):
![](img/game_start.png)
At this point, a normal game of Tic-Tac-Toe can be played between the 2 players.
Once the game ends, (either by drawing or by a player winning), a screen similar to this should be shown:
![](img/game_end.png)
At this point, both players can click the "BACK TO MENU" button to leave the room, and start a new game again.
