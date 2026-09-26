import type { Result } from 'typescript-result';
import type { UserType } from '@/domain/user/user.type.ts';

/**
 * Repository pattern for user operations.
 */
export interface UserRepository {
  /** Find all users. */
  findAll(): Promise<Result<UserType[], Error>>;
  /** Find a user by id. */
  findById(id: string): Promise<Result<UserType | null, Error>>;
  /** Find a user by email. */
  findByEmail(email: string): Promise<Result<UserType | null, Error>>;
  /** Create a new user. */
  create(user: UserType): Promise<Result<UserType, Error>>;
  /** Update a user. */
  update(user: UserType): Promise<Result<UserType, Error>>;
  /** Delete a user. */
  delete(id: string): Promise<Result<boolean, Error>>;
}
