import { query } from '../db/index.js';
import { config } from '../config.js';
import { ok, fail } from '../lib/respond.js';

const USERNAME_RE = /^[a-zA-Z0-9_]{3,30}$/;

function signToken(fastify, user) {
  return fastify.jwt.sign({
    sub: user.id,
    username: user.username,
    displayName: user.display_name,
    avatarUrl: user.avatar_url,
    isBanned: user.is_banned,
  });
}

export default async function authRoutes(fastify) {
  /**
   * GET /v1/auth/me — current user profile.
   */
  fastify.get('/auth/me', { preHandler: fastify.authenticate }, async (request, reply) => {
    const { rows } = await query(
      `SELECT id, username, display_name, avatar_url, bio, verification_level,
              follower_count, following_count, total_claps, xp, level,
              is_banned, is_in_jail, is_admin, created_at, last_seen_at
         FROM users WHERE id = $1 AND deleted_at IS NULL`,
      [request.user.sub],
    );
    if (!rows[0]) return fail(reply, 404, 'NOT_FOUND', 'User not found');
    return ok(rows[0]);
  });

  /**
   * POST /v1/auth/dev-login — DEV ONLY. Finds or creates a user by username and
   * returns a JWT. OAuth providers (google/facebook/x) land in a later phase.
   * Gated behind ALLOW_DEV_LOGIN so it can never be enabled in production.
   */
  fastify.post('/auth/dev-login', async (request, reply) => {
    if (!config.allowDevLogin) {
      return fail(reply, 404, 'NOT_FOUND', 'Not found');
    }
    const { username, displayName } = request.body || {};
    if (!USERNAME_RE.test(username || '')) {
      return fail(reply, 400, 'VALIDATION_ERROR', 'username must be 3–30 chars [a-zA-Z0-9_]');
    }

    const { rows } = await query(
      `INSERT INTO users (username, display_name)
            VALUES ($1, $2)
       ON CONFLICT (username) DO UPDATE SET last_seen_at = NOW()
         RETURNING *`,
      [username, displayName || username],
    );
    const user = rows[0];
    if (user.is_banned) return fail(reply, 403, 'BANNED', 'Account is banned');

    return ok({ token: signToken(fastify, user), user });
  });
}
