import { query } from '../db/index.js';
import { ok, fail } from '../lib/respond.js';

/** User-facing jail endpoints (status + appeal). One appeal per 30 days. */
export default async function jailRoutes(fastify) {
  const auth = { preHandler: fastify.authenticate };

  /** GET /v1/jail/status */
  fastify.get('/jail/status', auth, async (request) => {
    const jail = await query(
      `SELECT reason, entered_at FROM jail WHERE user_id = $1 AND released_at IS NULL`,
      [request.user.sub],
    );
    const appeal = await query(
      `SELECT id, status, reason, created_at, reviewed_at, admin_notes
         FROM jail_appeals WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [request.user.sub],
    );
    return ok({
      inJail: jail.rowCount > 0,
      reason: jail.rows[0]?.reason || null,
      enteredAt: jail.rows[0]?.entered_at || null,
      lastAppeal: appeal.rows[0] || null,
    });
  });

  /** POST /v1/jail/appeal — submit an appeal (once per 30 days). */
  fastify.post('/jail/appeal', auth, async (request, reply) => {
    const { reason } = request.body || {};
    if (!reason || reason.length < 10) {
      return fail(reply, 400, 'VALIDATION_ERROR', 'Appeal reason must be at least 10 characters');
    }
    const jail = await query(
      `SELECT 1 FROM jail WHERE user_id = $1 AND released_at IS NULL`,
      [request.user.sub],
    );
    if (!jail.rowCount) return fail(reply, 422, 'NOT_JAILED', 'You are not in jail');

    const recent = await query(
      `SELECT 1 FROM jail_appeals
        WHERE user_id = $1 AND created_at > NOW() - INTERVAL '30 days'`,
      [request.user.sub],
    );
    if (recent.rowCount) {
      return fail(reply, 429, 'APPEAL_COOLDOWN', 'You can only appeal once every 30 days');
    }

    const { rows } = await query(
      `INSERT INTO jail_appeals (user_id, reason) VALUES ($1, $2) RETURNING id, status, created_at`,
      [request.user.sub, reason],
    );
    return reply.code(201).send(ok(rows[0]));
  });
}
