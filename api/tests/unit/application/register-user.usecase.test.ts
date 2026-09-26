import { Result } from 'typescript-result';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PasswordHasherPort } from '@/application/command/ports/password-hasher.port.ts';
import { RegisterUserUsecase } from '@/application/command/usecases/user/register-user.usecase.ts';
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

describe('RegisterUserUsecase', () => {
  let userRepository: UserRepository;
  let passwordHasher: PasswordHasherPort;

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
  });

  it('crée un utilisateur et retourne un SafeUser (sans mot de passe)', async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(Result.ok(null));
    vi.mocked(passwordHasher.hash).mockResolvedValue(Result.ok('hashedPassword123'));
    const created = createUser({
      id: 'new-id',
      email: 'new@example.com',
      password: 'hashedPassword123',
      username: 'newuser',
    });
    vi.mocked(userRepository.create).mockResolvedValue(Result.ok(created));

    const usecase = new RegisterUserUsecase(userRepository, passwordHasher);
    const result = await usecase.execute({
      email: 'new@example.com',
      password: 'Secret123',
      username: 'newuser',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).not.toHaveProperty('password');
      expect(result.value.email).toBe('new@example.com');
      expect(result.value.username).toBe('newuser');
      expect(result.value.role).toBe(Role.USER);
    }
    expect(userRepository.findByEmail).toHaveBeenCalledWith('new@example.com');
    expect(passwordHasher.hash).toHaveBeenCalledWith('Secret123');
    expect(userRepository.create).toHaveBeenCalled();
  });

  it("retourne EMAIL_ALREADY_USED si l'email existe déjà", async () => {
    const existing = createUser({ email: 'taken@example.com' });
    vi.mocked(userRepository.findByEmail).mockResolvedValue(Result.ok(existing));

    const usecase = new RegisterUserUsecase(userRepository, passwordHasher);
    const result = await usecase.execute({
      email: 'taken@example.com',
      password: 'Secret123',
      username: 'someone',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe('EMAIL_ALREADY_USED');
    }
    expect(passwordHasher.hash).not.toHaveBeenCalled();
    expect(userRepository.create).not.toHaveBeenCalled();
  });

  it('utilise le rôle ADMIN si fourni', async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(Result.ok(null));
    vi.mocked(passwordHasher.hash).mockResolvedValue(Result.ok('hashed'));
    const created = createUser({
      id: 'id',
      email: 'admin@example.com',
      password: 'hashed',
      username: 'admin',
      role: Role.ADMIN,
    });
    vi.mocked(userRepository.create).mockResolvedValue(Result.ok(created));

    const usecase = new RegisterUserUsecase(userRepository, passwordHasher);
    const result = await usecase.execute({
      email: 'admin@example.com',
      password: 'Secret123',
      username: 'admin',
      role: Role.ADMIN,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.role).toBe(Role.ADMIN);
    }
  });

  it("propage l'erreur si findByEmail échoue", async () => {
    const err = new Error('DB_ERROR');
    vi.mocked(userRepository.findByEmail).mockResolvedValue(Result.error(err));

    const usecase = new RegisterUserUsecase(userRepository, passwordHasher);
    const result = await usecase.execute({
      email: 'a@example.com',
      password: 'Secret123',
      username: 'u',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe(err);
  });

  it("propage l'erreur si hash échoue", async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(Result.ok(null));
    vi.mocked(passwordHasher.hash).mockResolvedValue(Result.error(new Error('HASH_ERROR')));

    const usecase = new RegisterUserUsecase(userRepository, passwordHasher);
    const result = await usecase.execute({
      email: 'a@example.com',
      password: 'Secret123',
      username: 'u',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toBe('HASH_ERROR');
    expect(userRepository.create).not.toHaveBeenCalled();
  });

  it("propage l'erreur si create échoue", async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(Result.ok(null));
    vi.mocked(passwordHasher.hash).mockResolvedValue(Result.ok('hashed'));
    vi.mocked(userRepository.create).mockResolvedValue(Result.error(new Error('CREATE_FAILED')));

    const usecase = new RegisterUserUsecase(userRepository, passwordHasher);
    const result = await usecase.execute({
      email: 'a@example.com',
      password: 'Secret123',
      username: 'u',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toBe('CREATE_FAILED');
  });
});
