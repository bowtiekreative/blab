import { query } from '../db/index.js';

// --- Squad roles (Tier 2) ---
export const SQUAD_RANK = { super_admin: 3, admin: 2, moderator: 1, member: 0 };

export async function squadRole(squadId, userId) {
  const { rows } = await query(
    'SELECT role FROM squad_members WHERE squad_id = $1 AND user_id = $2',
    [squadId, userId],
  );
  return rows[0]?.role || null;
}

export const canManageSquad = (role) => SQUAD_RANK[role] >= SQUAD_RANK.admin;
export const canInviteToSquad = (role) => SQUAD_RANK[role] >= SQUAD_RANK.moderator;

// --- Room roles (Tier 1) ---
/** Returns 'host' | 'cohost' | 'mod' | null for a user in a room. */
export async function roomRole(roomId, userId) {
  const { rows } = await query('SELECT host_id FROM rooms WHERE id = $1', [roomId]);
  if (!rows[0]) return null;
  if (rows[0].host_id === userId) return 'host';
  const co = await query('SELECT 1 FROM room_co_hosts WHERE room_id = $1 AND user_id = $2', [
    roomId,
    userId,
  ]);
  if (co.rowCount) return 'cohost';
  const mod = await query('SELECT 1 FROM room_moderators WHERE room_id = $1 AND user_id = $2', [
    roomId,
    userId,
  ]);
  if (mod.rowCount) return 'mod';
  return null;
}

// host or co-host (ban, unban, clear chat, kick from slot, manage mods)
export const isRoomManager = (role) => role === 'host' || role === 'cohost';
// host, co-host, or moderator (mute, warn, delete message)
export const isRoomMod = (role) => role === 'host' || role === 'cohost' || role === 'mod';
