import { query } from '../db/index.js';
import { hub } from '../realtime/hub.js';
import { withTx, credit } from '../lib/wallet.js';
import { CLAP_EARN_TOKENS, FREE_CLAPS_PER_ROOM } from '../lib/economy.js';

/**
 * WebSocket gateway. Auth via `?token=<jwt>` query param (api/websocket.md).
 * Implements the client→server / server→client event shapes from the spec.
 *
 * Registered for @fastify/websocket v11 where the route handler receives the
 * raw WebSocket as its first argument.
 */
export default async function wsGateway(fastify) {
  fastify.get('/ws', { websocket: true }, (socket, req) => {
    let user;
    try {
      const token = new URL(req.url, 'http://localhost').searchParams.get('token');
      user = fastify.jwt.verify(token);
    } catch {
      socket.send(JSON.stringify({ type: 'error', code: 'UNAUTHORIZED', message: 'Invalid token' }));
      socket.close();
      return;
    }

    /** @type {import('../realtime/hub.js').Client} */
    const client = {
      socket,
      userId: user.sub,
      username: user.username,
      avatarUrl: user.avatarUrl || null,
    };
    let currentRoomId = null;

    const leaveCurrent = () => {
      if (!currentRoomId) return;
      hub.leave(currentRoomId, client);
      hub.broadcast(currentRoomId, { type: 'viewer_left', userId: client.userId });
      hub.broadcast(currentRoomId, {
        type: 'lurker_count_updated',
        count: hub.rooms.get(currentRoomId)?.lurkers.size ?? 0,
      });
      currentRoomId = null;
    };

    const handlers = {
      enter_room: (msg) => enterRoom(msg.roomId, msg.visible !== false),
      join_room: (msg) => enterRoom(msg.roomId, true),
      lurk_room: (msg) => enterRoom(msg.roomId, false),
      leave_room: () => leaveCurrent(),
      send_message: async (msg) => {
        if (!currentRoomId || !msg.content) return;
        const { rows } = await query(
          `INSERT INTO messages (room_id, user_id, type, content, gif_url, mentions)
                VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, created_at`,
          [
            currentRoomId,
            client.userId,
            msg.gifUrl ? 'gif' : 'text',
            msg.content,
            msg.gifUrl || null,
            Array.isArray(msg.mentions) ? msg.mentions : [],
          ],
        );
        hub.broadcast(currentRoomId, {
          type: 'new_message',
          message: {
            id: rows[0].id,
            userId: client.userId,
            username: client.username,
            avatarUrl: client.avatarUrl,
            content: msg.content,
            type: msg.gifUrl ? 'gif' : 'text',
            gifUrl: msg.gifUrl || null,
            mentions: msg.mentions || [],
            createdAt: rows[0].created_at,
          },
        });
        // Notify mentioned users present in the room.
        for (const uid of msg.mentions || []) {
          hub.broadcast(currentRoomId, {
            type: 'mention',
            fromUserId: client.userId,
            fromUsername: client.username,
            roomId: currentRoomId,
            message: msg.content,
          });
        }
      },
      clap: async (msg) => {
        if (!currentRoomId || !msg.targetUserId) return;
        if (msg.targetUserId === client.userId) return; // no self-claps

        // Enforce the free-clap cap; beyond it the client must use clap-tokens.
        const { rows: usedRows } = await query(
          `SELECT COALESCE(SUM(count), 0)::int AS used
             FROM claps WHERE room_id = $1 AND giver_id = $2 AND is_token_clap = false`,
          [currentRoomId, client.userId],
        );
        if (usedRows[0].used >= FREE_CLAPS_PER_ROOM) {
          return hub.send(client, {
            type: 'error',
            code: 'FREE_CLAP_LIMIT',
            message: `Free clap limit (${FREE_CLAPS_PER_ROOM}) reached — use token claps`,
          });
        }

        // Record the free clap and credit the receiver, atomically.
        await withTx(async (tx) => {
          await tx.query(
            `INSERT INTO claps (room_id, giver_id, receiver_id, count) VALUES ($1, $2, $3, 1)`,
            [currentRoomId, client.userId, msg.targetUserId],
          );
          await credit(tx, msg.targetUserId, CLAP_EARN_TOKENS, {
            type: 'clap_earning',
            from: client.userId,
            roomId: currentRoomId,
            description: 'Earned from a free clap',
          });
        });

        const { rows } = await query(
          `SELECT COALESCE(SUM(count), 0)::int AS total
             FROM claps WHERE room_id = $1 AND receiver_id = $2`,
          [currentRoomId, msg.targetUserId],
        );
        hub.broadcast(currentRoomId, {
          type: 'clap_received',
          fromUserId: client.userId,
          targetUserId: msg.targetUserId,
          totalClaps: rows[0].total,
        });
      },
      react: (msg) => {
        if (!currentRoomId || !msg.emoji) return;
        hub.broadcast(currentRoomId, { type: 'reaction', userId: client.userId, emoji: msg.emoji });
      },
      join_slot: (msg) => slotChange(msg.slotIndex),
      swap_slot: (msg) => slotChange(msg.toSlotIndex),
      leave_slot: () => slotChange(null),
      typing: (msg) => {
        if (!currentRoomId) return;
        hub.broadcast(
          currentRoomId,
          {
            type: 'typing',
            roomId: currentRoomId,
            userId: client.userId,
            username: client.username,
            isTyping: Boolean(msg.isTyping),
          },
          client,
        );
      },
    };

    async function enterRoom(roomId, visible) {
      if (!roomId) return;
      if (currentRoomId && currentRoomId !== roomId) leaveCurrent();
      currentRoomId = roomId;
      const room = hub.join(roomId, client, { visible });

      const { rows } = await query('SELECT name, host_id, current_topic FROM rooms WHERE id = $1', [
        roomId,
      ]);
      hub.send(client, {
        type: 'room_state',
        room: hub.snapshot(roomId, {
          name: rows[0]?.name,
          hostId: rows[0]?.host_id,
          currentTopic: rows[0]?.current_topic,
        }),
      });

      if (visible) {
        hub.broadcast(
          roomId,
          {
            type: 'viewer_entered',
            userId: client.userId,
            username: client.username,
            avatarUrl: client.avatarUrl,
          },
          client,
        );
      }
      hub.broadcast(roomId, { type: 'lurker_count_updated', count: room.lurkers.size });
    }

    async function slotChange(toSlot) {
      if (!currentRoomId) return;
      const room = hub.room(currentRoomId);
      const fromSlot = room.slots.indexOf(client.userId);

      if (toSlot === null) {
        if (fromSlot !== -1) room.slots[fromSlot] = null;
      } else {
        if (toSlot < 0 || toSlot > 3) return;
        if (room.slots[toSlot] && room.slots[toSlot] !== client.userId) {
          hub.send(client, { type: 'error', code: 'SLOT_TAKEN', message: 'Slot is occupied' });
          return;
        }
        if (fromSlot !== -1) room.slots[fromSlot] = null;
        room.slots[toSlot] = client.userId;
      }

      // Persist slot assignment on the room row.
      const cols = [0, 1, 2, 3].map((i) => `slot_${i}_user_id = $${i + 2}`).join(', ');
      await query(`UPDATE rooms SET ${cols} WHERE id = $1`, [currentRoomId, ...room.slots]);

      if (toSlot === null) {
        hub.broadcast(currentRoomId, { type: 'participant_left', userId: client.userId, slotIndex: fromSlot });
        hub.broadcast(currentRoomId, { type: 'slot_freed', slotIndex: fromSlot });
      } else if (fromSlot === -1) {
        hub.broadcast(currentRoomId, {
          type: 'participant_joined',
          userId: client.userId,
          username: client.username,
          slotIndex: toSlot,
        });
      } else {
        hub.broadcast(currentRoomId, {
          type: 'slot_changed',
          userId: client.userId,
          fromSlot,
          toSlot,
        });
      }
    }

    socket.on('message', async (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return hub.send(client, { type: 'error', code: 'BAD_JSON', message: 'Invalid JSON' });
      }
      const handler = handlers[msg.type];
      if (!handler) {
        return hub.send(client, { type: 'error', code: 'UNKNOWN_EVENT', message: `Unknown: ${msg.type}` });
      }
      try {
        await handler(msg);
      } catch (err) {
        fastify.log.error(err, 'ws handler error');
        hub.send(client, { type: 'error', code: 'SERVER_ERROR', message: 'Internal error' });
      }
    });

    socket.on('close', () => leaveCurrent());
  });
}
