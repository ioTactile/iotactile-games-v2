/**
 * Per-row Dice score calculation on the client.
 */

export type ScoreKey =
  | 'one'
  | 'two'
  | 'three'
  | 'four'
  | 'five'
  | 'six'
  | 'threeOfAKind'
  | 'fourOfAKind'
  | 'fullHouse'
  | 'smallStraight'
  | 'largeStraight'
  | 'dice'
  | 'chance';

export const SCORE_KEYS: ScoreKey[] = [
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

export interface DiceFaceInput {
  face: number;
}

function countFaces(dices: DiceFaceInput[]): Record<number, number> {
  const counts: Record<number, number> = {};
  for (const d of dices) {
    counts[d.face] = (counts[d.face] ?? 0) + 1;
  }
  return counts;
}

export function computeScore(key: ScoreKey, dices: DiceFaceInput[]): number {
  if (!dices || dices.length !== 5) return 0;
  switch (key) {
    case 'one':
      return dices.filter((d) => d.face === 1).length * 1;
    case 'two':
      return dices.filter((d) => d.face === 2).length * 2;
    case 'three':
      return dices.filter((d) => d.face === 3).length * 3;
    case 'four':
      return dices.filter((d) => d.face === 4).length * 4;
    case 'five':
      return dices.filter((d) => d.face === 5).length * 5;
    case 'six':
      return dices.filter((d) => d.face === 6).length * 6;
    case 'threeOfAKind': {
      const c = countFaces(dices);
      return Object.values(c).some((n) => n >= 3) ? dices.reduce((s, d) => s + d.face, 0) : 0;
    }
    case 'fourOfAKind': {
      const c = countFaces(dices);
      return Object.values(c).some((n) => n >= 4) ? dices.reduce((s, d) => s + d.face, 0) : 0;
    }
    case 'fullHouse': {
      const sorted = [...dices].sort((a, b) => a.face - b.face);
      const full =
        (sorted[0].face === sorted[2].face && sorted[3].face === sorted[4].face) ||
        (sorted[0].face === sorted[1].face && sorted[2].face === sorted[4].face);
      const allSame = sorted.every((d, i) => i === 0 || d.face === sorted[i - 1].face);
      return full && !allSame ? 25 : 0;
    }
    case 'smallStraight': {
      const faces = new Set(dices.map((d) => d.face));
      const ok =
        (faces.has(1) && faces.has(2) && faces.has(3) && faces.has(4)) ||
        (faces.has(2) && faces.has(3) && faces.has(4) && faces.has(5)) ||
        (faces.has(3) && faces.has(4) && faces.has(5) && faces.has(6));
      return ok ? 30 : 0;
    }
    case 'largeStraight': {
      const sorted = [...dices].sort((a, b) => a.face - b.face);
      const ok =
        (sorted[0].face === 1 &&
          sorted[4].face === 5 &&
          new Set(sorted.map((d) => d.face)).size === 5) ||
        (sorted[0].face === 2 &&
          sorted[4].face === 6 &&
          new Set(sorted.map((d) => d.face)).size === 5);
      return ok ? 40 : 0;
    }
    case 'dice': {
      const first = dices[0].face;
      return dices.every((d) => d.face === first) ? 50 : 0;
    }
    case 'chance':
      return dices.reduce((s, d) => s + d.face, 0);
    default:
      return 0;
  }
}

const UPPER_KEYS: ScoreKey[] = ['one', 'two', 'three', 'four', 'five', 'six'];
const BONUS_THRESHOLD = 63;
const BONUS_POINTS = 35;

export function computeBonus(scores: Partial<Record<ScoreKey, number | null>>): number {
  const upper = UPPER_KEYS.reduce((s, k) => s + (scores[k] ?? 0), 0);
  return upper >= BONUS_THRESHOLD ? BONUS_POINTS : 0;
}

export function computeTotal(scores: Partial<Record<ScoreKey, number | null>>): number {
  const upper = UPPER_KEYS.reduce((s, k) => s + (scores[k] ?? 0), 0);
  const bonus = upper >= BONUS_THRESHOLD ? BONUS_POINTS : 0;
  const lower = SCORE_KEYS.filter((k) => !UPPER_KEYS.includes(k)).reduce(
    (s, k) => s + (scores[k] ?? 0),
    0,
  );
  return upper + bonus + lower;
}

export const SCORE_LABELS: Record<ScoreKey, string> = {
  one: '1',
  two: '2',
  three: '3',
  four: '4',
  five: '5',
  six: '6',
  threeOfAKind: 'Brelan',
  fourOfAKind: 'Carré',
  fullHouse: 'Full',
  smallStraight: 'Petite suite',
  largeStraight: 'Grande suite',
  dice: 'Dice',
  chance: 'Chance',
};
