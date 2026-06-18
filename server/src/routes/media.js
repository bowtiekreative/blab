import { query } from '../db/index.js';
import { config } from '../config.js';
import { ok, fail } from '../lib/respond.js';
import { livekitEnabled, mintToken } from '../lib/livekit.js';

/**
 * Media (LiveKit SFU) token endpoint. Returns { enabled: false } when LiveKit
 * isn't configured so the client can fall back to local-only preview.
 */
export default async function mediaRoutes(fastify) {
  fastify.post('/rooms/:id/token', { preHandler: fastify.authenticate }, async (request, reply) => {
    if (!livekitEnabled()) return ok({ enabled: false });

    const { rows } = await query('SELECT id, is_banned FROM rooms WHERE id = $1', [
      request.params.id,
    ]);
    if (!rows[0]) return fail(reply, 404, 'NOT_FOUND', 'Room not found');
    if (rows[0].is_banned) return fail(reply, 403, 'ROOM_BANNED', 'Room is unavailable');

    // `publish` is requested when the user is taking (or holds) a carousel slot.
    const canPublish = Boolean(request.body?.publish);
    const roomName = rows[0].id;
    const token = await mintToken({
      roomName,
      identity: request.user.sub,
      name: request.user.username,
      canPublish,
    });

    return ok({ enabled: true, url: config.livekit.url, room: roomName, token, canPublish });
  });
}
