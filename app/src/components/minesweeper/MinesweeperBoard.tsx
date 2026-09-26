'use client';

import type { Cell } from '@/lib/minesweeper';
import type { IMineSweeper } from '@/lib/minesweeper';
import { cn } from '@/lib/utils';

import { getCellDisplayType, getCellImageSrc } from './cell-type';

const ZOOM_LEVELS = [16, 20, 24, 28, 32, 36, 40] as const;
export type ZoomLevel = (typeof ZOOM_LEVELS)[number];

export const DEFAULT_ZOOM: ZoomLevel = 28;

interface MinesweeperBoardProps {
  game: IMineSweeper;
  zoomLevel: number;
  mobileAction: 'click' | 'flag';
  onCellAction: (row: number, col: number, action: 'click' | 'flag') => void;
  onZoomChange?: (level: number) => void;
}

export function MinesweeperBoard({
  game,
  zoomLevel,
  mobileAction,
  onCellAction,
  onZoomChange,
}: MinesweeperBoardProps) {
  const board = game.getBoard();
  const numRows = game.getNumRows();
  const numCols = game.getNumCols();
  const timer = game.getTimer();
  const isPaused = timer.getIsPaused();
  const numNotDetectedMines = game.getNumMines() - game.getNumFlags();

  const handleLeftClick = (row: number, col: number) => {
    onCellAction(row, col, mobileAction === 'flag' ? 'flag' : 'click');
  };

  const handleRightClick = (e: React.MouseEvent, row: number, col: number) => {
    e.preventDefault();
    onCellAction(row, col, 'flag');
  };

  return (
    <div className="flex flex-col items-center gap-2 overflow-auto p-2">
      <div className="flex w-full max-w-fit flex-wrap items-center justify-between gap-2 rounded-md bg-minesweeper-main-primary px-3 py-2">
        <span className="tabular-nums font-bold text-minesweeper-foreground">
          {numNotDetectedMines}
        </span>
        <span className="tabular-nums font-mono text-sm font-bold text-minesweeper-foreground">
          {formatElapsed(timer.getElapsedTime())}
        </span>
        {onZoomChange && (
          <select
            className="rounded border border-border bg-background px-2 py-1 text-sm text-foreground"
            value={zoomLevel}
            onChange={(e) => onZoomChange(Number(e.target.value))}
            aria-label="Taille des cases"
          >
            {ZOOM_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}px
              </option>
            ))}
          </select>
        )}
      </div>

      <div
        className="inline-flex flex-col border border-minesweeper-main-secondary bg-minesweeper-main-secondary/70 p-1 shadow-md"
        style={{
          // Grille : lignes x colonnes
          display: 'grid',
          gridTemplateColumns: `repeat(${numCols}, ${zoomLevel}px)`,
          gridTemplateRows: `repeat(${numRows}, ${zoomLevel}px)`,
        }}
      >
        {isPaused ? (
          <div
            className="col-span-full row-span-full bg-muted/50"
            style={{
              gridColumn: `1 / -1`,
              gridRow: `1 / -1`,
              minHeight: numRows * zoomLevel,
              minWidth: numCols * zoomLevel,
            }}
          />
        ) : (
          board.flatMap((row, rowIndex) =>
            row.map((cell: Cell, colIndex: number) => (
              <button
                key={cellKey(rowIndex, colIndex)}
                type="button"
                className={cn(
                  'cursor-pointer border-0 bg-cover bg-center bg-no-repeat p-0 transition-opacity hover:opacity-90',
                  'focus-visible:outline-2 focus-visible:outline-ring',
                )}
                style={{
                  width: zoomLevel,
                  height: zoomLevel,
                  backgroundImage: `url(${getCellImageSrc(getCellDisplayType(cell))})`,
                }}
                onClick={() => handleLeftClick(rowIndex, colIndex)}
                onContextMenu={(e) => handleRightClick(e, rowIndex, colIndex)}
                onAuxClick={(e) => {
                  if (e.button === 2) e.preventDefault();
                }}
                aria-label={`Case ${rowIndex + 1}, ${colIndex + 1}`}
              />
            )),
          )
        )}
      </div>
    </div>
  );
}

function cellKey(row: number, col: number): string {
  return `${row}-${col}`;
}

function formatElapsed(ms: number): string {
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.floor((ms % 60_000) / 1000);
  const cs = Math.floor((ms % 1000) / 10);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}
