import { query } from '../db/index.js';
import { ok, fail } from '../lib/respond.js';
import { withTx, debit, credit, InsufficientFunds } from '../lib/wallet.js';
import { CLAP_EARN_TOKENS } from '../lib/economy.js';
import { hub } from '../realtime/hub.js';
import { requireActive } from '../lib/guards.js';

export default async function clapRoutes(fastify) {
  /**
   * POST /v1/rooms/:id/clap-tokens — unlimited paid claps (1 ⏣ = 1 clap).
   * Sender is debited; receiver earns 1 ⏣ per clap.
   */
  fastify.post('/rooms/:id/clap-tokens', { preHandler: [fastify.authenticate, requireActive('clap')] }, async (request, reply) => {
    const roomId = request.params.id;
    const { targetUserId } = request.body || {};
    const count = Math.max(1, Math.min(1000, Number(request.body?.count) || 1));
    if (!targetUserId) return fail(reply, 400, 'VALIDATION_ERROR', 'targetUserId is required');
    if (targetUserId === request.user.sub) return fail(reply, 422, 'SELF_CLAP', 'You cannot clap yourself');

    try {
      await withTx(async (client) => {
        await debit(client, request.user.sub, count, {
          type: 'clap',
          to: targetUserId,
          roomId,
          description: `${count} token clap(s)`,
        });
        await credit(client, targetUserId, count * CLAP_EARN_TOKENS, {
          type: 'clap_earning',
          from: request.user.sub,
          roomId,
          description: `Earned from ${count} clap(s)`,
        });
        await client.query(
          `INSERT INTO claps (room_id, giver_id, receiver_id, count, is_token_clap, token_amount)
                VALUES ($1, $2, $3, $4, true, $4)`,
          [roomId, request.user.sub, targetUserId, count],
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

    const { rows } = await query(
      `SELECT COALESCE(SUM(count), 0)::int AS total FROM claps WHERE room_id = $1 AND receiver_id = $2`,
      [roomId, targetUserId],
    );
    hub.broadcast(roomId, {
      type: 'clap_received',
      fromUserId: request.user.sub,
      targetUserId,
      totalClaps: rows[0].total,
    });
    return ok({ targetUserId, count, totalClaps: rows[0].total });
  });

  /** GET /v1/rooms/:id/clap-leaderboard */
  fastify.get('/rooms/:id/clap-leaderboard', async (request) => {
    const { rows } = await query(
      `SELECT c.receiver_id AS user_id, u.username, SUM(c.count)::int AS claps
         FROM claps c JOIN users u ON u.id = c.receiver_id
        WHERE c.room_id = $1
        GROUP BY c.receiver_id, u.username
        ORDER BY claps DESC LIMIT 10`,
      [request.params.id],
    );
    return ok(rows);
  });
}
