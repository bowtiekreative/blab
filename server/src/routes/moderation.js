import { query } from '../db/index.js';
import { ok, fail } from '../lib/respond.js';
import { hub } from '../realtime/hub.js';
import { roomRole, isRoomManager, isRoomMod } from '../lib/permissions.js';

/**
 * Tier 1 — Room governance (host / co-host / moderator).
 * Permission rules follow api/moderation.md's matrix.
 */
export default async function moderationRoutes(fastify) {
  const auth = { preHandler: fastify.authenticate };

  // Resolve the caller's room role, or send 403/404. Returns role or null.
  async function requireRole(request, reply, predicate, label) {
    const role = await roomRole(request.params.id, request.user.sub);
    if (role === null) {
      // Distinguish "no room" from "no permission".
      const exists = await query('SELECT 1 FROM rooms WHERE id = $1', [request.params.id]);
      if (!exists.rowCount) {
        fail(reply, 404, 'NOT_FOUND', 'Room not found');
        return null;
      }
    }
    if (!predicate(role)) {
      fail(reply, 403, 'FORBIDDEN', `${label} required`);
      return null;
    }
    return role;
  }

  // Persist the hub's current slot array for a room to the rooms table.
  async function persistSlots(roomId) {
    const room = hub.rooms.get(roomId);
    if (!room) return;
    await query(
      `UPDATE rooms SET slot_0_user_id=$2, slot_1_user_id=$3, slot_2_user_id=$4, slot_3_user_id=$5 WHERE id=$1`,
      [roomId, ...room.slots],
    );
  }

  // --- Co-hosts & moderators ---

  fastify.post('/rooms/:id/co-host', auth, async (request, reply) => {
    if (!(await requireRole(request, reply, (r) => r === 'host', 'Host'))) return;
    const { userId } = request.body || {};
    if (!userId) return fail(reply, 400, 'VALIDATION_ERROR', 'userId is required');
    await query(
      `INSERT INTO room_co_hosts (room_id, user_id, promoted_by) VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING`,
      [request.params.id, userId, request.user.sub],
    );
    hub.broadcast(request.params.id, { type: 'co_host_added', userId });
    return ok({ userId, role: 'cohost' });
  });

  fastify.delete('/rooms/:id/co-host/:userId', auth, async (request, reply) => {
    if (!(await requireRole(request, reply, (r) => r === 'host', 'Host'))) return;
    await query('DELETE FROM room_co_hosts WHERE room_id = $1 AND user_id = $2', [
      request.params.id,
      request.params.userId,
    ]);
    return ok({ removed: true });
  });

  fastify.post('/rooms/:id/moderator', auth, async (request, reply) => {
    if (!(await requireRole(request, reply, isRoomManager, 'Host or co-host'))) return;
    const { userId } = request.body || {};
    if (!userId) return fail(reply, 400, 'VALIDATION_ERROR', 'userId is required');
    await query(
      `INSERT INTO room_moderators (room_id, user_id, added_by) VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING`,
      [request.params.id, userId, request.user.sub],
    );
    hub.broadcast(request.params.id, { type: 'moderator_added', userId });
    return ok({ userId, role: 'mod' });
  });

  fastify.delete('/rooms/:id/moderator/:userId', auth, async (request, reply) => {
    if (!(await requireRole(request, reply, isRoomManager, 'Host or co-host'))) return;
    await query('DELETE FROM room_moderators WHERE room_id = $1 AND user_id = $2', [
      request.params.id,
      request.params.userId,
    ]);
    return ok({ removed: true });
  });

  fastify.get('/rooms/:id/moderators', async (request) => {
    const { rows } = await query(
      `SELECT u.id AS user_id, u.username, 'mod' AS role FROM room_moderators m
         JOIN users u ON u.id = m.user_id WHERE m.room_id = $1
       UNION
       SELECT u.id, u.username, 'cohost' FROM room_co_hosts c
         JOIN users u ON u.id = c.user_id WHERE c.room_id = $1`,
      [request.params.id],
    );
    return ok(rows);
  });

  // --- Kick / ban ---

  fastify.post('/rooms/:id/kick', auth, async (request, reply) => {
    if (!(await requireRole(request, reply, isRoomManager, 'Host or co-host'))) return;
    const { userId } = request.body || {};
    const slotIndex = hub.freeUserSlot(request.params.id, userId);
    await persistSlots(request.params.id);
    hub.broadcast(request.params.id, { type: 'participant_kicked', userId, slotIndex, reason: 'kicked' });
    if (slotIndex !== -1) hub.broadcast(request.params.id, { type: 'slot_freed', slotIndex });
    return ok({ kicked: true });
  });

  fastify.post('/rooms/:id/bans', auth, async (request, reply) => {
    if (!(await requireRole(request, reply, isRoomManager, 'Host or co-host'))) return;
    const { userId, reason } = request.body || {};
    if (!userId) return fail(reply, 400, 'VALIDATION_ERROR', 'userId is required');
    await query(
      `INSERT INTO room_bans (room_id, user_id, banned_by, reason) VALUES ($1, $2, $3, $4)
       ON CONFLICT (room_id, user_id) DO UPDATE SET reason = EXCLUDED.reason`,
      [request.params.id, userId, request.user.sub, reason || null],
    );
    const slotIndex = hub.freeUserSlot(request.params.id, userId);
    await persistSlots(request.params.id);
    hub.broadcast(request.params.id, { type: 'user_banned_from_room', userId, reason: reason || null });
    if (slotIndex !== -1) hub.broadcast(request.params.id, { type: 'slot_freed', slotIndex });
    return ok({ banned: true });
  });

  fastify.delete('/rooms/:id/bans/:userId', auth, async (request, reply) => {
    if (!(await requireRole(request, reply, isRoomManager, 'Host or co-host'))) return;
    await query('DELETE FROM room_bans WHERE room_id = $1 AND user_id = $2', [
      request.params.id,
      request.params.userId,
    ]);
    return ok({ unbanned: true });
  });

  fastify.get('/rooms/:id/bans', auth, async (request, reply) => {
    if (!(await requireRole(request, reply, isRoomManager, 'Host or co-host'))) return;
    const { rows } = await query(
      `SELECT b.user_id, u.username, b.reason, b.created_at FROM room_bans b
         JOIN users u ON u.id = b.user_id WHERE b.room_id = $1`,
      [request.params.id],
    );
    return ok(rows);
  });

  // --- Warn / mute / messages ---

  fastify.post('/rooms/:id/warn', auth, async (request, reply) => {
    if (!(await requireRole(request, reply, isRoomMod, 'Moderator'))) return;
    const { userId, reason } = request.body || {};
    hub.broadcast(request.params.id, { type: 'user_warned', userId, reason: reason || null });
    return ok({ warned: true });
  });

  fastify.post('/rooms/:id/mute', auth, async (request, reply) => {
    if (!(await requireRole(request, reply, isRoomMod, 'Moderator'))) return;
    const { userId } = request.body || {};
    hub.broadcast(request.params.id, { type: 'participant_muted', userId });
    return ok({ muted: true });
  });

  fastify.delete('/rooms/:id/messages/:mid', auth, async (request, reply) => {
    if (!(await requireRole(request, reply, isRoomMod, 'Moderator'))) return;
    await query('DELETE FROM messages WHERE id = $1 AND room_id = $2', [
      request.params.mid,
      request.params.id,
    ]);
    hub.broadcast(request.params.id, { type: 'message_deleted', messageId: request.params.mid });
    return ok({ deleted: true });
  });

  fastify.post('/rooms/:id/clear-chat', auth, async (request, reply) => {
    if (!(await requireRole(request, reply, isRoomManager, 'Host or co-host'))) return;
    await query(
      `DELETE FROM messages WHERE room_id = $1 AND created_at > NOW() - INTERVAL '5 minutes'`,
      [request.params.id],
    );
    hub.broadcast(request.params.id, { type: 'chat_cleared' });
    return ok({ cleared: true });
  });

  // --- Room muted words ---

  fastify.post('/rooms/:id/muted-words', auth, async (request, reply) => {
    if (!(await requireRole(request, reply, isRoomManager, 'Host or co-host'))) return;
    const { word, scope = 'all', action = 'hide' } = request.body || {};
    if (!word) return fail(reply, 400, 'VALIDATION_ERROR', 'word is required');
    await query(
      `INSERT INTO room_muted_words (room_id, word, scope, action, added_by)
            VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (room_id, word) DO UPDATE SET scope = EXCLUDED.scope, action = EXCLUDED.action`,
      [request.params.id, word.toLowerCase(), scope, action, request.user.sub],
    );
    return reply.code(201).send(ok({ word, scope, action }));
  });

  fastify.get('/rooms/:id/muted-words', async (request) => {
    const { rows } = await query(
      'SELECT word, scope, action FROM room_muted_words WHERE room_id = $1',
      [request.params.id],
    );
    return ok(rows);
  });
}
