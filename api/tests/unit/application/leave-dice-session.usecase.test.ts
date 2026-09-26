import { Result } from 'typescript-result';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LeaveDiceSessionUsecase } from '@/application/command/usecases/dice/leave-dice-session.usecase.ts';
import type {
  DiceSessionPlayerRepository,
  DiceSessionRepository,
} from '@/domain/dice/dice.repository.ts';
import type { DiceSessionPlayerType, DiceSessionType } from '@/domain/dice/dice.type.ts';

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

function createPlayer(overrides: Partial<DiceSessionPlayerType> = {}): DiceSessionPlayerType {
  return {
    id: 'player-1',
    sessionId: 'session-1',
    slot: 1,
    userId: 'user-1',
    guestId: null,
    displayName: 'Alice',
    orderIndex: 0,
    createdAt: new Date(),
    ...overrides,
  };
}

describe('LeaveDiceSessionUsecase', () => {
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

  it('retourne USER_OR_GUEST_REQUIRED si ni userId ni guestId', async () => {
    const usecase = new LeaveDiceSessionUsecase(sessionRepo, playerRepo);
    const result = await usecase.execute({
      sessionId: 'session-1',
      userId: null,
      guestId: null,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toBe('USER_OR_GUEST_REQUIRED');
    expect(sessionRepo.findById).not.toHaveBeenCalled();
  });

  it("retourne SESSION_NOT_FOUND si la session n'existe pas", async () => {
    vi.mocked(sessionRepo.findById).mockResolvedValue(Result.ok(null));
    const usecase = new LeaveDiceSessionUsecase(sessionRepo, playerRepo);
    const result = await usecase.execute({
      sessionId: 'session-1',
      userId: 'user-1',
      guestId: null,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toBe('SESSION_NOT_FOUND');
  });

  it("retourne CANNOT_LEAVE_STARTED_GAME si la session n'est pas en WAITING", async () => {
    const session = createSession({ status: 'PLAYING' });
    vi.mocked(sessionRepo.findById).mockResolvedValue(Result.ok(session));
    const usecase = new LeaveDiceSessionUsecase(sessionRepo, playerRepo);
    const result = await usecase.execute({
      sessionId: 'session-1',
      userId: 'user-1',
      guestId: null,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toBe('CANNOT_LEAVE_STARTED_GAME');
    expect(playerRepo.findBySessionAndUserOrGuest).not.toHaveBeenCalled();
  });

  it("retourne NOT_IN_SESSION si le joueur n'est pas dans la session", async () => {
    vi.mocked(sessionRepo.findById).mockResolvedValue(Result.ok(createSession()));
    vi.mocked(playerRepo.findBySessionAndUserOrGuest).mockResolvedValue(Result.ok(null));
    const usecase = new LeaveDiceSessionUsecase(sessionRepo, playerRepo);
    const result = await usecase.execute({
      sessionId: 'session-1',
      userId: 'user-1',
      guestId: null,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toBe('NOT_IN_SESSION');
  });

  it("retire le joueur et ne supprime pas la session s'il reste des joueurs", async () => {
    vi.mocked(sessionRepo.findById).mockResolvedValue(Result.ok(createSession()));
    vi.mocked(playerRepo.findBySessionAndUserOrGuest).mockResolvedValue(Result.ok(createPlayer()));
    vi.mocked(playerRepo.removePlayer).mockResolvedValue(Result.ok(true));
    vi.mocked(playerRepo.countBySession).mockResolvedValue(Result.ok(2));
    const usecase = new LeaveDiceSessionUsecase(sessionRepo, playerRepo);
    const result = await usecase.execute({
      sessionId: 'session-1',
      userId: 'user-1',
      guestId: null,
    });
    expect(result.ok).toBe(true);
    expect(playerRepo.removePlayer).toHaveBeenCalledWith('session-1', 1);
    expect(playerRepo.countBySession).toHaveBeenCalledWith('session-1');
    expect(sessionRepo.delete).not.toHaveBeenCalled();
  });

  it('supprime la session quand le dernier joueur quitte', async () => {
    vi.mocked(sessionRepo.findById).mockResolvedValue(Result.ok(createSession()));
    vi.mocked(playerRepo.findBySessionAndUserOrGuest).mockResolvedValue(Result.ok(createPlayer()));
    vi.mocked(playerRepo.removePlayer).mockResolvedValue(Result.ok(true));
    vi.mocked(playerRepo.countBySession).mockResolvedValue(Result.ok(0));
    vi.mocked(sessionRepo.delete).mockResolvedValue(Result.ok(undefined));
    const usecase = new LeaveDiceSessionUsecase(sessionRepo, playerRepo);
    const result = await usecase.execute({
      sessionId: 'session-1',
      userId: 'user-1',
      guestId: null,
    });
    expect(result.ok).toBe(true);
    expect(sessionRepo.delete).toHaveBeenCalledWith('session-1');
    expect(sessionRepo.updateStatus).not.toHaveBeenCalled();
  });

  it("retourne l'erreur si delete échoue quand la session devient vide", async () => {
    vi.mocked(sessionRepo.findById).mockResolvedValue(Result.ok(createSession()));
    vi.mocked(playerRepo.findBySessionAndUserOrGuest).mockResolvedValue(Result.ok(createPlayer()));
    vi.mocked(playerRepo.removePlayer).mockResolvedValue(Result.ok(true));
    vi.mocked(playerRepo.countBySession).mockResolvedValue(Result.ok(0));
    vi.mocked(sessionRepo.delete).mockResolvedValue(Result.error(new Error('DELETE_FAILED')));
    const usecase = new LeaveDiceSessionUsecase(sessionRepo, playerRepo);
    const result = await usecase.execute({
      sessionId: 'session-1',
      userId: 'user-1',
      guestId: null,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toBe('DELETE_FAILED');
  });
});
