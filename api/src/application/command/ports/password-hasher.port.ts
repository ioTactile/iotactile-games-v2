import type { Result } from 'typescript-result';

/**
 * Port for hashing and verifying passwords.
 * Implementation (e.g. bcrypt) lives in adapters.
 */
export interface PasswordHasherPort {
  /** Hash a plaintext password. Never store plaintext. */
  hash(plainPassword: string): Promise<Result<string, Error>>;

  /** Compare a plaintext password to the stored hash (timing-safe). */
  compare(plainPassword: string, hashedPassword: string): Promise<Result<boolean, Error>>;
}
