/** User role (aligned with API). */
export const Role = {
  ADMIN: 'ADMIN',
  USER: 'USER',
} as const;

export type Role = (typeof Role)[keyof typeof Role];

/** Front-end user (no password; aligned with GET /auth/me). */
export interface User {
  id: string;
  email: string;
  username: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

/** Login payload (aligned with POST /auth/login). */
export interface LoginCredentials {
  email: string;
  password: string;
}

/** Login response (accessToken in body, refresh in cookie). */
export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresInSeconds: number;
}

/** Registration payload (aligned with POST /auth/register). */
export interface RegisterCredentials {
  email: string;
  password: string;
  username: string;
  role?: Role;
}
