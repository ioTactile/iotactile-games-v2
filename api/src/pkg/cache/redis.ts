import type { RedisClientType } from 'redis';
import { createClient } from 'redis';
import { config } from '@/pkg/config/index.ts';
import { logger } from '@/pkg/logger/index.ts';

let client: RedisClientType | null = null;
let connecting = false;

export function getRedisClient(): RedisClientType | null {
  if (!config.cache?.redisUrl) return null;
  if (client) return client;
  if (connecting) return null;

  connecting = true;
  client = createClient({
    url: config.cache.redisUrl,
  });

  client.on('error', (error) => {
    logger.error({ err: error }, '[redis] connection error');
  });

  void client
    .connect()
    .catch((error) => {
      logger.error({ err: error }, '[redis] failed to connect');
      client = null;
    })
    .finally(() => {
      connecting = false;
    });

  return client;
}
