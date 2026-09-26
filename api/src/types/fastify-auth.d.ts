import type {
  AccessTokenPayload,
  AuthTokenPort,
} from '@/application/command/ports/auth-token.port.ts';

declare module 'fastify' {
  interface FastifyRequest {
    user?: AccessTokenPayload;
  }

  interface FastifyInstance {
    authToken: AuthTokenPort;
    requireAuth: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    optionalAuth: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
