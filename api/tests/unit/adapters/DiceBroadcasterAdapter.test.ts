import { describe, expect, it, vi } from "vitest";
import { DiceBroadcasterAdapter } from "@/adapters/secondary/realtime/DiceBroadcasterAdapter.ts";

describe("DiceBroadcasterAdapter", () => {
	it("diffuse uniquement aux clients de la session", () => {
		const adapter = new DiceBroadcasterAdapter();
		const sendA = vi.fn();
		const sendB = vi.fn();
		const sendOther = vi.fn();

		adapter.register("session-1", sendA);
		adapter.register("session-1", sendB);
		adapter.register("session-2", sendOther);

		adapter.broadcast("session-1", { type: "STATE", payload: { ok: true } });

		expect(sendA).toHaveBeenCalledTimes(1);
		expect(sendB).toHaveBeenCalledTimes(1);
		expect(sendOther).not.toHaveBeenCalled();
		expect(sendA.mock.calls[0][0]).toBe(
			JSON.stringify({ type: "STATE", payload: { ok: true } }),
		);
	});

	it("n'envoie plus après désinscription", () => {
		const adapter = new DiceBroadcasterAdapter();
		const send = vi.fn();
		const unregister = adapter.register("session-1", send);

		unregister();
		adapter.broadcast("session-1", { type: "STATE" });

		expect(send).not.toHaveBeenCalled();
	});

	it("ignore les erreurs d'envoi d'un client déconnecté", () => {
		const adapter = new DiceBroadcasterAdapter();
		const failing = vi.fn(() => {
			throw new Error("closed");
		});
		const ok = vi.fn();
		adapter.register("session-1", failing);
		adapter.register("session-1", ok);

		expect(() =>
			adapter.broadcast("session-1", { type: "PING" }),
		).not.toThrow();
		expect(ok).toHaveBeenCalledTimes(1);
	});
});
