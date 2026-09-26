/**
 * Dice types aligned with the backend API.
 */

export const DiceSessionStatus = {
  WAITING: 'WAITING',
  PLAYING: 'PLAYING',
  FINISHED: 'FINISHED',
} as const;

export type DiceSessionStatusType = (typeof DiceSessionStatus)[keyof typeof DiceSessionStatus];

export interface DiceFaceDto {
  face: number;
  locked: boolean;
}

export interface DiceSessionPlayerDto {
  id: string;
  sessionId: string;
  slot: number;
  userId: string | null;
  guestId: string | null;
  displayName: string;
  orderIndex: number;
  createdAt: string;
}

export interface DiceSessionDto {
  id: string;
  name: string;
  joinCode?: string | null;
  isPublic?: boolean;
  status: DiceSessionStatusType;
  createdAt: string;
  updatedAt: string;
}

export interface MyDiceSessionItemDto {
  id: string;
  name: string;
  joinCode?: string | null;
  isPublic?: boolean;
  status: DiceSessionStatusType;
}

export interface PublicDiceSessionItemDto {
  id: string;
  name: string;
  joinCode: string | null;
  status: DiceSessionStatusType;
}

export interface DicePlayerScoresDto {
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
  dice: number | null;
  chance: number | null;
  total: number;
}

export interface DiceSessionStateDto {
  id: string;
  sessionId: string;
  currentPlayerSlot: number;
  remainingTurns: number;
  dices: DiceFaceDto[];
  triesLeft: number;
  scores: Record<number, DicePlayerScoresDto>;
  updatedAt: string;
}

export interface DiceSessionViewDto {
  session: DiceSessionDto;
  players: DiceSessionPlayerDto[];
  state: DiceSessionStateDto | null;
}

export type ScoreKeyDto =
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
