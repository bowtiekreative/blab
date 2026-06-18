// Thin REST client for the Hustle Zone API. Token is injected from the auth store.

const TOKEN_KEY = 'hz_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  const token = getToken();
  if (token) headers.authorization = `Bearer ${token}`;

  const res = await fetch(`/v1${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = json?.error?.message || res.statusText;
    throw new Error(message);
  }
  return json.data as T;
}

export interface User {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  level: number;
  total_claps: number;
}

export interface RoomSlot {
  index: number;
  userId: string | null;
}

export interface Room {
  id: string;
  host_id: string;
  host_username?: string;
  name: string;
  description: string | null;
  category: string | null;
  hashtags: string[];
  is_live: boolean;
  current_topic: string | null;
  slots: RoomSlot[];
  stats: { viewerCount: number; lurkerCount: number };
}

export const api = {
  devLogin: (username: string) =>
    request<{ token: string; user: User }>('POST', '/auth/dev-login', { username }),
  me: () => request<User>('GET', '/auth/me'),
  listRooms: (params: { q?: string; live?: boolean } = {}) => {
    const qs = new URLSearchParams();
    if (params.q) qs.set('q', params.q);
    if (params.live) qs.set('live', 'true');
    const s = qs.toString();
    return request<Room[]>('GET', `/rooms${s ? `?${s}` : ''}`);
  },
  getRoom: (id: string) => request<Room>('GET', `/rooms/${id}`),
  createRoom: (input: { name: string; category?: string; hashtags?: string[] }) =>
    request<Room>('POST', '/rooms', input),
  startRoom: (id: string) => request<{ id: string; isLive: boolean }>('POST', `/rooms/${id}/start`),
  endRoom: (id: string) => request<{ id: string; isLive: boolean }>('POST', `/rooms/${id}/end`),
};
