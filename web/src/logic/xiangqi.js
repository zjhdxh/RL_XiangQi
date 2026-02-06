const BOARD_ROWS = 10;
const BOARD_COLS = 9;

const PIECE_TYPES = {
  GENERAL: 'G',
  ADVISOR: 'A',
  ELEPHANT: 'E',
  HORSE: 'H',
  ROOK: 'R',
  CANNON: 'C',
  SOLDIER: 'S',
};

const COLORS = {
  RED: 'r',
  BLACK: 'b',
};

const PALACE = {
  [COLORS.RED]: { rows: [7, 9], cols: [3, 5] },
  [COLORS.BLACK]: { rows: [0, 2], cols: [3, 5] },
};

const RIVER_ROW = 4;

const normalizePos = (pos) => {
  if (Array.isArray(pos)) {
    return { row: pos[0], col: pos[1] };
  }
  return { row: pos.row, col: pos.col };
};

const inBounds = (row, col) =>
  row >= 0 && row < BOARD_ROWS && col >= 0 && col < BOARD_COLS;

const cloneBoard = (board) => board.map((row) => row.slice());

const getPiece = (board, row, col) => {
  if (!inBounds(row, col)) return null;
  return board[row][col] || null;
};

const getColor = (piece) => (piece ? piece[0] : null);
const getType = (piece) => (piece ? piece[1] : null);

const isInsidePalace = (color, row, col) => {
  const palace = PALACE[color];
  return (
    row >= palace.rows[0] &&
    row <= palace.rows[1] &&
    col >= palace.cols[0] &&
    col <= palace.cols[1]
  );
};

const countPiecesBetween = (board, from, to) => {
  const dr = Math.sign(to.row - from.row);
  const dc = Math.sign(to.col - from.col);
  let row = from.row + dr;
  let col = from.col + dc;
  let count = 0;
  while (row !== to.row || col !== to.col) {
    if (getPiece(board, row, col)) count += 1;
    row += dr;
    col += dc;
  }
  return count;
};

const isStraightLine = (from, to) =>
  from.row === to.row || from.col === to.col;

const isDiagonal = (from, to) =>
  Math.abs(from.row - to.row) === Math.abs(from.col - to.col);

const findGeneral = (board, color) => {
  for (let row = 0; row < BOARD_ROWS; row += 1) {
    for (let col = 0; col < BOARD_COLS; col += 1) {
      const piece = getPiece(board, row, col);
      if (piece && getColor(piece) === color && getType(piece) === PIECE_TYPES.GENERAL) {
        return { row, col };
      }
    }
  }
  return null;
};

const generalsFacing = (board) => {
  const redGeneral = findGeneral(board, COLORS.RED);
  const blackGeneral = findGeneral(board, COLORS.BLACK);
  if (!redGeneral || !blackGeneral) return false;
  if (redGeneral.col !== blackGeneral.col) return false;
  const between = countPiecesBetween(board, redGeneral, blackGeneral);
  return between === 0;
};

const isHorseMoveLegal = (board, from, to) => {
  const dr = to.row - from.row;
  const dc = to.col - from.col;
  const absDr = Math.abs(dr);
  const absDc = Math.abs(dc);
  if (!((absDr === 2 && absDc === 1) || (absDr === 1 && absDc === 2))) return false;
  if (absDr === 2) {
    const blockRow = from.row + Math.sign(dr);
    return !getPiece(board, blockRow, from.col);
  }
  const blockCol = from.col + Math.sign(dc);
  return !getPiece(board, from.row, blockCol);
};

const isElephantMoveLegal = (board, from, to, color) => {
  if (!isDiagonal(from, to)) return false;
  if (Math.abs(from.row - to.row) !== 2) return false;
  if (color === COLORS.RED && to.row <= RIVER_ROW) return false;
  if (color === COLORS.BLACK && to.row > RIVER_ROW) return false;
  const midRow = (from.row + to.row) / 2;
  const midCol = (from.col + to.col) / 2;
  return !getPiece(board, midRow, midCol);
};

const isAdvisorMoveLegal = (from, to, color) => {
  if (!isDiagonal(from, to)) return false;
  if (Math.abs(from.row - to.row) !== 1) return false;
  return isInsidePalace(color, to.row, to.col);
};

const isGeneralMoveLegal = (board, from, to, color) => {
  const dr = Math.abs(from.row - to.row);
  const dc = Math.abs(from.col - to.col);
  if (dr + dc !== 1) return false;
  if (!isInsidePalace(color, to.row, to.col)) return false;
  const nextBoard = cloneBoard(board);
  nextBoard[to.row][to.col] = nextBoard[from.row][from.col];
  nextBoard[from.row][from.col] = null;
  return !generalsFacing(nextBoard);
};

const isSoldierMoveLegal = (from, to, color) => {
  const dr = to.row - from.row;
  const dc = to.col - from.col;
  if (color === COLORS.RED) {
    if (dr === -1 && dc === 0) return true;
    if (from.row <= RIVER_ROW && dr === 0 && Math.abs(dc) === 1) return true;
  } else {
    if (dr === 1 && dc === 0) return true;
    if (from.row > RIVER_ROW && dr === 0 && Math.abs(dc) === 1) return true;
  }
  return false;
};

const isCannonMoveLegal = (board, from, to, isCapture) => {
  if (!isStraightLine(from, to)) return false;
  const between = countPiecesBetween(board, from, to);
  if (isCapture) return between === 1;
  return between === 0;
};

const isRookMoveLegal = (board, from, to) => {
  if (!isStraightLine(from, to)) return false;
  return countPiecesBetween(board, from, to) === 0;
};

const isPseudoLegalMove = (board, from, to) => {
  if (!inBounds(to.row, to.col)) return false;
  const piece = getPiece(board, from.row, from.col);
  if (!piece) return false;
  const color = getColor(piece);
  const target = getPiece(board, to.row, to.col);
  if (target && getColor(target) === color) return false;

  const type = getType(piece);
  const isCapture = Boolean(target);
  switch (type) {
    case PIECE_TYPES.GENERAL:
      return isGeneralMoveLegal(board, from, to, color);
    case PIECE_TYPES.ADVISOR:
      return isAdvisorMoveLegal(from, to, color);
    case PIECE_TYPES.ELEPHANT:
      return isElephantMoveLegal(board, from, to, color);
    case PIECE_TYPES.HORSE:
      return isHorseMoveLegal(board, from, to);
    case PIECE_TYPES.ROOK:
      return isRookMoveLegal(board, from, to);
    case PIECE_TYPES.CANNON:
      return isCannonMoveLegal(board, from, to, isCapture);
    case PIECE_TYPES.SOLDIER:
      return isSoldierMoveLegal(from, to, color);
    default:
      return false;
  }
};

const isInCheck = (board, color) => {
  const general = findGeneral(board, color);
  if (!general) return true;
  const opponent = color === COLORS.RED ? COLORS.BLACK : COLORS.RED;

  if (generalsFacing(board)) {
    const otherGeneral = findGeneral(board, opponent);
    if (otherGeneral && otherGeneral.col === general.col) return true;
  }

  for (let row = 0; row < BOARD_ROWS; row += 1) {
    for (let col = 0; col < BOARD_COLS; col += 1) {
      const piece = getPiece(board, row, col);
      if (!piece || getColor(piece) !== opponent) continue;
      if (isPseudoLegalMove(board, { row, col }, general)) {
        return true;
      }
    }
  }
  return false;
};

const hasAnyLegalMove = (board, color) => {
  for (let row = 0; row < BOARD_ROWS; row += 1) {
    for (let col = 0; col < BOARD_COLS; col += 1) {
      const piece = getPiece(board, row, col);
      if (!piece || getColor(piece) !== color) continue;
      for (let toRow = 0; toRow < BOARD_ROWS; toRow += 1) {
        for (let toCol = 0; toCol < BOARD_COLS; toCol += 1) {
          if (isLegalMove(board, { row, col }, { row: toRow, col: toCol })) {
            return true;
          }
        }
      }
    }
  }
  return false;
};

const isLegalMove = (board, fromInput, toInput) => {
  const from = normalizePos(fromInput);
  const to = normalizePos(toInput);
  if (!inBounds(from.row, from.col) || !inBounds(to.row, to.col)) return false;
  const piece = getPiece(board, from.row, from.col);
  if (!piece) return false;
  if (from.row === to.row && from.col === to.col) return false;

  if (!isPseudoLegalMove(board, from, to)) return false;

  const nextBoard = cloneBoard(board);
  nextBoard[to.row][to.col] = nextBoard[from.row][from.col];
  nextBoard[from.row][from.col] = null;

  if (generalsFacing(nextBoard)) return false;
  return !isInCheck(nextBoard, getColor(piece));
};

const applyMove = (board, move) => {
  const from = normalizePos(move.from);
  const to = normalizePos(move.to);
  const legal = isLegalMove(board, from, to);
  if (!legal) {
    return { board, legal: false, reason: 'illegal-move' };
  }

  const nextBoard = cloneBoard(board);
  const movingPiece = nextBoard[from.row][from.col];
  const captured = nextBoard[to.row][to.col] || null;
  nextBoard[to.row][to.col] = movingPiece;
  nextBoard[from.row][from.col] = null;

  const moverColor = getColor(movingPiece);
  const opponent = moverColor === COLORS.RED ? COLORS.BLACK : COLORS.RED;
  const opponentGeneral = findGeneral(nextBoard, opponent);
  const check = opponentGeneral ? isInCheck(nextBoard, opponent) : true;
  let winner = null;
  let stalemate = false;

  if (!opponentGeneral) {
    winner = moverColor;
  } else if (!hasAnyLegalMove(nextBoard, opponent)) {
    if (check) {
      winner = moverColor;
    } else {
      stalemate = true;
    }
  }

  return {
    board: nextBoard,
    legal: true,
    captured,
    check,
    winner,
    stalemate,
    move: { from, to },
  };
};

export {
  BOARD_ROWS,
  BOARD_COLS,
  PIECE_TYPES,
  COLORS,
  isLegalMove,
  applyMove,
  isInCheck,
  hasAnyLegalMove,
};
