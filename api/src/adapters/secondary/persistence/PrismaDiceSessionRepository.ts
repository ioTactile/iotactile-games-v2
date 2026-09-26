import { randomBytes } from 'node:crypto';
import { Result } from 'typescript-result';
import type { DiceSessionRepository } from '@/domain/dice/dice.repository.ts';
import type { DiceSessionType } from '@/domain/dice/dice.type.ts';
import { DiceSessionStatus } from '@/domain/dice/dice.type.ts';
import { prisma } from '@/pkg/database/prisma.ts';

function mapStatus(s: 'WAITING' | 'PLAYING' | 'FINISHED'): DiceSessionType['status'] {
  return s as DiceSessionType['status'];
}

/** Characters used for join codes (avoids 0/O, 1/I/L for readability) */
const JOIN_CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateJoinCode(): string {
  const bytes = randomBytes(6);
  let code = '';
  for (let i = 0; i < bytes.length; i++) {
    const index = bytes[i] % JOIN_CODE_CHARS.length;
    code += JOIN_CODE_CHARS[index];
  }
  return code;
}

function toSession(row: {
  id: string;
  name: string;
  joinCode: string | null;
  isPublic: boolean;
  status: 'WAITING' | 'PLAYING' | 'FINISHED';
  createdAt: Date;
  updatedAt: Date;
}): DiceSessionType {
  return {
    id: row.id,
    name: row.name,
    joinCode: row.joinCode,
    isPublic: row.isPublic,
    status: mapStatus(row.status),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PrismaDiceSessionRepository implements DiceSessionRepository {
  async create(session: {
    name: string;
    isPublic?: boolean;
    createdBy: {
      userId: string | null;
      guestId: string | null;
      displayName: string;
    };
  }): Promise<Result<DiceSessionType, Error>> {
    const maxAttempts = 5;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const joinCode = generateJoinCode();
      try {
        const created = await prisma.diceSession.create({
          data: {
            name: session.name,
            joinCode,
            isPublic: session.isPublic ?? false,
            status: 'WAITING',
            players: {
              create: {
                slot: 1,
                userId: session.createdBy.userId,
                guestId: session.createdBy.guestId,
                displayName: session.createdBy.displayName,
                orderIndex: 0,
              },
            },
          },
        });
        return Result.ok(toSession(created));
      } catch (error: unknown) {
        const isUniqueViolation =
          error &&
          typeof error === 'object' &&
          'code' in error &&
          (error as { code: string }).code === 'P2002';
        if (!isUniqueViolation || attempt === maxAttempts - 1) {
          return Result.error(error as Error);
        }
      }
    }
    return Result.error(new Error('JOIN_CODE_GENERATION_FAILED'));
  }

  async findById(id: string): Promise<Result<DiceSessionType | null, Error>> {
    try {
      const row = await prisma.diceSession.findUnique({
        where: { id },
      });
      return Result.ok(row ? toSession(row) : null);
    } catch (error) {
      return Result.error(error as Error);
    }
  }

  async findByJoinCode(joinCode: string): Promise<Result<DiceSessionType | null, Error>> {
    try {
      const normalized = joinCode.trim().toUpperCase();
      if (!normalized) return Result.ok(null);
      const row = await prisma.diceSession.findUnique({
        where: { joinCode: normalized },
      });
      return Result.ok(row ? toSession(row) : null);
    } catch (error) {
      return Result.error(error as Error);
    }
  }

  async findPublicWaiting(): Promise<Result<DiceSessionType[], Error>> {
    try {
      const rows = await prisma.diceSession.findMany({
        where: { isPublic: true, status: 'WAITING' },
        orderBy: { updatedAt: 'desc' },
      });
      return Result.ok(rows.map(toSession));
    } catch (error) {
      return Result.error(error as Error);
    }
  }

  async updateStatus(id: string, status: DiceSessionType['status']): Promise<Result<void, Error>> {
    try {
      const prismaStatus =
        status === DiceSessionStatus.WAITING
          ? 'WAITING'
          : status === DiceSessionStatus.PLAYING
            ? 'PLAYING'
            : 'FINISHED';
      await prisma.diceSession.update({
        where: { id },
        data: { status: prismaStatus },
      });
      return Result.ok(undefined);
    } catch (error) {
      return Result.error(error as Error);
    }
  }

  async delete(id: string): Promise<Result<void, Error>> {
    try {
      await prisma.diceSession.delete({ where: { id } });
      return Result.ok(undefined);
    } catch (error) {
      return Result.error(error as Error);
    }
  }
}
