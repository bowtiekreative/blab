import { query } from '../db/index.js';
import { hub } from '../realtime/hub.js';

/**
 * Persist a notification and deliver it in real time to the recipient's open
 * sockets. Web Push / FCM fan-out happens here too once push infra is wired;
 * for now delivery is in-app (WS) + the stored row for the notifications feed.
 */
export async function notify(userId, { type, title, body, data }) {
  if (!userId) return null;
  const { rows } = await query(
    `INSERT INTO notifications (user_id, type, title, body, data)
          VALUES ($1, $2, $3, $4, $5)
       RETURNING id, type, title, body, data, is_read, created_at`,
    [userId, type, title || null, body || null, data ? JSON.stringify(data) : null],
  );
  const notification = rows[0];
  hub.sendToUser(userId, { type: 'notification', notification });
  return notification;
}
