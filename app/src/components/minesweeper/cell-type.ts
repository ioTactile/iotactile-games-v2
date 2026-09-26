import type { Cell } from '@/lib/minesweeper';

export type CellDisplayType =
  | 'closed'
  | 'flag'
  | 'type0'
  | 'type1'
  | 'type2'
  | 'type3'
  | 'type4'
  | 'type5'
  | 'type6'
  | 'type7'
  | 'type8'
  | 'mine'
  | 'mine_red';

export function getCellDisplayType(cell: Cell): CellDisplayType {
  if (cell.getIsFlagged() && !cell.getIsRevealed()) {
    return 'flag';
  }
  if (!cell.getIsRevealed()) {
    return 'closed';
  }
  if (cell.getIsMine()) {
    return cell.getIsMineClicked() ? 'mine_red' : 'mine';
  }
  const n = cell.getNumAdjacentMines();
  if (n >= 0 && n <= 8) {
    return `type${n}` as CellDisplayType;
  }
  return 'type0';
}

export function getCellImageSrc(type: CellDisplayType): string {
  return `/assets/minesweeper/${type}.svg`;
}
