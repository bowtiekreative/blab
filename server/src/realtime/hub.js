/**
 * In-memory realtime hub: tracks live room membership and fans out events to
 * connected WebSocket clients. Authoritative room data lives in Postgres; this
 * is the ephemeral presence/broadcast layer (Redis-backed in a later phase).
 */

/** @typedef {{ socket: import('ws').WebSocket, userId: string, username: string, avatarUrl: string|null }} Client */

class Room {
  constructor(id) {
    this.id = id;
    /** @type {Set<Client>} */
    this.clients = new Set();
    /** visible viewers: userId -> { username, avatarUrl } */
    this.viewers = new Map();
    /** hidden lurkers: set of userId */
    this.lurkers = new Set();
    /** 4-person carousel: slotIndex -> userId|null */
    this.slots = [null, null, null, null];
  }

  isEmpty() {
    return this.clients.size === 0;
  }
}

class Hub {
  constructor() {
    /** @type {Map<string, Room>} */
    this.rooms = new Map();
  }

  room(roomId) {
    let r = this.rooms.get(roomId);
    if (!r) {
      r = new Room(roomId);
      this.rooms.set(roomId, r);
    }
    return r;
  }

  join(roomId, client, { visible = true } = {}) {
    const room = this.room(roomId);
    room.clients.add(client);
    if (visible) {
      room.viewers.set(client.userId, { username: client.username, avatarUrl: client.avatarUrl });
      room.lurkers.delete(client.userId);
    } else {
      room.lurkers.add(client.userId);
      room.viewers.delete(client.userId);
    }
    return room;
  }

  leave(roomId, client) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    room.clients.delete(client);
    room.viewers.delete(client.userId);
    room.lurkers.delete(client.userId);
    // Free any slot held by this user.
    for (let i = 0; i < room.slots.length; i++) {
      if (room.slots[i] === client.userId) room.slots[i] = null;
    }
    if (room.isEmpty()) this.rooms.delete(roomId);
  }

  /** Broadcast a JSON event to everyone in the room (optionally excluding one client). */
  broadcast(roomId, event, except = null) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const payload = JSON.stringify(event);
    for (const client of room.clients) {
      if (client === except) continue;
      if (client.socket.readyState === 1 /* OPEN */) {
        client.socket.send(payload);
      }
    }
  }

  /** Send a JSON event to a single client. */
  send(client, event) {
    if (client.socket.readyState === 1) client.socket.send(JSON.stringify(event));
  }

  snapshot(roomId, meta = {}) {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    return {
      id: roomId,
      ...meta,
      slots: room.slots.map((userId, index) => ({
        index,
        userId,
        user: userId ? room.viewers.get(userId) || null : null,
      })),
      viewerCount: room.viewers.size,
      lurkerCount: room.lurkers.size,
    };
  }
}

export const hub = new Hub();
