import { Result } from "typescript-result";
import {
	type JoinDiceSessionResult,
	JoinDiceSessionUsecase,
} from "@/application/command/usecases/dice/join-dice-session.usecase.ts";
import type {
	DiceSessionPlayerRepository,
	DiceSessionRepository,
} from "@/domain/dice/dice.repository.ts";
import type { DiceSessionType } from "@/domain/dice/dice.type.ts";

export interface JoinDiceSessionByCodeInput {
	joinCode: string;
	userId: string | null;
	guestId: string | null;
	displayName: string;
}

/**
 * Résout une session par code de rejoindre puis délègue au join classique.
 */
export class JoinDiceSessionByCodeUsecase {
	private readonly sessionRepo: DiceSessionRepository;
	private readonly joinUsecase: JoinDiceSessionUsecase;

	constructor(
		sessionRepo: DiceSessionRepository,
		playerRepo: DiceSessionPlayerRepository,
	) {
		this.sessionRepo = sessionRepo;
		this.joinUsecase = new JoinDiceSessionUsecase(sessionRepo, playerRepo);
	}

	async execute(
		input: JoinDiceSessionByCodeInput,
	): Promise<Result<JoinDiceSessionResult, Error>> {
		const code = input.joinCode.trim().toUpperCase();
		if (!code) {
			return Result.error(new Error("JOIN_CODE_REQUIRED"));
		}

		const sessionByCodeResult = await this.sessionRepo.findByJoinCode(code);
		if (!sessionByCodeResult.ok) return sessionByCodeResult;

		const session: DiceSessionType | null = sessionByCodeResult.value;
		if (!session) {
			return Result.error(new Error("SESSION_NOT_FOUND"));
		}

		return this.joinUsecase.execute({
			sessionId: session.id,
			userId: input.userId,
			guestId: input.guestId,
			displayName: input.displayName,
		});
	}
}
