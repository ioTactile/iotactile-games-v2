import { Result } from 'typescript-result';
import type { AuthTokenPort } from '@/application/command/ports/auth-token.port.ts';
import type { PasswordHasherPort } from '@/application/command/ports/password-hasher.port.ts';
import type { UserRepository } from '@/domain/user/user.repository.ts';

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
}

export class LoginUsecase {
  private readonly userRepository: UserRepository;
  private readonly passwordHasher: PasswordHasherPort;
  private readonly authToken: AuthTokenPort;

  constructor(
    userRepository: UserRepository,
    passwordHasher: PasswordHasherPort,
    authToken: AuthTokenPort,
  ) {
    this.userRepository = userRepository;
    this.passwordHasher = passwordHasher;
    this.authToken = authToken;
  }

  async execute(email: string, password: string): Promise<Result<LoginResult, Error>> {
    const userResult = await this.userRepository.findByEmail(email);
    if (!userResult.ok) return userResult;
    const user = userResult.value;
    if (!user) {
      return Result.error(new Error('USER_NOT_FOUND'));
    }

    const match = await this.passwordHasher.compare(password, user.password);
    if (!match.ok) return match;
    if (!match.value) {
      return Result.error(new Error('INVALID_CREDENTIALS'));
    }

    const access = await this.authToken.issueAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    if (!access.ok) return access;

    const refresh = await this.authToken.issueRefreshToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    if (!refresh.ok) return refresh;

    return Result.ok({
      accessToken: access.value,
      refreshToken: refresh.value,
      expiresInSeconds: 900, // 15 min; keep in sync with JWT config
    });
  }
}
