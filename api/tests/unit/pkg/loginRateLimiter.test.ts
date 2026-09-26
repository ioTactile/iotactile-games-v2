import { describe, expect, it } from "vitest";

import {
	buildLoginKey,
	isLoginBlocked,
	registerLoginFailure,
	resetLoginAttempts,
} from "@/pkg/security/loginRateLimiter.ts";

describe("loginRateLimiter", () => {
	it("construit une clé stable à partir de l'IP et de l'email", () => {
		const key1 = buildLoginKey("127.0.0.1", "User@Example.com ");
		const key2 = buildLoginKey("127.0.0.1", "user@example.com");
		expect(key1).toBe(key2);
	});

	it("ne bloque pas avant le seuil puis bloque après plusieurs échecs rapprochés", () => {
		const baseNow = Date.now();
		const key = buildLoginKey("127.0.0.1", "user@example.com");

		expect(isLoginBlocked(key, baseNow)).toBe(false);

		for (let i = 0; i < 5; i++) {
			registerLoginFailure(key, baseNow + i * 1000);
		}

		expect(isLoginBlocked(key, baseNow + 5_000)).toBe(true);
	});

	it("réinitialise l'état après un reset", () => {
		const now = Date.now();
		const key = buildLoginKey("127.0.0.1", "other@example.com");

		registerLoginFailure(key, now);
		expect(isLoginBlocked(key, now)).toBe(false);

		resetLoginAttempts(key);
		expect(isLoginBlocked(key, now + 1_000)).toBe(false);
	});
});
