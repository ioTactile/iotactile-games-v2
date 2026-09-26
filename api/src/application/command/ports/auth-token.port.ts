import type { Result } from 'typescript-result';
import type { Role } from '@/domain/user/user.type.ts';

/** Minimal access-token payload (e.g. JWT). */
export interface AccessTokenPayload {
  sub: string; // userId
  email: string;
  role: Role;
}

/** Refresh-token payload (e.g. JWT). */
export interface RefreshTokenPayload {
  sub: string; // userId
  email: string;
  role: Role;
}

/**
 * Port for issuing and verifying authentication tokens (JWT).
 * Implementation lives in adapters (e.g. @fastify/jwt).
 */
export interface AuthTokenPort {
  /** Issue a short-lived access token. */
  issueAccessToken(payload: AccessTokenPayload): Promise<Result<string, Error>>;

  /** Issue a long-lived refresh token. */
  issueRefreshToken(payload: RefreshTokenPayload): Promise<Result<string, Error>>;

  /** Verify an access token and return its payload. */
  verifyAccessToken(token: string): Promise<Result<AccessTokenPayload, Error>>;

  /** Verify a refresh token and return its payload. */
  verifyRefreshToken(token: string): Promise<Result<RefreshTokenPayload, Error>>;
}
