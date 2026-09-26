import { Result } from 'typescript-result';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GetUserByIdUsecase } from '@/application/query/usecases/user/get-user-by-id.usecase.ts';
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

describe('GetUserByIdUsecase', () => {
  let userRepository: UserRepository;

  beforeEach(() => {
    userRepository = {
      findByEmail: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
  });

  it("retourne l'utilisateur si trouvé", async () => {
    const user = createUser({ id: 'id-123' });
    vi.mocked(userRepository.findById).mockResolvedValue(Result.ok(user));

    const usecase = new GetUserByIdUsecase(userRepository);
    const result = await usecase.execute('id-123');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual(user);
    }
    expect(userRepository.findById).toHaveBeenCalledWith('id-123');
  });

  it("retourne null si l'utilisateur n'existe pas", async () => {
    vi.mocked(userRepository.findById).mockResolvedValue(Result.ok(null));

    const usecase = new GetUserByIdUsecase(userRepository);
    const result = await usecase.execute('unknown');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe(null);
    }
  });

  it("propage l'erreur du repository", async () => {
    const err = new Error('DB_ERROR');
    vi.mocked(userRepository.findById).mockResolvedValue(Result.error(err));

    const usecase = new GetUserByIdUsecase(userRepository);
    const result = await usecase.execute('id');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe(err);
  });
});
