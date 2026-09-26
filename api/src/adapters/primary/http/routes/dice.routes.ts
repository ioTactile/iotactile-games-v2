import type { FastifyInstance } from 'fastify';
import { createDiceWsHandler } from '@/adapters/primary/http/routes/dice-ws.handler.ts';

import {
  createDiceSessionBodySchema,
  diceSessionIdParamsSchema,
  joinByCodeBodySchema,
  joinDiceSessionBodySchema,
  listMyDiceSessionsQuerySchema,
} from '@/adapters/primary/http/schemas/dice.schemas.ts';
import { CachedDiceSessionRepository } from '@/adapters/secondary/persistence/CachedDiceSessionRepository.ts';
import { PrismaDiceSessionPlayerRepository } from '@/adapters/secondary/persistence/PrismaDiceSessionPlayerRepository.ts';
import { PrismaDiceSessionRepository } from '@/adapters/secondary/persistence/PrismaDiceSessionRepository.ts';
import { PrismaDiceSessionStateRepository } from '@/adapters/secondary/persistence/PrismaDiceSessionStateRepository.ts';
import { PrismaUserRepository } from '@/adapters/secondary/persistence/PrismaUserRepository.ts';
import { DiceBroadcasterAdapter } from '@/adapters/secondary/realtime/DiceBroadcasterAdapter.ts';
import type { AccessTokenPayload } from '@/application/command/ports/auth-token.port.ts';
import { ChooseScoreUsecase } from '@/application/command/usecases/dice/choose-score.usecase.ts';
import { CreateDiceSessionUsecase } from '@/application/command/usecases/dice/create-dice-session.usecase.ts';
import { JoinDiceSessionUsecase } from '@/application/command/usecases/dice/join-dice-session.usecase.ts';
import { JoinDiceSessionByCodeUsecase } from '@/application/command/usecases/dice/join-dice-session-by-code.usecase.ts';
import { LeaveDiceSessionUsecase } from '@/application/command/usecases/dice/leave-dice-session.usecase.ts';
import { LockDiceUsecase } from '@/application/command/usecases/dice/lock-dice.usecase.ts';
import { RollDiceUsecase } from '@/application/command/usecases/dice/roll-dice.usecase.ts';
import { StartDiceGameUsecase } from '@/application/command/usecases/dice/start-dice-game.usecase.ts';
import { GetDiceSessionUsecase } from '@/application/query/usecases/dice/get-dice-session.usecase.ts';
import { ListMyDiceSessionsUsecase } from '@/application/query/usecases/dice/list-my-dice-sessions.usecase.ts';
import { ListPublicDiceSessionsUsecase } from '@/application/query/usecases/dice/list-public-dice-sessions.usecase.ts';
import { GetUserByIdUsecase } from '@/application/query/usecases/user/get-user-by-id.usecase.ts';
import { getRedisClient } from '@/pkg/cache/redis.ts';
import { config } from '@/pkg/config/index.ts';

const sessionRepo = new CachedDiceSessionRepository({
  inner: new PrismaDiceSessionRepository(),
  redis: getRedisClient(),
  publicWaitingTtlSeconds: config.cache.dice.publicSessionsTtlSeconds,
});
const playerRepo = new PrismaDiceSessionPlayerRepository();
const stateRepo = new PrismaDiceSessionStateRepository();
const broadcaster = new DiceBroadcasterAdapter();
const userRepo = new PrismaUserRepository();
const getUserById = new GetUserByIdUsecase(userRepo);

function getUserId(request: { user?: unknown }): string | null {
  const user = request.user as AccessTokenPayload | undefined;
  return user?.sub ?? null;
}

async function getDisplayName(
  request: { user?: unknown },
  bodyDisplayName?: string,
): Promise<string | null> {
  if (bodyDisplayName?.trim()) return bodyDisplayName.trim();
  const user = request.user as AccessTokenPayload | undefined;
  if (user?.sub) {
    const u = await getUserById.execute(user.sub);
    if (u.ok && u.value) return u.value.username;
  }
  return null;
}

export async function registerDiceRoutes(server: FastifyInstance) {
  const createUsecase = new CreateDiceSessionUsecase(sessionRepo);
  const joinUsecase = new JoinDiceSessionUsecase(sessionRepo, playerRepo);
  const joinByCodeUsecase = new JoinDiceSessionByCodeUsecase(sessionRepo, playerRepo);
  const leaveUsecase = new LeaveDiceSessionUsecase(sessionRepo, playerRepo);
  const getUsecase = new GetDiceSessionUsecase(sessionRepo, playerRepo, stateRepo);
  const startUsecase = new StartDiceGameUsecase(
    sessionRepo,
    playerRepo,
    stateRepo,
    broadcaster,
    getUsecase,
  );
  const rollUsecase = new RollDiceUsecase(sessionRepo, playerRepo, stateRepo, broadcaster);
  const lockUsecase = new LockDiceUsecase(sessionRepo, playerRepo, stateRepo, broadcaster);
  const chooseScoreUsecase = new ChooseScoreUsecase(
    sessionRepo,
    playerRepo,
    stateRepo,
    broadcaster,
  );

  const listMySessionsUsecase = new ListMyDiceSessionsUsecase(sessionRepo, playerRepo);
  const listPublicSessionsUsecase = new ListPublicDiceSessionsUsecase(sessionRepo);

  server.addHook('preHandler', server.optionalAuth);

  server.get('/sessions/public', async (_request, reply) => {
    const result = await listPublicSessionsUsecase.execute();
    if (!result.ok) {
      return reply.status(500).send({ error: 'Erreur serveur.' });
    }
    return reply.status(200).send(result.value);
  });

  server.get<{ Querystring: unknown }>('/sessions', async (request, reply) => {
    const parsed = listMyDiceSessionsQuerySchema.safeParse(request.query);
    const query = parsed.success ? parsed.data : {};
    const userId = getUserId(request);
    const guestId = query.guestId ?? null;
    if (!userId && !guestId) {
      return reply.status(400).send({
        error: 'Connexion ou guestId requis (fournir guestId en query pour invité).',
      });
    }
    const result = await listMySessionsUsecase.execute({ userId, guestId });
    if (!result.ok) {
      request.log.error(result.error);
      return reply.status(500).send({ error: 'Erreur serveur.' });
    }
    return reply.status(200).send(result.value);
  });

  server.post<{ Body: unknown }>('/sessions', async (request, reply) => {
    const parsed = createDiceSessionBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'VALIDATION_ERROR',
        details: parsed.error.flatten().fieldErrors,
      });
    }
    const body = parsed.data;
    const userId = getUserId(request);
    const guestId = body.guestId ?? null;
    if (!userId && !guestId) {
      return reply.status(400).send({
        error: 'Connexion ou guestId requis (invité : fournir guestId + displayName).',
      });
    }
    const displayName =
      (await getDisplayName(request, body.displayName)) ?? (body.displayName?.trim() || null);
    if (!displayName) {
      return reply.status(400).send({
        error: 'displayName requis (ou connectez-vous pour utiliser votre pseudo).',
      });
    }

    const result = await createUsecase.execute({
      name: body.name,
      isPublic: body.isPublic ?? false,
      userId,
      guestId,
      displayName,
    });
    if (!result.ok) {
      const err = result.error.message;
      if (err === 'DISPLAY_NAME_REQUIRED' || err === 'USER_OR_GUEST_REQUIRED') {
        return reply.status(400).send({ error: result.error.message });
      }
      request.log.error(result.error);
      return reply.status(500).send({ error: 'Erreur serveur.' });
    }
    return reply.status(201).send(result.value);
  });

  server.post<{
    Params: { sessionId: string };
    Body: unknown;
  }>('/sessions/:sessionId/join', async (request, reply) => {
    const params = diceSessionIdParamsSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: 'sessionId invalide.' });
    }
    const parsed = joinDiceSessionBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'VALIDATION_ERROR',
        details: parsed.error.flatten().fieldErrors,
      });
    }
    const body = parsed.data;
    const userId = getUserId(request);
    const guestId = body.guestId ?? null;
    if (!userId && !guestId) {
      return reply.status(400).send({
        error: 'Connexion ou guestId requis (invité : fournir guestId + displayName).',
      });
    }
    const displayName =
      (await getDisplayName(request, body.displayName)) ?? (body.displayName?.trim() || null);
    if (!displayName) {
      return reply.status(400).send({
        error: 'displayName requis.',
      });
    }

    const result = await joinUsecase.execute({
      sessionId: params.data.sessionId,
      userId,
      guestId,
      displayName,
    });
    if (!result.ok) {
      const err = result.error.message;
      if (err === 'SESSION_NOT_FOUND') return reply.status(404).send({ error: err });
      if (
        err === 'SESSION_ALREADY_STARTED_OR_FINISHED' ||
        err === 'SESSION_FULL' ||
        err === 'ALREADY_IN_SESSION' ||
        err === 'DISPLAY_NAME_REQUIRED' ||
        err === 'USER_OR_GUEST_REQUIRED'
      ) {
        return reply.status(400).send({ error: err });
      }
      request.log.error(result.error);
      return reply.status(500).send({ error: 'Erreur serveur.' });
    }
    return reply.status(200).send(result.value);
  });

  server.post<{ Body: unknown }>('/sessions/join-by-code', async (request, reply) => {
    const parsed = joinByCodeBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'VALIDATION_ERROR',
        details: parsed.error.flatten().fieldErrors,
      });
    }
    const body = parsed.data;
    const userId = getUserId(request);
    const guestId = body.guestId ?? null;
    if (!userId && !guestId) {
      return reply.status(400).send({
        error: 'Connexion ou guestId requis (invité : fournir guestId + displayName).',
      });
    }
    const displayName =
      (await getDisplayName(request, body.displayName)) ?? (body.displayName?.trim() || null);
    if (!displayName) {
      return reply.status(400).send({
        error: 'displayName requis.',
      });
    }
    const result = await joinByCodeUsecase.execute({
      joinCode: body.joinCode,
      userId,
      guestId,
      displayName,
    });
    if (!result.ok) {
      const err = result.error.message;
      if (err === 'SESSION_NOT_FOUND') return reply.status(404).send({ error: err });
      if (
        err === 'SESSION_ALREADY_STARTED_OR_FINISHED' ||
        err === 'SESSION_FULL' ||
        err === 'ALREADY_IN_SESSION' ||
        err === 'DISPLAY_NAME_REQUIRED' ||
        err === 'USER_OR_GUEST_REQUIRED' ||
        err === 'JOIN_CODE_REQUIRED'
      ) {
        return reply.status(400).send({ error: err });
      }
      request.log.error(result.error);
      return reply.status(500).send({ error: 'Erreur serveur.' });
    }
    return reply.status(200).send(result.value);
  });

  server.post<{
    Params: { sessionId: string };
    Body: { guestId?: string };
  }>('/sessions/:sessionId/leave', async (request, reply) => {
    const params = diceSessionIdParamsSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: 'sessionId invalide.' });
    }
    const userId = getUserId(request);
    const guestId = request.body?.guestId ?? null;
    if (!userId && !guestId) {
      return reply.status(400).send({
        error: 'Connexion ou guestId requis.',
      });
    }

    const result = await leaveUsecase.execute({
      sessionId: params.data.sessionId,
      userId,
      guestId,
    });
    if (!result.ok) {
      const err = result.error.message;
      if (err === 'SESSION_NOT_FOUND') return reply.status(404).send({ error: err });
      if (
        err === 'CANNOT_LEAVE_STARTED_GAME' ||
        err === 'NOT_IN_SESSION' ||
        err === 'USER_OR_GUEST_REQUIRED'
      ) {
        return reply.status(400).send({ error: err });
      }
      request.log.error(result.error);
      return reply.status(500).send({ error: 'Erreur serveur.' });
    }
    return reply.status(204).send();
  });

  server.post<{
    Params: { sessionId: string };
    Body: { guestId?: string };
  }>('/sessions/:sessionId/start', async (request, reply) => {
    const params = diceSessionIdParamsSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: 'sessionId invalide.' });
    }
    const userId = getUserId(request);
    const guestId = request.body?.guestId ?? null;
    if (!userId && !guestId) {
      return reply.status(400).send({
        error: 'Connexion ou guestId requis.',
      });
    }

    const result = await startUsecase.execute({
      sessionId: params.data.sessionId,
      userId,
      guestId,
    });
    if (!result.ok) {
      const err = result.error.message;
      if (err === 'SESSION_NOT_FOUND') return reply.status(404).send({ error: err });
      if (
        err === 'SESSION_ALREADY_STARTED_OR_FINISHED' ||
        err === 'MIN_ONE_PLAYER_REQUIRED' ||
        err === 'ONLY_CREATOR_CAN_START' ||
        err === 'USER_OR_GUEST_REQUIRED'
      ) {
        return reply.status(400).send({ error: err });
      }
      request.log.error(result.error);
      return reply.status(500).send({ error: 'Erreur serveur.' });
    }
    return reply.status(204).send();
  });

  server.get<{ Params: { sessionId: string } }>('/sessions/:sessionId', async (request, reply) => {
    const params = diceSessionIdParamsSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: 'sessionId invalide.' });
    }

    const result = await getUsecase.execute(params.data.sessionId);
    if (!result.ok) {
      request.log.error(result.error);
      return reply.status(500).send({ error: 'Erreur serveur.' });
    }
    if (!result.value) {
      return reply.status(404).send({ error: 'SESSION_NOT_FOUND' });
    }
    return reply.status(200).send(result.value);
  });

  // WebSocket: dedicated handler (auth, membership, game protocol)
  server.get(
    '/sessions/:sessionId/ws',
    { websocket: true } as Record<string, unknown>,
    createDiceWsHandler(server, {
      playerRepo,
      broadcaster,
      getUsecase,
      rollUsecase,
      lockUsecase,
      chooseScoreUsecase,
    }),
  );
}
