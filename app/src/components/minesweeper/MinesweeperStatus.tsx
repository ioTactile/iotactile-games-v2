'use client';

import { Pause, Play, RotateCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { Timer } from '@/lib/minesweeper';
import type { GameStatus } from '@/lib/minesweeper';
import { cn } from '@/lib/utils';

interface MinesweeperStatusProps {
  gameStatus: GameStatus;
  timer: Timer;
  selectedAction: 'click' | 'flag';
  onRestart: () => void;
  onTogglePause: () => void;
  onToggleAction: () => void;
  isRestarting?: boolean;
  /** Hide the action selector (mobile) */
  showActionToggle?: boolean;
}

export function MinesweeperStatus({
  gameStatus,
  timer,
  selectedAction,
  onRestart,
  onTogglePause,
  onToggleAction,
  isRestarting = false,
  showActionToggle = true,
}: MinesweeperStatusProps) {
  const canPause = gameStatus === 'inProgress';
  const isPaused = timer.getIsPaused();

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 py-2 text-minesweeper-foreground">
      <Button
        variant="minesweeper"
        size="icon"
        onClick={onRestart}
        disabled={isRestarting}
        aria-label="Recommencer"
        title="Recommencer (r)"
        className={cn(isRestarting && 'animate-spin')}
      >
        <RotateCw className="size-5" />
      </Button>
      <Button
        variant="minesweeper"
        size="icon"
        onClick={onTogglePause}
        disabled={!canPause}
        aria-label={isPaused ? 'Reprendre' : 'Pause'}
        title={isPaused ? 'Reprendre (espace)' : 'Pause (espace)'}
      >
        {isPaused ? <Play className="size-5" /> : <Pause className="size-5" />}
      </Button>
      {showActionToggle && (
        <button
          type="button"
          onClick={onToggleAction}
          className="flex size-9 items-center justify-center rounded-md bg-minesweeper-main-primary hover:bg-minesweeper-main-primary/80 text-minesweeper-foreground"
          aria-label={
            selectedAction === 'flag'
              ? 'Mode drapeau actif, cliquer pour passer en mode révéler'
              : 'Mode révéler actif, cliquer pour passer en mode drapeau'
          }
          title={selectedAction === 'flag' ? 'Passer en mode révéler' : 'Passer en mode drapeau'}
        >
          <span
            className="size-5 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(/assets/minesweeper/${selectedAction === 'flag' ? 'flag' : 'closed'}.svg)`,
            }}
          />
        </button>
      )}
    </div>
  );
}
