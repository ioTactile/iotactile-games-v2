'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import type { GameOptions } from '@/lib/minesweeper';

const MIN_ROWS = 5;
const MAX_ROWS = 50;
const MIN_COLS = 5;
const MAX_COLS = 50;
const DEFAULT_ROWS = 16;
const DEFAULT_COLS = 16;
const DEFAULT_MINES = 40;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

interface CustomGameFormProps {
  onSubmit: (options: GameOptions) => void;
  onBack: () => void;
  labels?: {
    width?: string;
    height?: string;
    mines?: string;
    submit?: string;
    back?: string;
  };
}

export function CustomGameForm({ onSubmit, onBack, labels = {} }: CustomGameFormProps) {
  const [numRows, setNumRows] = useState(DEFAULT_ROWS);
  const [numCols, setNumCols] = useState(DEFAULT_COLS);
  const [numMines, setNumMines] = useState(DEFAULT_MINES);
  const [error, setError] = useState<string | null>(null);

  const maxMines = numRows * numCols - 9;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const r = clamp(numRows, MIN_ROWS, MAX_ROWS);
    const c = clamp(numCols, MIN_COLS, MAX_COLS);
    const m = clamp(numMines, 1, maxMines);
    if (m > r * c - 9) {
      setError('Trop de mines pour cette grille.');
      return;
    }
    setNumRows(r);
    setNumCols(c);
    setNumMines(m);
    onSubmit({
      numRows: r,
      numCols: c,
      numMines: m,
      difficulty: 'custom',
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-minesweeper-main-secondary bg-minesweeper-muted/90 p-6"
    >
      <div className="flex flex-col gap-2">
        <label
          htmlFor="minesweeper-width"
          className="text-sm font-medium text-minesweeper-muted-foreground"
        >
          {labels.width ?? 'Largeur'}
        </label>
        <input
          id="minesweeper-width"
          type="number"
          min={MIN_ROWS}
          max={MAX_ROWS}
          value={numRows}
          onChange={(e) => setNumRows(Number(e.target.value) || DEFAULT_ROWS)}
          className="rounded-md border border-minesweeper-main-secondary bg-minesweeper-foreground px-3 py-2 text-minesweeper-main-secondary"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label
          htmlFor="minesweeper-height"
          className="text-sm font-medium text-minesweeper-muted-foreground"
        >
          {labels.height ?? 'Hauteur'}
        </label>
        <input
          id="minesweeper-height"
          type="number"
          min={MIN_COLS}
          max={MAX_COLS}
          value={numCols}
          onChange={(e) => setNumCols(Number(e.target.value) || DEFAULT_COLS)}
          className="rounded-md border border-minesweeper-main-secondary bg-minesweeper-foreground px-3 py-2 text-minesweeper-main-secondary"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label
          htmlFor="minesweeper-mines"
          className="text-sm font-medium text-minesweeper-muted-foreground"
        >
          {labels.mines ?? 'Mines'}
        </label>
        <input
          id="minesweeper-mines"
          type="number"
          min={1}
          max={maxMines}
          value={numMines}
          onChange={(e) => setNumMines(Number(e.target.value) || 1)}
          className="rounded-md border border-minesweeper-main-secondary bg-minesweeper-foreground px-3 py-2 text-minesweeper-main-secondary"
        />
        <p className="text-xs text-minesweeper-muted-foreground">
          Max {maxMines} pour cette grille
        </p>
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          {labels.back ?? 'Retour'}
        </Button>
        <Button type="submit" className="flex-1">
          {labels.submit ?? 'Jouer'}
        </Button>
      </div>
    </form>
  );
}
