/**
 * API base URL (client-side).
 * Uses NEXT_PUBLIC_API_URL when set, otherwise http://localhost:3000 in dev.
 */
export function getApiUrl(): string {
  return String(process.env.NEXT_PUBLIC_API_URL);
}

export const defaultFetchOptions: RequestInit = {
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
  },
};

/**
 * WebSocket URL for a given route (replaces http(s) with ws(s)).
 */
export function getWsUrl(path: string): string {
  const base = getApiUrl().replace(/^http/, 'ws');
  const p = path.startsWith('/') ? path : `/${path}`;
  return base.endsWith('/') ? `${base.slice(0, -1)}${p}` : `${base}${p}`;
}
