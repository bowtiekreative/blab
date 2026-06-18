import { query } from '../db/index.js';
import { ok, fail } from '../lib/respond.js';

const TARGET_TYPES = ['user', 'room', 'message'];
const REASONS = [
  'harassment', 'spam', 'nsfw', 'impersonation',
  'hate_speech', 'violence', 'illegal', 'other',
];

export default async function reportRoutes(fastify) {
  const auth = { preHandler: fastify.authenticate };

  /** POST /v1/reports — file a report (feeds the Tier 3 review queue). */
  fastify.post('/reports', auth, async (request, reply) => {
    const { targetType, targetId, reason, description } = request.body || {};
    if (!TARGET_TYPES.includes(targetType)) return fail(reply, 400, 'VALIDATION_ERROR', 'Invalid targetType');
    if (!targetId) return fail(reply, 400, 'VALIDATION_ERROR', 'targetId is required');
    if (!REASONS.includes(reason)) return fail(reply, 400, 'VALIDATION_ERROR', 'Invalid reason');

    const { rows } = await query(
      `INSERT INTO reports (reporter_id, target_type, target_id, reason, description)
            VALUES ($1, $2, $3, $4, $5) RETURNING id, created_at`,
      [request.user.sub, targetType, targetId, reason, description || null],
    );
    return reply.code(201).send(ok({ id: rows[0].id, status: 'submitted', createdAt: rows[0].created_at }));
  });

  /** GET /v1/reports/:id — status (reporter or admin only). */
  fastify.get('/reports/:id', auth, async (request, reply) => {
    const { rows } = await query('SELECT * FROM reports WHERE id = $1', [request.params.id]);
    if (!rows[0]) return fail(reply, 404, 'NOT_FOUND', 'Report not found');
    const me = await query('SELECT is_admin FROM users WHERE id = $1', [request.user.sub]);
    if (rows[0].reporter_id !== request.user.sub && !me.rows[0]?.is_admin) {
      return fail(reply, 403, 'FORBIDDEN', 'Not your report');
    }
    return ok(rows[0]);
  });

  // --- Tier 0: self-moderation (global block) ---

  /** POST /v1/users/:id/block */
  fastify.post('/users/:id/block', auth, async (request, reply) => {
    if (request.params.id === request.user.sub) return fail(reply, 422, 'INVALID', 'Cannot block yourself');
    await query(
      `INSERT INTO user_blocks (blocker_id, blocked_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [request.user.sub, request.params.id],
    );
    return ok({ blocked: true });
  });

  /** DELETE /v1/users/:id/block */
  fastify.delete('/users/:id/block', auth, async (request) => {
    await query('DELETE FROM user_blocks WHERE blocker_id = $1 AND blocked_id = $2', [
      request.user.sub,
      request.params.id,
    ]);
    return ok({ unblocked: true });
  });

  /** GET /v1/users/me/blocks */
  fastify.get('/users/me/blocks', auth, async (request) => {
    const { rows } = await query(
      `SELECT b.blocked_id, u.username FROM user_blocks b
         JOIN users u ON u.id = b.blocked_id WHERE b.blocker_id = $1`,
      [request.user.sub],
    );
    return ok(rows);
  });
}
