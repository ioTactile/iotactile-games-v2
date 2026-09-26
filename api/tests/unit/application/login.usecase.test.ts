import { Result } from 'typescript-result';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthTokenPort } from '@/application/command/ports/auth-token.port.ts';
import type { PasswordHasherPort } from '@/application/command/ports/password-hasher.port.ts';
import { LoginUsecase } from '@/application/command/usecases/user/login.usecase.ts';
import type { UserRepository } from '@/domain/user/user.repository.ts';
import type { UserType } from '@/domain/user/user.type.ts';
import { Role } from '@/domain/user/user.type.ts';

function createUser(overrides: Partial<UserType> = {}): UserType {
  return {
    id: 'user-1',
    email: 'u@example.com',
    password: 'hashed',
    username: 'user1',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    role: Role.USER,
    ...overrides,
  };
}

describe('LoginUsecase', () => {
  let userRepository: UserRepository;
  let passwordHasher: PasswordHasherPort;
  let authToken: AuthTokenPort;

  beforeEach(() => {
    userRepository = {
      findByEmail: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    passwordHasher = {
      hash: vi.fn(),
      compare: vi.fn(),
    };
    authToken = {
      issueAccessToken: vi.fn(),
      issueRefreshToken: vi.fn(),
      verifyAccessToken: vi.fn(),
      verifyRefreshToken: vi.fn(),
    };
  });

  it('retourne accessToken, refreshToken et expiresInSeconds en cas de succès', async () => {
    const user = createUser({ email: 'u@example.com', password: 'hash' });
    vi.mocked(userRepository.findByEmail).mockResolvedValue(Result.ok(user));
    vi.mocked(passwordHasher.compare).mockResolvedValue(Result.ok(true));
    vi.mocked(authToken.issueAccessToken).mockResolvedValue(Result.ok('access-token'));
    vi.mocked(authToken.issueRefreshToken).mockResolvedValue(Result.ok('refresh-token'));

    const usecase = new LoginUsecase(userRepository, passwordHasher, authToken);
    const result = await usecase.execute('u@example.com', 'password123');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.accessToken).toBe('access-token');
      expect(result.value.refreshToken).toBe('refresh-token');
      expect(result.value.expiresInSeconds).toBe(900);
    }
    expect(authToken.issueAccessToken).toHaveBeenCalledWith({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    expect(authToken.issueRefreshToken).toHaveBeenCalledWith({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
  });

  it("retourne USER_NOT_FOUND si l'utilisateur n'existe pas", async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(Result.ok(null));

    const usecase = new LoginUsecase(userRepository, passwordHasher, authToken);
    const result = await usecase.execute('unknown@example.com', 'any');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe('USER_NOT_FOUND');
    }
    expect(passwordHasher.compare).not.toHaveBeenCalled();
  });

  it('retourne INVALID_CREDENTIALS si le mot de passe ne correspond pas', async () => {
    const user = createUser();
    vi.mocked(userRepository.findByEmail).mockResolvedValue(Result.ok(user));
    vi.mocked(passwordHasher.compare).mockResolvedValue(Result.ok(false));

    const usecase = new LoginUsecase(userRepository, passwordHasher, authToken);
    const result = await usecase.execute('u@example.com', 'wrong');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe('INVALID_CREDENTIALS');
    }
    expect(authToken.issueAccessToken).not.toHaveBeenCalled();
  });

  it("propage l'erreur si findByEmail échoue", async () => {
    const err = new Error('DB_ERROR');
    vi.mocked(userRepository.findByEmail).mockResolvedValue(Result.error(err));

    const usecase = new LoginUsecase(userRepository, passwordHasher, authToken);
    const result = await usecase.execute('u@example.com', 'p');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe(err);
  });

  it("propage l'erreur si compare échoue", async () => {
    const user = createUser();
    vi.mocked(userRepository.findByEmail).mockResolvedValue(Result.ok(user));
    vi.mocked(passwordHasher.compare).mockResolvedValue(Result.error(new Error('COMPARE_ERROR')));

    const usecase = new LoginUsecase(userRepository, passwordHasher, authToken);
    const result = await usecase.execute('u@example.com', 'p');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toBe('COMPARE_ERROR');
  });
});
