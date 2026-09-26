import { Result } from 'typescript-result';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ListPublicDiceSessionsUsecase } from '@/application/query/usecases/dice/list-public-dice-sessions.usecase.ts';
import type { DiceSessionRepository } from '@/domain/dice/dice.repository.ts';
import type { DiceSessionType } from '@/domain/dice/dice.type.ts';

function createSession(overrides: Partial<DiceSessionType> = {}): DiceSessionType {
  return {
    id: 'session-1',
    name: 'Partie publique',
    joinCode: 'ABC123',
    isPublic: true,
    status: 'WAITING',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('ListPublicDiceSessionsUsecase', () => {
  let sessionRepo: DiceSessionRepository;

  beforeEach(() => {
    sessionRepo = {
      create: vi.fn(),
      findById: vi.fn(),
      findByJoinCode: vi.fn(),
      findPublicWaiting: vi.fn(),
      updateStatus: vi.fn(),
      delete: vi.fn(),
    };
  });

  it('retourne la liste des sessions publiques en attente', async () => {
    const sessions = [
      createSession({ id: 's1', name: 'Partie 1' }),
      createSession({ id: 's2', name: 'Partie 2', joinCode: null }),
    ];
    vi.mocked(sessionRepo.findPublicWaiting).mockResolvedValue(Result.ok(sessions));

    const usecase = new ListPublicDiceSessionsUsecase(sessionRepo);
    const result = await usecase.execute();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(2);
      expect(result.value[0]).toEqual({
        id: 's1',
        name: 'Partie 1',
        joinCode: 'ABC123',
        status: 'WAITING',
      });
      expect(result.value[1]).toEqual({
        id: 's2',
        name: 'Partie 2',
        joinCode: null,
        status: 'WAITING',
      });
    }
    expect(sessionRepo.findPublicWaiting).toHaveBeenCalledTimes(1);
  });

  it('retourne un tableau vide si aucune session publique en attente', async () => {
    vi.mocked(sessionRepo.findPublicWaiting).mockResolvedValue(Result.ok([]));

    const usecase = new ListPublicDiceSessionsUsecase(sessionRepo);
    const result = await usecase.execute();

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual([]);
  });

  it("propage l'erreur si findPublicWaiting échoue", async () => {
    vi.mocked(sessionRepo.findPublicWaiting).mockResolvedValue(Result.error(new Error('DB_ERROR')));

    const usecase = new ListPublicDiceSessionsUsecase(sessionRepo);
    const result = await usecase.execute();

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toBe('DB_ERROR');
  });
});
