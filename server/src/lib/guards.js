import { query } from '../db/index.js';

/**
 * Fetch a user's enforcement state (jail / ban / suspension). Used to gate
 * sensitive actions: jailed users cannot create rooms, join, chat, or gift.
 */
export async function enforcementState(userId) {
  const { rows } = await query(
    `SELECT is_banned, is_in_jail, suspended_until, chat_muted_until FROM users WHERE id = $1`,
    [userId],
  );
  const u = rows[0] || {};
  const now = Date.now();
  return {
    banned: Boolean(u.is_banned),
    jailed: Boolean(u.is_in_jail),
    suspended: u.suspended_until ? new Date(u.suspended_until).getTime() > now : false,
    chatMuted: u.chat_muted_until ? new Date(u.chat_muted_until).getTime() > now : false,
  };
}

/**
 * Fastify preHandler factory: blocks the request when the user is banned,
 * jailed, or suspended. `action` is used in the error message.
 */
export function requireActive(action = 'do that') {
  return async (request, reply) => {
    const s = await enforcementState(request.user.sub);
    if (s.banned) return reply.code(403).send({ error: { code: 'BANNED', message: 'Account is banned' } });
    if (s.jailed)
      return reply.code(403).send({ error: { code: 'JAILED', message: `You are in jail and cannot ${action}` } });
    if (s.suspended)
      return reply.code(403).send({ error: { code: 'SUSPENDED', message: 'Account is suspended' } });
  };
}
