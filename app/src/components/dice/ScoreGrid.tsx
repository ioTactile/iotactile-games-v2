'use client';

import Image from 'next/image';
import { useState } from 'react';

import { SCORE_INPUT_IMAGES } from '@/constants/assets.constant';
import { useI18n } from '@/i18n/I18nProvider';
import {
  computeBonus,
  computeScore,
  computeTotal,
  SCORE_KEYS,
  SCORE_LABELS,
  type ScoreKey,
} from '@/lib/dice/dice-scores';
import { cn } from '@/lib/utils';

import type { DiceState } from './DiceRow';
import type { Player } from './PlayerBar';
import { RulesModal } from './RulesModal';

type ScoreGridProps = {
  players: Player[];
  currentPlayerId: string;
  scoresByPlayer: Record<string, Partial<Record<ScoreKey, number | null>>>;
  dices: DiceState[];
  onChooseScore: (key: ScoreKey) => void;
  canChoose: boolean;
  className?: string;
};

export function ScoreGrid({
  players,
  currentPlayerId,
  scoresByPlayer,
  dices,
  onChooseScore,
  canChoose,
  className,
}: ScoreGridProps) {
  const { t } = useI18n();

  const [rulesOpen, setRulesOpen] = useState(false);
  const dicesInput = dices.map((d) => ({ face: d.face ?? 1 }));

  return (
    <>
      <RulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} />
      <div
        className={cn(
          'flex flex-col overflow-hidden rounded-md border bg-dice-foreground/95 shadow-lg',
          className,
        )}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[240px] border-collapse text-sm">
            <thead>
              <tr className="border-b">
                <th className="bg-dice-foreground/50 px-2 py-1.5 text-left font-semibold text-dice-main-secondary">
                  <span className="flex items-center gap-1.5">
                    Score
                    <button
                      type="button"
                      onClick={() => setRulesOpen(true)}
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-dice-main-tertiary/20 text-dice-main-tertiary hover:bg-dice-main-tertiary/40"
                      aria-label={t('dice.showRules')}
                    >
                      ?
                    </button>
                  </span>
                </th>
                {players.map((p) => (
                  <th
                    key={p.id}
                    className={cn(
                      'min-w-[52px] px-1 py-1.5 text-center font-medium',
                      p.id === currentPlayerId
                        ? 'bg-dice-main-tertiary text-dice-tertiary-foreground'
                        : 'bg-dice-foreground/70 text-dice-main-secondary',
                    )}
                  >
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SCORE_KEYS.map((key) => {
                const img = SCORE_INPUT_IMAGES[key];
                const currentPlayerScoreNotSet =
                  scoresByPlayer[currentPlayerId]?.[key] === undefined ||
                  scoresByPlayer[currentPlayerId]?.[key] === null;
                const hasDiceValues = dices.some((d) => d.face !== undefined && d.face !== null);
                const showPropositionForCurrentPlayer =
                  currentPlayerId && currentPlayerScoreNotSet && hasDiceValues;
                const possibleValue = showPropositionForCurrentPlayer
                  ? computeScore(key, dicesInput)
                  : null;

                return (
                  <tr
                    key={key}
                    className="border-b border-dice-foreground/10 hover:bg-dice-foreground/30"
                  >
                    <td className="flex items-center gap-1.5 px-2 py-1">
                      {img && (
                        <Image
                          src={img}
                          alt={`Bouton de choix de score ${SCORE_LABELS[key]}`}
                          width={20}
                          height={20}
                          className="h-5 w-5 shrink-0 object-contain"
                          unoptimized
                        />
                      )}
                      <span className="text-xs text-dice-main-secondary">{SCORE_LABELS[key]}</span>
                    </td>
                    {players.map((p) => {
                      const scores = scoresByPlayer[p.id] ?? {};
                      const value = scores[key];
                      const isSet = value !== undefined && value !== null;
                      const isCurrent = p.id === currentPlayerId;
                      const showProposition = isCurrent && showPropositionForCurrentPlayer;

                      return (
                        <td
                          key={p.id}
                          className={cn(
                            'min-w-[52px] px-1 py-1 text-center tabular-nums',
                            isCurrent && 'bg-dice-main-tertiary/15',
                          )}
                        >
                          {showProposition && canChoose ? (
                            <button
                              type="button"
                              onClick={() => onChooseScore(key)}
                              className="rounded px-1 py-0.5 font-medium text-dice-main-tertiary hover:bg-dice-main-tertiary/30"
                            >
                              {possibleValue ?? '—'}
                            </button>
                          ) : (
                            <span
                              className={cn(
                                isSet
                                  ? 'font-medium text-dice-main-secondary'
                                  : 'text-dice-main-secondary/70',
                              )}
                            >
                              {isSet ? value : showProposition ? (possibleValue ?? '—') : '—'}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              <tr className="border-b border-dice-foreground/20 bg-dice-foreground/50">
                <td className="px-2 py-1 text-xs font-medium text-dice-main-secondary">BONUS</td>
                {players.map((p) => (
                  <td
                    key={p.id}
                    className={cn(
                      'px-1 py-1 text-center tabular-nums font-medium',
                      p.id === currentPlayerId && 'bg-dice-main-tertiary/15',
                    )}
                  >
                    {computeBonus(scoresByPlayer[p.id] ?? {})}
                  </td>
                ))}
              </tr>
              <tr className="bg-dice-foreground/70 font-bold">
                <td className="px-2 py-1.5 text-sm text-dice-main-secondary">TOTAL</td>
                {players.map((p) => (
                  <td
                    key={p.id}
                    className={cn(
                      'px-1 py-1.5 text-center tabular-nums text-dice-main-secondary',
                      p.id === currentPlayerId && 'bg-dice-main-tertiary/20',
                    )}
                  >
                    {computeTotal(scoresByPlayer[p.id] ?? {})}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
