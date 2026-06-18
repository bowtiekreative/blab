import { randomUUID } from 'node:crypto';
import { query } from '../db/index.js';
import { ok, fail } from '../lib/respond.js';
import { withTx } from '../lib/wallet.js';
import {
  squadRole,
  SQUAD_RANK,
  canManageSquad,
  canInviteToSquad,
} from '../lib/permissions.js';

const NAME_RE = /^[\w .'-]{2,30}$/;

export default async function squadRoutes(fastify) {
  const auth = { preHandler: fastify.authenticate };

  /** POST /v1/squads — create a squad (creator becomes super_admin). */
  fastify.post('/squads', auth, async (request, reply) => {
    const { name, description, tagline, brandColor } = request.body || {};
    if (!NAME_RE.test(name || '')) {
      return fail(reply, 400, 'VALIDATION_ERROR', 'name must be 2–30 chars');
    }
    try {
      const squad = await withTx(async (client) => {
        const { rows } = await client.query(
          `INSERT INTO squads (name, description, tagline, brand_color, created_by)
                VALUES ($1, $2, $3, COALESCE($4, '#6366f1'), $5) RETURNING *`,
          [name, description || null, tagline || null, brandColor || null, request.user.sub],
        );
        await client.query(
          `INSERT INTO squad_members (squad_id, user_id, role) VALUES ($1, $2, 'super_admin')`,
          [rows[0].id, request.user.sub],
        );
        return rows[0];
      });
      return reply.code(201).send(ok(squad));
    } catch (err) {
      if (err.code === '23505') return fail(reply, 409, 'CONFLICT', 'Squad name already taken');
      throw err;
    }
  });

  /** GET /v1/squads — list/search public squads. */
  fastify.get('/squads', async (request) => {
    const { q } = request.query || {};
    const params = [];
    let where = 'is_active = true';
    if (q) {
      params.push(`%${q}%`);
      where += ` AND name ILIKE $${params.length}`;
    }
    const { rows } = await query(
      `SELECT id, name, description, tagline, brand_color, avatar_url, member_count, created_at
         FROM squads WHERE ${where} ORDER BY member_count DESC, created_at DESC LIMIT 50`,
      params,
    );
    return ok(rows);
  });

  /** GET /v1/squads/:id */
  fastify.get('/squads/:id', async (request, reply) => {
    const { rows } = await query('SELECT * FROM squads WHERE id = $1', [request.params.id]);
    if (!rows[0]) return fail(reply, 404, 'NOT_FOUND', 'Squad not found');
    return ok(rows[0]);
  });

  /** GET /v1/squads/:id/members */
  fastify.get('/squads/:id/members', async (request) => {
    const { rows } = await query(
      `SELECT m.user_id, m.role, m.joined_at, u.username, u.avatar_url
         FROM squad_members m JOIN users u ON u.id = m.user_id
        WHERE m.squad_id = $1
        ORDER BY CASE m.role WHEN 'super_admin' THEN 0 WHEN 'admin' THEN 1
                             WHEN 'moderator' THEN 2 ELSE 3 END, m.joined_at`,
      [request.params.id],
    );
    return ok(rows);
  });

  /** GET /v1/users/:id/squads */
  fastify.get('/users/:id/squads', async (request) => {
    const { rows } = await query(
      `SELECT s.id, s.name, s.brand_color, m.role
         FROM squad_members m JOIN squads s ON s.id = m.squad_id
        WHERE m.user_id = $1`,
      [request.params.id],
    );
    return ok(rows);
  });

  /** PATCH /v1/squads/:id — edit metadata (Admin+). */
  fastify.patch('/squads/:id', auth, async (request, reply) => {
    const role = await squadRole(request.params.id, request.user.sub);
    if (!canManageSquad(role)) return fail(reply, 403, 'FORBIDDEN', 'Admin access required');
    const { description, tagline, brandColor, conductRules, avatarUrl, coverUrl } = request.body || {};
    const { rows } = await query(
      `UPDATE squads SET
         description = COALESCE($2, description),
         tagline = COALESCE($3, tagline),
         brand_color = COALESCE($4, brand_color),
         conduct_rules = COALESCE($5, conduct_rules),
         avatar_url = COALESCE($6, avatar_url),
         cover_url = COALESCE($7, cover_url),
         updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [request.params.id, description, tagline, brandColor, conductRules, avatarUrl, coverUrl],
    );
    return ok(rows[0]);
  });

  /** DELETE /v1/squads/:id — Super Admin only. */
  fastify.delete('/squads/:id', auth, async (request, reply) => {
    const role = await squadRole(request.params.id, request.user.sub);
    if (role !== 'super_admin') return fail(reply, 403, 'FORBIDDEN', 'Super Admin only');
    await query('DELETE FROM squads WHERE id = $1', [request.params.id]);
    return ok({ deleted: true });
  });

  // --- Membership ---

  /** POST /v1/squads/:id/invite — invite a user (Moderator+). Invite-only. */
  fastify.post('/squads/:id/invite', auth, async (request, reply) => {
    const role = await squadRole(request.params.id, request.user.sub);
    if (!canInviteToSquad(role)) return fail(reply, 403, 'FORBIDDEN', 'Cannot invite');
    const { userId } = request.body || {};
    if (!userId) return fail(reply, 400, 'VALIDATION_ERROR', 'userId is required');

    const existing = await query('SELECT 1 FROM squad_members WHERE squad_id = $1 AND user_id = $2', [
      request.params.id,
      userId,
    ]);
    if (existing.rowCount) return fail(reply, 409, 'CONFLICT', 'Already a member');

    const code = randomUUID();
    await query(
      `INSERT INTO squad_invites (squad_id, invite_code, invited_by, invitee_id)
            VALUES ($1, $2, $3, $4)`,
      [request.params.id, code, request.user.sub, userId],
    );
    return reply.code(201).send(ok({ inviteCode: code }));
  });

  /** GET /v1/squads/:id/invites — pending invites (Admin+). */
  fastify.get('/squads/:id/invites', auth, async (request, reply) => {
    const role = await squadRole(request.params.id, request.user.sub);
    if (!canManageSquad(role)) return fail(reply, 403, 'FORBIDDEN', 'Admin access required');
    const { rows } = await query(
      `SELECT id, invite_code, invitee_id, status, created_at, expires_at
         FROM squad_invites WHERE squad_id = $1 AND status = 'pending'`,
      [request.params.id],
    );
    return ok(rows);
  });

  /** POST /v1/squads/invite/:code/accept */
  fastify.post('/squads/invite/:code/accept', auth, async (request, reply) => {
    try {
      const result = await withTx(async (client) => {
        const { rows } = await client.query(
          `SELECT * FROM squad_invites WHERE invite_code = $1 FOR UPDATE`,
          [request.params.code],
        );
        const invite = rows[0];
        if (!invite || invite.status !== 'pending') return { error: 'Invite not found or used' };
        if (new Date(invite.expires_at) < new Date()) return { error: 'Invite expired' };
        if (invite.invitee_id && invite.invitee_id !== request.user.sub) {
          return { error: 'Invite is for another user' };
        }
        await client.query(
          `INSERT INTO squad_members (squad_id, user_id, role, invited_by)
                VALUES ($1, $2, 'member', $3) ON CONFLICT DO NOTHING`,
          [invite.squad_id, request.user.sub, invite.invited_by],
        );
        await client.query(`UPDATE squad_invites SET status = 'accepted' WHERE id = $1`, [invite.id]);
        await client.query(
          `UPDATE squads SET member_count = (SELECT COUNT(*) FROM squad_members WHERE squad_id = $1) WHERE id = $1`,
          [invite.squad_id],
        );
        return { squadId: invite.squad_id };
      });
      if (result.error) return fail(reply, 422, 'INVITE_INVALID', result.error);
      return ok(result);
    } catch (err) {
      throw err;
    }
  });

  /** POST /v1/squads/invite/:code/decline */
  fastify.post('/squads/invite/:code/decline', auth, async (request) => {
    await query(
      `UPDATE squad_invites SET status = 'declined' WHERE invite_code = $1 AND status = 'pending'`,
      [request.params.code],
    );
    return ok({ declined: true });
  });

  /** POST /v1/squads/:id/leave */
  fastify.post('/squads/:id/leave', auth, async (request, reply) => {
    const role = await squadRole(request.params.id, request.user.sub);
    if (!role) return fail(reply, 404, 'NOT_FOUND', 'Not a member');
    if (role === 'super_admin') {
      return fail(reply, 422, 'OWNER_CANNOT_LEAVE', 'Transfer ownership or delete the squad first');
    }
    await leaveSquad(request.params.id, request.user.sub);
    return ok({ left: true });
  });

  /** POST /v1/squads/:id/kick/:userId — Moderator+ (cannot kick equal/higher rank). */
  fastify.post('/squads/:id/kick/:userId', auth, async (request, reply) => {
    const actorRole = await squadRole(request.params.id, request.user.sub);
    if (!canInviteToSquad(actorRole)) return fail(reply, 403, 'FORBIDDEN', 'Cannot kick');
    const targetRole = await squadRole(request.params.id, request.params.userId);
    if (!targetRole) return fail(reply, 404, 'NOT_FOUND', 'Not a member');
    if (SQUAD_RANK[targetRole] >= SQUAD_RANK[actorRole]) {
      return fail(reply, 403, 'FORBIDDEN', 'Cannot kick a member of equal or higher rank');
    }
    await leaveSquad(request.params.id, request.params.userId);
    return ok({ kicked: true });
  });

  /** POST /v1/squads/:id/promote/:userId — Admin+ promotes one rank up. */
  fastify.post('/squads/:id/promote/:userId', auth, (request, reply) =>
    changeRank(request, reply, +1),
  );
  /** POST /v1/squads/:id/demote/:userId — Admin+ demotes one rank down. */
  fastify.post('/squads/:id/demote/:userId', auth, (request, reply) =>
    changeRank(request, reply, -1),
  );

  // --- Squad conduct (muted words) ---

  /** POST /v1/squads/:id/muted-words — add a squad muted word (Admin+). */
  fastify.post('/squads/:id/muted-words', auth, async (request, reply) => {
    const role = await squadRole(request.params.id, request.user.sub);
    if (!canManageSquad(role)) return fail(reply, 403, 'FORBIDDEN', 'Admin access required');
    const { word } = request.body || {};
    if (!word) return fail(reply, 400, 'VALIDATION_ERROR', 'word is required');
    await query(
      `INSERT INTO squad_muted_words (squad_id, word, added_by) VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING`,
      [request.params.id, word.toLowerCase(), request.user.sub],
    );
    return reply.code(201).send(ok({ word }));
  });

  /** GET /v1/squads/:id/muted-words */
  fastify.get('/squads/:id/muted-words', auth, async (request) => {
    const { rows } = await query('SELECT word FROM squad_muted_words WHERE squad_id = $1', [
      request.params.id,
    ]);
    return ok(rows.map((r) => r.word));
  });

  // --- helpers ---

  async function leaveSquad(squadId, userId) {
    await query('DELETE FROM squad_members WHERE squad_id = $1 AND user_id = $2', [squadId, userId]);
    await query(
      `UPDATE squads SET member_count = (SELECT COUNT(*) FROM squad_members WHERE squad_id = $1) WHERE id = $1`,
      [squadId],
    );
  }

  async function changeRank(request, reply, delta) {
    const { id, userId } = request.params;
    const actorRole = await squadRole(id, request.user.sub);
    if (!canManageSquad(actorRole)) return fail(reply, 403, 'FORBIDDEN', 'Admin access required');
    const targetRole = await squadRole(id, userId);
    if (!targetRole) return fail(reply, 404, 'NOT_FOUND', 'Not a member');

    const order = ['member', 'moderator', 'admin']; // super_admin only via ownership transfer
    const idx = order.indexOf(targetRole);
    if (idx === -1) return fail(reply, 422, 'INVALID', 'Cannot change this member’s rank');
    const newIdx = idx + delta;
    if (newIdx < 0 || newIdx >= order.length) {
      return fail(reply, 422, 'INVALID', delta > 0 ? 'Already at max promotable rank' : 'Already at min rank');
    }
    const newRole = order[newIdx];
    // Cannot set someone to equal/higher than yourself.
    if (SQUAD_RANK[newRole] >= SQUAD_RANK[actorRole]) {
      return fail(reply, 403, 'FORBIDDEN', 'Cannot set a rank equal to or above your own');
    }
    await query('UPDATE squad_members SET role = $3 WHERE squad_id = $1 AND user_id = $2', [
      id,
      userId,
      newRole,
    ]);
    return ok({ userId, role: newRole });
  }
}
