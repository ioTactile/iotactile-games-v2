interface LoginAttemptState {
  count: number;
  windowStart: number;
  blockedUntil?: number;
}

const attempts = new Map<string, LoginAttemptState>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60_000;
const BLOCK_MS = 5 * 60_000;

export function buildLoginKey(ip: string | undefined, email: string): string {
  const safeIp = ip || 'unknown';
  return `${safeIp}:${email.trim().toLowerCase()}`;
}

export function isLoginBlocked(key: string, now = Date.now()): boolean {
  const state = attempts.get(key);
  if (!state) return false;

  if (state.blockedUntil !== undefined) {
    if (now < state.blockedUntil) {
      return true;
    }
    attempts.delete(key);
    return false;
  }

  if (now - state.windowStart > WINDOW_MS) {
    attempts.delete(key);
    return false;
  }

  return false;
}

export function registerLoginFailure(key: string, now = Date.now()): void {
  const state = attempts.get(key);
  if (!state) {
    attempts.set(key, { count: 1, windowStart: now });
    return;
  }

  if (now - state.windowStart > WINDOW_MS) {
    attempts.set(key, { count: 1, windowStart: now });
    return;
  }

  const nextCount = state.count + 1;
  if (nextCount >= MAX_ATTEMPTS) {
    attempts.set(key, {
      count: nextCount,
      windowStart: state.windowStart,
      blockedUntil: now + BLOCK_MS,
    });
    return;
  }

  attempts.set(key, {
    count: nextCount,
    windowStart: state.windowStart,
  });
}

export function resetLoginAttempts(key: string): void {
  attempts.delete(key);
}
