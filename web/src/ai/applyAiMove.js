import { chooseMove } from './chooseMove';

export const applyAiMove = (board, side, options = {}) => {
  const move = chooseMove(board, side, options);
  if (!move || !board) {
    return null;
  }

  if (typeof board.applyMove === 'function') {
    board.applyMove(move);
    return move;
  }

  if (typeof board.makeMove === 'function') {
    board.makeMove(move);
    return move;
  }

  if (typeof board.move === 'function') {
    board.move(move);
    return move;
  }

  return move;
};

export default applyAiMove;
