import { randomBytes } from 'node:crypto';
import { query } from '../db/index.js';
import { ok, fail } from '../lib/respond.js';
import { hub } from '../realtime/hub.js';
import { requireActive } from '../lib/guards.js';

// Bare column list (for INSERT ... RETURNING). The aliased variant is used in SELECTs that join users.
const ROOM_FIELDS = `id, host_id, name, description, cover_image_url, category,
  hashtags, is_live, is_private, is_recorded, invite_code, current_topic,
  slot_0_user_id, slot_1_user_id, slot_2_user_id, slot_3_user_id,
  created_at, started_at, ended_at`;
const ROOM_COLS = ROOM_FIELDS.replace(/(\w+)/g, 'r.$1');

function inviteCode() {
  return randomBytes(6).toString('base64url');
}

/** Attach live presence counts from the hub to a DB room row. */
function withLiveStats(row) {
  const live = hub.rooms.get(row.id);
  return {
    ...row,
    slots: [0, 1, 2, 3].map((i) => ({ index: i, userId: row[`slot_${i}_user_id`] })),
    stats: {
      viewerCount: live ? live.viewers.size : 0,
      lurkerCount: live ? live.lurkers.size : 0,
    },
  };
}

export default async function roomRoutes(fastify) {
  /** GET /v1/rooms — list/search rooms (live first, newest first). */
  fastify.get('/rooms', async (request) => {
    const { q, tag, category, live } = request.query || {};
    const where = ['r.is_banned = false'];
    const params = [];
    if (q) {
      params.push(`%${q}%`);
      where.push(`r.name ILIKE $${params.length}`);
    }
    if (tag) {
      params.push(tag);
      where.push(`$${params.length} = ANY(r.hashtags)`);
    }
    if (category) {
      params.push(category);
      where.push(`r.category = $${params.length}`);
    }
    if (live === 'true') where.push('r.is_live = true');

    const { rows } = await query(
      `SELECT ${ROOM_COLS}, u.username AS host_username, u.avatar_url AS host_avatar_url
         FROM rooms r JOIN users u ON u.id = r.host_id
        WHERE ${where.join(' AND ')}
        ORDER BY r.is_live DESC, r.created_at DESC
        LIMIT 50`,
      params,
    );
    return ok(rows.map(withLiveStats));
  });

  /** POST /v1/rooms — create a room. */
  fastify.post('/rooms', { preHandler: [fastify.authenticate, requireActive('create rooms')] }, async (request, reply) => {
    const { name, description, category, hashtags, isPrivate } = request.body || {};
    if (!name || name.length > 100) {
      return fail(reply, 400, 'VALIDATION_ERROR', 'name is required (≤100 chars)');
    }
    const { rows } = await query(
      `INSERT INTO rooms (host_id, name, description, category, hashtags, is_private, invite_code)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING ${ROOM_FIELDS}`,
      [
        request.user.sub,
        name,
        description || null,
        category || null,
        Array.isArray(hashtags) ? hashtags : [],
        Boolean(isPrivate),
        inviteCode(),
      ],
    );
    return reply.code(201).send(ok(withLiveStats(rows[0])));
  });

  /** GET /v1/rooms/:id — room details. */
  fastify.get('/rooms/:id', async (request, reply) => {
    const { rows } = await query(
      `SELECT ${ROOM_COLS}, u.username AS host_username, u.avatar_url AS host_avatar_url
         FROM rooms r JOIN users u ON u.id = r.host_id
        WHERE r.id = $1`,
      [request.params.id],
    );
    if (!rows[0]) return fail(reply, 404, 'NOT_FOUND', 'Room not found');
    return ok(withLiveStats(rows[0]));
  });

  async function loadRoomForHost(roomId, userId, reply) {
    const { rows } = await query('SELECT host_id FROM rooms WHERE id = $1', [roomId]);
    if (!rows[0]) {
      fail(reply, 404, 'NOT_FOUND', 'Room not found');
      return null;
    }
    if (rows[0].host_id !== userId) {
      fail(reply, 403, 'FORBIDDEN', 'Host only');
      return null;
    }
    return rows[0];
  }

  /** POST /v1/rooms/:id/start — go live (host only). */
  fastify.post('/rooms/:id/start', { preHandler: fastify.authenticate }, async (request, reply) => {
    if (!(await loadRoomForHost(request.params.id, request.user.sub, reply))) return;
    await query(
      `UPDATE rooms SET is_live = true, started_at = COALESCE(started_at, NOW()), ended_at = NULL
        WHERE id = $1`,
      [request.params.id],
    );
    hub.broadcast(request.params.id, { type: 'room_started' });
    return ok({ id: request.params.id, isLive: true });
  });

  /** POST /v1/rooms/:id/end — end stream (host only). */
  fastify.post('/rooms/:id/end', { preHandler: fastify.authenticate }, async (request, reply) => {
    if (!(await loadRoomForHost(request.params.id, request.user.sub, reply))) return;
    await query('UPDATE rooms SET is_live = false, ended_at = NOW() WHERE id = $1', [
      request.params.id,
    ]);
    hub.broadcast(request.params.id, { type: 'room_ended', reason: 'host_ended' });
    return ok({ id: request.params.id, isLive: false });
  });
}
