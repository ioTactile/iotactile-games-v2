import '@/pkg/env.ts';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import fastifyWebsocket from '@fastify/websocket';
import Fastify from 'fastify';
import { authPlugin } from '@/adapters/primary/http/plugins/auth.plugin.ts';
import { registerAuthRoutes } from '@/adapters/primary/http/routes/auth.routes.ts';
import { registerDiceRoutes } from '@/adapters/primary/http/routes/dice.routes.ts';
import { registerUserRoutes } from '@/adapters/primary/http/routes/user.routes.ts';
import { config } from '@/pkg/config/index.ts';
import { loggerConfig } from '@/pkg/logger/index.ts';

const server = Fastify({
  logger: loggerConfig,
});

// Avoid FST_ERR_CTP_EMPTY_JSON_BODY when the client sends application/json with an empty body (e.g. refresh token in a cookie)
server.addHook('preParsing', (request, _reply, payload, done) => {
  const contentType = request.headers['content-type'];
  const contentLength = request.headers['content-length'];
  if (
    contentType?.includes('application/json') &&
    (contentLength === undefined || contentLength === '0')
  ) {
    delete request.headers['content-type'];
  }
  done(null, payload);
});

await server.register(cors, {
  origin: (origin, cb) => {
    // Allow requests with no Origin (server-to-server, Postman, etc.)
    if (!origin) {
      cb(null, true);
      return;
    }
    // Allow if the origin is in the whitelist
    if (config.cors.origins.includes(origin)) {
      // Echo the real origin (required when credentials: true)
      cb(null, origin);
    } else {
      server.log.warn(
        `CORS bloquée pour l'origine: ${origin}. Autorisées: ${config.cors.origins.join(', ')}`,
      );
      cb(new Error('CORS non autorisée'), false);
    }
  },
  credentials: true, // Required for cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie'],
});

await server.register(cookie, {
  secret: config.cookie.secret,
});

await server.register(jwt, {
  secret: config.jwt.secret,
});

await server.register(fastifyWebsocket);

await authPlugin(server);
await registerAuthRoutes(server);
await registerUserRoutes(server);
await server.register(
  async (instance) => {
    await registerDiceRoutes(instance);
  },
  { prefix: '/dice' },
);

try {
  await server.listen({ port: config.server.port, host: config.server.host });
} catch (error) {
  server.log.error(error);
  process.exit(1);
}

process.on('SIGINT', async () => {
  await server.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await server.close();
  process.exit(0);
});
