import type { Result } from 'typescript-result';
import type { UserRepository } from '@/domain/user/user.repository.ts';
import type { UserType } from '@/domain/user/user.type.ts';

export class GetUserByIdUsecase {
  private readonly userRepository: UserRepository;

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
  }

  async execute(id: string): Promise<Result<UserType | null, Error>> {
    return this.userRepository.findById(id);
  }
}
