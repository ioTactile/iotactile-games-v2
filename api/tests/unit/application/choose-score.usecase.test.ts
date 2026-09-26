import { Result } from 'typescript-result';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DiceBroadcasterPort } from '@/application/command/ports/dice-broadcaster.port.ts';
import { ChooseScoreUsecase } from '@/application/command/usecases/dice/choose-score.usecase.ts';
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
import { EMPTY_DICE_SCORES } from '@/domain/dice/dice.type.ts';

function createSession(overrides: Partial<DiceSessionType> = {}): DiceSessionType {
  return {
    id: 'session-1',
    name: 'Ma partie',
    joinCode: 'ABC123',
    isPublic: true,
    status: 'PLAYING',
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
    triesLeft: 0,
    scores: { 1: { ...EMPTY_DICE_SCORES }, 2: { ...EMPTY_DICE_SCORES } },
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('ChooseScoreUsecase', () => {
  let sessionRepo: DiceSessionRepository;
  let playerRepo: DiceSessionPlayerRepository;
  let stateRepo: DiceSessionStateRepository;
  let broadcaster: DiceBroadcasterPort;

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
    broadcaster = { register: vi.fn(() => () => {}), broadcast: vi.fn() };
  });

  it('retourne USER_OR_GUEST_REQUIRED si ni userId ni guestId', async () => {
    const usecase = new ChooseScoreUsecase(sessionRepo, playerRepo, stateRepo, broadcaster);
    const result = await usecase.execute({
      sessionId: 'session-1',
      userId: null,
      guestId: null,
      scoreKey: 'one',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toBe('USER_OR_GUEST_REQUIRED');
    expect(sessionRepo.findById).not.toHaveBeenCalled();
  });

  it('retourne INVALID_SCORE_KEY si scoreKey invalide', async () => {
    const usecase = new ChooseScoreUsecase(sessionRepo, playerRepo, stateRepo, broadcaster);
    const result = await usecase.execute({
      sessionId: 'session-1',
      userId: 'user-1',
      guestId: null,
      scoreKey: 'invalid' as 'one',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toBe('INVALID_SCORE_KEY');
    expect(sessionRepo.findById).not.toHaveBeenCalled();
  });

  it('retourne SESSION_NOT_PLAYING si session absente ou status !== PLAYING', async () => {
    vi.mocked(sessionRepo.findById).mockResolvedValue(Result.ok(null));
    const usecase = new ChooseScoreUsecase(sessionRepo, playerRepo, stateRepo, broadcaster);
    const result = await usecase.execute({
      sessionId: 'session-1',
      userId: 'user-1',
      guestId: null,
      scoreKey: 'one',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toBe('SESSION_NOT_PLAYING');
  });

  it("retourne NOT_IN_SESSION si le joueur n'est pas dans la session", async () => {
    vi.mocked(sessionRepo.findById).mockResolvedValue(Result.ok(createSession()));
    vi.mocked(playerRepo.findBySessionAndUserOrGuest).mockResolvedValue(Result.ok(null));
    const usecase = new ChooseScoreUsecase(sessionRepo, playerRepo, stateRepo, broadcaster);
    const result = await usecase.execute({
      sessionId: 'session-1',
      userId: 'user-1',
      guestId: null,
      scoreKey: 'one',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toBe('NOT_IN_SESSION');
    expect(stateRepo.updateState).not.toHaveBeenCalled();
  });

  it('retourne NO_SCORES_FOR_PLAYER si pas de scores pour le slot', async () => {
    vi.mocked(sessionRepo.findById).mockResolvedValue(Result.ok(createSession()));
    vi.mocked(playerRepo.findBySessionAndUserOrGuest).mockResolvedValue(
      Result.ok(createPlayer({ slot: 1 })),
    );
    vi.mocked(stateRepo.findBySession).mockResolvedValue(Result.ok(createState({ scores: {} })));
    const usecase = new ChooseScoreUsecase(sessionRepo, playerRepo, stateRepo, broadcaster);
    const result = await usecase.execute({
      sessionId: 'session-1',
      userId: 'user-1',
      guestId: null,
      scoreKey: 'one',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toBe('NO_SCORES_FOR_PLAYER');
    expect(stateRepo.updateState).not.toHaveBeenCalled();
  });

  it('retourne SCORE_ALREADY_SET si la ligne est déjà remplie', async () => {
    const scoresWithOne = {
      1: { ...EMPTY_DICE_SCORES, one: 3 },
      2: { ...EMPTY_DICE_SCORES },
    };
    vi.mocked(sessionRepo.findById).mockResolvedValue(Result.ok(createSession()));
    vi.mocked(playerRepo.findBySessionAndUserOrGuest).mockResolvedValue(Result.ok(createPlayer()));
    vi.mocked(stateRepo.findBySession).mockResolvedValue(
      Result.ok(createState({ scores: scoresWithOne })),
    );
    const usecase = new ChooseScoreUsecase(sessionRepo, playerRepo, stateRepo, broadcaster);
    const result = await usecase.execute({
      sessionId: 'session-1',
      userId: 'user-1',
      guestId: null,
      scoreKey: 'one',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toBe('SCORE_ALREADY_SET');
    expect(stateRepo.updateState).not.toHaveBeenCalled();
  });

  it("retourne NOT_YOUR_TURN si ce n'est pas le tour du joueur", async () => {
    vi.mocked(sessionRepo.findById).mockResolvedValue(Result.ok(createSession()));
    vi.mocked(playerRepo.findBySessionAndUserOrGuest).mockResolvedValue(
      Result.ok(createPlayer({ slot: 2 })),
    );
    vi.mocked(stateRepo.findBySession).mockResolvedValue(
      Result.ok(createState({ currentPlayerSlot: 1 })),
    );
    const usecase = new ChooseScoreUsecase(sessionRepo, playerRepo, stateRepo, broadcaster);
    const result = await usecase.execute({
      sessionId: 'session-1',
      userId: 'user-1',
      guestId: null,
      scoreKey: 'one',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toBe('NOT_YOUR_TURN');
    expect(stateRepo.updateState).not.toHaveBeenCalled();
  });

  it('met à jour le score, passe au joueur suivant et broadcast', async () => {
    const session = createSession();
    const state = createState();
    const players = [
      createPlayer({ slot: 1, orderIndex: 0 }),
      createPlayer({ slot: 2, orderIndex: 1 }),
    ];
    vi.mocked(sessionRepo.findById).mockResolvedValue(Result.ok(session));
    vi.mocked(playerRepo.findBySessionAndUserOrGuest).mockResolvedValue(Result.ok(players[0]));
    vi.mocked(playerRepo.findBySession).mockResolvedValue(Result.ok(players));
    vi.mocked(stateRepo.findBySession).mockResolvedValue(Result.ok(state));
    vi.mocked(stateRepo.updateState).mockResolvedValue(
      Result.ok({
        ...state,
        currentPlayerSlot: 2,
        remainingTurns: 13,
        scores: {
          ...state.scores,
          1: { ...state.scores[1], one: 5, total: 5 },
        },
      }),
    );

    const usecase = new ChooseScoreUsecase(sessionRepo, playerRepo, stateRepo, broadcaster);
    const result = await usecase.execute({
      sessionId: 'session-1',
      userId: 'user-1',
      guestId: null,
      scoreKey: 'one',
    });

    expect(result.ok).toBe(true);
    expect(stateRepo.updateState).toHaveBeenCalledWith(
      'session-1',
      expect.objectContaining({
        currentPlayerSlot: 2,
        remainingTurns: 13,
        scores: expect.objectContaining({
          1: expect.objectContaining({ one: 5 }),
        }),
      }),
    );
    expect(broadcaster.broadcast).toHaveBeenCalledWith('session-1', {
      type: 'STATE',
      payload: expect.any(Object),
    });
    expect(sessionRepo.updateStatus).not.toHaveBeenCalled();
  });

  it('passe le statut en FINISHED et broadcast GAME_OVER quand remainingTurns atteint 0', async () => {
    const session = createSession();
    const state = createState({ remainingTurns: 1 });
    const players = [createPlayer({ slot: 1, orderIndex: 0 })];
    vi.mocked(sessionRepo.findById).mockResolvedValue(Result.ok(session));
    vi.mocked(playerRepo.findBySessionAndUserOrGuest).mockResolvedValue(Result.ok(players[0]));
    vi.mocked(playerRepo.findBySession).mockResolvedValue(Result.ok(players));
    vi.mocked(stateRepo.findBySession).mockResolvedValue(Result.ok(state));
    vi.mocked(stateRepo.updateState).mockResolvedValue(
      Result.ok({
        ...state,
        currentPlayerSlot: 1,
        remainingTurns: 0,
        scores: state.scores,
      }),
    );
    vi.mocked(sessionRepo.updateStatus).mockResolvedValue(Result.ok(undefined));

    const usecase = new ChooseScoreUsecase(sessionRepo, playerRepo, stateRepo, broadcaster);
    const result = await usecase.execute({
      sessionId: 'session-1',
      userId: 'user-1',
      guestId: null,
      scoreKey: 'one',
    });

    expect(result.ok).toBe(true);
    expect(sessionRepo.updateStatus).toHaveBeenCalledWith('session-1', 'FINISHED');
    expect(broadcaster.broadcast).toHaveBeenCalledWith('session-1', {
      type: 'GAME_OVER',
      payload: expect.any(Object),
    });
  });

  it("propage l'erreur si updateState échoue", async () => {
    vi.mocked(sessionRepo.findById).mockResolvedValue(Result.ok(createSession()));
    vi.mocked(playerRepo.findBySessionAndUserOrGuest).mockResolvedValue(Result.ok(createPlayer()));
    vi.mocked(playerRepo.findBySession).mockResolvedValue(Result.ok([createPlayer()]));
    vi.mocked(stateRepo.findBySession).mockResolvedValue(Result.ok(createState()));
    vi.mocked(stateRepo.updateState).mockResolvedValue(Result.error(new Error('UPDATE_FAILED')));

    const usecase = new ChooseScoreUsecase(sessionRepo, playerRepo, stateRepo, broadcaster);
    const result = await usecase.execute({
      sessionId: 'session-1',
      userId: 'user-1',
      guestId: null,
      scoreKey: 'one',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toBe('UPDATE_FAILED');
  });

  it('calcule le bonus et décrémente remainingTurns en fin de round', async () => {
    const session = createSession();
    const highScores = {
      ...createState().scores[1],
      one: 5,
      two: 10,
      three: 15,
      four: 16,
      five: 20,
      six: 0,
    };
    const state = createState({
      remainingTurns: 5,
      currentPlayerSlot: 2,
      scores: {
        1: highScores,
        2: { ...createState().scores[1] },
      },
      dices: [
        { face: 6, locked: false },
        { face: 6, locked: false },
        { face: 6, locked: false },
        { face: 1, locked: false },
        { face: 1, locked: false },
      ],
    });
    const players = [
      createPlayer({ slot: 1, orderIndex: 0, userId: 'user-1' }),
      createPlayer({
        id: 'p2',
        slot: 2,
        orderIndex: 1,
        userId: 'user-2',
      }),
    ];
    vi.mocked(sessionRepo.findById).mockResolvedValue(Result.ok(session));
    vi.mocked(playerRepo.findBySessionAndUserOrGuest).mockResolvedValue(Result.ok(players[1]));
    vi.mocked(playerRepo.findBySession).mockResolvedValue(Result.ok(players));
    vi.mocked(stateRepo.findBySession).mockResolvedValue(Result.ok(state));
    vi.mocked(stateRepo.updateState).mockResolvedValue(Result.ok(state));

    const usecase = new ChooseScoreUsecase(sessionRepo, playerRepo, stateRepo, broadcaster);
    const result = await usecase.execute({
      sessionId: 'session-1',
      userId: 'user-2',
      guestId: null,
      scoreKey: 'six',
    });

    expect(result.ok).toBe(true);
    expect(stateRepo.updateState).toHaveBeenCalledWith(
      'session-1',
      expect.objectContaining({
        currentPlayerSlot: 1,
        remainingTurns: 4,
        triesLeft: 3,
        scores: expect.objectContaining({
          2: expect.objectContaining({ six: 18 }),
        }),
      }),
    );
  });
});
