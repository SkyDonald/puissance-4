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

// Initialisation
let colonne = 7;
let ligne = 6;
let game = 0;
let board = new Array();
let contenuElt = document.getElementById("contenu");
contenuElt.innerHTML = "";
let turn = id;
let first = false;

let boutonElt = document.getElementById("newGame");
// Ajout d'un gestionnaire pour l'événement click
boutonElt.addEventListener("click", () => {
  socket.emit("new-game");
  newGame();
});

var id = guid();
const socket = io("ws://localhost:8080", {
  auth: {
    id,
  },
});

socket.on("game-id", (e) => {
  boutonElt.style.display = "none";
  alert("En attente d'un adversaire...");
  game = e.game;
  board = e.board;
  turn = 0;
  first = e.first;
});
socket.on("game-start", (e) => {
  console.log(e);
  if (e.game === game) {
    turn = e.player;
    alert(
      "Début de la partie" +
        (e.player === id ? ", vous commencez! " : ", l'adversaire commence.")
    );
  }
});
socket.on("turn", (e) => {
  if (e.game !== game) {
    return;
  }
  board = e.board;
  turn = e.turn;
  let caseMinElt = document.getElementById("L" + e.k + "C" + e.l);
  let divElt = document.createElement("div");
  divElt.className = "player";
  caseMinElt.appendChild(divElt);
  divElt.style.backgroundColor = first
    ? e.player === id
      ? "red"
      : "yellow"
    : e.player === id
    ? "yellow"
    : "red";
});

socket.on("game-end", (e) => {
  alert(
    e.winner === id
      ? "<h2>Vous êtes le vainqueur !</h2>"
      : "<h2>Vous avez perdu.</h2>"
  );
  // On supprime les évènements clics
  for (let i = 0; i < ligne; i++) {
    for (let j = 0; j < colonne; j++) {
      let caseElt = document.getElementById("L" + i + "C" + j);
      caseElt.style.backgroundColor = "blue";
      caseElt.removeEventListener("click", clickEvent);
    }
  }
  game = 0;
  boutonElt.style.display = "block";
});

// Fonctions
// Fonction de création du board
function createBoard(ligne, colonne) {
  let oldTable = document.querySelector("table");
  if (oldTable) oldTable.remove();
  // On crée l'élément table du DOM
  let tableElt = document.createElement("table");
  // Chaque case est un élément du tableau à deux dimensions
  // On parcours les lignes
  for (let i = 0; i < ligne; i++) {
    // Element tr du DOM
    let ligneElt = document.createElement("tr");
    ligneElt.id = "L" + i;
    // On parcours les colonnes de la ligne
    for (let j = 0; j < colonne; j++) {
      // Element td du DOM
      let colonneElt = document.createElement("td");
      colonneElt.id = "L" + i + "C" + j;
      // Ajout des colonnes à la ligne
      ligneElt.appendChild(colonneElt);
    }
    // Ajout des lignes au tableau
    tableElt.appendChild(ligneElt);
  }
  // ajout du tableau au contenu
  contenuElt.appendChild(tableElt);
}

// Fonction d'initialisation d'une nouvelle partie
function newGame() {
  createBoard(ligne, colonne);
  createEvent(ligne, colonne);
}

// Fonction d'ajout des évènement click sur le tableau
function createEvent(ligne, colonne) {
  // On créé les évènements sur les cases
  for (let i = 0; i < ligne; i++) {
    for (let j = 0; j < colonne; j++) {
      let caseElt = document.getElementById("L" + i + "C" + j);
      caseElt.addEventListener("click", clickEvent);
    }
  }
}

// Fonction clickEvent
function clickEvent() {
  if (turn !== id) return;
  let l = Number(this.id.charAt(3));
  let k = ligne - 1;
  while (k > -1) {
    if (board[k][l] == 0) {
      socket.emit("place", { k, l });
      k = -1;
    } else {
      k--;
    }
  }
}

newGame();
