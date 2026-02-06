const DEFAULT_EVALUATION = (board, side) => {
  if (typeof board?.evaluate === 'function') {
    return board.evaluate(side);
  }

  const material = board?.material;
  if (material && typeof material === 'object') {
    const own = material[side] ?? 0;
    const opp = material[side === 'red' ? 'black' : 'red'] ?? 0;
    return own - opp;
  }

  return 0;
};

const getLegalMoves = (board, side) => {
  if (typeof board?.getLegalMoves === 'function') {
    return board.getLegalMoves(side) ?? [];
  }

  if (Array.isArray(board?.legalMoves)) {
    return board.legalMoves;
  }

  if (board?.legalMoves && typeof board.legalMoves === 'object') {
    return board.legalMoves[side] ?? [];
  }

  if (Array.isArray(board?.moves)) {
    return board.moves;
  }

  return [];
};

const applyMoveToClone = (board, move) => {
  if (typeof board?.clone === 'function') {
    const cloned = board.clone();
    if (typeof cloned?.applyMove === 'function') {
      cloned.applyMove(move);
      return cloned;
    }
    if (typeof cloned?.makeMove === 'function') {
      cloned.makeMove(move);
      return cloned;
    }
    if (typeof cloned?.move === 'function') {
      cloned.move(move);
      return cloned;
    }
    return cloned;
  }

  return null;
};

const pickRandomMove = (moves) => {
  if (!moves.length) {
    return null;
  }
  const index = Math.floor(Math.random() * moves.length);
  return moves[index];
};

export const chooseMove = (board, side, options = {}) => {
  const moves = getLegalMoves(board, side);
  if (!moves.length) {
    return null;
  }

  const depth = options.depth ?? 1;
  const evaluate = options.evaluate ?? DEFAULT_EVALUATION;

  if (depth <= 0 || typeof board?.clone !== 'function') {
    return pickRandomMove(moves);
  }

  let bestMove = moves[0];
  let bestScore = -Infinity;

  for (const move of moves) {
    const nextBoard = applyMoveToClone(board, move);
    if (!nextBoard) {
      continue;
    }
    const score = evaluate(nextBoard, side);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove ?? pickRandomMove(moves);
};

export default chooseMove;
