import type { Gift, Payment } from "@tanku/shared";
import { afterEach, beforeEach, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { createStore, type Store } from "../src/data/store.js";
import { approvedCard, createSpeakerGift, giftsOf, pendingCard, rejectedCard } from "./helpers/gifts.js";
import { startTestServer, type TestServer } from "./helpers/server.js";

let store: Store;
let server: TestServer;

// A fresh app and store per test: paying changes both.
beforeEach(async () => {
  store = createStore();
  server = await startTestServer(createApp(store));
});

afterEach(() => {
  server.close();
});

const post = (path: string, body: unknown) => server.send("POST", path, body);

it("approves the payment: the gift is sent, charged at the catalog price and visible to the recipient", async () => {
  const gift = await createSpeakerGift(server);

  const res = await post(`/api/gifts/${gift.id}/pay`, approvedCard);
  const result = (await res.json()) as { gift: Gift; payment: Payment };

  expect(res.status).toBe(201);
  expect(result.gift.status).toBe("sent");
  expect(result.payment).toMatchObject({ giftId: gift.id, amountCop: 179900, status: "approved" });
  expect(await giftsOf(server, "user-santiago")).toEqual([result.gift]);
  expect(store.payments).toHaveLength(1);
});

it("rejects the payment, keeps the gift hidden from the recipient and lets the giver retry", async () => {
  const gift = await createSpeakerGift(server);

  const rejected = (await (await post(`/api/gifts/${gift.id}/pay`, rejectedCard)).json()) as {
    gift: Gift;
    payment: Payment;
  };

  expect(rejected.gift.status).toBe("payment_failed");
  expect(rejected.payment.status).toBe("rejected");
  expect(await giftsOf(server, "user-santiago")).toEqual([]);
  expect((await giftsOf(server, "user-valentina"))[0]!.status).toBe("payment_failed");

  const retried = (await (await post(`/api/gifts/${gift.id}/pay`, approvedCard)).json()) as {
    gift: Gift;
  };

  expect(retried.gift.status).toBe("sent");
  expect(store.payments).toHaveLength(2);
});

it("leaves a pending payment: the gift stays payment_pending and hidden from the recipient", async () => {
  const gift = await createSpeakerGift(server);

  const res = await post(`/api/gifts/${gift.id}/pay`, pendingCard);
  const result = (await res.json()) as { gift: Gift; payment: Payment };

  expect(res.status).toBe(201);
  expect(result.gift.status).toBe("payment_pending");
  expect(result.payment.status).toBe("pending");
  expect(await giftsOf(server, "user-santiago")).toEqual([]);
});

it("answers 409 INVALID_TRANSITION when the gift is already paid and creates no payment", async () => {
  const gift = await createSpeakerGift(server);
  await post(`/api/gifts/${gift.id}/pay`, approvedCard);

  const res = await post(`/api/gifts/${gift.id}/pay`, approvedCard);

  expect(res.status).toBe(409);
  expect(await res.json()).toEqual({ error: "INVALID_TRANSITION" });
  expect(store.payments).toHaveLength(1);
});

it("answers 404 GIFT_NOT_FOUND for an unknown gift", async () => {
  const res = await post("/api/gifts/nothing/pay", approvedCard);

  expect(res.status).toBe(404);
  expect(await res.json()).toEqual({ error: "GIFT_NOT_FOUND" });
});

it("answers 400 INVALID_PAYMENT for a bad card: no payment is created and the gift does not change", async () => {
  const gift = await createSpeakerGift(server);

  const res = await post(`/api/gifts/${gift.id}/pay`, { cardNumber: "123" });

  expect(res.status).toBe(400);
  expect(await res.json()).toEqual({ error: "INVALID_PAYMENT" });
  expect(store.payments).toEqual([]);
  expect((await giftsOf(server, "user-valentina"))[0]!.status).toBe("payment_pending");
});

it("never sends the card number back", async () => {
  const gift = await createSpeakerGift(server);

  const res = await post(`/api/gifts/${gift.id}/pay`, approvedCard);
  const text = await res.text();

  expect(res.status).toBe(201);
  expect(text).not.toContain("4242");
});
