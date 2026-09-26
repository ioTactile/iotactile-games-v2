import fastifyJwt from '@fastify/jwt';
import Fastify from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { JwtAuthTokenAdapter } from '@/adapters/secondary/security/JwtAuthTokenAdapter.ts';
import { Role } from '@/domain/user/user.type.ts';

describe('JwtAuthTokenAdapter', () => {
  let server: Awaited<ReturnType<typeof buildServer>>;

  async function buildServer() {
    const app = Fastify({ logger: false });
    await app.register(fastifyJwt, {
      secret: 'test-secret-for-unit-tests-only',
    });
    return app;
  }

  beforeAll(async () => {
    server = await buildServer();
  });

  afterAll(async () => {
    await server.close();
  });

  it('issueAccessToken et verifyAccessToken : round-trip', async () => {
    const adapter = new JwtAuthTokenAdapter(server, {
      accessTokenTtlSeconds: 900,
      refreshTokenTtlSeconds: 604800,
    });
    const payload = {
      sub: 'user-1',
      email: 'u@example.com',
      role: Role.USER,
    };
    const issue = await adapter.issueAccessToken(payload);
    expect(issue.ok).toBe(true);
    if (!issue.ok) return;
    const verify = await adapter.verifyAccessToken(issue.value);
    expect(verify.ok).toBe(true);
    if (verify.ok) {
      expect(verify.value.sub).toBe(payload.sub);
      expect(verify.value.email).toBe(payload.email);
      expect(verify.value.role).toBe(payload.role);
    }
  });

  it('issueRefreshToken et verifyRefreshToken : round-trip', async () => {
    const adapter = new JwtAuthTokenAdapter(server, {
      accessTokenTtlSeconds: 900,
      refreshTokenTtlSeconds: 604800,
    });
    const payload = {
      sub: 'user-1',
      email: 'u@example.com',
      role: Role.ADMIN,
    };
    const issue = await adapter.issueRefreshToken(payload);
    expect(issue.ok).toBe(true);
    if (!issue.ok) return;
    const verify = await adapter.verifyRefreshToken(issue.value);
    expect(verify.ok).toBe(true);
    if (verify.ok) {
      expect(verify.value.sub).toBe(payload.sub);
      expect(verify.value.role).toBe(Role.ADMIN);
    }
  });

  it('verifyAccessToken retourne une erreur pour un refresh token', async () => {
    const adapter = new JwtAuthTokenAdapter(server, {
      accessTokenTtlSeconds: 900,
      refreshTokenTtlSeconds: 604800,
    });
    const refresh = await adapter.issueRefreshToken({
      sub: 'id',
      email: 'e@x.com',
      role: Role.USER,
    });
    expect(refresh.ok).toBe(true);
    if (!refresh.ok) return;
    const verify = await adapter.verifyAccessToken(refresh.value);
    expect(verify.ok).toBe(false);
    if (!verify.ok) {
      expect(verify.error.message).toBe('INVALID_TOKEN_TYPE');
    }
  });

  it('verifyRefreshToken retourne une erreur pour un access token', async () => {
    const adapter = new JwtAuthTokenAdapter(server, {
      accessTokenTtlSeconds: 900,
      refreshTokenTtlSeconds: 604800,
    });
    const access = await adapter.issueAccessToken({
      sub: 'id',
      email: 'e@x.com',
      role: Role.USER,
    });
    expect(access.ok).toBe(true);
    if (!access.ok) return;
    const verify = await adapter.verifyRefreshToken(access.value);
    expect(verify.ok).toBe(false);
    if (!verify.ok) {
      expect(verify.error.message).toBe('INVALID_TOKEN_TYPE');
    }
  });

  it('verifyAccessToken retourne une erreur pour un token invalide', async () => {
    const adapter = new JwtAuthTokenAdapter(server, {
      accessTokenTtlSeconds: 900,
      refreshTokenTtlSeconds: 604800,
    });
    const verify = await adapter.verifyAccessToken('invalid.jwt.token');
    expect(verify.ok).toBe(false);
  });
});
