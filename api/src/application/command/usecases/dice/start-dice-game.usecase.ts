import { Result } from 'typescript-result';
import type { DiceBroadcasterPort } from '@/application/command/ports/dice-broadcaster.port.ts';
import type { GetDiceSessionUsecase } from '@/application/query/usecases/dice/get-dice-session.usecase.ts';
import type {
  DiceSessionPlayerRepository,
  DiceSessionRepository,
  DiceSessionStateRepository,
} from '@/domain/dice/dice.repository.ts';
import {
  DiceSessionStatus,
  EMPTY_DICE_SCORES,
  MAX_TRIES,
  NUM_DICES,
  TOTAL_TURNS,
} from '@/domain/dice/dice.type.ts';

export interface StartDiceGameInput {
  sessionId: string;
  userId: string | null;
  guestId: string | null;
}

export class StartDiceGameUsecase {
  private readonly sessionRepo: DiceSessionRepository;
  private readonly playerRepo: DiceSessionPlayerRepository;
  private readonly stateRepo: DiceSessionStateRepository;
  private readonly broadcaster: DiceBroadcasterPort;
  private readonly getSession: GetDiceSessionUsecase;

  constructor(
    sessionRepo: DiceSessionRepository,
    playerRepo: DiceSessionPlayerRepository,
    stateRepo: DiceSessionStateRepository,
    broadcaster: DiceBroadcasterPort,
    getSession: GetDiceSessionUsecase,
  ) {
    this.sessionRepo = sessionRepo;
    this.playerRepo = playerRepo;
    this.stateRepo = stateRepo;
    this.broadcaster = broadcaster;
    this.getSession = getSession;
  }

  async execute(input: StartDiceGameInput): Promise<Result<void, Error>> {
    if (!input.userId && !input.guestId) {
      return Result.error(new Error('USER_OR_GUEST_REQUIRED'));
    }

    const sessionResult = await this.sessionRepo.findById(input.sessionId);
    if (!sessionResult.ok) return sessionResult;
    const session = sessionResult.value;
    if (!session) {
      return Result.error(new Error('SESSION_NOT_FOUND'));
    }
    if (session.status !== DiceSessionStatus.WAITING) {
      return Result.error(new Error('SESSION_ALREADY_STARTED_OR_FINISHED'));
    }

    const playersResult = await this.playerRepo.findBySession(input.sessionId);
    if (!playersResult.ok) return playersResult;
    const players = playersResult.value;
    if (players.length < 1) {
      return Result.error(new Error('MIN_ONE_PLAYER_REQUIRED'));
    }

    const isCreator = players[0].userId === input.userId || players[0].guestId === input.guestId;
    if (!isCreator) {
      return Result.error(new Error('ONLY_CREATOR_CAN_START'));
    }

    const scores: Record<number, typeof EMPTY_DICE_SCORES> = {};
    for (const p of players) {
      scores[p.slot] = { ...EMPTY_DICE_SCORES };
    }

    const firstSlot = players[0].slot;
    const createResult = await this.stateRepo.createState({
      sessionId: input.sessionId,
      currentPlayerSlot: firstSlot,
      remainingTurns: TOTAL_TURNS,
      dices: Array.from({ length: NUM_DICES }, () => ({
        face: 1,
        locked: false,
      })),
      triesLeft: MAX_TRIES,
      scores,
    });
    if (!createResult.ok) return createResult;

    const updateResult = await this.sessionRepo.updateStatus(
      input.sessionId,
      DiceSessionStatus.PLAYING,
    );
    if (!updateResult.ok) return updateResult;

    const viewResult = await this.getSession.execute(input.sessionId);
    if (viewResult.ok && viewResult.value) {
      this.broadcaster.broadcast(input.sessionId, {
        type: 'STATE',
        payload: viewResult.value,
      });
    }

    return Result.ok(undefined);
  }
}
