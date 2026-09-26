import { Result } from "typescript-result";
import type { DiceBroadcasterPort } from "@/application/command/ports/dice-broadcaster.port.ts";
import type {
	DiceSessionPlayerRepository,
	DiceSessionRepository,
	DiceSessionStateRepository,
} from "@/domain/dice/dice.repository.ts";
import { DiceSessionStatus, NUM_DICES } from "@/domain/dice/dice.type.ts";

export interface LockDiceInput {
	sessionId: string;
	userId: string | null;
	guestId: string | null;
	diceIndex: number; // 0-4
}

export class LockDiceUsecase {
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

	async execute(input: LockDiceInput): Promise<Result<void, Error>> {
		if (!input.userId && !input.guestId) {
			return Result.error(new Error("USER_OR_GUEST_REQUIRED"));
		}
		if (input.diceIndex < 0 || input.diceIndex >= NUM_DICES) {
			return Result.error(new Error("INVALID_DICE_INDEX"));
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

		const newDices = state.dices.map((d, i) =>
			i === input.diceIndex ? { ...d, locked: !d.locked } : d,
		);

		const updateResult = await this.stateRepo.updateState(input.sessionId, {
			dices: newDices,
		});
		if (!updateResult.ok) return updateResult;

		const viewResult = await this.getSessionView(input.sessionId);
		if (viewResult.ok && viewResult.value) {
			this.broadcaster.broadcast(input.sessionId, {
				type: "STATE",
				payload: viewResult.value,
			});
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
