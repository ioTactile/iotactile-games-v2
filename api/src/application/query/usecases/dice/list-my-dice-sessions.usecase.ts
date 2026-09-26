import { Result } from 'typescript-result';
import type {
  DiceSessionPlayerRepository,
  DiceSessionRepository,
} from '@/domain/dice/dice.repository.ts';
import type { DiceSessionType } from '@/domain/dice/dice.type.ts';

export interface MyDiceSessionItem {
  id: string;
  name: string;
  joinCode: string | null;
  isPublic: boolean;
  status: DiceSessionType['status'];
}

export class ListMyDiceSessionsUsecase {
  private readonly sessionRepo: DiceSessionRepository;
  private readonly playerRepo: DiceSessionPlayerRepository;

  constructor(sessionRepo: DiceSessionRepository, playerRepo: DiceSessionPlayerRepository) {
    this.sessionRepo = sessionRepo;
    this.playerRepo = playerRepo;
  }

  async execute(params: {
    userId: string | null;
    guestId: string | null;
  }): Promise<Result<MyDiceSessionItem[], Error>> {
    if (!params.userId && !params.guestId) {
      return Result.ok([]);
    }
    const idsResult = await this.playerRepo.findSessionIdsByUserOrGuest(
      params.userId,
      params.guestId,
    );
    if (!idsResult.ok) return idsResult;
    const sessionIds = idsResult.value;
    const sessions: DiceSessionType[] = [];
    for (const id of sessionIds) {
      const sessionResult = await this.sessionRepo.findById(id);
      if (!sessionResult.ok) return sessionResult;
      const session = sessionResult.value;
      if (!session) continue;
      sessions.push(session);
    }
    sessions.sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime() || a.name.localeCompare(b.name),
    );
    return Result.ok(
      sessions.map((s) => ({
        id: s.id,
        name: s.name,
        joinCode: s.joinCode ?? null,
        isPublic: s.isPublic,
        status: s.status,
      })),
    );
  }
}
