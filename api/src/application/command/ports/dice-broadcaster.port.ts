/**
 * Port to broadcast Dice game updates in real time (WebSocket).
 * Implemented by the secondary realtime adapter; consumed by use cases
 * (broadcast) and the primary WS adapter (register).
 */
export interface DiceBroadcasterPort {
  /** Register a client for a session; returns an unsubscribe function. */
  register(sessionId: string, send: (payload: unknown) => void): () => void;

  /** Send a message to all clients connected to a session. */
  broadcast(sessionId: string, payload: unknown): void;
}
