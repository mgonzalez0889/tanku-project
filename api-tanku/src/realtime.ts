import type { Gift, ServerToClientEvents, User } from "@tanku/shared";
import { Server } from "socket.io";

/** What the routes can announce; the app only knows this, never Socket.io. */
export interface Notifier {
  /** To the recipient: the payment was approved, the gift is theirs to see. */
  giftReceived(gift: Gift): void;
  /** To the giver: the recipient accepted the gift (maybe with another variant). */
  giftAccepted(gift: Gift): void;
}

export const noopNotifier: Notifier = { giftReceived: () => {}, giftAccepted: () => {} };

const roomOf = (userId: string) => `user:${userId}`;

/**
 * Creates the Socket.io server without an http server: createApp needs the notifier before the
 * http server exists, so the caller attaches it afterwards with `io.attach(httpServer)`.
 * No login: a socket says who it is in `auth.userId`, like the REST routes trust the caller.
 */
export function createRealtime(users: readonly User[]) {
  const io = new Server<Record<string, never>, ServerToClientEvents>();

  io.use((socket, next) => {
    const { userId } = socket.handshake.auth;
    if (typeof userId !== "string" || !users.some((user) => user.id === userId)) {
      next(new Error("USER_NOT_FOUND"));
      return;
    }
    socket.join(roomOf(userId));
    next();
  });

  const notifier: Notifier = {
    giftReceived: (gift) => {
      io.to(roomOf(gift.recipientId)).emit("gift:received", gift);
    },
    giftAccepted: (gift) => {
      io.to(roomOf(gift.giverId)).emit("gift:accepted", gift);
    },
  };

  return { io, notifier };
}
