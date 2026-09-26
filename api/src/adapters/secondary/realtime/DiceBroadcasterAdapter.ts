import type { DiceBroadcasterPort } from '@/application/command/ports/dice-broadcaster.port.ts';

type Send = (payload: unknown) => void;

/**
 * In-memory adapter to broadcast Dice events to all clients
 * connected to a session (WebSocket). Sockets are registered on WS connect.
 */
export class DiceBroadcasterAdapter implements DiceBroadcasterPort {
  private readonly rooms = new Map<string, Set<Send>>();

  register(sessionId: string, send: Send): () => void {
    if (!this.rooms.has(sessionId)) {
      this.rooms.set(sessionId, new Set());
    }
    this.rooms.get(sessionId)?.add(send);
    return () => {
      this.rooms.get(sessionId)?.delete(send);
      if (this.rooms.get(sessionId)?.size === 0) {
        this.rooms.delete(sessionId);
      }
    };
  }

  broadcast(sessionId: string, payload: unknown): void {
    const room = this.rooms.get(sessionId);
    if (!room) return;
    const message = typeof payload === 'string' ? payload : JSON.stringify(payload);
    for (const send of room) {
      try {
        send(message);
      } catch {
        // Ignore send errors (client disconnected)
      }
    }
  }
}
