import type { FastifyInstance, FastifyRequest } from 'fastify';
import { diceSessionIdParamsSchema } from '@/adapters/primary/http/schemas/dice.schemas.ts';
import type { DiceBroadcasterPort } from '@/application/command/ports/dice-broadcaster.port.ts';
import type { ChooseScoreUsecase } from '@/application/command/usecases/dice/choose-score.usecase.ts';
import type { LockDiceUsecase } from '@/application/command/usecases/dice/lock-dice.usecase.ts';
import type { RollDiceUsecase } from '@/application/command/usecases/dice/roll-dice.usecase.ts';
import type { GetDiceSessionUsecase } from '@/application/query/usecases/dice/get-dice-session.usecase.ts';
import type { DiceSessionPlayerRepository } from '@/domain/dice/dice.repository.ts';
import { SCORE_KEYS, type ScoreKey } from '@/domain/dice/diceInputs.ts';
import { extractAccessTokenFromProtocols } from '@/pkg/security/wsAuth.ts';

/** Minimal WebSocket socket type (for @fastify/websocket handler). */
export interface DiceWsSocket {
  send(payload: string): void;
  close(code?: number, reason?: string): void;
  on(event: string, fn: (data?: string | Buffer) => void): void;
}

export interface DiceWsHandlerDeps {
  playerRepo: DiceSessionPlayerRepository;
  broadcaster: DiceBroadcasterPort;
  getUsecase: GetDiceSessionUsecase;
  rollUsecase: RollDiceUsecase;
  lockUsecase: LockDiceUsecase;
  chooseScoreUsecase: ChooseScoreUsecase;
}

/**
 * Dice WebSocket handler: auth, membership, ROLL/LOCK/CHOOSE_SCORE protocol.
 * Kept separate from the HTTP route to respect the primary-adapter boundary.
 */
export function createDiceWsHandler(server: FastifyInstance, deps: DiceWsHandlerDeps) {
  const { playerRepo, broadcaster, getUsecase, rollUsecase, lockUsecase, chooseScoreUsecase } =
    deps;

  return (connectionOrReq: unknown, requestOrReply: unknown): void => {
    const socket = connectionOrReq as DiceWsSocket;
    const request = requestOrReply as FastifyRequest<{
      Params: { sessionId: string };
      Querystring: { guestId?: string };
    }>;
    const params = diceSessionIdParamsSchema.safeParse(request.params);
    if (!params.success) {
      socket.close(1008, 'sessionId invalide');
      return;
    }
    const sessionId = params.data.sessionId;
    const guestId = typeof request.query?.guestId === 'string' ? request.query.guestId : undefined;

    let resolveCreds: (value: { userId: string | null; guestId: string | null }) => void;
    let rejectCreds: (reason: Error) => void;
    const credsPromise = new Promise<{
      userId: string | null;
      guestId: string | null;
    }>((resolve, reject) => {
      resolveCreds = resolve;
      rejectCreds = reject;
    });

    const connect = async () => {
      let userId: string | null = null;
      let resolvedGuestId: string | null = null;
      const protocols = request.headers['sec-websocket-protocol'];
      const bearerToken = extractAccessTokenFromProtocols(protocols);
      if (bearerToken) {
        const result = await server.authToken.verifyAccessToken(bearerToken);
        if (result.ok) userId = result.value.sub;
      }
      if (!userId && guestId) resolvedGuestId = guestId;
      if (!userId && !resolvedGuestId) {
        socket.close(1008, 'token ou guestId requis');
        rejectCreds(new Error('token ou guestId requis'));
        return;
      }

      const playerResult = await playerRepo.findBySessionAndUserOrGuest(
        sessionId,
        userId,
        resolvedGuestId,
      );
      if (!playerResult.ok || !playerResult.value) {
        socket.close(1008, 'non membre de la session');
        rejectCreds(new Error('non membre de la session'));
        return;
      }

      resolveCreds({ userId, guestId: resolvedGuestId });

      const unregister = broadcaster.register(sessionId, (payload) => {
        socket.send(payload as string);
      });

      socket.on('close', () => {
        unregister();
      });

      const r = await getUsecase.execute(sessionId);
      if (r.ok && r.value) {
        socket.send(
          JSON.stringify({
            type: 'STATE',
            payload: r.value,
          }),
        );
      }
    };

    socket.on('message', async (raw: string | Buffer | undefined) => {
      let creds: { userId: string | null; guestId: string | null };
      try {
        creds = await credsPromise;
      } catch {
        return;
      }
      let data: { type: string; payload?: unknown };
      try {
        const str = raw === undefined ? '' : typeof raw === 'string' ? raw : raw.toString('utf8');
        data = JSON.parse(str) as { type: string; payload?: unknown };
      } catch {
        socket.send(JSON.stringify({ type: 'ERROR', error: 'INVALID_JSON' }));
        return;
      }

      if (data.type === 'ROLL') {
        const res = await rollUsecase.execute({
          sessionId,
          userId: creds.userId,
          guestId: creds.guestId,
        });
        if (!res.ok) {
          socket.send(
            JSON.stringify({
              type: 'ERROR',
              error: res.error.message,
            }),
          );
        }
        return;
      }

      if (data.type === 'LOCK') {
        const diceIndex =
          typeof data.payload === 'object' && data.payload !== null && 'diceIndex' in data.payload
            ? Number((data.payload as { diceIndex: number }).diceIndex)
            : NaN;
        if (Number.isNaN(diceIndex)) {
          socket.send(
            JSON.stringify({
              type: 'ERROR',
              error: 'diceIndex requis',
            }),
          );
          return;
        }
        const res = await lockUsecase.execute({
          sessionId,
          userId: creds.userId,
          guestId: creds.guestId,
          diceIndex,
        });
        if (!res.ok) {
          socket.send(
            JSON.stringify({
              type: 'ERROR',
              error: res.error.message,
            }),
          );
        }
        return;
      }

      if (data.type === 'CHOOSE_SCORE') {
        const scoreKey =
          typeof data.payload === 'object' && data.payload !== null && 'scoreKey' in data.payload
            ? (data.payload as { scoreKey: string }).scoreKey
            : undefined;
        if (
          !scoreKey ||
          typeof scoreKey !== 'string' ||
          !SCORE_KEYS.includes(scoreKey as ScoreKey)
        ) {
          socket.send(
            JSON.stringify({
              type: 'ERROR',
              error: 'scoreKey invalide',
            }),
          );
          return;
        }
        const res = await chooseScoreUsecase.execute({
          sessionId,
          userId: creds.userId,
          guestId: creds.guestId,
          scoreKey: scoreKey as ScoreKey,
        });
        if (!res.ok) {
          socket.send(
            JSON.stringify({
              type: 'ERROR',
              error: res.error.message,
            }),
          );
        }
      }
    });

    void connect();
  };
}
