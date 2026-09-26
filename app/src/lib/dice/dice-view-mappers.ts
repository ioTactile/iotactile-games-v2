import type { DiceState } from '@/components/dice/DiceRow';
import type { Player } from '@/components/dice/PlayerBar';
import type { ScoreKey } from '@/lib/dice/dice-scores';
import type { DiceFaceDto, DicePlayerScoresDto, DiceSessionViewDto } from '@/types/dice';

const SCORE_KEYS: ScoreKey[] = [
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'threeOfAKind',
  'fourOfAKind',
  'fullHouse',
  'smallStraight',
  'largeStraight',
  'dice',
  'chance',
];

function mapScoresDtoToPartial(dto: DicePlayerScoresDto): Partial<Record<ScoreKey, number | null>> {
  const out: Partial<Record<ScoreKey, number | null>> = {};
  for (const k of SCORE_KEYS) {
    const v = dto[k as keyof DicePlayerScoresDto];
    if (v !== undefined) out[k] = v;
  }
  return out;
}

export function viewToPlayers(view: DiceSessionViewDto): Player[] {
  return [...view.players]
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((p) => ({ id: p.id, name: p.displayName }));
}

export function viewToCurrentPlayerId(view: DiceSessionViewDto): string {
  const state = view.state;
  if (!state) return view.players[0]?.id ?? '';
  const p = view.players.find((pl) => pl.slot === state.currentPlayerSlot);
  return p?.id ?? '';
}

export function viewToDices(view: DiceSessionViewDto): DiceState[] {
  if (!view.state) return [];
  return view.state.dices.map((d: DiceFaceDto, index) => ({
    id: index,
    face: d.face,
    locked: d.locked,
  }));
}

export function viewToScoresByPlayer(
  view: DiceSessionViewDto,
): Record<string, Partial<Record<ScoreKey, number | null>>> {
  const out: Record<string, Partial<Record<ScoreKey, number | null>>> = {};
  if (!view.state) return out;
  for (const p of view.players) {
    const slotScores = view.state.scores[p.slot];
    if (slotScores) {
      out[p.id] = mapScoresDtoToPartial(slotScores);
    }
  }
  return out;
}

export function viewToTriesLeft(view: DiceSessionViewDto): number {
  return view.state?.triesLeft ?? 3;
}

export function isGameOver(view: DiceSessionViewDto): boolean {
  return view.session.status === 'FINISHED' || (view.state?.remainingTurns ?? 0) <= 0;
}
