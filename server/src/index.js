import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';

import { config, isProd } from './config.js';
import authPlugin from './plugins/auth.js';
import healthRoutes from './routes/health.js';
import authRoutes from './routes/auth.js';
import roomRoutes from './routes/rooms.js';
import mediaRoutes from './routes/media.js';
import tokenRoutes from './routes/tokens.js';
import giftRoutes from './routes/gifts.js';
import clapRoutes from './routes/claps.js';
import squadRoutes from './routes/squads.js';
import moderationRoutes from './routes/moderation.js';
import reportRoutes from './routes/reports.js';
import jailRoutes from './routes/jail.js';
import adminRoutes from './routes/admin.js';
import wsGateway from './ws/gateway.js';
import { closePool } from './db/index.js';

export async function build() {
  const fastify = Fastify({
    logger: { level: isProd ? 'info' : 'debug' },
  });

  await fastify.register(cors, { origin: config.corsOrigin, credentials: true });
  await fastify.register(websocket);
  await fastify.register(authPlugin);

  // REST API under /v1, health at root.
  await fastify.register(healthRoutes);
  await fastify.register(authRoutes, { prefix: '/v1' });
  await fastify.register(roomRoutes, { prefix: '/v1' });
  await fastify.register(mediaRoutes, { prefix: '/v1' });
  await fastify.register(tokenRoutes, { prefix: '/v1' });
  await fastify.register(giftRoutes, { prefix: '/v1' });
  await fastify.register(clapRoutes, { prefix: '/v1' });
  await fastify.register(squadRoutes, { prefix: '/v1' });
  await fastify.register(moderationRoutes, { prefix: '/v1' });
  await fastify.register(reportRoutes, { prefix: '/v1' });
  await fastify.register(jailRoutes, { prefix: '/v1' });
  await fastify.register(adminRoutes, { prefix: '/v1' });

  // WebSocket signaling gateway.
  await fastify.register(wsGateway);

  return fastify;
}

async function start() {
  const fastify = await build();
  try {
    await fastify.listen({ port: config.port, host: config.host });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }

  for (const sig of ['SIGINT', 'SIGTERM']) {
    process.on(sig, async () => {
      await fastify.close();
      await closePool();
      process.exit(0);
    });
  }
}

// Only auto-start when run directly (not when imported by tests).
if (import.meta.url === `file://${process.argv[1]}`) {
  start();
}
