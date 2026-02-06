const board = document.querySelector("#board");

const pieces = [
  { row: 0, col: 0, label: "車", side: "black" },
  { row: 0, col: 1, label: "馬", side: "black" },
  { row: 0, col: 2, label: "象", side: "black" },
  { row: 0, col: 3, label: "士", side: "black" },
  { row: 0, col: 4, label: "將", side: "black" },
  { row: 0, col: 5, label: "士", side: "black" },
  { row: 0, col: 6, label: "象", side: "black" },
  { row: 0, col: 7, label: "馬", side: "black" },
  { row: 0, col: 8, label: "車", side: "black" },
  { row: 2, col: 1, label: "炮", side: "black" },
  { row: 2, col: 7, label: "炮", side: "black" },
  { row: 3, col: 0, label: "卒", side: "black" },
  { row: 3, col: 2, label: "卒", side: "black" },
  { row: 3, col: 4, label: "卒", side: "black" },
  { row: 3, col: 6, label: "卒", side: "black" },
  { row: 3, col: 8, label: "卒", side: "black" },
  { row: 9, col: 0, label: "車", side: "red" },
  { row: 9, col: 1, label: "馬", side: "red" },
  { row: 9, col: 2, label: "相", side: "red" },
  { row: 9, col: 3, label: "仕", side: "red" },
  { row: 9, col: 4, label: "帥", side: "red" },
  { row: 9, col: 5, label: "仕", side: "red" },
  { row: 9, col: 6, label: "相", side: "red" },
  { row: 9, col: 7, label: "馬", side: "red" },
  { row: 9, col: 8, label: "車", side: "red" },
  { row: 7, col: 1, label: "炮", side: "red" },
  { row: 7, col: 7, label: "炮", side: "red" },
  { row: 6, col: 0, label: "兵", side: "red" },
  { row: 6, col: 2, label: "兵", side: "red" },
  { row: 6, col: 4, label: "兵", side: "red" },
  { row: 6, col: 6, label: "兵", side: "red" },
  { row: 6, col: 8, label: "兵", side: "red" },
];

const pieceLookup = new Map(pieces.map((piece) => [`${piece.row}-${piece.col}`, piece]));

for (let row = 0; row < 10; row += 1) {
  for (let col = 0; col < 9; col += 1) {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.dataset.row = row;
    cell.dataset.col = col;

    const piece = pieceLookup.get(`${row}-${col}`);
    if (piece) {
      const token = document.createElement("div");
      token.className = `piece ${piece.side}`;
      token.textContent = piece.label;
      cell.appendChild(token);
    }

    board.appendChild(cell);
  }
}
