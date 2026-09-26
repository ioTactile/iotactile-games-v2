import { Result } from 'typescript-result';
import type { DiceSessionRepository } from '@/domain/dice/dice.repository.ts';
import type { DiceSessionType } from '@/domain/dice/dice.type.ts';

export interface PublicDiceSessionItem {
  id: string;
  name: string;
  joinCode: string | null;
  status: DiceSessionType['status'];
}

export class ListPublicDiceSessionsUsecase {
  private readonly sessionRepo: DiceSessionRepository;

  constructor(sessionRepo: DiceSessionRepository) {
    this.sessionRepo = sessionRepo;
  }

  async execute(): Promise<Result<PublicDiceSessionItem[], Error>> {
    const result = await this.sessionRepo.findPublicWaiting();
    if (!result.ok) return result;
    return Result.ok(
      result.value.map((s) => ({
        id: s.id,
        name: s.name,
        joinCode: s.joinCode ?? null,
        status: s.status,
      })),
    );
  }
}
