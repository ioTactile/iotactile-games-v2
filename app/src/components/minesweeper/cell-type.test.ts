import { describe, expect, test } from 'vitest';

import { Cell } from '@/lib/minesweeper';

import { getCellDisplayType, getCellImageSrc } from './cell-type';

describe('getCellDisplayType', () => {
  test('returns closed for unrevealed non-flagged cell', () => {
    const cell = new Cell();
    expect(getCellDisplayType(cell)).toBe('closed');
  });

  test('returns flag for flagged unrevealed cell', () => {
    const cell = new Cell();
    cell.setIsFlagged(true);
    expect(getCellDisplayType(cell)).toBe('flag');
  });

  test('returns mine_red for revealed clicked mine', () => {
    const cell = new Cell();
    cell.setIsMine(true);
    cell.setIsRevealed(true);
    cell.setIsMineClicked(true);
    expect(getCellDisplayType(cell)).toBe('mine_red');
  });

  test('returns mine for revealed non-clicked mine', () => {
    const cell = new Cell();
    cell.setIsMine(true);
    cell.setIsRevealed(true);
    expect(getCellDisplayType(cell)).toBe('mine');
  });

  test('returns typeN for revealed cell with N adjacent mines', () => {
    for (let n = 0; n <= 8; n++) {
      const cell = new Cell();
      cell.setIsRevealed(true);
      cell.setNumAdjacentMines(n);
      expect(getCellDisplayType(cell)).toBe(`type${n}`);
    }
  });
});

describe('getCellImageSrc', () => {
  test('returns path for type', () => {
    expect(getCellImageSrc('closed')).toBe('/assets/minesweeper/closed.svg');
    expect(getCellImageSrc('flag')).toBe('/assets/minesweeper/flag.svg');
    expect(getCellImageSrc('mine')).toBe('/assets/minesweeper/mine.svg');
    expect(getCellImageSrc('type3')).toBe('/assets/minesweeper/type3.svg');
  });
});
