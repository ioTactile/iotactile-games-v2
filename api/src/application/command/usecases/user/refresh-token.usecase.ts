import { Result } from 'typescript-result';
import type { AuthTokenPort } from '@/application/command/ports/auth-token.port.ts';

export interface RefreshTokenResult {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
}

export class RefreshTokenUsecase {
  private readonly authToken: AuthTokenPort;

  constructor(authToken: AuthTokenPort) {
    this.authToken = authToken;
  }

  async execute(refreshToken: string): Promise<Result<RefreshTokenResult, Error>> {
    const payload = await this.authToken.verifyRefreshToken(refreshToken);
    if (!payload.ok) return payload;

    const access = await this.authToken.issueAccessToken({
      sub: payload.value.sub,
      email: payload.value.email,
      role: payload.value.role,
    });
    if (!access.ok) return access;

    const newRefresh = await this.authToken.issueRefreshToken({
      sub: payload.value.sub,
      email: payload.value.email,
      role: payload.value.role,
    });
    if (!newRefresh.ok) return newRefresh;

    return Result.ok({
      accessToken: access.value,
      refreshToken: newRefresh.value,
      expiresInSeconds: 900,
    });
  }
}
