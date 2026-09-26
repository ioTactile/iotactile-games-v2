/**
 * Port pour diffuser les mises à jour du jeu Dice en temps réel (WebSocket).
 * Implémenté par l'adapter secondary (realtime), consommé par les use cases
 * (broadcast) et l'adapter primary WS (register).
 */
export interface DiceBroadcasterPort {
	/** Enregistrer un client pour une session ; retourne une fonction de désinscription. */
	register(sessionId: string, send: (payload: unknown) => void): () => void;

	/** Envoyer un message à tous les clients connectés à une session. */
	broadcast(sessionId: string, payload: unknown): void;
}
