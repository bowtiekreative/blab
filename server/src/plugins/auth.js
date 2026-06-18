import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import { config } from '../config.js';

/**
 * Registers JWT support and an `authenticate` preHandler.
 *
 * Tokens follow api/auth.md: { sub, username, displayName, avatarUrl, isBanned }.
 * Banned users are rejected at verification time.
 */
async function authPlugin(fastify) {
  fastify.register(fastifyJwt, {
    secret: config.jwt.secret,
    sign: { expiresIn: config.jwt.expiresIn },
  });

  fastify.decorate('authenticate', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.code(401).send({
        error: { code: 'UNAUTHORIZED', message: 'Missing or invalid token' },
      });
    }
    if (request.user?.isBanned) {
      return reply.code(403).send({
        error: { code: 'BANNED', message: 'Account is banned' },
      });
    }
  });
}

export default fp(authPlugin, { name: 'auth' });
