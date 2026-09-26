'use client';

import { Button } from '@/components/ui/button';
import type { Difficulty, GameOptions } from '@/lib/minesweeper';

const DIFFICULTIES: {
  name: string;
  numRows: number;
  numCols: number;
  numMines: number;
  difficulty: Difficulty;
}[] = [
  {
    name: 'Débutant',
    numRows: 9,
    numCols: 9,
    numMines: 10,
    difficulty: 'beginner',
  },
  {
    name: 'Intermédiaire',
    numRows: 16,
    numCols: 16,
    numMines: 40,
    difficulty: 'intermediate',
  },
  {
    name: 'Expert',
    numRows: 30,
    numCols: 16,
    numMines: 99,
    difficulty: 'expert',
  },
];

interface DifficultySelectorProps {
  onSelect: (options: GameOptions) => void;
  onCustom: () => void;
  labels?: Partial<Record<'beginner' | 'intermediate' | 'expert' | 'custom', string>>;
}

export function DifficultySelector({ onSelect, onCustom, labels }: DifficultySelectorProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-6 text-minesweeper-muted-foreground">
      {DIFFICULTIES.map((d) => (
        <Button
          key={d.difficulty}
          variant="minesweeper"
          size="lg"
          className="w-full max-w-xs"
          onClick={() =>
            onSelect({
              numRows: d.numRows,
              numCols: d.numCols,
              numMines: d.numMines,
              difficulty: d.difficulty,
            })
          }
        >
          {labels?.[d.difficulty] ?? d.name}
        </Button>
      ))}
      <Button variant="minesweeper" size="lg" className="w-full max-w-xs" onClick={onCustom}>
        {labels?.custom ?? 'Personnalisé'}
      </Button>
    </div>
  );
}
