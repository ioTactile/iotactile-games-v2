import { Result } from 'typescript-result';
import type { DiceSessionStateRepository } from '@/domain/dice/dice.repository.ts';
import type { DicePlayerScores, DiceSessionStateType } from '@/domain/dice/dice.type.ts';
import { prisma } from '@/pkg/database/prisma.ts';

function toState(row: {
  id: string;
  sessionId: string;
  currentPlayerSlot: number;
  remainingTurns: number;
  dices: unknown;
  triesLeft: number;
  scores: unknown;
  updatedAt: Date;
}): DiceSessionStateType {
  return {
    id: row.id,
    sessionId: row.sessionId,
    currentPlayerSlot: row.currentPlayerSlot,
    remainingTurns: row.remainingTurns,
    dices: row.dices as DiceSessionStateType['dices'],
    triesLeft: row.triesLeft,
    scores: row.scores as DiceSessionStateType['scores'],
    updatedAt: row.updatedAt,
  };
}

export class PrismaDiceSessionStateRepository implements DiceSessionStateRepository {
  async createState(state: {
    sessionId: string;
    currentPlayerSlot: number;
    remainingTurns: number;
    dices: { face: number; locked: boolean }[];
    triesLeft: number;
    scores: Record<number, DicePlayerScores>;
  }): Promise<Result<DiceSessionStateType, Error>> {
    try {
      const created = await prisma.diceSessionState.create({
        data: {
          sessionId: state.sessionId,
          currentPlayerSlot: state.currentPlayerSlot,
          remainingTurns: state.remainingTurns,
          dices: state.dices as object,
          triesLeft: state.triesLeft,
          scores: state.scores as object,
        },
      });
      return Result.ok(toState(created));
    } catch (error) {
      return Result.error(error as Error);
    }
  }

  async findBySession(sessionId: string): Promise<Result<DiceSessionStateType | null, Error>> {
    try {
      const row = await prisma.diceSessionState.findUnique({
        where: { sessionId },
      });
      return Result.ok(row ? toState(row) : null);
    } catch (error) {
      return Result.error(error as Error);
    }
  }

  async updateState(
    sessionId: string,
    state: Partial<{
      currentPlayerSlot: number;
      remainingTurns: number;
      dices: { face: number; locked: boolean }[];
      triesLeft: number;
      scores: Record<number, DicePlayerScores>;
    }>,
  ): Promise<Result<DiceSessionStateType, Error>> {
    try {
      const updated = await prisma.diceSessionState.update({
        where: { sessionId },
        data: {
          ...(state.currentPlayerSlot !== undefined && {
            currentPlayerSlot: state.currentPlayerSlot,
          }),
          ...(state.remainingTurns !== undefined && {
            remainingTurns: state.remainingTurns,
          }),
          ...(state.dices !== undefined && { dices: state.dices as object }),
          ...(state.triesLeft !== undefined && { triesLeft: state.triesLeft }),
          ...(state.scores !== undefined && { scores: state.scores as object }),
        },
      });
      return Result.ok(toState(updated));
    } catch (error) {
      return Result.error(error as Error);
    }
  }
}
