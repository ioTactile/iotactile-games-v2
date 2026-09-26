import { Result } from 'typescript-result';
import type { PasswordHasherPort } from '@/application/command/ports/password-hasher.port.ts';
import type { UserRepository } from '@/domain/user/user.repository.ts';
import type { UserType } from '@/domain/user/user.type.ts';
import { Role } from '@/domain/user/user.type.ts';

export interface RegisterUserInput {
  email: string;
  password: string;
  username: string;
  role?: Role;
}

/** User DTO returned after creation (no password). */
export type SafeUser = Omit<UserType, 'password'>;

export class RegisterUserUsecase {
  private readonly userRepository: UserRepository;
  private readonly passwordHasher: PasswordHasherPort;

  constructor(userRepository: UserRepository, passwordHasher: PasswordHasherPort) {
    this.userRepository = userRepository;
    this.passwordHasher = passwordHasher;
  }

  async execute(input: RegisterUserInput): Promise<Result<SafeUser, Error>> {
    const existing = await this.userRepository.findByEmail(input.email);
    if (!existing.ok) return existing;
    if (existing.value !== null) {
      return Result.error(new Error('EMAIL_ALREADY_USED'));
    }

    const hashed = await this.passwordHasher.hash(input.password);
    if (!hashed.ok) return hashed;

    const userToCreate: UserType = {
      id: '',
      email: input.email,
      password: hashed.value,
      username: input.username,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      role: input.role === 'ADMIN' ? Role.ADMIN : Role.USER,
    };

    const created = await this.userRepository.create(userToCreate);
    if (!created.ok) return created;

    const { password, ...safeUser } = created.value;
    void password;
    return Result.ok(safeUser);
  }
}
