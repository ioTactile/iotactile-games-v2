import { Result } from 'typescript-result';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JoinDiceSessionUsecase } from '@/application/command/usecases/dice/join-dice-session.usecase.ts';
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

describe('JoinDiceSessionUsecase', () => {
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

  it('retourne DISPLAY_NAME_REQUIRED si displayName vide', async () => {
    const usecase = new JoinDiceSessionUsecase(sessionRepo, playerRepo);
    const result = await usecase.execute({
      sessionId: 'session-1',
      userId: 'user-1',
      guestId: null,
      displayName: '',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toBe('DISPLAY_NAME_REQUIRED');
    expect(sessionRepo.findById).not.toHaveBeenCalled();
  });

  it('retourne USER_OR_GUEST_REQUIRED si ni userId ni guestId', async () => {
    const usecase = new JoinDiceSessionUsecase(sessionRepo, playerRepo);
    const result = await usecase.execute({
      sessionId: 'session-1',
      userId: null,
      guestId: null,
      displayName: 'Alice',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toBe('USER_OR_GUEST_REQUIRED');
    expect(sessionRepo.findById).not.toHaveBeenCalled();
  });

  it("retourne SESSION_NOT_FOUND si la session n'existe pas", async () => {
    vi.mocked(sessionRepo.findById).mockResolvedValue(Result.ok(null));
    const usecase = new JoinDiceSessionUsecase(sessionRepo, playerRepo);
    const result = await usecase.execute({
      sessionId: 'session-1',
      userId: 'user-1',
      guestId: null,
      displayName: 'Alice',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toBe('SESSION_NOT_FOUND');
  });

  it('retourne SESSION_ALREADY_STARTED_OR_FINISHED si status !== WAITING', async () => {
    vi.mocked(sessionRepo.findById).mockResolvedValue(
      Result.ok(createSession({ status: 'PLAYING' })),
    );
    const usecase = new JoinDiceSessionUsecase(sessionRepo, playerRepo);
    const result = await usecase.execute({
      sessionId: 'session-1',
      userId: 'user-1',
      guestId: null,
      displayName: 'Alice',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toBe('SESSION_ALREADY_STARTED_OR_FINISHED');
    expect(playerRepo.addPlayer).not.toHaveBeenCalled();
  });

  it('retourne SESSION_FULL si 4 joueurs déjà présents', async () => {
    vi.mocked(sessionRepo.findById).mockResolvedValue(Result.ok(createSession()));
    vi.mocked(playerRepo.findBySession).mockResolvedValue(
      Result.ok([
        createPlayer({ slot: 1 }),
        createPlayer({ slot: 2 }),
        createPlayer({ slot: 3 }),
        createPlayer({ slot: 4 }),
      ]),
    );
    const usecase = new JoinDiceSessionUsecase(sessionRepo, playerRepo);
    const result = await usecase.execute({
      sessionId: 'session-1',
      userId: 'user-new',
      guestId: null,
      displayName: 'Bob',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toBe('SESSION_FULL');
    expect(playerRepo.addPlayer).not.toHaveBeenCalled();
  });

  it('retourne ALREADY_IN_SESSION si le joueur est déjà dans la session', async () => {
    vi.mocked(sessionRepo.findById).mockResolvedValue(Result.ok(createSession()));
    vi.mocked(playerRepo.findBySession).mockResolvedValue(Result.ok([createPlayer()]));
    vi.mocked(playerRepo.findBySessionAndUserOrGuest).mockResolvedValue(Result.ok(createPlayer()));
    const usecase = new JoinDiceSessionUsecase(sessionRepo, playerRepo);
    const result = await usecase.execute({
      sessionId: 'session-1',
      userId: 'user-1',
      guestId: null,
      displayName: 'Alice',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toBe('ALREADY_IN_SESSION');
    expect(playerRepo.addPlayer).not.toHaveBeenCalled();
  });

  it('ajoute le joueur au prochain slot et retourne session + slot', async () => {
    const session = createSession();
    vi.mocked(sessionRepo.findById).mockResolvedValue(Result.ok(session));
    vi.mocked(playerRepo.findBySession).mockResolvedValue(Result.ok([createPlayer({ slot: 1 })]));
    vi.mocked(playerRepo.findBySessionAndUserOrGuest).mockResolvedValue(Result.ok(null));
    vi.mocked(playerRepo.addPlayer).mockResolvedValue(
      Result.ok(createPlayer({ slot: 2, userId: 'user-2', displayName: 'Bob' })),
    );

    const usecase = new JoinDiceSessionUsecase(sessionRepo, playerRepo);
    const result = await usecase.execute({
      sessionId: 'session-1',
      userId: 'user-2',
      guestId: null,
      displayName: ' Bob ',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.session).toEqual(session);
      expect(result.value.slot).toBe(2);
    }
    expect(playerRepo.addPlayer).toHaveBeenCalledWith({
      sessionId: 'session-1',
      slot: 2,
      userId: 'user-2',
      guestId: null,
      displayName: 'Bob',
      orderIndex: 1,
    });
  });

  it("propage l'erreur si findById échoue", async () => {
    vi.mocked(sessionRepo.findById).mockResolvedValue(Result.error(new Error('DB_ERROR')));
    const usecase = new JoinDiceSessionUsecase(sessionRepo, playerRepo);
    const result = await usecase.execute({
      sessionId: 'session-1',
      userId: 'user-1',
      guestId: null,
      displayName: 'Alice',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toBe('DB_ERROR');
  });
});
