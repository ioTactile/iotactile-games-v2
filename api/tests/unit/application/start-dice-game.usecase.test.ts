import { Result } from 'typescript-result';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DiceBroadcasterPort } from '@/application/command/ports/dice-broadcaster.port.ts';
import { StartDiceGameUsecase } from '@/application/command/usecases/dice/start-dice-game.usecase.ts';
import type { GetDiceSessionUsecase } from '@/application/query/usecases/dice/get-dice-session.usecase.ts';
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
    dices: [
      { face: 1, locked: false },
      { face: 1, locked: false },
      { face: 1, locked: false },
      { face: 1, locked: false },
      { face: 1, locked: false },
    ],
    triesLeft: 3,
    scores: {},
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('StartDiceGameUsecase', () => {
  let sessionRepo: DiceSessionRepository;
  let playerRepo: DiceSessionPlayerRepository;
  let stateRepo: DiceSessionStateRepository;
  let broadcaster: DiceBroadcasterPort;
  let getSession: GetDiceSessionUsecase;

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
    broadcaster = {
      register: vi.fn(() => () => {}),
      broadcast: vi.fn(),
    };
    getSession = {
      execute: vi.fn().mockResolvedValue(Result.ok(null)),
    } as unknown as GetDiceSessionUsecase;
  });

  function makeUsecase() {
    return new StartDiceGameUsecase(sessionRepo, playerRepo, stateRepo, broadcaster, getSession);
  }

  it('retourne USER_OR_GUEST_REQUIRED si ni userId ni guestId', async () => {
    const usecase = makeUsecase();
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
    const usecase = makeUsecase();
    const result = await usecase.execute({
      sessionId: 'session-1',
      userId: 'user-1',
      guestId: null,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toBe('SESSION_NOT_FOUND');
  });

  it('retourne SESSION_ALREADY_STARTED_OR_FINISHED si status !== WAITING', async () => {
    vi.mocked(sessionRepo.findById).mockResolvedValue(
      Result.ok(createSession({ status: 'PLAYING' })),
    );
    const usecase = makeUsecase();
    const result = await usecase.execute({
      sessionId: 'session-1',
      userId: 'user-1',
      guestId: null,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toBe('SESSION_ALREADY_STARTED_OR_FINISHED');
    expect(stateRepo.createState).not.toHaveBeenCalled();
  });

  it('retourne MIN_ONE_PLAYER_REQUIRED si aucun joueur', async () => {
    vi.mocked(sessionRepo.findById).mockResolvedValue(Result.ok(createSession()));
    vi.mocked(playerRepo.findBySession).mockResolvedValue(Result.ok([]));
    const usecase = makeUsecase();
    const result = await usecase.execute({
      sessionId: 'session-1',
      userId: 'user-1',
      guestId: null,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toBe('MIN_ONE_PLAYER_REQUIRED');
    expect(stateRepo.createState).not.toHaveBeenCalled();
  });

  it("retourne ONLY_CREATOR_CAN_START si l'appelant n'est pas le premier joueur", async () => {
    const creatorGuest = [
      createPlayer({
        slot: 1,
        userId: null,
        guestId: 'creator-guest-id',
        orderIndex: 0,
      }),
    ];
    vi.mocked(sessionRepo.findById).mockResolvedValue(Result.ok(createSession()));
    vi.mocked(playerRepo.findBySession).mockResolvedValue(Result.ok(creatorGuest));

    const usecase = makeUsecase();
    const result = await usecase.execute({
      sessionId: 'session-1',
      userId: 'user-1',
      guestId: null,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toBe('ONLY_CREATOR_CAN_START');
    expect(stateRepo.createState).not.toHaveBeenCalled();
  });

  it("crée l'état, met à jour le statut en PLAYING et retourne succès", async () => {
    const session = createSession();
    const players = [
      createPlayer({ slot: 1, userId: 'user-1' }),
      createPlayer({ slot: 2, userId: 'user-2' }),
    ];
    vi.mocked(sessionRepo.findById).mockResolvedValue(Result.ok(session));
    vi.mocked(playerRepo.findBySession).mockResolvedValue(Result.ok(players));
    vi.mocked(stateRepo.createState).mockResolvedValue(Result.ok(createState()));
    vi.mocked(sessionRepo.updateStatus).mockResolvedValue(Result.ok(undefined));
    vi.mocked(getSession.execute).mockResolvedValue(
      Result.ok({
        session: createSession({ status: 'PLAYING' }),
        players,
        state: createState(),
      }),
    );

    const usecase = makeUsecase();
    const result = await usecase.execute({
      sessionId: 'session-1',
      userId: 'user-1',
      guestId: null,
    });

    expect(result.ok).toBe(true);
    expect(stateRepo.createState).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: 'session-1',
        currentPlayerSlot: 1,
        remainingTurns: 13,
        triesLeft: 3,
        scores: expect.objectContaining({
          1: expect.any(Object),
          2: expect.any(Object),
        }),
      }),
    );
    expect(sessionRepo.updateStatus).toHaveBeenCalledWith('session-1', 'PLAYING');
    expect(getSession.execute).toHaveBeenCalledWith('session-1');
    expect(broadcaster.broadcast).toHaveBeenCalledWith(
      'session-1',
      expect.objectContaining({ type: 'STATE' }),
    );
  });

  it('accepte le créateur par guestId', async () => {
    vi.mocked(sessionRepo.findById).mockResolvedValue(Result.ok(createSession()));
    vi.mocked(playerRepo.findBySession).mockResolvedValue(
      Result.ok([createPlayer({ slot: 1, userId: null, guestId: 'guest-1' })]),
    );
    vi.mocked(stateRepo.createState).mockResolvedValue(Result.ok(createState()));
    vi.mocked(sessionRepo.updateStatus).mockResolvedValue(Result.ok(undefined));

    const usecase = makeUsecase();
    const result = await usecase.execute({
      sessionId: 'session-1',
      userId: null,
      guestId: 'guest-1',
    });

    expect(result.ok).toBe(true);
    expect(stateRepo.createState).toHaveBeenCalled();
    expect(sessionRepo.updateStatus).toHaveBeenCalledWith('session-1', 'PLAYING');
  });

  it("propage l'erreur si createState échoue", async () => {
    vi.mocked(sessionRepo.findById).mockResolvedValue(Result.ok(createSession()));
    vi.mocked(playerRepo.findBySession).mockResolvedValue(Result.ok([createPlayer()]));
    vi.mocked(stateRepo.createState).mockResolvedValue(
      Result.error(new Error('CREATE_STATE_FAILED')),
    );

    const usecase = makeUsecase();
    const result = await usecase.execute({
      sessionId: 'session-1',
      userId: 'user-1',
      guestId: null,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toBe('CREATE_STATE_FAILED');
    expect(sessionRepo.updateStatus).not.toHaveBeenCalled();
  });
});
