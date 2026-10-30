import type { Gift, Payment, ServerToClientEvents } from "@tanku/shared";
import { io as connectClient, type Socket } from "socket.io-client";
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { createApp } from "../src/app.js";
import { createStore } from "../src/data/store.js";
import { createRealtime } from "../src/realtime.js";
import { startTestServer } from "./helpers/server.js";

let server: Awaited<ReturnType<typeof startTestServer>>;

const approvedCard = { cardNumber: "4242 4242 4242 0000" };
const rejectedCard = { cardNumber: "4242 4242 4242 0002" };
const pendingCard = { cardNumber: "4242 4242 4242 0001" };

async function createSpeakerGift(giverId: string, recipientId: string): Promise<Gift> {
  const res = await server.send("POST", "/api/gifts", {
    giverId,
    recipientId,
    productId: "product-speaker",
    variantId: "black",
  });
  return (await res.json()) as Gift;
}

async function pay(giftId: string, card: { cardNumber: string }) {
  const res = await server.send("POST", `/api/gifts/${giftId}/pay`, card);
  return (await res.json()) as { gift: Gift; payment: Payment };
}

describe("paying notifies the recipient only when the payment is approved", () => {
  let giftReceived: Mock<(gift: Gift) => void>;

  beforeEach(async () => {
    giftReceived = vi.fn<(gift: Gift) => void>();
    server = await startTestServer(createApp(createStore(), { giftReceived }));
  });

  afterEach(() => {
    server.close();
  });

  it("calls the notifier once with the same gift the response returns", async () => {
    const gift = await createSpeakerGift("user-valentina", "user-santiago");

    const paid = await pay(gift.id, approvedCard);

    expect(paid.gift.status).toBe("sent");
    expect(giftReceived).toHaveBeenCalledTimes(1);
    expect(giftReceived).toHaveBeenCalledWith(paid.gift);
  });

  it("does not call it for a rejected payment", async () => {
    const gift = await createSpeakerGift("user-valentina", "user-santiago");

    await pay(gift.id, rejectedCard);

    expect(giftReceived).not.toHaveBeenCalled();
  });

  it("does not call it for a pending payment", async () => {
    const gift = await createSpeakerGift("user-valentina", "user-santiago");

    await pay(gift.id, pendingCard);

    expect(giftReceived).not.toHaveBeenCalled();
  });
});

describe("sockets", () => {
  let sockets: Socket<ServerToClientEvents>[];

  beforeEach(async () => {
    const store = createStore();
    const realtime = createRealtime(store.users);
    server = await startTestServer(createApp(store, realtime.notifier), realtime.io);
    sockets = [];
  });

  afterEach(() => {
    for (const socket of sockets) socket.disconnect();
    server.close();
  });

  const client = (auth: object) =>
    connectClient(server.baseUrl, { auth, transports: ["websocket"], reconnection: false }) as Socket<ServerToClientEvents>;

  async function connectAs(userId: string) {
    const socket = client({ userId });
    sockets.push(socket);
    await new Promise<void>((resolve, reject) => {
      socket.once("connect", () => resolve());
      socket.once("connect_error", reject);
    });
    return socket;
  }

  // Register it before triggering the payment: the event may arrive before the HTTP response does.
  const nextGift = (socket: Socket<ServerToClientEvents>) =>
    new Promise<Gift>((resolve) => socket.once("gift:received", resolve));

  it("sends the recipient the sent gift when the payment is approved", async () => {
    const santiago = await connectAs("user-santiago");
    const gift = await createSpeakerGift("user-valentina", "user-santiago");
    const received = nextGift(santiago);

    const paid = await pay(gift.id, approvedCard);

    const sent = await received;
    expect(sent).toEqual(paid.gift);
    expect(sent.status).toBe("sent");
  });

  it("does not send it to the giver", async () => {
    const valentina = await connectAs("user-valentina");
    const first = nextGift(valentina);
    // Gift A is paid by Valentina for Santiago; gift B is the other way round.
    const giftA = await createSpeakerGift("user-valentina", "user-santiago");
    await pay(giftA.id, approvedCard);
    const giftB = await createSpeakerGift("user-santiago", "user-valentina");
    await pay(giftB.id, approvedCard);

    // Events keep their order on a socket: if A had leaked, it would arrive before B.
    expect((await first).id).toBe(giftB.id);
  });

  it("sends nothing for rejected or pending payments", async () => {
    const santiago = await connectAs("user-santiago");
    const first = nextGift(santiago);
    const rejected = await createSpeakerGift("user-valentina", "user-santiago");
    await pay(rejected.id, rejectedCard);
    const pending = await createSpeakerGift("user-valentina", "user-santiago");
    await pay(pending.id, pendingCard);
    const approved = await createSpeakerGift("user-valentina", "user-santiago");
    await pay(approved.id, approvedCard);

    expect((await first).id).toBe(approved.id);
  });

  it.each([
    ["no userId", {}],
    ["an unknown userId", { userId: "nobody" }],
  ])("refuses a connection with %s", async (_name, auth) => {
    const socket = client(auth);
    sockets.push(socket);

    const message = await new Promise<string>((resolve) => {
      socket.once("connect_error", (error) => resolve(error.message));
    });

    expect(message).toBe("USER_NOT_FOUND");
  });
});
