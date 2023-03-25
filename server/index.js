const { createServer } = require("http");
const { Server } = require("socket.io");
const express = require("express");
const cors = require("cors");
const path = require("path");

const engine = express();
const server = createServer(engine);
const ws = new Server(server, {
  cors: {
    origin: "*",
    optionsSuccessStatus: 200,
  },
});
engine.use(express.static(path.join(__dirname, "..", "html")));
engine.use(
  cors({
    origin: "*",
    methods: "GET",
    optionsSuccessStatus: 200,
  })
);

const games = [];
let guid = () => {
  let s4 = () => {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  };
  //return id of format 'aaaaaaaa'-'aaaa'-'aaaa'-'aaaa'-'aaaaaaaaaaaa'
  return (
    s4() +
    s4() +
    "-" +
    s4() +
    "-" +
    s4() +
    "-" +
    s4() +
    "-" +
    s4() +
    s4() +
    s4()
  );
};
let getGame = (id) => {
  let game = games.find((g) => g.players.length === 1);
  if (!game) {
    game = {
      players: [id],
      id: guid(),
      board: createBoard(),
      player: id,
    };
    games.push(game);
  } else {
    game.players.push(id);
  }
  return game;
};

ws.on("connection", (socket) => {
  const id = socket.handshake.auth.id;
  let game = getGame(id);
  socket.on("disconnect", () => {
    ws.sockets.emit("game-end", {
      game: game.id,
      winner: game.players.find((p) => p !== id),
    });
  });
  socket.emit("game-id", {
    game: game.id,
    board: game.board,
    player: game.player,
    first: game.players.length === 1,
  });
  if (game.players.length === 2) {
    ws.sockets.emit("game-start", {
      game: game.id,
      players: game.players,
      player: game.player,
    });
  }
  socket.on("place", (e) => {
    game.board[e.k][e.l] = id;
    ws.sockets.emit("turn", {
      game: game.id,
      turn: game.players.find((p) => p !== id),
      player: id,
      board: game.board,
      k: e.k,
      l: e.l,
    });
    if (verifVictoire(game.board, id, e.k, e.l)) {
      ws.sockets.emit("game-end", {
        game: game.id,
        winner: id,
      });
      game = undefined;
    }
  });
  socket.on("new-game", () => {
    game = getGame(id);
    socket.emit("game-id", {
      game: game.id,
      board: game.board,
      player: game.player,
      first: game.players.length === 1,
    });
    if (game.players.length === 2) {
      ws.sockets.emit("game-start", {
        game: game.id,
        players: game.players,
        player: game.player,
      });
    }
  });
});

function createBoard() {
  const board = [];
  for (let i = 0; i < 6; i++) {
    board[i] = [];
    for (let j = 0; j < 7; j++) {
      board[i][j] = 0;
    }
  }
  return board;
}

function verifVictoire(board, id, i, j) {
  colonne = 7;
  ligne = 6;
  // Vérification horizontale
  let countLigne = 0;
  let h = 0;
  while (h < colonne) {
    if (board[i][h] == id) {
      countLigne++;
      h++;
    } else if (board[i][h] !== id && countLigne == 4) {
      h++;
    } else {
      countLigne = 0;
      h++;
    }
  }

  // Vérification verticale
  let countColonne = 0;
  let v = 0;
  while (v < ligne) {
    if (board[v][j] == id) {
      countColonne++;
      v++;
    } else if (board[v][j] !== id && countColonne == 4) {
      v++;
    } else {
      countColonne = 0;
      v++;
    }
  }

  // Vérification diagonale
  let countDiag = 0;
  let d = -Math.min(i, j);

  while (i + d < ligne && j + d < colonne && i + d >= 0 && j + d >= 0) {
    if (board[i + d][j + d] == id) {
      countDiag++;
      d++;
    } else if (board[i + d][j + d] !== id && countDiag == 4) {
      d++;
    } else {
      countDiag = 0;
      d++;
    }
  }

  // Vérification anti-diagonale
  let countAntiDiag = 0;
  let a = -Math.min(i, colonne - 1 - j);
  while (i + a < ligne && j - a < colonne && i + a >= 0 && j - a >= 0) {
    if (board[i + a][j - a] == id) {
      countAntiDiag++;
      a++;
    } else if (board[i + a][j - a] !== id && countAntiDiag == 4) {
      a++;
    } else {
      countAntiDiag = 0;
      a++;
    }
  }

  return (
    countLigne >= 4 || countColonne >= 4 || countDiag >= 4 || countAntiDiag >= 4
  );
}

server.listen(8080);
