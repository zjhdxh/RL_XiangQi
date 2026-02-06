const boardEl = document.getElementById("board");
const currentPlayerEl = document.getElementById("current-player");
const checkStatusEl = document.getElementById("check-status");
const gameStatusEl = document.getElementById("game-status");
const restartBtn = document.getElementById("restart");
const undoBtn = document.getElementById("undo");

const PIECE_LABELS = {
  general: { red: "帅", black: "将" },
  advisor: { red: "仕", black: "士" },
  elephant: { red: "相", black: "象" },
  horse: { red: "马", black: "马" },
  chariot: { red: "车", black: "车" },
  cannon: { red: "炮", black: "砲" },
  soldier: { red: "兵", black: "卒" },
};

const DIRECTIONS = {
  orthogonal: [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ],
};

let gameState = null;
let selected = null;
let availableMoves = [];
let aiThinking = false;

const inBounds = (row, col) => row >= 0 && row < 10 && col >= 0 && col < 9;

const cloneBoard = (board) => board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));

const initialBoard = () => {
  const emptyRow = () => Array(9).fill(null);
  const board = Array.from({ length: 10 }, emptyRow);

  const place = (row, col, type, color) => {
    board[row][col] = { type, color };
  };

  // Black side
  place(0, 0, "chariot", "black");
  place(0, 1, "horse", "black");
  place(0, 2, "elephant", "black");
  place(0, 3, "advisor", "black");
  place(0, 4, "general", "black");
  place(0, 5, "advisor", "black");
  place(0, 6, "elephant", "black");
  place(0, 7, "horse", "black");
  place(0, 8, "chariot", "black");
  place(2, 1, "cannon", "black");
  place(2, 7, "cannon", "black");
  place(3, 0, "soldier", "black");
  place(3, 2, "soldier", "black");
  place(3, 4, "soldier", "black");
  place(3, 6, "soldier", "black");
  place(3, 8, "soldier", "black");

  // Red side
  place(9, 0, "chariot", "red");
  place(9, 1, "horse", "red");
  place(9, 2, "elephant", "red");
  place(9, 3, "advisor", "red");
  place(9, 4, "general", "red");
  place(9, 5, "advisor", "red");
  place(9, 6, "elephant", "red");
  place(9, 7, "horse", "red");
  place(9, 8, "chariot", "red");
  place(7, 1, "cannon", "red");
  place(7, 7, "cannon", "red");
  place(6, 0, "soldier", "red");
  place(6, 2, "soldier", "red");
  place(6, 4, "soldier", "red");
  place(6, 6, "soldier", "red");
  place(6, 8, "soldier", "red");

  return board;
};

const createState = () => ({
  board: initialBoard(),
  currentPlayer: "red",
  winner: null,
  history: [],
});

const getGeneralPosition = (board, color) => {
  for (let row = 0; row < 10; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      const piece = board[row][col];
      if (piece && piece.type === "general" && piece.color === color) {
        return { row, col };
      }
    }
  }
  return null;
};

const isSameColor = (piece, color) => piece && piece.color === color;

const isEnemy = (piece, color) => piece && piece.color !== color;

const palaceContains = (row, col, color) => {
  if (color === "red") {
    return row >= 7 && row <= 9 && col >= 3 && col <= 5;
  }
  return row >= 0 && row <= 2 && col >= 3 && col <= 5;
};

const riverCrossed = (row, color) => (color === "red" ? row <= 4 : row >= 5);

const addMove = (moves, board, from, to, color) => {
  const target = board[to.row][to.col];
  if (!target || isEnemy(target, color)) {
    moves.push({ from, to, capture: !!target });
  }
};

const generateStraightMoves = (board, from, color, captureRule) => {
  const moves = [];
  for (const [dr, dc] of DIRECTIONS.orthogonal) {
    let row = from.row + dr;
    let col = from.col + dc;
    let blocked = false;
    while (inBounds(row, col)) {
      const target = board[row][col];
      if (!blocked) {
        if (!target) {
          if (captureRule !== "capture-only") {
            addMove(moves, board, from, { row, col }, color);
          }
        } else {
          if (captureRule === "normal") {
            if (isEnemy(target, color)) {
              addMove(moves, board, from, { row, col }, color);
            }
            break;
          }
          blocked = true;
        }
      } else {
        if (target) {
          if (captureRule === "cannon") {
            if (isEnemy(target, color)) {
              addMove(moves, board, from, { row, col }, color);
            }
          }
          break;
        }
      }
      row += dr;
      col += dc;
    }
  }
  return moves;
};

const generateMovesForPiece = (board, row, col) => {
  const piece = board[row][col];
  if (!piece) return [];
  const color = piece.color;
  const moves = [];
  const from = { row, col };

  switch (piece.type) {
    case "general": {
      for (const [dr, dc] of DIRECTIONS.orthogonal) {
        const nr = row + dr;
        const nc = col + dc;
        if (inBounds(nr, nc) && palaceContains(nr, nc, color)) {
          addMove(moves, board, from, { row: nr, col: nc }, color);
        }
      }
      const enemyGeneral = getGeneralPosition(board, color === "red" ? "black" : "red");
      if (enemyGeneral && enemyGeneral.col === col) {
        const step = enemyGeneral.row > row ? 1 : -1;
        let clear = true;
        for (let r = row + step; r !== enemyGeneral.row; r += step) {
          if (board[r][col]) {
            clear = false;
            break;
          }
        }
        if (clear) {
          addMove(moves, board, from, enemyGeneral, color);
        }
      }
      break;
    }
    case "advisor": {
      const deltas = [
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
      ];
      deltas.forEach(([dr, dc]) => {
        const nr = row + dr;
        const nc = col + dc;
        if (inBounds(nr, nc) && palaceContains(nr, nc, color)) {
          addMove(moves, board, from, { row: nr, col: nc }, color);
        }
      });
      break;
    }
    case "elephant": {
      const deltas = [
        [2, 2],
        [2, -2],
        [-2, 2],
        [-2, -2],
      ];
      deltas.forEach(([dr, dc]) => {
        const nr = row + dr;
        const nc = col + dc;
        const br = row + dr / 2;
        const bc = col + dc / 2;
        if (!inBounds(nr, nc)) return;
        if (color === "red" && nr < 5) return;
        if (color === "black" && nr > 4) return;
        if (board[br][bc]) return;
        addMove(moves, board, from, { row: nr, col: nc }, color);
      });
      break;
    }
    case "horse": {
      const deltas = [
        { block: [1, 0], move: [2, 1] },
        { block: [1, 0], move: [2, -1] },
        { block: [-1, 0], move: [-2, 1] },
        { block: [-1, 0], move: [-2, -1] },
        { block: [0, 1], move: [1, 2] },
        { block: [0, 1], move: [-1, 2] },
        { block: [0, -1], move: [1, -2] },
        { block: [0, -1], move: [-1, -2] },
      ];
      deltas.forEach(({ block, move }) => {
        const br = row + block[0];
        const bc = col + block[1];
        const nr = row + move[0];
        const nc = col + move[1];
        if (!inBounds(nr, nc)) return;
        if (board[br][bc]) return;
        addMove(moves, board, from, { row: nr, col: nc }, color);
      });
      break;
    }
    case "chariot":
      return generateStraightMoves(board, from, color, "normal");
    case "cannon": {
      const moveMoves = generateStraightMoves(board, from, color, "capture-only");
      const captureMoves = generateStraightMoves(board, from, color, "cannon");
      return [...moveMoves, ...captureMoves];
    }
    case "soldier": {
      const forward = color === "red" ? -1 : 1;
      const nr = row + forward;
      if (inBounds(nr, col)) {
        addMove(moves, board, from, { row: nr, col }, color);
      }
      if (riverCrossed(row, color)) {
        [col - 1, col + 1].forEach((nc) => {
          if (inBounds(row, nc)) {
            addMove(moves, board, from, { row, col: nc }, color);
          }
        });
      }
      break;
    }
    default:
      break;
  }

  return moves;
};

const applyMove = (state, move) => {
  const nextBoard = cloneBoard(state.board);
  const piece = nextBoard[move.from.row][move.from.col];
  nextBoard[move.from.row][move.from.col] = null;
  nextBoard[move.to.row][move.to.col] = piece;
  return {
    board: nextBoard,
    currentPlayer: state.currentPlayer === "red" ? "black" : "red",
    winner: state.winner,
    history: [...state.history, { board: state.board, currentPlayer: state.currentPlayer }],
  };
};

const getLegalMoves = (state, color) => {
  const moves = [];
  for (let row = 0; row < 10; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      const piece = state.board[row][col];
      if (piece && piece.color === color) {
        const pieceMoves = generateMovesForPiece(state.board, row, col);
        pieceMoves.forEach((move) => {
          const simulated = applyMove({ ...state, history: [] }, move);
          if (!isInCheck(simulated.board, color)) {
            moves.push(move);
          }
        });
      }
    }
  }
  return moves;
};

const isInCheck = (board, color) => {
  const general = getGeneralPosition(board, color);
  if (!general) return false;
  const enemy = color === "red" ? "black" : "red";

  for (let row = 0; row < 10; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      const piece = board[row][col];
      if (piece && piece.color === enemy) {
        const pieceMoves = generateMovesForPiece(board, row, col);
        if (pieceMoves.some((move) => move.to.row === general.row && move.to.col === general.col)) {
          return true;
        }
      }
    }
  }
  return false;
};

const updateStatus = () => {
  const { currentPlayer, winner, board } = gameState;
  currentPlayerEl.textContent = `当前玩家：${currentPlayer === "red" ? "红方" : "黑方"}`;

  if (winner) {
    gameStatusEl.textContent = `胜负：${winner === "red" ? "红方获胜" : "黑方获胜"}`;
  } else {
    gameStatusEl.textContent = "胜负：进行中";
  }

  const inCheck = isInCheck(board, currentPlayer);
  checkStatusEl.textContent = inCheck ? "状态：将军！" : "状态：安全";
};

const renderBoard = () => {
  boardEl.innerHTML = "";
  for (let row = 0; row < 10; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      const cell = document.createElement("div");
      cell.className = "cell";
      if ((row + col) % 2 === 0) cell.classList.add("dark");
      cell.dataset.row = row;
      cell.dataset.col = col;

      const isSelected = selected && selected.row === row && selected.col === col;
      if (isSelected) {
        cell.classList.add("selected");
      }

      const move = availableMoves.find((item) => item.to.row === row && item.to.col === col);
      if (move) {
        cell.classList.add(move.capture ? "capture" : "available");
      }

      const piece = gameState.board[row][col];
      if (piece) {
        const pieceEl = document.createElement("div");
        pieceEl.className = `piece ${piece.color}`;
        pieceEl.textContent = PIECE_LABELS[piece.type][piece.color];
        cell.appendChild(pieceEl);
      }

      cell.addEventListener("click", () => handleCellClick(row, col));
      boardEl.appendChild(cell);
    }
  }
};

const resetSelection = () => {
  selected = null;
  availableMoves = [];
};

const handleCellClick = (row, col) => {
  if (gameState.winner || aiThinking) return;

  const piece = gameState.board[row][col];
  if (selected) {
    const move = availableMoves.find((item) => item.to.row === row && item.to.col === col);
    if (move) {
      performMove(move);
      return;
    }
  }

  if (piece && piece.color === gameState.currentPlayer && gameState.currentPlayer === "red") {
    selected = { row, col };
    availableMoves = getLegalMoves(gameState, piece.color).filter(
      (move) => move.from.row === row && move.from.col === col,
    );
  } else {
    resetSelection();
  }
  renderBoard();
};

const performMove = (move) => {
  gameState = applyMove(gameState, move);
  resetSelection();
  finalizeTurn();
};

const finalizeTurn = () => {
  const opponent = gameState.currentPlayer;
  const legalMoves = getLegalMoves(gameState, opponent);
  const opponentGeneral = getGeneralPosition(gameState.board, opponent);
  if (!opponentGeneral) {
    gameState.winner = opponent === "red" ? "black" : "red";
  } else if (legalMoves.length === 0) {
    if (isInCheck(gameState.board, opponent)) {
      gameState.winner = opponent === "red" ? "black" : "red";
    }
  }
  updateStatus();
  renderBoard();
  undoBtn.disabled = gameState.history.length === 0;

  if (!gameState.winner && gameState.currentPlayer === "black") {
    triggerAiMove();
  }
};

const triggerAiMove = () => {
  aiThinking = true;
  updateStatus();
  setTimeout(() => {
    const legalMoves = getLegalMoves(gameState, "black");
    if (legalMoves.length === 0) {
      aiThinking = false;
      finalizeTurn();
      return;
    }
    const move = legalMoves[Math.floor(Math.random() * legalMoves.length)];
    gameState = applyMove(gameState, move);
    aiThinking = false;
    finalizeTurn();
  }, 400);
};

const restartGame = () => {
  gameState = createState();
  resetSelection();
  aiThinking = false;
  updateStatus();
  renderBoard();
  undoBtn.disabled = true;
};

const undoMove = () => {
  if (gameState.history.length === 0 || aiThinking) return;
  const previous = gameState.history[gameState.history.length - 1];
  gameState = {
    ...gameState,
    board: cloneBoard(previous.board),
    currentPlayer: previous.currentPlayer,
    winner: null,
    history: gameState.history.slice(0, -1),
  };
  resetSelection();
  updateStatus();
  renderBoard();
  undoBtn.disabled = gameState.history.length === 0;
};

restartBtn.addEventListener("click", restartGame);
undoBtn.addEventListener("click", undoMove);

restartGame();
