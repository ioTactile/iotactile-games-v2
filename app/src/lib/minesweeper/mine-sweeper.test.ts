import { beforeEach, describe, expect, test } from 'vitest';

import { Cell } from './cell';
import { MineSweeper } from './mine-sweeper';
import { Timer } from './timer';
import type { GameOptions } from './types';

describe('MineSweeper', () => {
  let mineSweeper: MineSweeper;
  const options: GameOptions = {
    numRows: 5,
    numCols: 5,
    numMines: 3,
    difficulty: 'beginner',
  };

  beforeEach(() => {
    mineSweeper = new MineSweeper();
  });

  test('should initialize with default values', () => {
    expect(mineSweeper.getBoard()).toEqual([]);
    expect(mineSweeper.getNumRows()).toBe(0);
    expect(mineSweeper.getNumCols()).toBe(0);
    expect(mineSweeper.getNumMines()).toBe(0);
    expect(mineSweeper.getNumFlags()).toBe(0);
    expect(mineSweeper.getNumRevealed()).toBe(0);
    expect(mineSweeper.getTimer()).toBeInstanceOf(Timer);
    expect(mineSweeper.getGameStatus()).toBe('waiting');
    expect(mineSweeper.getDifficulty()).toBe('beginner');
  });

  test('should setup the game', () => {
    mineSweeper.setup(options);
    expect(mineSweeper.getNumRows()).toBe(5);
    expect(mineSweeper.getNumCols()).toBe(5);
    expect(mineSweeper.getNumMines()).toBe(3);
    expect(mineSweeper.getDifficulty()).toBe('beginner');
    expect(mineSweeper.getBoard().length).toBe(5);
    expect(mineSweeper.getBoard()[0].length).toBe(5);
    expect(mineSweeper.getBoard()[0][0]).toBeInstanceOf(Cell);
  });

  test('should restart the game', () => {
    mineSweeper.restart(options);
    expect(mineSweeper.getNumRows()).toBe(5);
    expect(mineSweeper.getNumCols()).toBe(5);
    expect(mineSweeper.getNumMines()).toBe(3);
    expect(mineSweeper.getDifficulty()).toBe('beginner');
    expect(mineSweeper.getBoard().length).toBe(5);
    expect(mineSweeper.getBoard()[0].length).toBe(5);
    expect(mineSweeper.getBoard()[0][0]).toBeInstanceOf(Cell);
  });

  test('should handle cell action (click)', () => {
    mineSweeper.setup(options);
    mineSweeper.handleCellAction(0, 0, 'click');
    expect(mineSweeper.getBoard()[0][0].getIsRevealed()).toBe(true);
    expect(mineSweeper.getBoard()[0][0].getIsMine()).toBe(false);
    expect(mineSweeper.getNumRevealed()).toBeGreaterThan(0);
    expect(mineSweeper.getGameStatus()).not.toBe('waiting');
  });

  test('should relocate mine on first click when cell is a mine', () => {
    mineSweeper.setup(options);
    const board = mineSweeper.getBoard();

    if (!board[0][0].getIsMine()) {
      outer: for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
          if (board[row][col].getIsMine()) {
            board[row][col].setIsMine(false);
            board[0][0].setIsMine(true);
            break outer;
          }
        }
      }
    }

    mineSweeper.handleCellAction(0, 0, 'click');

    expect(board[0][0].getIsRevealed()).toBe(true);
    expect(board[0][0].getIsMine()).toBe(false);
    expect(mineSweeper.getGameStatus()).toBe('inProgress');
  });

  test('should handle cell action (flag)', () => {
    mineSweeper.setup(options);
    mineSweeper.handleCellAction(0, 0, 'flag');
    expect(mineSweeper.getBoard()[0][0].getIsFlagged()).toBe(true);
    expect(mineSweeper.getNumFlags()).toBe(1);
  });
});
