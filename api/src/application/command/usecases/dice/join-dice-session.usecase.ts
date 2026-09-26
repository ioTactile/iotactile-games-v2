import { Result } from "typescript-result";
import type {
	DiceSessionPlayerRepository,
	DiceSessionRepository,
} from "@/domain/dice/dice.repository.ts";
import {
	DiceSessionStatus,
	type DiceSessionType,
	SLOT_ORDER,
} from "@/domain/dice/dice.type.ts";

export interface JoinDiceSessionInput {
	sessionId: string;
	userId: string | null;
	guestId: string | null;
	displayName: string;
}

export interface JoinDiceSessionResult {
	session: DiceSessionType;
	slot: number;
}

export class JoinDiceSessionUsecase {
	private readonly sessionRepo: DiceSessionRepository;
	private readonly playerRepo: DiceSessionPlayerRepository;

	constructor(
		sessionRepo: DiceSessionRepository,
		playerRepo: DiceSessionPlayerRepository,
	) {
		this.sessionRepo = sessionRepo;
		this.playerRepo = playerRepo;
	}

	async execute(
		input: JoinDiceSessionInput,
	): Promise<Result<JoinDiceSessionResult, Error>> {
		if (!input.displayName?.trim()) {
			return Result.error(new Error("DISPLAY_NAME_REQUIRED"));
		}
		if (!input.userId && !input.guestId) {
			return Result.error(new Error("USER_OR_GUEST_REQUIRED"));
		}

		const sessionResult = await this.sessionRepo.findById(input.sessionId);
		if (!sessionResult.ok) return sessionResult;
		const session = sessionResult.value;
		if (!session) {
			return Result.error(new Error("SESSION_NOT_FOUND"));
		}
		if (session.status !== DiceSessionStatus.WAITING) {
			return Result.error(new Error("SESSION_ALREADY_STARTED_OR_FINISHED"));
		}

		const playersResult = await this.playerRepo.findBySession(input.sessionId);
		if (!playersResult.ok) return playersResult;
		const players = playersResult.value;
		if (players.length >= SLOT_ORDER.length) {
			return Result.error(new Error("SESSION_FULL"));
		}

		const alreadyIn = await this.playerRepo.findBySessionAndUserOrGuest(
			input.sessionId,
			input.userId,
			input.guestId,
		);
		if (!alreadyIn.ok) return alreadyIn;
		if (alreadyIn.value) {
			return Result.error(new Error("ALREADY_IN_SESSION"));
		}

		const usedSlots = new Set(players.map((p) => p.slot));
		const nextSlot = SLOT_ORDER.find((s) => !usedSlots.has(s));
		if (nextSlot === undefined) {
			return Result.error(new Error("NO_SLOT_AVAILABLE"));
		}

		const addResult = await this.playerRepo.addPlayer({
			sessionId: input.sessionId,
			slot: nextSlot,
			userId: input.userId ?? null,
			guestId: input.guestId ?? null,
			displayName: input.displayName.trim(),
			orderIndex: players.length,
		});
		if (!addResult.ok) return addResult;

		return Result.ok({ session, slot: nextSlot });
	}
}
