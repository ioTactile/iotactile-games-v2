import { Result } from "typescript-result";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DiceBroadcasterPort } from "@/application/command/ports/dice-broadcaster.port.ts";
import { RollDiceUsecase } from "@/application/command/usecases/dice/roll-dice.usecase.ts";
import type {
	DiceSessionPlayerRepository,
	DiceSessionRepository,
	DiceSessionStateRepository,
} from "@/domain/dice/dice.repository.ts";
import type {
	DiceSessionPlayerType,
	DiceSessionStateType,
	DiceSessionType,
} from "@/domain/dice/dice.type.ts";

function createSession(
	overrides: Partial<DiceSessionType> = {},
): DiceSessionType {
	return {
		id: "session-1",
		name: "Ma partie",
		joinCode: "ABC123",
		isPublic: true,
		status: "PLAYING",
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

function createState(
	overrides: Partial<DiceSessionStateType> = {},
): DiceSessionStateType {
	return {
		id: "state-1",
		sessionId: "session-1",
		currentPlayerSlot: 1,
		remainingTurns: 13,
		dices: [
			{ face: 1, locked: false },
			{ face: 2, locked: false },
			{ face: 3, locked: false },
			{ face: 4, locked: false },
			{ face: 5, locked: false },
		],
		triesLeft: 3,
		scores: {},
		updatedAt: new Date(),
		...overrides,
	};
}

describe("RollDiceUsecase", () => {
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

	it("retourne USER_OR_GUEST_REQUIRED si ni userId ni guestId", async () => {
		const usecase = new RollDiceUsecase(
			sessionRepo,
			playerRepo,
			stateRepo,
			broadcaster,
		);
		const result = await usecase.execute({
			sessionId: "session-1",
			userId: null,
			guestId: null,
		});
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.error.message).toBe("USER_OR_GUEST_REQUIRED");
		expect(sessionRepo.findById).not.toHaveBeenCalled();
	});

	it("retourne SESSION_NOT_PLAYING si session n'existe pas ou status !== PLAYING", async () => {
		vi.mocked(sessionRepo.findById).mockResolvedValue(Result.ok(null));
		const usecase = new RollDiceUsecase(
			sessionRepo,
			playerRepo,
			stateRepo,
			broadcaster,
		);
		const result = await usecase.execute({
			sessionId: "session-1",
			userId: "user-1",
			guestId: null,
		});
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.error.message).toBe("SESSION_NOT_PLAYING");
	});

	it("retourne SESSION_NOT_PLAYING si status WAITING", async () => {
		vi.mocked(sessionRepo.findById).mockResolvedValue(
			Result.ok(createSession({ status: "WAITING" })),
		);
		const usecase = new RollDiceUsecase(
			sessionRepo,
			playerRepo,
			stateRepo,
			broadcaster,
		);
		const result = await usecase.execute({
			sessionId: "session-1",
			userId: "user-1",
			guestId: null,
		});
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.error.message).toBe("SESSION_NOT_PLAYING");
		expect(stateRepo.findBySession).not.toHaveBeenCalled();
	});

	it("retourne NOT_IN_SESSION si le joueur n'est pas dans la session", async () => {
		vi.mocked(sessionRepo.findById).mockResolvedValue(
			Result.ok(createSession()),
		);
		vi.mocked(playerRepo.findBySessionAndUserOrGuest).mockResolvedValue(
			Result.ok(null),
		);
		const usecase = new RollDiceUsecase(
			sessionRepo,
			playerRepo,
			stateRepo,
			broadcaster,
		);
		const result = await usecase.execute({
			sessionId: "session-1",
			userId: "user-1",
			guestId: null,
		});
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.error.message).toBe("NOT_IN_SESSION");
		expect(stateRepo.updateState).not.toHaveBeenCalled();
	});

	it("retourne NO_GAME_STATE si pas d'état", async () => {
		vi.mocked(sessionRepo.findById).mockResolvedValue(
			Result.ok(createSession()),
		);
		vi.mocked(playerRepo.findBySessionAndUserOrGuest).mockResolvedValue(
			Result.ok(createPlayer()),
		);
		vi.mocked(stateRepo.findBySession).mockResolvedValue(Result.ok(null));
		const usecase = new RollDiceUsecase(
			sessionRepo,
			playerRepo,
			stateRepo,
			broadcaster,
		);
		const result = await usecase.execute({
			sessionId: "session-1",
			userId: "user-1",
			guestId: null,
		});
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.error.message).toBe("NO_GAME_STATE");
		expect(stateRepo.updateState).not.toHaveBeenCalled();
	});

	it("retourne NOT_YOUR_TURN si ce n'est pas le tour du joueur", async () => {
		vi.mocked(sessionRepo.findById).mockResolvedValue(
			Result.ok(createSession()),
		);
		vi.mocked(playerRepo.findBySessionAndUserOrGuest).mockResolvedValue(
			Result.ok(createPlayer({ slot: 2 })),
		);
		vi.mocked(stateRepo.findBySession).mockResolvedValue(
			Result.ok(createState({ currentPlayerSlot: 1 })),
		);
		const usecase = new RollDiceUsecase(
			sessionRepo,
			playerRepo,
			stateRepo,
			broadcaster,
		);
		const result = await usecase.execute({
			sessionId: "session-1",
			userId: "user-1",
			guestId: null,
		});
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.error.message).toBe("NOT_YOUR_TURN");
		expect(stateRepo.updateState).not.toHaveBeenCalled();
	});

	it("retourne NO_TRIES_LEFT si triesLeft <= 0", async () => {
		vi.mocked(sessionRepo.findById).mockResolvedValue(
			Result.ok(createSession()),
		);
		vi.mocked(playerRepo.findBySessionAndUserOrGuest).mockResolvedValue(
			Result.ok(createPlayer()),
		);
		vi.mocked(stateRepo.findBySession).mockResolvedValue(
			Result.ok(createState({ triesLeft: 0 })),
		);
		const usecase = new RollDiceUsecase(
			sessionRepo,
			playerRepo,
			stateRepo,
			broadcaster,
		);
		const result = await usecase.execute({
			sessionId: "session-1",
			userId: "user-1",
			guestId: null,
		});
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.error.message).toBe("NO_TRIES_LEFT");
		expect(stateRepo.updateState).not.toHaveBeenCalled();
	});

	it("met à jour les dés non verrouillés, décrémente triesLeft et broadcast", async () => {
		const session = createSession();
		const state = createState({ triesLeft: 2 });
		const updatedState = { ...state, triesLeft: 1 };
		vi.mocked(sessionRepo.findById).mockResolvedValue(Result.ok(session));
		vi.mocked(playerRepo.findBySessionAndUserOrGuest).mockResolvedValue(
			Result.ok(createPlayer()),
		);
		vi.mocked(playerRepo.findBySession).mockResolvedValue(
			Result.ok([createPlayer()]),
		);
		vi.mocked(stateRepo.findBySession).mockResolvedValue(Result.ok(state));
		vi.mocked(stateRepo.updateState).mockResolvedValue(Result.ok(updatedState));

		const usecase = new RollDiceUsecase(
			sessionRepo,
			playerRepo,
			stateRepo,
			broadcaster,
		);
		const result = await usecase.execute({
			sessionId: "session-1",
			userId: "user-1",
			guestId: null,
		});

		expect(result.ok).toBe(true);
		expect(stateRepo.updateState).toHaveBeenCalledWith(
			"session-1",
			expect.objectContaining({
				triesLeft: 1,
				dices: expect.any(Array),
			}),
		);
		expect(broadcaster.broadcast).toHaveBeenCalledWith("session-1", {
			type: "STATE",
			payload: expect.any(Object),
		});
	});

	it("propage l'erreur si updateState échoue", async () => {
		vi.mocked(sessionRepo.findById).mockResolvedValue(
			Result.ok(createSession()),
		);
		vi.mocked(playerRepo.findBySessionAndUserOrGuest).mockResolvedValue(
			Result.ok(createPlayer()),
		);
		vi.mocked(stateRepo.findBySession).mockResolvedValue(
			Result.ok(createState()),
		);
		vi.mocked(stateRepo.updateState).mockResolvedValue(
			Result.error(new Error("UPDATE_FAILED")),
		);

		const usecase = new RollDiceUsecase(
			sessionRepo,
			playerRepo,
			stateRepo,
			broadcaster,
		);
		const result = await usecase.execute({
			sessionId: "session-1",
			userId: "user-1",
			guestId: null,
		});

		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.error.message).toBe("UPDATE_FAILED");
	});

	it("préserve les dés verrouillés lors du roll", async () => {
		vi.spyOn(Math, "random").mockReturnValue(0.99); // face 6
		const session = createSession();
		const state = createState({
			triesLeft: 2,
			dices: [
				{ face: 2, locked: true },
				{ face: 3, locked: false },
				{ face: 4, locked: true },
				{ face: 5, locked: false },
				{ face: 1, locked: false },
			],
		});
		vi.mocked(sessionRepo.findById).mockResolvedValue(Result.ok(session));
		vi.mocked(playerRepo.findBySessionAndUserOrGuest).mockResolvedValue(
			Result.ok(createPlayer()),
		);
		vi.mocked(playerRepo.findBySession).mockResolvedValue(
			Result.ok([createPlayer()]),
		);
		vi.mocked(stateRepo.findBySession).mockResolvedValue(Result.ok(state));
		vi.mocked(stateRepo.updateState).mockResolvedValue(Result.ok(state));

		const usecase = new RollDiceUsecase(
			sessionRepo,
			playerRepo,
			stateRepo,
			broadcaster,
		);
		const result = await usecase.execute({
			sessionId: "session-1",
			userId: "user-1",
			guestId: null,
		});

		expect(result.ok).toBe(true);
		expect(stateRepo.updateState).toHaveBeenCalledWith(
			"session-1",
			expect.objectContaining({
				dices: [
					{ face: 2, locked: true },
					{ face: 6, locked: false },
					{ face: 4, locked: true },
					{ face: 6, locked: false },
					{ face: 6, locked: false },
				],
			}),
		);
		vi.restoreAllMocks();
	});
});
