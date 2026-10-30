import type { Gift, ServerToClientEvents } from "@tanku/shared";
import { io as connectClient, type Socket } from "socket.io-client";
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { createApp } from "../src/app.js";
import { createStore } from "../src/data/store.js";
import { createRealtime, noopNotifier } from "../src/realtime.js";
import {
  accept,
  approvedCard,
  changeVariant,
  createSpeakerGift,
  paidSpeakerGift,
  pay,
  pendingCard,
  rejectedCard,
} from "./helpers/gifts.js";
import { startTestServer, type TestServer } from "./helpers/server.js";

let server: TestServer;

describe("paying notifies the recipient only when the payment is approved", () => {
  let giftReceived: Mock<(gift: Gift) => void>;

  beforeEach(async () => {
    giftReceived = vi.fn<(gift: Gift) => void>();
    server = await startTestServer(createApp(createStore(), { ...noopNotifier, giftReceived }));
  });

  afterEach(() => {
    server.close();
  });

  it("calls the notifier once with the same gift the response returns", async () => {
    const gift = await createSpeakerGift(server);

    const paid = await pay(server, gift.id, approvedCard);

    expect(paid.gift.status).toBe("sent");
    expect(giftReceived).toHaveBeenCalledTimes(1);
    expect(giftReceived).toHaveBeenCalledWith(paid.gift);
  });

  it("does not call it for a rejected payment", async () => {
    const gift = await createSpeakerGift(server);

    await pay(server, gift.id, rejectedCard);

    expect(giftReceived).not.toHaveBeenCalled();
  });

  it("does not call it for a pending payment", async () => {
    const gift = await createSpeakerGift(server);

    await pay(server, gift.id, pendingCard);

    expect(giftReceived).not.toHaveBeenCalled();
  });
});

describe("answering a gift notifies the giver only when it succeeds", () => {
  let giftAccepted: Mock<(gift: Gift) => void>;

  beforeEach(async () => {
    giftAccepted = vi.fn<(gift: Gift) => void>();
    server = await startTestServer(createApp(createStore(), { ...noopNotifier, giftAccepted }));
  });

  afterEach(() => {
    server.close();
  });

  it("calls the notifier once with the gift that accept returns", async () => {
    const gift = await paidSpeakerGift(server);

    const accepted = (await (await accept(server, gift.id)).json()) as Gift;

    expect(giftAccepted).toHaveBeenCalledTimes(1);
    expect(giftAccepted).toHaveBeenCalledWith(accepted);
  });

  it("calls it with the original variant when the recipient changes the variant", async () => {
    const gift = await paidSpeakerGift(server);

    const changed = (await (await changeVariant(server, gift.id, { variantId: "blue" })).json()) as Gift;

    expect(changed.originalVariantId).toBe("black");
    expect(giftAccepted).toHaveBeenCalledTimes(1);
    expect(giftAccepted).toHaveBeenCalledWith(changed);
  });

  it("does not call it again for a second answer (409)", async () => {
    const gift = await paidSpeakerGift(server);
    await accept(server, gift.id);

    await accept(server, gift.id);

    expect(giftAccepted).toHaveBeenCalledTimes(1);
  });

  it("does not call it for a bad variant (400)", async () => {
    const gift = await paidSpeakerGift(server);

    await changeVariant(server, gift.id, { variantId: "xl" });

    expect(giftAccepted).not.toHaveBeenCalled();
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

  // Register it before triggering the action: the event may arrive before the HTTP response does.
  const next = (socket: Socket<ServerToClientEvents>, event: "gift:received" | "gift:accepted") =>
    new Promise<Gift>((resolve) => socket.once(event, resolve));

  it("sends the recipient the sent gift when the payment is approved", async () => {
    const santiago = await connectAs("user-santiago");
    const gift = await createSpeakerGift(server);
    const received = next(santiago, "gift:received");

    const paid = await pay(server, gift.id, approvedCard);

    const sent = await received;
    expect(sent).toEqual(paid.gift);
    expect(sent.status).toBe("sent");
  });

  it("does not send it to the giver", async () => {
    const valentina = await connectAs("user-valentina");
    const first = next(valentina, "gift:received");
    // Gift A is paid by Valentina for Santiago; gift B is the other way round.
    await paidSpeakerGift(server, "user-valentina", "user-santiago");
    const giftB = await paidSpeakerGift(server, "user-santiago", "user-valentina");

    // Events keep their order on a socket: if A had leaked, it would arrive before B.
    expect((await first).id).toBe(giftB.id);
  });

  it("sends nothing for rejected or pending payments", async () => {
    const santiago = await connectAs("user-santiago");
    const first = next(santiago, "gift:received");
    const rejected = await createSpeakerGift(server);
    await pay(server, rejected.id, rejectedCard);
    const pending = await createSpeakerGift(server);
    await pay(server, pending.id, pendingCard);
    const approved = await paidSpeakerGift(server);

    expect((await first).id).toBe(approved.id);
  });

  it("tells the giver when the recipient accepts", async () => {
    const valentina = await connectAs("user-valentina");
    const gift = await paidSpeakerGift(server);
    const heard = next(valentina, "gift:accepted");

    const accepted = (await (await accept(server, gift.id)).json()) as Gift;

    expect(await heard).toEqual(accepted);
  });

  it("tells the giver which variant the recipient changed from", async () => {
    const valentina = await connectAs("user-valentina");
    const gift = await paidSpeakerGift(server);
    const heard = next(valentina, "gift:accepted");

    await changeVariant(server, gift.id, { variantId: "blue" });

    expect(await heard).toMatchObject({ variantId: "blue", originalVariantId: "black" });
  });

  it("does not tell the recipient that they accepted", async () => {
    const santiago = await connectAs("user-santiago");
    const first = next(santiago, "gift:accepted");
    // Santiago accepts gift A (Valentina's); gift B is Santiago's own gift, which Valentina accepts.
    const giftA = await paidSpeakerGift(server, "user-valentina", "user-santiago");
    await accept(server, giftA.id);
    const giftB = await paidSpeakerGift(server, "user-santiago", "user-valentina");
    await accept(server, giftB.id);

    // Santiago is only the giver of B, so B is the first acceptance he hears about.
    expect((await first).id).toBe(giftB.id);
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
