'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { DiceSlots } from '@/components/dice/DiceSlots';
import { PlayerBar } from '@/components/dice/PlayerBar';
import { RollButton } from '@/components/dice/RollButton';
import { RollZone } from '@/components/dice/RollZone';
import { ScoreGrid } from '@/components/dice/ScoreGrid';
import { SoundToggle } from '@/components/dice/SoundToggle';
import { LanguageSwitcher } from '@/components/i18n/language-switcher';
import { ANIMATION_DURATION_MS } from '@/constants/dice.constant';
import { useAuth } from '@/hooks/use-auth';
import { useDiceSounds } from '@/hooks/use-dice-sounds';
import { useDiceWs } from '@/hooks/use-dice-ws';
import { useI18n } from '@/i18n/I18nProvider';
import { getOrCreateGuestId } from '@/lib/auth/guest-id';
import { getDiceSession, leaveDiceSession, startDiceSession } from '@/lib/dice/dice-api';
import type { ScoreKey } from '@/lib/dice/dice-scores';
import {
  isGameOver,
  viewToCurrentPlayerId,
  viewToDices,
  viewToPlayers,
  viewToScoresByPlayer,
  viewToTriesLeft,
} from '@/lib/dice/dice-view-mappers';
import { queryKeys } from '@/lib/query/query-keys';
import type { DiceSessionViewDto } from '@/types/dice';

function isDiceRollUpdate(
  prev: DiceSessionViewDto | null,
  next: DiceSessionViewDto | null,
): boolean {
  if (!prev?.state?.dices || !next?.state?.dices) return false;
  if (prev.state.currentPlayerSlot !== next.state.currentPlayerSlot) return false;
  if (prev.state.triesLeft !== undefined && next.state.triesLeft === 3 && prev.state.triesLeft < 3)
    return false;
  const pa = prev.state.dices;
  const na = next.state.dices;
  if (pa.length !== na.length) return true;
  return pa.some((d, i) => na[i]?.face !== d.face);
}

function isDiceLockUpdate(
  prev: DiceSessionViewDto | null,
  next: DiceSessionViewDto | null,
): boolean {
  if (!prev?.state?.dices || !next?.state?.dices) return false;
  const pa = prev.state.dices;
  const na = next.state.dices;
  if (pa.length !== na.length) return false;
  const sameFaces = pa.every((d, i) => na[i]?.face === d.face);
  const lockedChanged = pa.some((d, i) => na[i]?.locked !== d.locked);
  return sameFaces && lockedChanged;
}

function getMyPlayerId(
  view: DiceSessionViewDto | null,
  userId: string | null,
  guestId: string | null,
): string | null {
  if (!view) return null;
  const me = view.players.find(
    (p) => (userId && p.userId === userId) || (guestId && p.guestId === guestId),
  );
  return me?.id ?? null;
}

function isCreator(view: DiceSessionViewDto | null, myPlayerId: string | null): boolean {
  if (!view || !myPlayerId) return false;
  const first = [...view.players].sort((a, b) => a.orderIndex - b.orderIndex)[0];
  return first?.id === myPlayerId;
}

export default function DiceRoomPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const sessionId = params.sessionId as string;
  const { accessToken, user } = useAuth();
  const guestId = typeof window !== 'undefined' ? getOrCreateGuestId() : '';
  const { t } = useI18n();

  const {
    data: sessionData,
    isLoading: sessionLoading,
    error: sessionError,
    refetch: refetchSession,
  } = useQuery({
    queryKey: queryKeys.dice.session(sessionId),
    queryFn: async () => {
      const res = await getDiceSession(sessionId);
      if (!res.ok) throw new Error(res.error);
      return res.data;
    },
    enabled: Boolean(sessionId),
    refetchInterval: (query) => {
      const status = query.state.data?.session.status;
      return status === 'WAITING' ? 2000 : false;
    },
  });

  const viewFromWs = useDiceWs({
    sessionId,
    accessToken: accessToken ?? null,
    guestId: accessToken ? null : guestId,
    enabled:
      Boolean(sessionId) &&
      Boolean(
        sessionData?.session.status === 'PLAYING' || sessionData?.session.status === 'FINISHED',
      ),
  });

  const view = useMemo(() => {
    if (viewFromWs.view) return viewFromWs.view;
    if (
      sessionData &&
      (sessionData.session.status === 'PLAYING' || sessionData.session.status === 'FINISHED')
    )
      return sessionData;
    return sessionData ?? null;
  }, [sessionData, viewFromWs.view]);

  const myPlayerId = getMyPlayerId(
    view ?? sessionData ?? null,
    user?.id ?? null,
    accessToken ? null : guestId,
  );
  const creator = isCreator(sessionData ?? null, myPlayerId);
  const [leaving, setLeaving] = useState(false);
  const [startLoading, setStartLoading] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [lockedOrder, setLockedOrder] = useState<number[]>([]);
  const [displayView, setDisplayView] = useState<DiceSessionViewDto | null>(null);
  const previousViewRef = useRef<DiceSessionViewDto | null>(null);
  const weJustLockedRef = useRef(false);
  const weJustRolledRef = useRef(false);
  const { playShakeAndRoll, stopShakeAndRoll, playRollDice } = useDiceSounds();

  useEffect(() => {
    if (!view) return;
    if (rolling) {
      previousViewRef.current = view;
      return;
    }
    const prev = previousViewRef.current;
    const remoteRoll = prev != null && isDiceRollUpdate(prev, view);
    const remoteLock = prev != null && isDiceLockUpdate(prev, view);

    if (remoteRoll) {
      if (weJustRolledRef.current) {
        weJustRolledRef.current = false;
        queueMicrotask(() => setDisplayView(view));
        previousViewRef.current = view;
        return;
      }
      playShakeAndRoll();
      queueMicrotask(() => setRolling(true));
      const t = setTimeout(() => {
        setDisplayView(view);
        setRolling(false);
        stopShakeAndRoll();
        previousViewRef.current = view;
      }, ANIMATION_DURATION_MS);
      return () => clearTimeout(t);
    }

    if (remoteLock) {
      if (!weJustLockedRef.current) playRollDice();
      weJustLockedRef.current = false;
    }

    queueMicrotask(() => setDisplayView(view));
    previousViewRef.current = view;
  }, [view, rolling, playShakeAndRoll, stopShakeAndRoll, playRollDice]);

  useEffect(() => {
    if (sessionError) {
      router.replace('/dice');
    }
  }, [sessionError, router]);

  const handleLeave = useCallback(async () => {
    if (!sessionId || leaving) return;
    setLeaving(true);
    const result = await leaveDiceSession({
      sessionId,
      guestId: accessToken ? undefined : getOrCreateGuestId(),
      accessToken: accessToken ?? null,
    });
    setLeaving(false);
    if (result.ok) {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.dice.session(sessionId),
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.dice.mySessions(guestId || undefined, accessToken ?? null),
      });
      router.replace('/dice');
    }
  }, [sessionId, leaving, accessToken, router, queryClient, guestId]);

  const handleStart = useCallback(async () => {
    if (!sessionId) return;
    setStartError(null);
    setStartLoading(true);
    const result = await startDiceSession({
      sessionId,
      guestId: accessToken ? undefined : getOrCreateGuestId(),
      accessToken: accessToken ?? null,
    });
    setStartLoading(false);
    if (result.ok) {
      await refetchSession();
    } else {
      setStartError(result.error);
    }
  }, [sessionId, accessToken, refetchSession]);

  const handleChooseScore = useCallback(
    (key: ScoreKey) => {
      viewFromWs.sendChooseScore(key);
    },
    [viewFromWs],
  );

  const handleRoll = useCallback(() => {
    weJustRolledRef.current = true;
    setRolling(true);
    playShakeAndRoll();
    viewFromWs.sendRoll();
    setTimeout(() => {
      setRolling(false);
      stopShakeAndRoll();
    }, ANIMATION_DURATION_MS);
  }, [viewFromWs, playShakeAndRoll, stopShakeAndRoll]);

  const handleLockFromRollZone = useCallback(
    (diceIndex: number) => {
      weJustLockedRef.current = true;
      viewFromWs.sendLock(diceIndex);
      setLockedOrder((prev) => (prev.includes(diceIndex) ? prev : [...prev, diceIndex]));
    },
    [viewFromWs],
  );

  const handleUnlockSlot = useCallback(
    (_slotIndex: number, diceIndex: number) => {
      weJustLockedRef.current = true;
      viewFromWs.sendLock(diceIndex);
      setLockedOrder((prev) => prev.filter((i) => i !== diceIndex));
    },
    [viewFromWs],
  );

  const data = sessionData ?? view ?? null;
  const status = data?.session?.status;
  const gameView = view ?? data;
  const currentPlayerIdFromView = gameView ? viewToCurrentPlayerId(gameView) : '';
  const gameViewForDisplay = displayView ?? gameView;
  const dices = useMemo(() => {
    if (!gameViewForDisplay || (status !== 'PLAYING' && status !== 'FINISHED')) return [];
    return viewToDices(gameViewForDisplay);
  }, [gameViewForDisplay, status]);

  const lockedOrderFiltered = useMemo(
    () => lockedOrder.filter((i) => dices[i]?.locked === true),
    [lockedOrder, dices],
  );

  const lockedOrderForDisplay = useMemo(() => {
    if (myPlayerId !== currentPlayerIdFromView) {
      return dices.map((d, i) => (d.locked ? i : -1)).filter((i) => i >= 0);
    }
    return lockedOrderFiltered;
  }, [myPlayerId, currentPlayerIdFromView, dices, lockedOrderFiltered]);

  if (!sessionId) {
    router.replace('/dice');
    return null;
  }

  if (sessionLoading && !sessionData) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-dice-main-secondary">
        <p className="text-dice-foreground/80">{t('dice.loadingSession')}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-dice-main-secondary">
        <p className="text-dice-foreground/80">{t('dice.sessionNotFound')}</p>
        <Link href="/dice" className="text-dice-main-tertiary hover:underline">
          {t('dice.backToMenu')}
        </Link>
      </div>
    );
  }

  if (status === 'WAITING') {
    const players = viewToPlayers(data);
    return (
      <div className="flex min-h-screen flex-col bg-dice-main-secondary">
        <header className="border-b border-dice-foreground/10 bg-dice-main-primary/80 px-4 py-3">
          <div className="flex items-center justify-between">
            <Link
              href="/dice"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-dice-main-tertiary text-dice-tertiary-foreground hover:opacity-90"
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
            <h1 className="text-lg font-semibold text-dice-foreground">{data.session.name}</h1>
            <div className="flex items-center gap-2">
              <LanguageSwitcher variant="dice" />
              <SoundToggle />
            </div>
          </div>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
          <p className="text-dice-foreground/90">
            {t('dice.waitingForPlayersLabel')} ({players.length}/4)
          </p>
          {data.session.joinCode && (
            <div className="flex flex-col items-center gap-2 rounded-xl bg-dice-main-primary/80 p-4 w-full max-w-xs border border-dice-foreground/20">
              <p className="text-sm text-dice-foreground/80">{t('dice.shareCodeHelp')}</p>
              <div className="flex items-center gap-2 w-full">
                <code className="flex-1 rounded-lg bg-dice-foreground/10 px-4 py-3 font-mono text-xl tracking-[0.3em] text-center text-dice-foreground">
                  {data.session.joinCode}
                </code>
                <button
                  type="button"
                  onClick={async () => {
                    const code = data.session.joinCode;
                    if (!code) return;
                    try {
                      await navigator.clipboard.writeText(code);
                      setCodeCopied(true);
                      setTimeout(() => setCodeCopied(false), 2000);
                    } catch {
                      setCodeCopied(false);
                    }
                  }}
                  className="shrink-0 rounded-lg bg-dice-main-tertiary px-4 py-3 font-medium text-dice-tertiary-foreground hover:opacity-90 transition-opacity"
                >
                  {codeCopied ? t('dice.copied') : t('dice.copy')}
                </button>
              </div>
            </div>
          )}
          <ul className="flex flex-col gap-2 rounded-xl bg-dice-main-primary/60 p-4 w-full max-w-xs">
            {players.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-2 rounded-lg bg-dice-foreground/10 px-3 py-2 text-dice-foreground"
              >
                <span className="size-2 rounded-full bg-dice-online" />
                {p.name}
              </li>
            ))}
          </ul>
          {startError && <p className="text-sm text-dice-error">{startError}</p>}
          <div className="flex flex-wrap gap-3">
            {creator && (
              <button
                type="button"
                onClick={handleStart}
                disabled={startLoading || players.length < 1}
                className="rounded-lg bg-dice-main-tertiary px-4 py-2 font-medium text-dice-tertiary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {startLoading ? t('dice.startingGame') : t('dice.startGame')}
              </button>
            )}
            <button
              type="button"
              onClick={handleLeave}
              disabled={leaving}
              className="rounded-lg border border-dice-foreground/30 bg-dice-foreground/10 px-4 py-2 font-medium text-dice-foreground hover:bg-dice-foreground/20 disabled:opacity-50"
            >
              {leaving ? t('dice.leaving') : t('dice.leave')}
            </button>
          </div>
          <Link href="/dice" className="text-sm text-dice-foreground/70 hover:text-dice-foreground">
            ← {t('dice.backToMenu')}
          </Link>
        </main>
      </div>
    );
  }

  if (status !== 'PLAYING' && status !== 'FINISHED') {
    return null;
  }
  if (!gameView) return null;

  const players = viewToPlayers(gameView);
  const currentPlayerId = viewToCurrentPlayerId(gameView);
  const scoresByPlayer = viewToScoresByPlayer(gameViewForDisplay ?? gameView);
  const triesLeft = viewToTriesLeft(gameView);
  const gameOver = isGameOver(gameView);
  const isMyTurn = myPlayerId === currentPlayerId;
  const canChoose = isMyTurn && triesLeft < 3;
  const showDices = triesLeft < 3;

  if (gameOver) {
    return (
      <div className="flex min-h-screen flex-col bg-dice-main-secondary">
        <PlayerBar players={players} currentPlayerId={currentPlayerId} backHref="/dice" />
        <div className="flex flex-col flex-1 sm:flex-none gap-4 p-3 sm:flex-row  sm:p-4">
          <aside className="w-full shrink-0 sm:w-64">
            <ScoreGrid
              players={players}
              currentPlayerId={currentPlayerId}
              scoresByPlayer={scoresByPlayer}
              dices={[]}
              onChooseScore={() => {}}
              canChoose={false}
              className="max-h-[calc(100vh-12rem)] overflow-y-auto"
            />
          </aside>
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4">
            <p className="text-center text-dice-foreground/90">{t('dice.gameOverMessage')}</p>
            <Link
              href="/dice"
              className="rounded-sm bg-dice-main-tertiary px-4 py-2 font-medium text-dice-tertiary-foreground hover:opacity-90"
            >
              {t('dice.backToMenu')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-dice-main-secondary">
      <PlayerBar players={players} currentPlayerId={currentPlayerId} backHref="/dice" />

      <div className="flex flex-1 flex-col gap-4 p-3 sm:flex-row sm:p-4">
        <aside className="w-full shrink-0 sm:w-64">
          <ScoreGrid
            players={players}
            currentPlayerId={currentPlayerId}
            scoresByPlayer={scoresByPlayer}
            dices={showDices && !rolling ? dices : []}
            onChooseScore={handleChooseScore}
            canChoose={canChoose}
            className="max-h-[calc(100vh-12rem)] overflow-y-auto"
          />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <RollZone
            rolling={rolling}
            dices={dices}
            showDices={showDices}
            onRoll={handleRoll}
            onRollEnd={() => setRolling(false)}
            onToggleLock={handleLockFromRollZone}
            disabled={!isMyTurn || triesLeft <= 0}
          />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-md bg-dice-main-primary/60 p-3">
            <div className="hidden sm:block" />
            <DiceSlots
              dices={dices}
              lockedOrder={lockedOrderForDisplay}
              showDices={showDices}
              onUnlockSlot={handleUnlockSlot}
              disabled={!isMyTurn || triesLeft <= 0}
              useWhiteTheme
            />
            <RollButton
              onRoll={handleRoll}
              disabled={!isMyTurn || triesLeft <= 0}
              triesLeft={triesLeft}
              rolling={rolling}
            />
          </div>
          {viewFromWs.error && <p className="text-sm text-dice-error">{viewFromWs.error}</p>}
        </div>
      </div>
    </div>
  );
}
