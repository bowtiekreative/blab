import { query } from '../db/index.js';
import { ok, fail } from '../lib/respond.js';
import { withTx, debit, credit, InsufficientFunds } from '../lib/wallet.js';
import { GIFT_CATALOG, GIFT_EARN_RATE } from '../lib/economy.js';
import { hub } from '../realtime/hub.js';
import { requireActive } from '../lib/guards.js';

export default async function giftRoutes(fastify) {
  /** GET /v1/gifts/catalog */
  fastify.get('/gifts/catalog', async () =>
    ok(
      Object.entries(GIFT_CATALOG).map(([type, g]) => ({
        type,
        icon: g.icon,
        cost: g.cost,
        animation: g.animation,
      })),
    ),
  );

  /**
   * POST /v1/gifts/send — spend ⏣ to send a gift to a participant.
   * Sender pays the full cost; recipient earns GIFT_EARN_RATE of it; the
   * remainder is the platform fee. Broadcasts a gift_sent event to the room.
   */
  fastify.post('/gifts/send', { preHandler: [fastify.authenticate, requireActive('send gifts')] }, async (request, reply) => {
    const { roomId, giftType, recipientId } = request.body || {};
    const gift = GIFT_CATALOG[giftType];
    if (!gift) return fail(reply, 400, 'VALIDATION_ERROR', 'Unknown gift type');
    if (!roomId || !recipientId) {
      return fail(reply, 400, 'VALIDATION_ERROR', 'roomId and recipientId are required');
    }
    if (recipientId === request.user.sub) {
      return fail(reply, 422, 'SELF_GIFT', 'You cannot gift yourself');
    }

    const { rows: roomRows } = await query('SELECT id, gifts_enabled FROM rooms WHERE id = $1', [roomId]);
    if (!roomRows[0]) return fail(reply, 404, 'NOT_FOUND', 'Room not found');
    if (roomRows[0].gifts_enabled === false) {
      return fail(reply, 403, 'GIFTS_DISABLED', 'Gifts are disabled in this room');
    }

    const earned = Math.round(gift.cost * GIFT_EARN_RATE);

    try {
      await withTx(async (client) => {
        await debit(client, request.user.sub, gift.cost, {
          type: 'gift',
          to: recipientId,
          roomId,
          description: `Sent ${giftType} ${gift.icon}`,
        });
        await credit(client, recipientId, earned, {
          type: 'gift_earning',
          from: request.user.sub,
          roomId,
          description: `Received ${giftType} ${gift.icon}`,
        });
        await client.query(
          `INSERT INTO gifts (room_id, sender_id, recipient_id, gift_type, cost, recipient_earned)
                VALUES ($1, $2, $3, $4, $5, $6)`,
          [roomId, request.user.sub, recipientId, giftType, gift.cost, earned],
        );
        // Persist a chat message so the gift shows in history.
        await client.query(
          `INSERT INTO messages (room_id, user_id, type, content)
                VALUES ($1, $2, 'gift', $3)`,
          [roomId, request.user.sub, `${gift.icon} ${giftType}`],
        );
      });
    } catch (err) {
      if (err instanceof InsufficientFunds) {
        return fail(reply, 422, 'INSUFFICIENT_FUNDS', 'Not enough tokens', {
          needed: err.needed,
          have: err.have,
        });
      }
      throw err;
    }

    hub.broadcast(roomId, {
      type: 'gift_sent',
      giftType,
      icon: gift.icon,
      animation: gift.animation,
      value: gift.cost,
      fromUserId: request.user.sub,
      fromUsername: request.user.username,
      toUserId: recipientId,
    });

    return ok({ giftType, cost: gift.cost, recipientEarned: earned });
  });
}
