import { query } from '../db/index.js';
import { ok, fail } from '../lib/respond.js';
import { withTx } from '../lib/wallet.js';
import { notify } from '../lib/notify.js';

export default async function notificationRoutes(fastify) {
  const auth = { preHandler: fastify.authenticate };

  /** GET /v1/notifications — my notifications (newest first). */
  fastify.get('/notifications', auth, async (request) => {
    const { rows } = await query(
      `SELECT id, type, title, body, data, is_read, created_at
         FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [request.user.sub],
    );
    const unread = await query(
      `SELECT COUNT(*)::int AS n FROM notifications WHERE user_id = $1 AND is_read = false`,
      [request.user.sub],
    );
    return ok(rows, { unread: unread.rows[0].n });
  });

  /** POST /v1/notifications/read/:id */
  fastify.post('/notifications/read/:id', auth, async (request) => {
    await query('UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2', [
      request.params.id,
      request.user.sub,
    ]);
    return ok({ read: true });
  });

  /** POST /v1/notifications/read-all */
  fastify.post('/notifications/read-all', auth, async (request) => {
    await query('UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false', [
      request.user.sub,
    ]);
    return ok({ read: true });
  });

  /** GET /v1/notifications/preferences */
  fastify.get('/notifications/preferences', auth, async (request) => {
    const { rows } = await query(
      `INSERT INTO notification_preferences (user_id) VALUES ($1)
       ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW() RETURNING *`,
      [request.user.sub],
    );
    return ok(rows[0]);
  });

  /** POST /v1/notifications/preferences — update a subset of toggles. */
  fastify.post('/notifications/preferences', auth, async (request) => {
    const allowed = [
      'mention_push', 'gift_push', 'follower_push',
      'room_invite_push', 'scheduled_room_push', 'squad_go_live_email',
    ];
    // Ensure the row exists first, then apply the toggles — otherwise a fresh
    // INSERT would store defaults and skip the ON CONFLICT update entirely.
    await query(
      `INSERT INTO notification_preferences (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`,
      [request.user.sub],
    );
    const sets = [];
    const params = [request.user.sub];
    for (const key of allowed) {
      if (typeof request.body?.[key] === 'boolean') {
        params.push(request.body[key]);
        sets.push(`${key} = $${params.length}`);
      }
    }
    const assignment = sets.length ? `${sets.join(', ')}, updated_at = NOW()` : 'updated_at = NOW()';
    const { rows } = await query(
      `UPDATE notification_preferences SET ${assignment} WHERE user_id = $1 RETURNING *`,
      params,
    );
    return ok(rows[0]);
  });

  // --- Push subscriptions ---

  /** POST /v1/push/subscribe — register a Web Push endpoint or FCM token. */
  fastify.post('/push/subscribe', auth, async (request, reply) => {
    const { platform = 'web', endpoint, p256dh, auth: authKey, fcmToken } = request.body || {};
    if (!endpoint && !fcmToken) {
      return fail(reply, 400, 'VALIDATION_ERROR', 'endpoint or fcmToken is required');
    }
    await query(
      `INSERT INTO push_subscriptions (user_id, platform, endpoint, p256dh_key, auth_key, fcm_token)
            VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, platform, endpoint) DO UPDATE
         SET p256dh_key = EXCLUDED.p256dh_key, auth_key = EXCLUDED.auth_key, fcm_token = EXCLUDED.fcm_token`,
      [request.user.sub, platform, endpoint || '', p256dh || null, authKey || null, fcmToken || null],
    );
    return reply.code(201).send(ok({ subscribed: true }));
  });

  /** POST /v1/push/unsubscribe */
  fastify.post('/push/unsubscribe', auth, async (request) => {
    const { endpoint } = request.body || {};
    await query('DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2', [
      request.user.sub,
      endpoint || '',
    ]);
    return ok({ unsubscribed: true });
  });

  // --- Follows (trigger follower notifications) ---

  /** POST /v1/users/:id/follow */
  fastify.post('/users/:id/follow', auth, async (request, reply) => {
    const followee = request.params.id;
    if (followee === request.user.sub) return fail(reply, 422, 'INVALID', 'Cannot follow yourself');

    const inserted = await withTx(async (client) => {
      const { rowCount } = await client.query(
        `INSERT INTO follows (follower_id, followee_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [request.user.sub, followee],
      );
      if (rowCount) {
        await client.query('UPDATE users SET follower_count = follower_count + 1 WHERE id = $1', [followee]);
        await client.query('UPDATE users SET following_count = following_count + 1 WHERE id = $1', [request.user.sub]);
      }
      return rowCount > 0;
    });

    if (inserted) {
      await notify(followee, {
        type: 'follower',
        title: 'New follower',
        body: `@${request.user.username} followed you`,
        data: { userId: request.user.sub },
      });
    }
    return ok({ following: true });
  });

  /** DELETE /v1/users/:id/follow */
  fastify.delete('/users/:id/follow', auth, async (request) => {
    await withTx(async (client) => {
      const { rowCount } = await client.query(
        'DELETE FROM follows WHERE follower_id = $1 AND followee_id = $2',
        [request.user.sub, request.params.id],
      );
      if (rowCount) {
        await client.query('UPDATE users SET follower_count = GREATEST(follower_count - 1, 0) WHERE id = $1', [request.params.id]);
        await client.query('UPDATE users SET following_count = GREATEST(following_count - 1, 0) WHERE id = $1', [request.user.sub]);
      }
    });
    return ok({ following: false });
  });
}
