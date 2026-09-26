import { Result } from 'typescript-result';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GetDiceSessionUsecase } from '@/application/query/usecases/dice/get-dice-session.usecase.ts';
import type {
  DiceSessionPlayerRepository,
  DiceSessionRepository,
  DiceSessionStateRepository,
} from '@/domain/dice/dice.repository.ts';
import type {
  DiceSessionPlayerType,
  DiceSessionStateType,
  DiceSessionType,
} from '@/domain/dice/dice.type.ts';

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

function createState(overrides: Partial<DiceSessionStateType> = {}): DiceSessionStateType {
  return {
    id: 'state-1',
    sessionId: 'session-1',
    currentPlayerSlot: 1,
    remainingTurns: 13,
    dices: [],
    triesLeft: 3,
    scores: {},
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('GetDiceSessionUsecase', () => {
  let sessionRepo: DiceSessionRepository;
  let playerRepo: DiceSessionPlayerRepository;
  let stateRepo: DiceSessionStateRepository;

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
    stateRepo = {
      createState: vi.fn(),
      findBySession: vi.fn(),
      updateState: vi.fn(),
    };
  });

  it("retourne null si la session n'existe pas", async () => {
    vi.mocked(sessionRepo.findById).mockResolvedValue(Result.ok(null));

    const usecase = new GetDiceSessionUsecase(sessionRepo, playerRepo, stateRepo);
    const result = await usecase.execute('session-1');

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe(null);
    expect(playerRepo.findBySession).not.toHaveBeenCalled();
    expect(stateRepo.findBySession).not.toHaveBeenCalled();
  });

  it('retourne la vue session + players + state si tout existe', async () => {
    const session = createSession();
    const players = [createPlayer()];
    const state = createState();
    vi.mocked(sessionRepo.findById).mockResolvedValue(Result.ok(session));
    vi.mocked(playerRepo.findBySession).mockResolvedValue(Result.ok(players));
    vi.mocked(stateRepo.findBySession).mockResolvedValue(Result.ok(state));

    const usecase = new GetDiceSessionUsecase(sessionRepo, playerRepo, stateRepo);
    const result = await usecase.execute('session-1');

    expect(result.ok).toBe(true);
    if (result.ok && result.value) {
      expect(result.value.session).toEqual(session);
      expect(result.value.players).toEqual(players);
      expect(result.value.state).toEqual(state);
    }
    expect(sessionRepo.findById).toHaveBeenCalledWith('session-1');
    expect(playerRepo.findBySession).toHaveBeenCalledWith('session-1');
    expect(stateRepo.findBySession).toHaveBeenCalledWith('session-1');
  });

  it("retourne state null si pas d'état (session en attente)", async () => {
    const session = createSession();
    const players = [createPlayer()];
    vi.mocked(sessionRepo.findById).mockResolvedValue(Result.ok(session));
    vi.mocked(playerRepo.findBySession).mockResolvedValue(Result.ok(players));
    vi.mocked(stateRepo.findBySession).mockResolvedValue(Result.ok(null));

    const usecase = new GetDiceSessionUsecase(sessionRepo, playerRepo, stateRepo);
    const result = await usecase.execute('session-1');

    expect(result.ok).toBe(true);
    if (result.ok && result.value) {
      expect(result.value.session).toEqual(session);
      expect(result.value.players).toEqual(players);
      expect(result.value.state).toBe(null);
    }
  });

  it("propage l'erreur si findById échoue", async () => {
    vi.mocked(sessionRepo.findById).mockResolvedValue(Result.error(new Error('DB_ERROR')));

    const usecase = new GetDiceSessionUsecase(sessionRepo, playerRepo, stateRepo);
    const result = await usecase.execute('session-1');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toBe('DB_ERROR');
  });

  it("propage l'erreur si findBySession (players) échoue", async () => {
    vi.mocked(sessionRepo.findById).mockResolvedValue(Result.ok(createSession()));
    vi.mocked(playerRepo.findBySession).mockResolvedValue(Result.error(new Error('PLAYERS_ERROR')));

    const usecase = new GetDiceSessionUsecase(sessionRepo, playerRepo, stateRepo);
    const result = await usecase.execute('session-1');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toBe('PLAYERS_ERROR');
  });
});
