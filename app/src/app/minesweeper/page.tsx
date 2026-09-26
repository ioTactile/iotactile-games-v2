'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { LanguageSwitcher } from '@/components/i18n/language-switcher';
import { CustomGameForm } from '@/components/minesweeper/CustomGameForm';
import { DifficultySelector } from '@/components/minesweeper/DifficultySelector';
import { DEFAULT_ZOOM, MinesweeperBoard } from '@/components/minesweeper/MinesweeperBoard';
import { MinesweeperStatus } from '@/components/minesweeper/MinesweeperStatus';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/I18nProvider';
import { type GameOptions, MineSweeper } from '@/lib/minesweeper';

type View = 'menu' | 'difficulty' | 'custom' | 'game';

export default function MinesweeperPage() {
  const { t } = useI18n();
  const [view, setView] = useState<View>('menu');
  const [gameOptions, setGameOptions] = useState<GameOptions | null>(null);
  const [game, setGame] = useState<MineSweeper | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(DEFAULT_ZOOM);
  const [mobileAction, setMobileAction] = useState<'click' | 'flag'>('click');
  const [isRestarting, setIsRestarting] = useState(false);
  const [, forceUpdate] = useState(0);

  const gameInstance = useMemo(() => new MineSweeper(), []);

  const startGame = useCallback(
    (options: GameOptions) => {
      gameInstance.setup(options);
      setGameOptions(options);
      setGame(gameInstance);
      setView('game');
      forceUpdate((n) => n + 1);
    },
    [gameInstance],
  );

  const restartGame = useCallback(() => {
    if (!gameOptions) return;
    setIsRestarting(true);
    setTimeout(() => {
      gameInstance.restart(gameOptions);
      setIsRestarting(false);
      forceUpdate((n) => n + 1);
    }, 400);
  }, [gameInstance, gameOptions]);

  const handleCellAction = useCallback(
    (row: number, col: number, action: 'click' | 'flag') => {
      gameInstance.handleCellAction(row, col, action);
      forceUpdate((n) => n + 1);
    },
    [gameInstance],
  );

  const togglePause = useCallback(() => {
    gameInstance.getTimer().togglePause();
    forceUpdate((n) => n + 1);
  }, [gameInstance]);

  useEffect(() => {
    if (!game || game.getGameStatus() !== 'inProgress' || game.getTimer().getIsPaused()) {
      return;
    }
    const interval = setInterval(() => {
      forceUpdate((n) => n + 1);
    }, 100);
    return () => clearInterval(interval);
  }, [game]);

  useEffect(() => {
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        if (view === 'game' && gameOptions) restartGame();
      }
      if (e.key === ' ') {
        e.preventDefault();
        if (view === 'game' && game?.getGameStatus() === 'inProgress') {
          togglePause();
        }
      }
    };
    window.addEventListener('keyup', onKeyUp);
    return () => window.removeEventListener('keyup', onKeyUp);
  }, [view, game, gameOptions, restartGame, togglePause]);

  return (
    <div className="min-h-screen bg-minesweeper-main-secondary">
      <header className="sticky top-0 z-10 border-b border-minesweeper-foreground/10 bg-minesweeper-main-primary/90 backdrop-blur supports-backdrop-filter:bg-minesweeper-main-primary/80">
        <div className="mx-auto flex h-14 items-center justify-between px-4">
          <Link
            href="/"
            className="flex size-9 items-center justify-center rounded-md bg-minesweeper-main-tertiary text-minesweeper-foreground shadow-sm hover:opacity-90"
            aria-label={t('common.back')}
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <h1 className="text-lg font-semibold text-minesweeper-foreground">
            {t('minesweeper.title')}
          </h1>
          <div className="flex items-center justify-end gap-2">
            <LanguageSwitcher variant="minesweeper" />
          </div>
        </div>
      </header>

      <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] flex-col px-4 py-4">
        {view === 'menu' && (
          <div className="flex flex-col items-center gap-4 text-minesweeper-muted-foreground">
            <p className="text-center">{t('minesweeper.intro')}</p>
            <Button variant="minesweeper" size="lg" onClick={() => setView('difficulty')}>
              {t('minesweeper.play')}
            </Button>

            <Link
              href="/"
              className="text-sm text-minesweeper-foreground/70 hover:text-minesweeper-foreground"
            >
              {t('minesweeper.backToHome')}
            </Link>
          </div>
        )}

        {view === 'difficulty' && (
          <div className="flex flex-col gap-4">
            <DifficultySelector
              onSelect={startGame}
              onCustom={() => setView('custom')}
              labels={{
                beginner: t('minesweeper.difficultyBeginner'),
                intermediate: t('minesweeper.difficultyIntermediate'),
                expert: t('minesweeper.difficultyExpert'),
                custom: t('minesweeper.difficultyCustom'),
              }}
            />
            <button
              type="button"
              onClick={() => setView('menu')}
              className="text-sm text-minesweeper-foreground/70 hover:text-minesweeper-foreground w-full max-w-xs mx-auto cursor-pointer"
            >
              {t('common.back')}
            </button>
          </div>
        )}

        {view === 'custom' && (
          <div className="flex flex-col items-center gap-4">
            <CustomGameForm
              onSubmit={startGame}
              onBack={() => setView('difficulty')}
              labels={{
                width: t('minesweeper.customWidth'),
                height: t('minesweeper.customHeight'),
                mines: t('minesweeper.customMines'),
                submit: t('minesweeper.customSubmit'),
                back: t('common.back'),
              }}
            />
          </div>
        )}

        {view === 'game' && game && gameOptions && (
          <div className="flex flex-1 flex-col items-center justify-between gap-4">
            <MinesweeperStatus
              gameStatus={game.getGameStatus()}
              timer={game.getTimer()}
              selectedAction={mobileAction}
              onRestart={restartGame}
              onTogglePause={togglePause}
              onToggleAction={() => setMobileAction((a) => (a === 'click' ? 'flag' : 'click'))}
              isRestarting={isRestarting}
              showActionToggle={true}
            />
            <div className="flex w-full flex-1 items-center justify-center">
              <MinesweeperBoard
                game={game}
                zoomLevel={zoomLevel}
                mobileAction={mobileAction}
                onCellAction={handleCellAction}
                onZoomChange={setZoomLevel}
              />
            </div>
            <div className="mt-2 flex justify-center">
              <Button
                variant="minesweeper"
                onClick={() => {
                  setView('difficulty');
                  setGameOptions(null);
                  setGame(null);
                }}
              >
                {t('minesweeper.newGame')}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
