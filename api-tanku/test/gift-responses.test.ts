import type { Gift } from "@tanku/shared";
import { afterEach, beforeEach, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { createStore } from "../src/data/store.js";
import { accept, changeVariant, createSpeakerGift, giftsOf, paidSpeakerGift } from "./helpers/gifts.js";
import { startTestServer, type TestServer } from "./helpers/server.js";

let server: TestServer;

// A fresh app per test: answering a gift changes the store.
beforeEach(async () => {
  server = await startTestServer(createApp(createStore()));
});

afterEach(() => {
  server.close();
});

it("accept: the gift becomes accepted for both people", async () => {
  const gift = await paidSpeakerGift(server);

  const res = await accept(server, gift.id);
  const accepted = (await res.json()) as Gift;

  expect(res.status).toBe(200);
  expect(accepted.status).toBe("accepted");
  expect(accepted.originalVariantId).toBeUndefined();
  expect((await giftsOf(server, "user-santiago"))[0]!.status).toBe("accepted");
  expect((await giftsOf(server, "user-valentina"))[0]!.status).toBe("accepted");
});

it("change-variant: the gift is accepted with the new variant and remembers the original", async () => {
  const gift = await paidSpeakerGift(server);

  const res = await changeVariant(server, gift.id, { variantId: "blue" });
  const changed = (await res.json()) as Gift;

  expect(res.status).toBe(200);
  expect(changed).toMatchObject({ status: "accepted", variantId: "blue", originalVariantId: "black" });
});

it.each([
  ["the variant the gift already has", { variantId: "black" }],
  ["a variant that is not the product's", { variantId: "xl" }],
  ["a missing variantId", {}],
  ["a variantId that is not a string", { variantId: 5 }],
  ["variants sent in the body (only the catalog counts)", { variantId: "xl", productVariantIds: ["xl"] }],
])("change-variant rejects %s with 400 INVALID_VARIANT and leaves the gift sent", async (_name, body) => {
  const gift = await paidSpeakerGift(server);

  const res = await changeVariant(server, gift.id, body);

  expect(res.status).toBe(400);
  expect(await res.json()).toEqual({ error: "INVALID_VARIANT" });
  expect((await giftsOf(server, "user-santiago"))[0]!.status).toBe("sent");
});

it("answers 409 INVALID_TRANSITION when the gift is not paid yet", async () => {
  const gift = await createSpeakerGift(server);

  const res = await accept(server, gift.id);

  expect(res.status).toBe(409);
  expect(await res.json()).toEqual({ error: "INVALID_TRANSITION" });
});

it("answers 409 when the gift was already accepted", async () => {
  const gift = await paidSpeakerGift(server);
  await accept(server, gift.id);

  expect((await accept(server, gift.id)).status).toBe(409);
});

it("checks the status before the variant: a bad variant on an accepted gift is 409, not 400", async () => {
  const gift = await paidSpeakerGift(server);
  await accept(server, gift.id);

  const res = await changeVariant(server, gift.id, { variantId: "xl" });

  expect(res.status).toBe(409);
});

it("answers 404 GIFT_NOT_FOUND for an unknown gift", async () => {
  const acceptRes = await accept(server, "nothing");
  const changeRes = await changeVariant(server, "nothing", { variantId: "blue" });

  expect(acceptRes.status).toBe(404);
  expect(await acceptRes.json()).toEqual({ error: "GIFT_NOT_FOUND" });
  expect(changeRes.status).toBe(404);
});
