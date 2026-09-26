import type { Result } from 'typescript-result';
import type {
  DicePlayerScores,
  DiceSessionPlayerType,
  DiceSessionStateType,
  DiceSessionStatusType,
  DiceSessionType,
} from '@/domain/dice/dice.type.ts';

export interface DiceSessionRepository {
  create(session: {
    name: string;
    isPublic?: boolean;
    createdBy: {
      userId: string | null;
      guestId: string | null;
      displayName: string;
    };
  }): Promise<Result<DiceSessionType, Error>>;

  findById(id: string): Promise<Result<DiceSessionType | null, Error>>;

  findByJoinCode(joinCode: string): Promise<Result<DiceSessionType | null, Error>>;

  findPublicWaiting(): Promise<Result<DiceSessionType[], Error>>;

  updateStatus(id: string, status: DiceSessionStatusType): Promise<Result<void, Error>>;

  delete(id: string): Promise<Result<void, Error>>;
}

export interface DiceSessionPlayerRepository {
  addPlayer(player: {
    sessionId: string;
    slot: number;
    userId: string | null;
    guestId: string | null;
    displayName: string;
    orderIndex: number;
  }): Promise<Result<DiceSessionPlayerType, Error>>;

  findBySession(sessionId: string): Promise<Result<DiceSessionPlayerType[], Error>>;

  removePlayer(sessionId: string, slot: number): Promise<Result<boolean, Error>>;

  findBySessionAndUserOrGuest(
    sessionId: string,
    userId: string | null,
    guestId: string | null,
  ): Promise<Result<DiceSessionPlayerType | null, Error>>;

  countBySession(sessionId: string): Promise<Result<number, Error>>;

  findSessionIdsByUserOrGuest(
    userId: string | null,
    guestId: string | null,
  ): Promise<Result<string[], Error>>;
}

export interface DiceSessionStateRepository {
  createState(state: {
    sessionId: string;
    currentPlayerSlot: number;
    remainingTurns: number;
    dices: { face: number; locked: boolean }[];
    triesLeft: number;
    scores: Record<number, DicePlayerScores>;
  }): Promise<Result<DiceSessionStateType, Error>>;

  findBySession(sessionId: string): Promise<Result<DiceSessionStateType | null, Error>>;

  updateState(
    sessionId: string,
    state: Partial<{
      currentPlayerSlot: number;
      remainingTurns: number;
      dices: { face: number; locked: boolean }[];
      triesLeft: number;
      scores: Record<number, DicePlayerScores>;
    }>,
  ): Promise<Result<DiceSessionStateType, Error>>;
}
