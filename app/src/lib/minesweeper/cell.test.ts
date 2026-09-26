import { beforeEach, describe, expect, test } from 'vitest';

import { Cell } from './cell';

describe('Cell', () => {
  let cell: Cell;

  beforeEach(() => {
    cell = new Cell();
  });

  test('should initialize with default values', () => {
    expect(cell.getIsMine()).toBe(false);
    expect(cell.getIsMineClicked()).toBe(false);
    expect(cell.getIsRevealed()).toBe(false);
    expect(cell.getIsFlagged()).toBe(false);
    expect(cell.getNumAdjacentMines()).toBe(0);
  });

  test('should set and get isMine property', () => {
    cell.setIsMine(true);
    expect(cell.getIsMine()).toBe(true);
  });

  test('should set and get isMineClicked property', () => {
    cell.setIsMineClicked(true);
    expect(cell.getIsMineClicked()).toBe(true);
  });

  test('should set and get isRevealed property', () => {
    cell.setIsRevealed(true);
    expect(cell.getIsRevealed()).toBe(true);
  });

  test('should set and get isFlagged property', () => {
    cell.setIsFlagged(true);
    expect(cell.getIsFlagged()).toBe(true);
  });

  test('should set and get numAdjacentMines property', () => {
    cell.setNumAdjacentMines(3);
    expect(cell.getNumAdjacentMines()).toBe(3);
  });
});
