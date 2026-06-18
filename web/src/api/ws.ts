// WebSocket client for realtime room events (api/websocket.md).

import { getToken } from './client';

export type ServerEvent = { type: string; [k: string]: unknown };
type Listener = (event: ServerEvent) => void;

export class RoomSocket {
  private ws: WebSocket | null = null;
  private listeners = new Set<Listener>();
  private queue: object[] = [];

  connect() {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    this.ws = new WebSocket(`${proto}://${location.host}/ws?token=${getToken()}`);
    this.ws.onopen = () => {
      this.queue.forEach((m) => this.ws!.send(JSON.stringify(m)));
      this.queue = [];
    };
    this.ws.onmessage = (e) => {
      const event = JSON.parse(e.data) as ServerEvent;
      this.listeners.forEach((l) => l(event));
    };
  }

  send(message: object) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(message));
    else this.queue.push(message);
  }

  on(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  close() {
    this.ws?.close();
    this.ws = null;
    this.listeners.clear();
  }
}
