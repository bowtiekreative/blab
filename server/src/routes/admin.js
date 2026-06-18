import { query } from '../db/index.js';
import { ok, fail } from '../lib/respond.js';
import { withTx } from '../lib/wallet.js';
import { hub } from '../realtime/hub.js';

/**
 * Tier 3 — Platform governance (admin staff only). Gated by authenticateAdmin.
 */
export default async function adminRoutes(fastify) {
  const admin = { preHandler: fastify.authenticateAdmin };

  // ===========================================================================
  // Dashboards & analytics (api/admin-dashboard.md)
  // ===========================================================================

  /** GET /v1/admin/dashboard — platform overview metrics. */
  fastify.get('/admin/dashboard', admin, async () => {
    const { rows } = await query(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL)::int AS total_users,
        (SELECT COUNT(*) FROM users WHERE last_seen_at > NOW() - INTERVAL '1 day')::int AS dau,
        (SELECT COUNT(*) FROM users WHERE last_seen_at > NOW() - INTERVAL '30 days')::int AS mau,
        (SELECT COUNT(*) FROM rooms WHERE created_at > NOW() - INTERVAL '1 day')::int AS rooms_today,
        (SELECT COUNT(*) FROM rooms WHERE is_live = true)::int AS live_now,
        (SELECT COALESCE(SUM(token_balance), 0) FROM wallets)::int AS tokens_in_circulation,
        (SELECT COUNT(*) FROM reports WHERE is_resolved = false)::int AS report_queue,
        (SELECT COUNT(*) FROM jail WHERE released_at IS NULL)::int AS jail_population
    `);
    return ok(rows[0]);
  });

  /** GET /v1/admin/users — list with status filter + search. */
  fastify.get('/admin/users', admin, async (request) => {
    const { status, q } = request.query || {};
    const where = ['deleted_at IS NULL'];
    const params = [];
    if (q) {
      params.push(`%${q}%`);
      where.push(`(username ILIKE $${params.length} OR email ILIKE $${params.length})`);
    }
    if (status === 'banned') where.push('is_banned = true');
    else if (status === 'jailed') where.push('is_in_jail = true');
    else if (status === 'suspended') where.push('suspended_until > NOW()');
    else if (status === 'active') where.push('is_banned = false AND is_in_jail = false');

    const { rows } = await query(
      `SELECT id, username, email, level, strikes, is_banned, is_in_jail, created_at, last_seen_at
         FROM users WHERE ${where.join(' AND ')} ORDER BY created_at DESC LIMIT 100`,
      params,
    );
    return ok(rows);
  });

  /** GET /v1/admin/users/:id — detail (profile, wallet, strikes, counts). */
  fastify.get('/admin/users/:id', admin, async (request, reply) => {
    const { rows } = await query(
      `SELECT id, username, display_name, email, bio, level, xp, strikes,
              is_banned, ban_reason, is_in_jail, suspended_until, verification_level,
              follower_count, following_count, created_at, last_seen_at
         FROM users WHERE id = $1`,
      [request.params.id],
    );
    if (!rows[0]) return fail(reply, 404, 'NOT_FOUND', 'User not found');
    const [wallet, strikes, roomsHosted, reportsAgainst] = await Promise.all([
      query('SELECT token_balance, token_lifetime_earned, token_lifetime_spent FROM wallets WHERE user_id = $1', [request.params.id]),
      query('SELECT id, reason, created_at FROM strikes WHERE user_id = $1 ORDER BY created_at DESC', [request.params.id]),
      query('SELECT COUNT(*)::int AS n FROM rooms WHERE host_id = $1', [request.params.id]),
      query(`SELECT COUNT(*)::int AS n FROM reports WHERE target_type = 'user' AND target_id = $1`, [request.params.id]),
    ]);
    return ok({
      ...rows[0],
      wallet: wallet.rows[0] || { token_balance: 0 },
      strikeHistory: strikes.rows,
      roomsHosted: roomsHosted.rows[0].n,
      reportsAgainst: reportsAgainst.rows[0].n,
    });
  });

  /** GET /v1/admin/rooms — tabs: live | recent | blocked. */
  fastify.get('/admin/rooms', admin, async (request) => {
    const tab = request.query?.tab || 'live';
    let where = 'r.is_live = true';
    if (tab === 'recent') where = `r.created_at > NOW() - INTERVAL '24 hours'`;
    else if (tab === 'blocked') where = 'r.is_banned = true';
    const { rows } = await query(
      `SELECT r.id, r.name, r.is_live, r.is_banned, r.created_at, u.username AS host_username
         FROM rooms r JOIN users u ON u.id = r.host_id
        WHERE ${where} ORDER BY r.created_at DESC LIMIT 100`,
    );
    return ok(rows);
  });

  /** GET /v1/admin/analytics/revenue — ⏣ flow by category. */
  fastify.get('/admin/analytics/revenue', admin, async () => {
    const { rows } = await query(
      `SELECT token_type, COUNT(*)::int AS count, COALESCE(SUM(amount), 0)::int AS tokens
         FROM token_transactions GROUP BY token_type ORDER BY tokens DESC`,
    );
    return ok(rows);
  });

  /** GET /v1/admin/analytics/top-creators — by lifetime ⏣ earned. */
  fastify.get('/admin/analytics/top-creators', admin, async () => {
    const { rows } = await query(
      `SELECT u.id, u.username, w.token_lifetime_earned AS earned
         FROM wallets w JOIN users u ON u.id = w.user_id
        ORDER BY w.token_lifetime_earned DESC LIMIT 10`,
    );
    return ok(rows);
  });

  /** GET /v1/admin/analytics/top-rooms — by total claps. */
  fastify.get('/admin/analytics/top-rooms', admin, async () => {
    const { rows } = await query(
      `SELECT r.id, r.name, COALESCE(SUM(c.count), 0)::int AS claps
         FROM rooms r LEFT JOIN claps c ON c.room_id = r.id
        GROUP BY r.id, r.name ORDER BY claps DESC LIMIT 10`,
    );
    return ok(rows);
  });

  /**
   * POST /v1/admin/users/:id/strike — issue a strike and apply the escalating
   * consequence (1st: 72h chat mute, 2nd: 7d suspension, 3rd: permanent ban).
   */
  fastify.post('/admin/users/:id/strike', admin, async (request, reply) => {
    const { reason } = request.body || {};
    const target = request.params.id;

    const result = await withTx(async (client) => {
      await client.query(`INSERT INTO strikes (user_id, issued_by, reason) VALUES ($1, $2, $3)`, [
        target,
        request.user.sub,
        reason || null,
      ]);
      const { rows } = await client.query(
        `UPDATE users SET strikes = strikes + 1 WHERE id = $1 RETURNING strikes`,
        [target],
      );
      const count = rows[0]?.strikes ?? 0;
      let consequence;
      if (count >= 3) {
        await client.query(
          `UPDATE users SET is_banned = true, ban_reason = COALESCE(ban_reason, '3 strikes'), banned_at = NOW() WHERE id = $1`,
          [target],
        );
        consequence = 'permanent_ban';
      } else if (count === 2) {
        await client.query(`UPDATE users SET suspended_until = NOW() + INTERVAL '7 days' WHERE id = $1`, [target]);
        consequence = '7_day_suspension';
      } else {
        await client.query(`UPDATE users SET chat_muted_until = NOW() + INTERVAL '72 hours' WHERE id = $1`, [target]);
        consequence = '72h_chat_mute';
      }
      return { count, consequence };
    });
    return ok({ userId: target, strikes: result.count, consequence: result.consequence });
  });

  /** GET /v1/admin/users/:id/strikes */
  fastify.get('/admin/users/:id/strikes', admin, async (request) => {
    const { rows } = await query(
      `SELECT id, reason, issued_by, created_at FROM strikes WHERE user_id = $1 ORDER BY created_at DESC`,
      [request.params.id],
    );
    return ok(rows);
  });

  /** POST /v1/admin/users/:id/ban  &  /unban */
  fastify.post('/admin/users/:id/ban', admin, async (request) => {
    await query(`UPDATE users SET is_banned = true, ban_reason = $2, banned_at = NOW() WHERE id = $1`, [
      request.params.id,
      request.body?.reason || null,
    ]);
    return ok({ banned: true });
  });
  fastify.post('/admin/users/:id/unban', admin, async (request) => {
    await query(`UPDATE users SET is_banned = false, ban_reason = NULL, banned_at = NULL WHERE id = $1`, [
      request.params.id,
    ]);
    return ok({ banned: false });
  });

  /** POST /v1/admin/users/:id/send-to-jail */
  fastify.post('/admin/users/:id/send-to-jail', admin, async (request, reply) => {
    const { reason, reportId } = request.body || {};
    if (!reason) return fail(reply, 400, 'VALIDATION_ERROR', 'reason is required');
    await withTx(async (client) => {
      await client.query(`UPDATE users SET is_in_jail = true WHERE id = $1`, [request.params.id]);
      await client.query(
        `INSERT INTO jail (user_id, reason, sentenced_by, report_id) VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id) WHERE released_at IS NULL DO NOTHING`,
        [request.params.id, reason, request.user.sub, reportId || null],
      );
    });
    return ok({ jailed: true });
  });

  /** POST /v1/admin/users/:id/release-from-jail */
  fastify.post('/admin/users/:id/release-from-jail', admin, async (request) => {
    await withTx(async (client) => {
      await client.query(`UPDATE users SET is_in_jail = false WHERE id = $1`, [request.params.id]);
      await client.query(
        `UPDATE jail SET released_at = NOW() WHERE user_id = $1 AND released_at IS NULL`,
        [request.params.id],
      );
    });
    return ok({ released: true });
  });

  // --- Rooms (block from discovery) ---

  fastify.post('/admin/rooms/:id/block', admin, async (request) => {
    await query(`UPDATE rooms SET is_banned = true, is_live = false WHERE id = $1`, [request.params.id]);
    hub.broadcast(request.params.id, { type: 'room_banned', reason: 'platform violation' });
    return ok({ blocked: true });
  });
  fastify.post('/admin/rooms/:id/unblock', admin, async (request) => {
    await query(`UPDATE rooms SET is_banned = false WHERE id = $1`, [request.params.id]);
    return ok({ blocked: false });
  });

  // --- Reports queue ---

  fastify.get('/admin/reports', admin, async (request) => {
    const resolved = request.query?.resolved === 'true';
    const { rows } = await query(
      `SELECT * FROM reports WHERE is_resolved = $1 ORDER BY created_at DESC LIMIT 100`,
      [resolved],
    );
    return ok(rows);
  });

  /** POST /v1/admin/reports/:id/resolve { resolution } */
  fastify.post('/admin/reports/:id/resolve', admin, async (request, reply) => {
    const { resolution } = request.body || {};
    if (!['dismissed', 'jailed', 'banned', 'warned'].includes(resolution)) {
      return fail(reply, 400, 'VALIDATION_ERROR', 'Invalid resolution');
    }
    const { rows } = await query(
      `UPDATE reports SET is_resolved = true, resolved_by = $2, resolution = $3
        WHERE id = $1 RETURNING id, resolution`,
      [request.params.id, request.user.sub, resolution],
    );
    if (!rows[0]) return fail(reply, 404, 'NOT_FOUND', 'Report not found');
    return ok(rows[0]);
  });

  // --- Jail queue & appeals ---

  fastify.get('/admin/jail', admin, async () => {
    const { rows } = await query(
      `SELECT j.user_id, u.username, j.reason, j.entered_at FROM jail j
         JOIN users u ON u.id = j.user_id WHERE j.released_at IS NULL ORDER BY j.entered_at DESC`,
    );
    return ok(rows);
  });

  fastify.get('/admin/jail/appeals', admin, async () => {
    const { rows } = await query(
      `SELECT a.id, a.user_id, u.username, a.reason, a.created_at FROM jail_appeals a
         JOIN users u ON u.id = a.user_id WHERE a.status = 'pending' ORDER BY a.created_at`,
    );
    return ok(rows);
  });

  /** POST /v1/admin/jail/appeals/:id/approve — release the user. */
  fastify.post('/admin/jail/appeals/:id/approve', admin, async (request, reply) => {
    const result = await withTx(async (client) => {
      const { rows } = await client.query(
        `UPDATE jail_appeals SET status = 'approved', reviewed_by = $2, reviewed_at = NOW(),
                admin_notes = $3
          WHERE id = $1 AND status = 'pending' RETURNING user_id`,
        [request.params.id, request.user.sub, request.body?.notes || null],
      );
      if (!rows[0]) return null;
      await client.query(`UPDATE users SET is_in_jail = false WHERE id = $1`, [rows[0].user_id]);
      await client.query(
        `UPDATE jail SET released_at = NOW() WHERE user_id = $1 AND released_at IS NULL`,
        [rows[0].user_id],
      );
      return rows[0];
    });
    if (!result) return fail(reply, 404, 'NOT_FOUND', 'Pending appeal not found');
    return ok({ approved: true, userId: result.user_id });
  });

  /** POST /v1/admin/jail/appeals/:id/deny */
  fastify.post('/admin/jail/appeals/:id/deny', admin, async (request, reply) => {
    const { rows } = await query(
      `UPDATE jail_appeals SET status = 'denied', reviewed_by = $2, reviewed_at = NOW(), admin_notes = $3
        WHERE id = $1 AND status = 'pending' RETURNING id`,
      [request.params.id, request.user.sub, request.body?.notes || null],
    );
    if (!rows[0]) return fail(reply, 404, 'NOT_FOUND', 'Pending appeal not found');
    return ok({ denied: true });
  });

  // --- IP bans ---

  fastify.post('/admin/ips/:ip/ban', admin, async (request) => {
    await query(
      `INSERT INTO ip_bans (ip_address, admin_id, reason) VALUES ($1, $2, $3)
       ON CONFLICT (ip_address) DO UPDATE SET reason = EXCLUDED.reason`,
      [request.params.ip, request.user.sub, request.body?.reason || null],
    );
    return ok({ banned: true });
  });
  fastify.delete('/admin/ips/:ip/ban', admin, async (request) => {
    await query('DELETE FROM ip_bans WHERE ip_address = $1', [request.params.ip]);
    return ok({ banned: false });
  });
}
