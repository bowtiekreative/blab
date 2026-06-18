import { query } from '../db/index.js';
import { ok, fail } from '../lib/respond.js';
import { hub } from '../realtime/hub.js';
import { roomRole } from '../lib/permissions.js';
import { livekitEnabled } from '../lib/livekit.js';

/**
 * Recordings & clips. In production, recordings are produced by LiveKit Egress
 * and clips/GIFs by server-side FFmpeg → S3 (api/media.md). Those require media
 * infra (Egress + S3 + FFmpeg) that isn't wired here, so when it's absent we
 * persist real metadata and mark the asset 'simulated' — the API surface is
 * complete and testable, and swapping in real egress is localized to this file.
 */
export default async function recordingRoutes(fastify) {
  const auth = { preHandler: fastify.authenticate };

  async function requireHost(request, reply) {
    const role = await roomRole(request.params.id, request.user.sub);
    if (role === null) {
      const exists = await query('SELECT 1 FROM rooms WHERE id = $1', [request.params.id]);
      if (!exists.rowCount) {
        fail(reply, 404, 'NOT_FOUND', 'Room not found');
        return false;
      }
    }
    if (role !== 'host') {
      fail(reply, 403, 'FORBIDDEN', 'Host only');
      return false;
    }
    return true;
  }

  /** POST /v1/rooms/:id/record/start */
  fastify.post('/rooms/:id/record/start', auth, async (request, reply) => {
    if (!(await requireHost(request, reply))) return;
    const active = await query(
      `SELECT id FROM recordings WHERE room_id = $1 AND ended_at IS NULL`,
      [request.params.id],
    );
    if (active.rowCount) return fail(reply, 409, 'ALREADY_RECORDING', 'Already recording');

    // Real egress would be started here when LiveKit + S3 are configured.
    const status = livekitEnabled() ? 'recording' : 'simulated';
    const { rows } = await query(
      `INSERT INTO recordings (room_id, started_by, status) VALUES ($1, $2, $3)
         RETURNING id, status, started_at`,
      [request.params.id, request.user.sub, status],
    );
    await query('UPDATE rooms SET is_recorded = true WHERE id = $1', [request.params.id]);
    hub.broadcast(request.params.id, { type: 'room_recording_started', recordingId: rows[0].id });
    return reply.code(201).send(ok(rows[0]));
  });

  /** POST /v1/rooms/:id/record/stop */
  fastify.post('/rooms/:id/record/stop', auth, async (request, reply) => {
    if (!(await requireHost(request, reply))) return;
    const { rows } = await query(
      `UPDATE recordings
          SET status = CASE WHEN status = 'simulated' THEN 'simulated' ELSE 'ready' END,
              ended_at = NOW(),
              duration_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))::int
        WHERE room_id = $1 AND (status = 'recording' OR status = 'simulated')
        RETURNING id, status, duration_seconds`,
      [request.params.id],
    );
    if (!rows[0]) return fail(reply, 404, 'NOT_FOUND', 'No active recording');
    hub.broadcast(request.params.id, { type: 'room_recording_stopped', recordingId: rows[0].id });
    return ok(rows[0]);
  });

  /** GET /v1/rooms/:id/recordings */
  fastify.get('/rooms/:id/recordings', async (request) => {
    const { rows } = await query(
      `SELECT id, status, duration_seconds, s3_key, started_at, ended_at
         FROM recordings WHERE room_id = $1 ORDER BY started_at DESC`,
      [request.params.id],
    );
    return ok(rows);
  });

  /** POST /v1/rooms/:id/clips — create a clip/gif/teaser from a recording. */
  fastify.post('/rooms/:id/clips', auth, async (request, reply) => {
    const { recordingId, startTime, endTime, title, kind = 'clip' } = request.body || {};
    if (!['clip', 'gif', 'teaser'].includes(kind)) {
      return fail(reply, 400, 'VALIDATION_ERROR', 'kind must be clip, gif, or teaser');
    }
    const start = Number(startTime) || 0;
    const end = Number(endTime) || 0;
    const duration = end - start;
    if (duration <= 0 || duration > 60000) {
      return fail(reply, 400, 'VALIDATION_ERROR', 'Clip must be 0–60s (times in ms)');
    }

    // FFmpeg extraction → S3 happens in prod; metadata is stored regardless.
    const { rows } = await query(
      `INSERT INTO clips (room_id, user_id, recording_id, title, kind, start_time_ms, end_time_ms, duration_ms, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'simulated')
         RETURNING id, kind, title, start_time_ms, end_time_ms, duration_ms, status, created_at`,
      [request.params.id, request.user.sub, recordingId || null, title || null, kind, start, end, duration],
    );
    return reply.code(201).send(ok(rows[0]));
  });

  /** GET /v1/rooms/:id/clips */
  fastify.get('/rooms/:id/clips', async (request) => {
    const { rows } = await query(
      `SELECT id, user_id, kind, title, duration_ms, view_count, status, created_at
         FROM clips WHERE room_id = $1 ORDER BY created_at DESC`,
      [request.params.id],
    );
    return ok(rows);
  });

  /** GET /v1/clips/trending */
  fastify.get('/clips/trending', async () => {
    const { rows } = await query(
      `SELECT c.id, c.room_id, c.title, c.kind, c.view_count, c.created_at, u.username
         FROM clips c JOIN users u ON u.id = c.user_id
        ORDER BY c.view_count DESC, c.created_at DESC LIMIT 20`,
    );
    return ok(rows);
  });

  /** POST /v1/clips/:id/view — increment view count. */
  fastify.post('/clips/:id/view', async (request) => {
    const { rows } = await query(
      'UPDATE clips SET view_count = view_count + 1 WHERE id = $1 RETURNING view_count',
      [request.params.id],
    );
    return ok({ viewCount: rows[0]?.view_count ?? 0 });
  });

  /** DELETE /v1/rooms/:id/clips/:clipId — owner or host. */
  fastify.delete('/rooms/:id/clips/:clipId', auth, async (request, reply) => {
    const { rows } = await query('SELECT user_id FROM clips WHERE id = $1 AND room_id = $2', [
      request.params.clipId,
      request.params.id,
    ]);
    if (!rows[0]) return fail(reply, 404, 'NOT_FOUND', 'Clip not found');
    const role = await roomRole(request.params.id, request.user.sub);
    if (rows[0].user_id !== request.user.sub && role !== 'host') {
      return fail(reply, 403, 'FORBIDDEN', 'Only the clip owner or host can delete it');
    }
    await query('DELETE FROM clips WHERE id = $1', [request.params.clipId]);
    return ok({ deleted: true });
  });
}
