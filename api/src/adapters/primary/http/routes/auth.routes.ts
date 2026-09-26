import type { FastifyInstance } from "fastify";
import {
	loginBodySchema,
	registerBodySchema,
} from "@/adapters/primary/http/schemas/auth.schemas.ts";
import { PrismaUserRepository } from "@/adapters/secondary/persistence/PrismaUserRepository.ts";
import { BcryptPasswordHasher } from "@/adapters/secondary/security/BcryptPasswordHasher.ts";
import type { AccessTokenPayload } from "@/application/command/ports/auth-token.port.ts";
import { LoginUsecase } from "@/application/command/usecases/user/login.usecase.ts";
import { RefreshTokenUsecase } from "@/application/command/usecases/user/refresh-token.usecase.ts";
import { RegisterUserUsecase } from "@/application/command/usecases/user/register-user.usecase.ts";
import { GetUserByIdUsecase } from "@/application/query/usecases/user/get-user-by-id.usecase.ts";
import { config } from "@/pkg/config/index.ts";
import {
	buildLoginKey,
	isLoginBlocked,
	registerLoginFailure,
	resetLoginAttempts,
} from "@/pkg/security/loginRateLimiter.ts";

export async function registerAuthRoutes(server: FastifyInstance) {
	const userRepository = new PrismaUserRepository();
	const passwordHasher = new BcryptPasswordHasher();
	const authToken = server.authToken;

	const registerUsecase = new RegisterUserUsecase(
		userRepository,
		passwordHasher,
	);
	const loginUsecase = new LoginUsecase(
		userRepository,
		passwordHasher,
		authToken,
	);
	const refreshTokenUsecase = new RefreshTokenUsecase(authToken);
	const getUserByIdUsecase = new GetUserByIdUsecase(userRepository);

	server.post<{ Body: unknown }>("/auth/register", async (request, reply) => {
		const parsed = registerBodySchema.safeParse(request.body);
		if (!parsed.success) {
			return reply.status(400).send({
				error: "VALIDATION_ERROR",
				details: parsed.error.flatten().fieldErrors,
			});
		}

		const result = await registerUsecase.execute(parsed.data);
		if (!result.ok) {
			if (result.error.message === "EMAIL_ALREADY_USED") {
				return reply.status(409).send({ error: "Cet email est déjà utilisé." });
			}
			request.log.error(result.error);
			return reply
				.status(500)
				.send({ error: "Erreur lors de la création du compte." });
		}

		return reply.status(201).send(result.value);
	});

	server.post<{ Body: unknown }>("/auth/login", async (request, reply) => {
		const parsed = loginBodySchema.safeParse(request.body);
		if (!parsed.success) {
			return reply.status(400).send({
				error: "VALIDATION_ERROR",
				details: parsed.error.flatten().fieldErrors,
			});
		}

		const key = buildLoginKey(request.ip, parsed.data.email);
		if (isLoginBlocked(key)) {
			return reply.status(429).send({
				error: "Trop de tentatives de connexion, réessayez plus tard.",
			});
		}

		const result = await loginUsecase.execute(
			parsed.data.email,
			parsed.data.password,
		);
		if (!result.ok) {
			if (
				result.error.message === "INVALID_CREDENTIALS" ||
				result.error.message === "USER_NOT_FOUND"
			) {
				registerLoginFailure(key);
			}
			if (result.error.message === "INVALID_CREDENTIALS") {
				return reply.status(401).send({ error: "Identifiants incorrects." });
			}
			request.log.error(result.error);
			return reply.status(500).send({ error: "Erreur lors de la connexion." });
		}

		const { accessToken, refreshToken, expiresInSeconds } = result.value;

		reply.setCookie(config.cookie.refreshTokenName, refreshToken, {
			httpOnly: config.cookie.httpOnly,
			secure: config.cookie.secure,
			sameSite: config.cookie.sameSite,
			maxAge: config.cookie.maxAge,
			path: "/",
		});

		resetLoginAttempts(key);

		return reply.status(200).send({
			accessToken,
			tokenType: "Bearer",
			expiresInSeconds,
		});
	});

	server.post<{ Body?: { refreshToken?: string } }>(
		"/auth/refresh",
		async (request, reply) => {
			const token =
				request.cookies[config.cookie.refreshTokenName] ??
				request.body?.refreshToken;
			if (!token) {
				return reply
					.status(401)
					.send({ error: "Refresh token manquant (cookie ou body)." });
			}

			const result = await refreshTokenUsecase.execute(token);
			if (!result.ok) {
				return reply
					.status(401)
					.send({ error: "Refresh token invalide ou expiré." });
			}

			const { accessToken, refreshToken, expiresInSeconds } = result.value;

			reply.setCookie(config.cookie.refreshTokenName, refreshToken, {
				httpOnly: config.cookie.httpOnly,
				secure: config.cookie.secure,
				sameSite: config.cookie.sameSite,
				maxAge: config.cookie.maxAge,
				path: "/",
			});

			return reply.status(200).send({
				accessToken,
				tokenType: "Bearer",
				expiresInSeconds,
			});
		},
	);

	server.post("/auth/logout", async (_request, reply) => {
		reply.clearCookie(config.cookie.refreshTokenName, { path: "/" });
		return reply.status(204).send();
	});

	server.get(
		"/auth/me",
		{ preHandler: [server.requireAuth] },
		async (request, reply) => {
			const payload = request.user as AccessTokenPayload | undefined;
			if (!payload) {
				return reply.status(401).send({ error: "Non authentifié." });
			}
			const result = await getUserByIdUsecase.execute(payload.sub);
			if (!result.ok) {
				request.log.error(result.error);
				return reply.status(500).send({ error: "Erreur serveur." });
			}
			const user = result.value;
			if (!user) {
				return reply.status(404).send({ error: "Utilisateur non trouvé." });
			}
			const { password: _p, ...safe } = user;
			return reply.status(200).send(safe);
		},
	);
}
