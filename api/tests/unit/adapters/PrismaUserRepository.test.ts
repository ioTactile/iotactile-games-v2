import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserType } from '@/domain/user/user.type.ts';
import { Role } from '@/domain/user/user.type.ts';

const mockUser = (overrides: Partial<UserType> = {}): UserType => ({
  id: 'id-1',
  email: 'u@example.com',
  password: 'hashed',
  username: 'user1',
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  role: Role.USER,
  ...overrides,
});

const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deleteMany: vi.fn(),
  },
};

vi.mock('@/pkg/database/prisma.ts', () => ({
  prisma: mockPrisma,
}));

describe('PrismaUserRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("findById retourne l'utilisateur si trouvé", async () => {
    const { PrismaUserRepository } =
      await import('@/adapters/secondary/persistence/PrismaUserRepository.ts');
    const user = mockUser({ id: 'id-123' });
    mockPrisma.user.findUnique.mockResolvedValue(user);

    const repo = new PrismaUserRepository();
    const result = await repo.findById('id-123');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual(user);
    }
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'id-123' },
    });
  });

  it('findById retourne null si non trouvé', async () => {
    const { PrismaUserRepository } =
      await import('@/adapters/secondary/persistence/PrismaUserRepository.ts');
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const repo = new PrismaUserRepository();
    const result = await repo.findById('unknown');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe(null);
    }
  });

  it('findByEmail appelle findUnique avec email', async () => {
    const { PrismaUserRepository } =
      await import('@/adapters/secondary/persistence/PrismaUserRepository.ts');
    const user = mockUser({ email: 'a@b.com' });
    mockPrisma.user.findUnique.mockResolvedValue(user);

    const repo = new PrismaUserRepository();
    const result = await repo.findByEmail('a@b.com');

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual(user);
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'a@b.com' },
    });
  });

  it('findAll retourne la liste des utilisateurs', async () => {
    const { PrismaUserRepository } =
      await import('@/adapters/secondary/persistence/PrismaUserRepository.ts');
    const users = [mockUser({ id: '1' }), mockUser({ id: '2' })];
    mockPrisma.user.findMany.mockResolvedValue(users);

    const repo = new PrismaUserRepository();
    const result = await repo.findAll();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(2);
      expect(result.value).toEqual(users);
    }
    expect(mockPrisma.user.findMany).toHaveBeenCalledWith();
  });

  it('create appelle prisma.user.create avec les bonnes données', async () => {
    const { PrismaUserRepository } =
      await import('@/adapters/secondary/persistence/PrismaUserRepository.ts');
    const toCreate = mockUser({ id: '' });
    const created = mockUser({ id: 'new-id' });
    mockPrisma.user.create.mockResolvedValue(created);

    const repo = new PrismaUserRepository();
    const result = await repo.create(toCreate);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual(created);
    expect(mockPrisma.user.create).toHaveBeenCalledWith({
      data: {
        email: toCreate.email,
        password: toCreate.password,
        username: toCreate.username,
        role: toCreate.role,
      },
    });
  });

  it('update appelle prisma.user.update', async () => {
    const { PrismaUserRepository } =
      await import('@/adapters/secondary/persistence/PrismaUserRepository.ts');
    const user = mockUser({ id: 'id-1', username: 'updated' });
    mockPrisma.user.update.mockResolvedValue(user);

    const repo = new PrismaUserRepository();
    const result = await repo.update(user);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.username).toBe('updated');
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: user.id },
      data: {
        email: user.email,
        password: user.password,
        username: user.username,
        deletedAt: user.deletedAt,
        role: user.role,
      },
    });
  });

  it('delete retourne true si un enregistrement supprimé', async () => {
    const { PrismaUserRepository } =
      await import('@/adapters/secondary/persistence/PrismaUserRepository.ts');
    mockPrisma.user.deleteMany.mockResolvedValue({ count: 1 });

    const repo = new PrismaUserRepository();
    const result = await repo.delete('id-1');

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe(true);
    expect(mockPrisma.user.deleteMany).toHaveBeenCalledWith({
      where: { id: 'id-1' },
    });
  });

  it('delete retourne false si aucun enregistrement', async () => {
    const { PrismaUserRepository } =
      await import('@/adapters/secondary/persistence/PrismaUserRepository.ts');
    mockPrisma.user.deleteMany.mockResolvedValue({ count: 0 });

    const repo = new PrismaUserRepository();
    const result = await repo.delete('unknown');

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe(false);
  });

  it("propage l'erreur Prisma en Result.error", async () => {
    const { PrismaUserRepository } =
      await import('@/adapters/secondary/persistence/PrismaUserRepository.ts');
    const dbError = new Error('Prisma error');
    mockPrisma.user.findUnique.mockRejectedValue(dbError);

    const repo = new PrismaUserRepository();
    const result = await repo.findById('id');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe(dbError);
    }
  });
});
