import { Result } from 'typescript-result';
import type { UserRepository } from '@/domain/user/user.repository.ts';
import type { UserType } from '@/domain/user/user.type.ts';
import { prisma } from '@/pkg/database/prisma.ts';

export class PrismaUserRepository implements UserRepository {
  async findById(id: string): Promise<Result<UserType | null, Error>> {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
      });
      return Result.ok(user);
    } catch (error) {
      return Result.error(error as Error);
    }
  }

  async findAll(): Promise<Result<UserType[], Error>> {
    try {
      const users = await prisma.user.findMany();
      return Result.ok(users);
    } catch (error) {
      return Result.error(error as Error);
    }
  }

  async findByEmail(email: string): Promise<Result<UserType | null, Error>> {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
      });
      return Result.ok(user);
    } catch (error) {
      return Result.error(error as Error);
    }
  }

  async create(user: UserType): Promise<Result<UserType, Error>> {
    try {
      const created = await prisma.user.create({
        data: {
          email: user.email,
          password: user.password,
          username: user.username,
          role: user.role,
        },
      });
      return Result.ok(created);
    } catch (error) {
      return Result.error(error as Error);
    }
  }

  async update(user: UserType): Promise<Result<UserType, Error>> {
    try {
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
          email: user.email,
          password: user.password,
          username: user.username,
          deletedAt: user.deletedAt,
          role: user.role,
        },
      });
      return Result.ok(updated);
    } catch (error) {
      return Result.error(error as Error);
    }
  }

  async delete(id: string): Promise<Result<boolean, Error>> {
    try {
      const result = await prisma.user.deleteMany({ where: { id } });
      return Result.ok(result.count > 0);
    } catch (error) {
      return Result.error(error as Error);
    }
  }
}
