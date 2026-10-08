export interface PendingPlayerMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
}

export class PendingPlayerSendError extends Error {}

/** Keep uncertain sends identifiable until persistence is confirmed. */
export function createPendingPlayerSends(newId: () => string = () => crypto.randomUUID()) {
  const pending = new Map<string, PendingPlayerMessage>();
  const scope = (message: { conversation_id: string; sender_id: string }) =>
    `${message.sender_id}:${message.conversation_id}`;
  return {
    prepare(message: Omit<PendingPlayerMessage, 'id'>): PendingPlayerMessage {
      const key = scope(message);
      const previous = pending.get(key);
      if (previous) {
        if (previous.content !== message.content) {
          throw new PendingPlayerSendError('The previous send is still unconfirmed. Retry its original text before sending a different message.');
        }
        return previous;
      }
      const next = { ...message, id: newId() };
      pending.set(key, next);
      return next;
    },
    confirm(message: PendingPlayerMessage) {
      const key = scope(message);
      if (pending.get(key)?.id === message.id) pending.delete(key);
    },
  };
}
