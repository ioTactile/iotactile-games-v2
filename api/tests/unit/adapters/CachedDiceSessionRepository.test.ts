import { Result } from 'typescript-result';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DiceSessionRepository } from '@/domain/dice/dice.repository.ts';
import type { DiceSessionType } from '@/domain/dice/dice.type.ts';

const createSession = (overrides: Partial<DiceSessionType> = {}): DiceSessionType => ({
  id: 'session-1',
  name: 'Partie publique',
  joinCode: 'ABC123',
  isPublic: true,
  status: 'WAITING',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('CachedDiceSessionRepository', () => {
  let innerRepo: DiceSessionRepository;
  let redis: {
    get: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
    del: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    innerRepo = {
      create: vi.fn(),
      findById: vi.fn(),
      findByJoinCode: vi.fn(),
      findPublicWaiting: vi.fn(),
      updateStatus: vi.fn(),
      delete: vi.fn(),
    };
    redis = {
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn(),
    };
  });

  it('retourne les données du cache quand disponibles', async () => {
    const { CachedDiceSessionRepository } =
      await import('@/adapters/secondary/persistence/CachedDiceSessionRepository.ts');
    const sessions = [createSession({ id: 's1' })];
    redis.get.mockResolvedValue(JSON.stringify(sessions));

    const repo = new CachedDiceSessionRepository({
      inner: innerRepo,
      redis: redis as unknown as never,
      publicWaitingTtlSeconds: 5,
    });

    const result = await repo.findPublicWaiting();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual(sessions);
    }
    expect(redis.get).toHaveBeenCalledTimes(1);
    expect(innerRepo.findPublicWaiting).not.toHaveBeenCalled();
  });

  it('chute sur le repository interne en cas de miss cache', async () => {
    const { CachedDiceSessionRepository } =
      await import('@/adapters/secondary/persistence/CachedDiceSessionRepository.ts');
    const sessions = [createSession({ id: 's1' })];
    redis.get.mockResolvedValue(null);
    vi.mocked(innerRepo.findPublicWaiting).mockResolvedValue(Result.ok(sessions));

    const repo = new CachedDiceSessionRepository({
      inner: innerRepo,
      redis: redis as unknown as never,
      publicWaitingTtlSeconds: 5,
    });

    const result = await repo.findPublicWaiting();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual(sessions);
    }
    expect(innerRepo.findPublicWaiting).toHaveBeenCalledTimes(1);
    expect(redis.set).toHaveBeenCalledTimes(1);
  });

  it("propage l'erreur du repository interne", async () => {
    const { CachedDiceSessionRepository } =
      await import('@/adapters/secondary/persistence/CachedDiceSessionRepository.ts');
    const error = new Error('DB_ERROR');
    redis.get.mockResolvedValue(null);
    vi.mocked(innerRepo.findPublicWaiting).mockResolvedValue(Result.error(error));

    const repo = new CachedDiceSessionRepository({
      inner: innerRepo,
      redis: redis as unknown as never,
      publicWaitingTtlSeconds: 5,
    });

    const result = await repo.findPublicWaiting();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe(error);
    }
  });

  it('délègue les autres méthodes au repository interne', async () => {
    const { CachedDiceSessionRepository } =
      await import('@/adapters/secondary/persistence/CachedDiceSessionRepository.ts');
    const repo = new CachedDiceSessionRepository({
      inner: innerRepo,
      redis: redis as unknown as never,
      publicWaitingTtlSeconds: 5,
    });

    const session = createSession();
    vi.mocked(innerRepo.create).mockResolvedValue(Result.ok(session));
    vi.mocked(innerRepo.findById).mockResolvedValue(Result.ok(session));
    vi.mocked(innerRepo.findByJoinCode).mockResolvedValue(Result.ok(session));
    vi.mocked(innerRepo.updateStatus).mockResolvedValue(Result.ok(undefined));
    vi.mocked(innerRepo.delete).mockResolvedValue(Result.ok(undefined));

    const created = await repo.create({
      name: 'Test',
      createdBy: { userId: null, guestId: null, displayName: 'X' },
    });
    const byId = await repo.findById('id');
    const byCode = await repo.findByJoinCode('CODE');
    const updated = await repo.updateStatus('id', 'WAITING');
    const deleted = await repo.delete('id');

    expect(created.ok).toBe(true);
    expect(byId.ok).toBe(true);
    expect(byCode.ok).toBe(true);
    expect(updated.ok).toBe(true);
    expect(deleted.ok).toBe(true);
    expect(innerRepo.create).toHaveBeenCalledTimes(1);
    expect(innerRepo.findById).toHaveBeenCalledTimes(1);
    expect(innerRepo.findByJoinCode).toHaveBeenCalledTimes(1);
    expect(innerRepo.updateStatus).toHaveBeenCalledTimes(1);
    expect(innerRepo.delete).toHaveBeenCalledTimes(1);
    expect(redis.del).toHaveBeenCalledTimes(3);
  });

  it('invalide le cache après create / updateStatus / delete', async () => {
    const { CachedDiceSessionRepository } =
      await import('@/adapters/secondary/persistence/CachedDiceSessionRepository.ts');
    const repo = new CachedDiceSessionRepository({
      inner: innerRepo,
      redis: redis as unknown as never,
      publicWaitingTtlSeconds: 5,
    });
    const session = createSession();
    vi.mocked(innerRepo.create).mockResolvedValue(Result.ok(session));
    vi.mocked(innerRepo.updateStatus).mockResolvedValue(Result.ok(undefined));
    vi.mocked(innerRepo.delete).mockResolvedValue(Result.ok(undefined));

    await repo.create({
      name: 'Public',
      isPublic: true,
      createdBy: { userId: 'u1', guestId: null, displayName: 'A' },
    });
    await repo.updateStatus('session-1', 'PLAYING');
    await repo.delete('session-1');

    expect(redis.del).toHaveBeenCalledTimes(3);
    expect(redis.del).toHaveBeenCalledWith('dice:sessions:public:waiting');
  });

  it('délègue sans Redis quand redis est null', async () => {
    const { CachedDiceSessionRepository } =
      await import('@/adapters/secondary/persistence/CachedDiceSessionRepository.ts');
    const sessions = [createSession()];
    vi.mocked(innerRepo.findPublicWaiting).mockResolvedValue(Result.ok(sessions));
    const repo = new CachedDiceSessionRepository({
      inner: innerRepo,
      redis: null,
      publicWaitingTtlSeconds: 5,
    });

    const result = await repo.findPublicWaiting();
    expect(result.ok).toBe(true);
    expect(innerRepo.findPublicWaiting).toHaveBeenCalledTimes(1);
  });

  it('reconstitue les Date depuis le JSON Redis', async () => {
    const { CachedDiceSessionRepository } =
      await import('@/adapters/secondary/persistence/CachedDiceSessionRepository.ts');
    const createdAt = '2026-01-15T10:00:00.000Z';
    const updatedAt = '2026-01-15T11:00:00.000Z';
    redis.get.mockResolvedValue(
      JSON.stringify([
        {
          id: 's1',
          name: 'Partie',
          joinCode: 'ABC123',
          isPublic: true,
          status: 'WAITING',
          createdAt,
          updatedAt,
        },
      ]),
    );

    const repo = new CachedDiceSessionRepository({
      inner: innerRepo,
      redis: redis as unknown as never,
      publicWaitingTtlSeconds: 5,
    });
    const result = await repo.findPublicWaiting();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value[0].createdAt).toBeInstanceOf(Date);
      expect(result.value[0].updatedAt).toBeInstanceOf(Date);
      expect(result.value[0].createdAt.toISOString()).toBe(createdAt);
    }
  });
});
