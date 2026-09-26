import { Result } from "typescript-result";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { JoinDiceSessionByCodeUsecase } from "@/application/command/usecases/dice/join-dice-session-by-code.usecase.ts";
import type {
	DiceSessionPlayerRepository,
	DiceSessionRepository,
} from "@/domain/dice/dice.repository.ts";
import type {
	DiceSessionPlayerType,
	DiceSessionType,
} from "@/domain/dice/dice.type.ts";

function createSession(
	overrides: Partial<DiceSessionType> = {},
): DiceSessionType {
	return {
		id: "session-1",
		name: "Ma partie",
		joinCode: "ABC123",
		isPublic: false,
		status: "WAITING",
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	};
}

function createPlayer(
	overrides: Partial<DiceSessionPlayerType> = {},
): DiceSessionPlayerType {
	return {
		id: "player-1",
		sessionId: "session-1",
		slot: 1,
		userId: "user-1",
		guestId: null,
		displayName: "Alice",
		orderIndex: 0,
		createdAt: new Date(),
		...overrides,
	};
}

describe("JoinDiceSessionByCodeUsecase", () => {
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

	it("retourne JOIN_CODE_REQUIRED si le code est vide", async () => {
		const usecase = new JoinDiceSessionByCodeUsecase(sessionRepo, playerRepo);
		const result = await usecase.execute({
			joinCode: "   ",
			userId: "user-2",
			guestId: null,
			displayName: "Bob",
		});
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.error.message).toBe("JOIN_CODE_REQUIRED");
		expect(sessionRepo.findByJoinCode).not.toHaveBeenCalled();
	});

	it("retourne SESSION_NOT_FOUND si le code est inconnu", async () => {
		vi.mocked(sessionRepo.findByJoinCode).mockResolvedValue(Result.ok(null));
		const usecase = new JoinDiceSessionByCodeUsecase(sessionRepo, playerRepo);
		const result = await usecase.execute({
			joinCode: "ZZZZZZ",
			userId: "user-2",
			guestId: null,
			displayName: "Bob",
		});
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.error.message).toBe("SESSION_NOT_FOUND");
		expect(sessionRepo.findByJoinCode).toHaveBeenCalledWith("ZZZZZZ");
	});

	it("normalise le code en majuscules et joint la session", async () => {
		const session = createSession();
		vi.mocked(sessionRepo.findByJoinCode).mockResolvedValue(Result.ok(session));
		vi.mocked(sessionRepo.findById).mockResolvedValue(Result.ok(session));
		vi.mocked(playerRepo.findBySession).mockResolvedValue(
			Result.ok([createPlayer()]),
		);
		vi.mocked(playerRepo.findBySessionAndUserOrGuest).mockResolvedValue(
			Result.ok(null),
		);
		vi.mocked(playerRepo.addPlayer).mockResolvedValue(
			Result.ok(createPlayer({ id: "player-2", slot: 2, userId: "user-2" })),
		);

		const usecase = new JoinDiceSessionByCodeUsecase(sessionRepo, playerRepo);
		const result = await usecase.execute({
			joinCode: "abc123",
			userId: "user-2",
			guestId: null,
			displayName: "Bob",
		});

		expect(sessionRepo.findByJoinCode).toHaveBeenCalledWith("ABC123");
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value.session.id).toBe("session-1");
			expect(result.value.slot).toBe(2);
		}
	});
});
