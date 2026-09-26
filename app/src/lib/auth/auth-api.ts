import type { LoginCredentials, LoginResponse, RegisterCredentials, User } from '@/types/auth';

import { defaultFetchOptions, getApiUrl } from '../api/api-client';

const authBase = () => `${getApiUrl()}/auth`;

/**
 * Login: POST /auth/login.
 * Refresh token is set as an httpOnly cookie by the API.
 */
export async function login(
  credentials: LoginCredentials,
): Promise<{ ok: true; data: LoginResponse } | { ok: false; error: string }> {
  const res = await fetch(`${authBase()}/login`, {
    ...defaultFetchOptions,
    method: 'POST',
    body: JSON.stringify(credentials),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return {
      ok: false,
      error: data?.error ?? 'Erreur lors de la connexion.',
    };
  }

  return {
    ok: true,
    data: data as LoginResponse,
  };
}

/**
 * Register: POST /auth/register.
 * Returns the created user (no password).
 */
export async function register(
  credentials: RegisterCredentials,
): Promise<{ ok: true; data: User } | { ok: false; error: string }> {
  const res = await fetch(`${authBase()}/register`, {
    ...defaultFetchOptions,
    method: 'POST',
    body: JSON.stringify(credentials),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return {
      ok: false,
      error: (data?.error as string) ?? "Erreur lors de l'inscription.",
    };
  }

  return { ok: true, data: data as User };
}

/**
 * Logout: POST /auth/logout (clears the refresh cookie).
 */
export async function logout(): Promise<void> {
  await fetch(`${authBase()}/logout`, {
    ...defaultFetchOptions,
    method: 'POST',
  });
}

/**
 * Current user: GET /auth/me (requires Authorization: Bearer accessToken).
 */
export async function getMe(
  accessToken: string,
): Promise<{ ok: true; data: User } | { ok: false; error: string }> {
  const res = await fetch(`${authBase()}/me`, {
    ...defaultFetchOptions,
    method: 'GET',
    headers: {
      ...defaultFetchOptions.headers,
      Authorization: `Bearer ${accessToken}`,
    } as HeadersInit,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return {
      ok: false,
      error: data?.error ?? 'Non authentifié.',
    };
  }

  return { ok: true, data: data as User };
}

/**
 * Refresh the access token via the refresh cookie: POST /auth/refresh.
 */
export async function refresh(): Promise<
  { ok: true; accessToken: string; expiresInSeconds: number } | { ok: false }
> {
  const res = await fetch(`${authBase()}/refresh`, {
    ...defaultFetchOptions,
    method: 'POST',
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return { ok: false };
  }

  return {
    ok: true,
    accessToken: (data as { accessToken: string }).accessToken,
    expiresInSeconds: (data as { expiresInSeconds: number }).expiresInSeconds,
  };
}
