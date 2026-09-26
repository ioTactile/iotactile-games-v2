import { Result } from 'typescript-result';
import type { DiceSessionPlayerRepository } from '@/domain/dice/dice.repository.ts';
import type { DiceSessionPlayerType } from '@/domain/dice/dice.type.ts';
import { prisma } from '@/pkg/database/prisma.ts';

function toPlayer(row: {
  id: string;
  sessionId: string;
  slot: number;
  userId: string | null;
  guestId: string | null;
  displayName: string;
  orderIndex: number;
  createdAt: Date;
}): DiceSessionPlayerType {
  return {
    id: row.id,
    sessionId: row.sessionId,
    slot: row.slot,
    userId: row.userId,
    guestId: row.guestId,
    displayName: row.displayName,
    orderIndex: row.orderIndex,
    createdAt: row.createdAt,
  };
}

export class PrismaDiceSessionPlayerRepository implements DiceSessionPlayerRepository {
  async addPlayer(player: {
    sessionId: string;
    slot: number;
    userId: string | null;
    guestId: string | null;
    displayName: string;
    orderIndex: number;
  }): Promise<Result<DiceSessionPlayerType, Error>> {
    try {
      const created = await prisma.diceSessionPlayer.create({
        data: {
          sessionId: player.sessionId,
          slot: player.slot,
          userId: player.userId,
          guestId: player.guestId,
          displayName: player.displayName,
          orderIndex: player.orderIndex,
        },
      });
      return Result.ok(toPlayer(created));
    } catch (error) {
      return Result.error(error as Error);
    }
  }

  async findBySession(sessionId: string): Promise<Result<DiceSessionPlayerType[], Error>> {
    try {
      const rows = await prisma.diceSessionPlayer.findMany({
        where: { sessionId },
        orderBy: { orderIndex: 'asc' },
      });
      return Result.ok(rows.map(toPlayer));
    } catch (error) {
      return Result.error(error as Error);
    }
  }

  async removePlayer(sessionId: string, slot: number): Promise<Result<boolean, Error>> {
    try {
      const result = await prisma.diceSessionPlayer.deleteMany({
        where: { sessionId, slot },
      });
      return Result.ok(result.count > 0);
    } catch (error) {
      return Result.error(error as Error);
    }
  }

  async findBySessionAndUserOrGuest(
    sessionId: string,
    userId: string | null,
    guestId: string | null,
  ): Promise<Result<DiceSessionPlayerType | null, Error>> {
    try {
      if (userId) {
        const row = await prisma.diceSessionPlayer.findFirst({
          where: { sessionId, userId },
        });
        return Result.ok(row ? toPlayer(row) : null);
      }
      if (guestId) {
        const row = await prisma.diceSessionPlayer.findFirst({
          where: { sessionId, guestId },
        });
        return Result.ok(row ? toPlayer(row) : null);
      }
      return Result.ok(null);
    } catch (error) {
      return Result.error(error as Error);
    }
  }

  async countBySession(sessionId: string): Promise<Result<number, Error>> {
    try {
      const count = await prisma.diceSessionPlayer.count({
        where: { sessionId },
      });
      return Result.ok(count);
    } catch (error) {
      return Result.error(error as Error);
    }
  }

  async findSessionIdsByUserOrGuest(
    userId: string | null,
    guestId: string | null,
  ): Promise<Result<string[], Error>> {
    try {
      const where: { userId?: string; guestId?: string }[] = [];
      if (userId) where.push({ userId });
      if (guestId) where.push({ guestId });
      if (where.length === 0) return Result.ok([]);
      const rows = await prisma.diceSessionPlayer.findMany({
        where: { OR: where },
        select: { sessionId: true },
        distinct: ['sessionId'],
      });
      return Result.ok(rows.map((row: { sessionId: string }) => row.sessionId));
    } catch (error) {
      return Result.error(error as Error);
    }
  }
}
