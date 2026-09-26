import { Result } from 'typescript-result';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ListMyDiceSessionsUsecase } from '@/application/query/usecases/dice/list-my-dice-sessions.usecase.ts';
import type {
  DiceSessionPlayerRepository,
  DiceSessionRepository,
} from '@/domain/dice/dice.repository.ts';
import type { DiceSessionType } from '@/domain/dice/dice.type.ts';

function createSession(overrides: Partial<DiceSessionType> = {}): DiceSessionType {
  return {
    id: 'session-1',
    name: 'Ma partie',
    joinCode: 'ABC123',
    isPublic: true,
    status: 'WAITING',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('ListMyDiceSessionsUsecase', () => {
  let sessionRepo: DiceSessionRepository;
  let playerRepo: DiceSessionPlayerRepository;

  beforeEach(() => {
    sessionRepo = {
      create: vi.fn(),
      findById: vi.fn(),
      findByJoinCode: vi.fn(),
      findPublicWaiting: vi.fn(),
      updateStatus: vi.fn(),
      delete: vi.fn(),
    };
    playerRepo = {
      addPlayer: vi.fn(),
      findBySession: vi.fn(),
      removePlayer: vi.fn(),
      findBySessionAndUserOrGuest: vi.fn(),
      countBySession: vi.fn(),
      findSessionIdsByUserOrGuest: vi.fn(),
    };
  });

  it('retourne un tableau vide si ni userId ni guestId', async () => {
    const usecase = new ListMyDiceSessionsUsecase(sessionRepo, playerRepo);
    const result = await usecase.execute({ userId: null, guestId: null });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual([]);
    expect(playerRepo.findSessionIdsByUserOrGuest).not.toHaveBeenCalled();
  });

  it('retourne la liste des sessions triées par updatedAt décroissant', async () => {
    const older = createSession({
      id: 's1',
      name: 'Older',
      updatedAt: new Date('2025-01-01'),
    });
    const newer = createSession({
      id: 's2',
      name: 'Newer',
      updatedAt: new Date('2025-02-01'),
    });
    vi.mocked(playerRepo.findSessionIdsByUserOrGuest).mockResolvedValue(Result.ok(['s1', 's2']));
    vi.mocked(sessionRepo.findById)
      .mockResolvedValueOnce(Result.ok(older))
      .mockResolvedValueOnce(Result.ok(newer));

    const usecase = new ListMyDiceSessionsUsecase(sessionRepo, playerRepo);
    const result = await usecase.execute({
      userId: 'user-1',
      guestId: null,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(2);
      expect(result.value[0].id).toBe('s2');
      expect(result.value[0].name).toBe('Newer');
      expect(result.value[1].id).toBe('s1');
      expect(result.value[1].name).toBe('Older');
    }
    expect(playerRepo.findSessionIdsByUserOrGuest).toHaveBeenCalledWith('user-1', null);
  });

  it('retourne les champs id, name, joinCode, isPublic, status pour chaque session', async () => {
    const session = createSession({
      id: 'sid',
      name: 'Partie',
      joinCode: 'XYZ',
      isPublic: false,
      status: 'PLAYING',
    });
    vi.mocked(playerRepo.findSessionIdsByUserOrGuest).mockResolvedValue(Result.ok(['sid']));
    vi.mocked(sessionRepo.findById).mockResolvedValue(Result.ok(session));

    const usecase = new ListMyDiceSessionsUsecase(sessionRepo, playerRepo);
    const result = await usecase.execute({
      userId: 'user-1',
      guestId: null,
    });

    expect(result.ok).toBe(true);
    if (result.ok && result.value[0]) {
      expect(result.value[0]).toEqual({
        id: 'sid',
        name: 'Partie',
        joinCode: 'XYZ',
        isPublic: false,
        status: 'PLAYING',
      });
    }
  });

  it('ignore les sessions non trouvées (findById null)', async () => {
    vi.mocked(playerRepo.findSessionIdsByUserOrGuest).mockResolvedValue(Result.ok(['s1', 's2']));
    vi.mocked(sessionRepo.findById)
      .mockResolvedValueOnce(Result.ok(null))
      .mockResolvedValueOnce(Result.ok(createSession({ id: 's2', name: 'Found' })));

    const usecase = new ListMyDiceSessionsUsecase(sessionRepo, playerRepo);
    const result = await usecase.execute({
      userId: 'user-1',
      guestId: null,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(1);
      expect(result.value[0].id).toBe('s2');
      expect(result.value[0].name).toBe('Found');
    }
  });

  it("propage l'erreur si findSessionIdsByUserOrGuest échoue", async () => {
    vi.mocked(playerRepo.findSessionIdsByUserOrGuest).mockResolvedValue(
      Result.error(new Error('DB_ERROR')),
    );

    const usecase = new ListMyDiceSessionsUsecase(sessionRepo, playerRepo);
    const result = await usecase.execute({
      userId: 'user-1',
      guestId: null,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toBe('DB_ERROR');
  });
});
