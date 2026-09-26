/**
 * Dice domain types (Yahtzee-style / 5 dice).
 */

export const DiceSessionStatus = {
  WAITING: 'WAITING',
  PLAYING: 'PLAYING',
  FINISHED: 'FINISHED',
} as const;

export type DiceSessionStatusType = (typeof DiceSessionStatus)[keyof typeof DiceSessionStatus];

export interface DiceFace {
  face: number; // 1-6
  locked: boolean;
}

export interface DiceSessionPlayerType {
  id: string;
  sessionId: string;
  slot: number; // 1-4
  userId: string | null;
  guestId: string | null;
  displayName: string;
  orderIndex: number;
  createdAt: Date;
}

export interface DiceSessionType {
  id: string;
  name: string;
  joinCode: string | null;
  isPublic: boolean;
  status: DiceSessionStatusType;
  createdAt: Date;
  updatedAt: Date;
}

/** Scores d'un joueur (13 lignes + bonus + total). */
export interface DicePlayerScores {
  one: number | null;
  two: number | null;
  three: number | null;
  four: number | null;
  five: number | null;
  six: number | null;
  bonus: number;
  threeOfAKind: number | null;
  fourOfAKind: number | null;
  fullHouse: number | null;
  smallStraight: number | null;
  largeStraight: number | null;
  chance: number | null;
  dice: number | null; // "Yams" / five of a kind
  total: number;
}

export type DiceScoresBySlot = Record<number, DicePlayerScores>;

export interface DiceSessionStateType {
  id: string;
  sessionId: string;
  currentPlayerSlot: number;
  remainingTurns: number; // starts at 13
  dices: DiceFace[];
  triesLeft: number; // 3 par tour
  scores: DiceScoresBySlot;
  updatedAt: Date;
}

export const EMPTY_DICE_SCORES: DicePlayerScores = {
  one: null,
  two: null,
  three: null,
  four: null,
  five: null,
  six: null,
  bonus: 0,
  threeOfAKind: null,
  fourOfAKind: null,
  fullHouse: null,
  smallStraight: null,
  largeStraight: null,
  chance: null,
  dice: null,
  total: 0,
};

export const SLOT_ORDER = [1, 2, 3, 4] as const;
export const NUM_DICES = 5;
export const MAX_TRIES = 3;
export const TOTAL_TURNS = 13;
export const BONUS_THRESHOLD = 63; // Bonus when upper section >= 63
export const BONUS_POINTS = 35;
