import { Result } from 'typescript-result';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthTokenPort } from '@/application/command/ports/auth-token.port.ts';
import { RefreshTokenUsecase } from '@/application/command/usecases/user/refresh-token.usecase.ts';
import { Role } from '@/domain/user/user.type.ts';

describe('RefreshTokenUsecase', () => {
  let authToken: AuthTokenPort;

  beforeEach(() => {
    authToken = {
      issueAccessToken: vi.fn(),
      issueRefreshToken: vi.fn(),
      verifyAccessToken: vi.fn(),
      verifyRefreshToken: vi.fn(),
    };
  });

  it('retourne un nouveau accessToken et refreshToken si le refresh est valide', async () => {
    const payload = {
      sub: 'user-1',
      email: 'u@example.com',
      role: Role.USER,
    };
    vi.mocked(authToken.verifyRefreshToken).mockResolvedValue(Result.ok(payload));
    vi.mocked(authToken.issueAccessToken).mockResolvedValue(Result.ok('new-access'));
    vi.mocked(authToken.issueRefreshToken).mockResolvedValue(Result.ok('new-refresh'));

    const usecase = new RefreshTokenUsecase(authToken);
    const result = await usecase.execute('old-refresh-token');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.accessToken).toBe('new-access');
      expect(result.value.refreshToken).toBe('new-refresh');
      expect(result.value.expiresInSeconds).toBe(900);
    }
    expect(authToken.verifyRefreshToken).toHaveBeenCalledWith('old-refresh-token');
    expect(authToken.issueAccessToken).toHaveBeenCalledWith(payload);
    expect(authToken.issueRefreshToken).toHaveBeenCalledWith(payload);
  });

  it("propage l'erreur si verifyRefreshToken échoue", async () => {
    vi.mocked(authToken.verifyRefreshToken).mockResolvedValue(
      Result.error(new Error('TOKEN_EXPIRED')),
    );

    const usecase = new RefreshTokenUsecase(authToken);
    const result = await usecase.execute('invalid');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe('TOKEN_EXPIRED');
    }
    expect(authToken.issueAccessToken).not.toHaveBeenCalled();
  });

  it("propage l'erreur si issueAccessToken échoue", async () => {
    vi.mocked(authToken.verifyRefreshToken).mockResolvedValue(
      Result.ok({
        sub: 'id',
        email: 'e@x.com',
        role: Role.USER,
      }),
    );
    vi.mocked(authToken.issueAccessToken).mockResolvedValue(Result.error(new Error('JWT_ERROR')));

    const usecase = new RefreshTokenUsecase(authToken);
    const result = await usecase.execute('valid-refresh');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toBe('JWT_ERROR');
  });
});
