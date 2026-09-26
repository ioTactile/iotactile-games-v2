import { Result } from "typescript-result";
import type { DiceBroadcasterPort } from "@/application/command/ports/dice-broadcaster.port.ts";
import type {
	DiceSessionPlayerRepository,
	DiceSessionRepository,
	DiceSessionStateRepository,
} from "@/domain/dice/dice.repository.ts";
import {
	type DicePlayerScores,
	DiceSessionStatus,
	MAX_TRIES,
	NUM_DICES,
} from "@/domain/dice/dice.type.ts";
import {
	computeBonusAndTotal,
	computeScoreFor,
	SCORE_KEYS,
	type ScoreKey,
} from "@/domain/dice/diceInputs.ts";

export interface ChooseScoreInput {
	sessionId: string;
	userId: string | null;
	guestId: string | null;
	scoreKey: ScoreKey;
}

export class ChooseScoreUsecase {
	private readonly sessionRepo: DiceSessionRepository;
	private readonly playerRepo: DiceSessionPlayerRepository;
	private readonly stateRepo: DiceSessionStateRepository;
	private readonly broadcaster: DiceBroadcasterPort;

	constructor(
		sessionRepo: DiceSessionRepository,
		playerRepo: DiceSessionPlayerRepository,
		stateRepo: DiceSessionStateRepository,
		broadcaster: DiceBroadcasterPort,
	) {
		this.sessionRepo = sessionRepo;
		this.playerRepo = playerRepo;
		this.stateRepo = stateRepo;
		this.broadcaster = broadcaster;
	}

	async execute(input: ChooseScoreInput): Promise<Result<void, Error>> {
		if (!input.userId && !input.guestId) {
			return Result.error(new Error("USER_OR_GUEST_REQUIRED"));
		}
		if (!SCORE_KEYS.includes(input.scoreKey)) {
			return Result.error(new Error("INVALID_SCORE_KEY"));
		}

		const sessionResult = await this.sessionRepo.findById(input.sessionId);
		if (!sessionResult.ok) return sessionResult;
		const session = sessionResult.value;
		if (session?.status !== DiceSessionStatus.PLAYING) {
			return Result.error(new Error("SESSION_NOT_PLAYING"));
		}

		const playerResult = await this.playerRepo.findBySessionAndUserOrGuest(
			input.sessionId,
			input.userId,
			input.guestId,
		);
		if (!playerResult.ok) return playerResult;
		const player = playerResult.value;
		if (!player) return Result.error(new Error("NOT_IN_SESSION"));

		const stateResult = await this.stateRepo.findBySession(input.sessionId);
		if (!stateResult.ok) return stateResult;
		const state = stateResult.value;
		if (!state) return Result.error(new Error("NO_GAME_STATE"));

		if (state.currentPlayerSlot !== player.slot) {
			return Result.error(new Error("NOT_YOUR_TURN"));
		}

		const currentScores = state.scores[player.slot];
		if (!currentScores) return Result.error(new Error("NO_SCORES_FOR_PLAYER"));
		if (
			currentScores[input.scoreKey] !== null &&
			currentScores[input.scoreKey] !== undefined
		) {
			return Result.error(new Error("SCORE_ALREADY_SET"));
		}

		const value = computeScoreFor(input.scoreKey, state.dices);
		const newPlayerScores: DicePlayerScores = {
			...currentScores,
			[input.scoreKey]: value,
		};
		const { bonus, total } = computeBonusAndTotal(newPlayerScores);
		newPlayerScores.bonus = bonus;
		newPlayerScores.total = total;

		const newScores = { ...state.scores, [player.slot]: newPlayerScores };

		const playersResult = await this.playerRepo.findBySession(input.sessionId);
		if (!playersResult.ok) return playersResult;
		const players = playersResult.value;
		const sorted = [...players].sort((a, b) => a.orderIndex - b.orderIndex);
		const currentIndex = sorted.findIndex(
			(p) => p.slot === state.currentPlayerSlot,
		);
		const nextIndex = (currentIndex + 1) % sorted.length;
		const nextPlayer = sorted[nextIndex];
		const isNewRound = nextIndex === 0;
		let newRemainingTurns = state.remainingTurns;
		if (isNewRound) {
			newRemainingTurns = state.remainingTurns - 1;
		}

		const updates: Parameters<DiceSessionStateRepository["updateState"]>[1] = {
			scores: newScores,
			currentPlayerSlot: nextPlayer.slot,
			remainingTurns: newRemainingTurns,
			dices: Array.from({ length: NUM_DICES }, () => ({
				face: 1,
				locked: false,
			})),
			triesLeft: MAX_TRIES,
		};

		const updateResult = await this.stateRepo.updateState(
			input.sessionId,
			updates,
		);
		if (!updateResult.ok) return updateResult;

		if (newRemainingTurns <= 0) {
			await this.sessionRepo.updateStatus(
				input.sessionId,
				DiceSessionStatus.FINISHED,
			);
		}

		const viewResult = await this.getSessionView(input.sessionId);
		if (viewResult.ok && viewResult.value) {
			this.broadcaster.broadcast(input.sessionId, {
				type: "STATE",
				payload: viewResult.value,
			});
			if (newRemainingTurns <= 0) {
				this.broadcaster.broadcast(input.sessionId, {
					type: "GAME_OVER",
					payload: viewResult.value,
				});
			}
		}

		return Result.ok(undefined);
	}

	private async getSessionView(sessionId: string) {
		const [session, players, state] = await Promise.all([
			this.sessionRepo.findById(sessionId),
			this.playerRepo.findBySession(sessionId),
			this.stateRepo.findBySession(sessionId),
		]);
		if (!session.ok || !session.value)
			return Result.error(new Error("NOT_FOUND"));
		if (!players.ok) return players;
		if (!state.ok) return state;
		return Result.ok({
			session: session.value,
			players: players.value,
			state: state.value,
		});
	}
}
