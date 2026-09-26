import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import { JwtAuthTokenAdapter } from "@/adapters/secondary/security/JwtAuthTokenAdapter.ts";
import type { AccessTokenPayload } from "@/application/command/ports/auth-token.port.ts";
import { Role } from "@/domain/user/user.type.ts";
import { config } from "@/pkg/config/index.ts";

export async function authPlugin(server: FastifyInstance) {
	const authToken = new JwtAuthTokenAdapter(server, {
		accessTokenTtlSeconds: config.jwt.accessTokenTtlSeconds,
		refreshTokenTtlSeconds: config.jwt.refreshTokenTtlSeconds,
	});

	server.decorate("authToken", authToken);

	server.decorate(
		"requireAuth",
		async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
			const header = request.headers.authorization;
			const token =
				header?.startsWith("Bearer ") === true ? header.slice(7) : null;
			if (!token) {
				return reply
					.status(401)
					.send({ error: "Token d'accès manquant (Authorization: Bearer …)." });
			}
			const result = await authToken.verifyAccessToken(token);
			if (!result.ok) {
				return reply.status(401).send({ error: "Token invalide ou expiré." });
			}
			request.user = result.value;
		},
	);

	server.decorate(
		"requireAdmin",
		async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
			if (!request.user) {
				return reply.status(401).send({ error: "Authentification requise." });
			}
			if ((request.user as AccessTokenPayload).role !== Role.ADMIN) {
				return reply
					.status(403)
					.send({ error: "Accès réservé aux administrateurs." });
			}
		},
	);

	/** Optionnel : remplit request.user si un Bearer token valide est présent. */
	server.decorate(
		"optionalAuth",
		async function optionalAuth(request: FastifyRequest, _reply: FastifyReply) {
			const header = request.headers.authorization;
			const token =
				header?.startsWith("Bearer ") === true ? header.slice(7) : null;
			if (!token) return;
			const result = await authToken.verifyAccessToken(token);
			if (result.ok) {
				request.user = result.value;
			}
		},
	);
}
