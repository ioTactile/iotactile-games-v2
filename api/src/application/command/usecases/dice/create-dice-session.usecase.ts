import { Result } from 'typescript-result';
import type { DiceSessionRepository } from '@/domain/dice/dice.repository.ts';
import type { DiceSessionType } from '@/domain/dice/dice.type.ts';

export interface CreateDiceSessionInput {
  name: string;
  isPublic?: boolean;
  userId: string | null;
  guestId: string | null;
  displayName: string;
}

export class CreateDiceSessionUsecase {
  private readonly sessionRepo: DiceSessionRepository;

  constructor(sessionRepo: DiceSessionRepository) {
    this.sessionRepo = sessionRepo;
  }

  async execute(input: CreateDiceSessionInput): Promise<Result<DiceSessionType, Error>> {
    if (!input.displayName?.trim()) {
      return Result.error(new Error('DISPLAY_NAME_REQUIRED'));
    }
    if (!input.userId && !input.guestId) {
      return Result.error(new Error('USER_OR_GUEST_REQUIRED'));
    }
    return this.sessionRepo.create({
      name: input.name.trim(),
      isPublic: input.isPublic ?? false,
      createdBy: {
        userId: input.userId ?? null,
        guestId: input.guestId ?? null,
        displayName: input.displayName.trim(),
      },
    });
  }
}
