import type { FastifyInstance } from 'fastify';
import { Result } from 'typescript-result';
import type {
  AccessTokenPayload,
  AuthTokenPort,
  RefreshTokenPayload,
} from '@/application/command/ports/auth-token.port.ts';

export interface JwtAuthTokenConfig {
  accessTokenTtlSeconds: number;
  refreshTokenTtlSeconds: number;
}

export class JwtAuthTokenAdapter implements AuthTokenPort {
  private readonly server: FastifyInstance;
  private readonly config: JwtAuthTokenConfig;

  constructor(server: FastifyInstance, config: JwtAuthTokenConfig) {
    this.server = server;
    this.config = config;
  }

  async issueAccessToken(payload: AccessTokenPayload): Promise<Result<string, Error>> {
    try {
      const token = await this.server.jwt.sign(
        { ...payload, type: 'access' },
        { expiresIn: this.config.accessTokenTtlSeconds },
      );
      return Result.ok(token as string);
    } catch (error) {
      return Result.error(error as Error);
    }
  }

  async issueRefreshToken(payload: RefreshTokenPayload): Promise<Result<string, Error>> {
    try {
      const token = await this.server.jwt.sign(
        { ...payload, type: 'refresh' },
        { expiresIn: this.config.refreshTokenTtlSeconds },
      );
      return Result.ok(token as string);
    } catch (error) {
      return Result.error(error as Error);
    }
  }

  async verifyAccessToken(token: string): Promise<Result<AccessTokenPayload, Error>> {
    try {
      const decoded = await this.server.jwt.verify<AccessTokenPayload & { type?: string }>(token);
      if (decoded.type !== 'access') {
        return Result.error(new Error('INVALID_TOKEN_TYPE'));
      }
      return Result.ok({
        sub: decoded.sub,
        email: decoded.email,
        role: decoded.role ?? 'USER',
      });
    } catch (error) {
      return Result.error(error as Error);
    }
  }

  async verifyRefreshToken(token: string): Promise<Result<RefreshTokenPayload, Error>> {
    try {
      const decoded = await this.server.jwt.verify<RefreshTokenPayload & { type?: string }>(token);
      if (decoded.type !== 'refresh') {
        return Result.error(new Error('INVALID_TOKEN_TYPE'));
      }
      return Result.ok({
        sub: decoded.sub,
        email: decoded.email,
        role: decoded.role ?? 'USER',
      });
    } catch (error) {
      return Result.error(error as Error);
    }
  }
}
