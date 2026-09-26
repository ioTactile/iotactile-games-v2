import { describe, expect, it } from "vitest";

import { generateJoinCode } from "@/adapters/secondary/persistence/PrismaDiceSessionRepository.ts";

describe("generateJoinCode", () => {
	it("génère un code de 6 caractères dans l'alphabet autorisé", () => {
		const code = generateJoinCode();
		expect(code).toHaveLength(6);
		expect(code).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/);
	});

	it("génère des codes variés sur plusieurs appels", () => {
		const codes = new Set<string>();
		for (let i = 0; i < 50; i++) {
			codes.add(generateJoinCode());
		}
		expect(codes.size).toBeGreaterThan(1);
	});
});
