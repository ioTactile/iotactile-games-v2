export const config = {
  server: {
    port: Number(process.env.SERVER_PORT),
    host: String(process.env.SERVER_HOST),
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  cors: {
    origins: [process.env.BASE_URL_API, process.env.BASE_URL_APP],
  },
  jwt: {
    secret: String(process.env.JWT_SECRET),
    accessTokenTtlSeconds: Number(process.env.JWT_ACCESS_TTL_SECONDS), // 15 min
    refreshTokenTtlSeconds: Number(process.env.JWT_REFRESH_TTL_SECONDS), // 7 jours
  },
  cookie: {
    secret: process.env.COOKIE_SECRET,
    refreshTokenName: 'refreshToken',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: Number(process.env.COOKIE_MAX_AGE), // 7 jours en secondes
  },
  cache: {
    redisUrl: process.env.REDIS_URL ?? null,
    dice: {
      publicSessionsTtlSeconds: Number(process.env.DICE_PUBLIC_SESSIONS_CACHE_TTL_SECONDS ?? '5'),
    },
  },
};
