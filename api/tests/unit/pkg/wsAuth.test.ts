import { describe, expect, it } from "vitest";

import { extractAccessTokenFromProtocols } from "@/pkg/security/wsAuth.ts";

describe("extractAccessTokenFromProtocols", () => {
	it("retourne undefined si l'en-tête est absent ou vide", () => {
		expect(extractAccessTokenFromProtocols(undefined)).toBeUndefined();
		expect(extractAccessTokenFromProtocols("")).toBeUndefined();
	});

	it("extrait le token depuis un seul sous-protocole", () => {
		const token = "abc.def.ghi";
		const header = `access-token.${token}`;
		expect(extractAccessTokenFromProtocols(header)).toBe(token);
	});

	it("extrait le token depuis une liste séparée par des virgules", () => {
		const token = "xyz.123";
		const header = `other, access-token.${token}, another`;
		expect(extractAccessTokenFromProtocols(header)).toBe(token);
	});

	it("extrait le token depuis un tableau de sous-protocoles", () => {
		const token = "jwt-token";
		const header = ["foo", `access-token.${token}`];
		expect(extractAccessTokenFromProtocols(header)).toBe(token);
	});
});
