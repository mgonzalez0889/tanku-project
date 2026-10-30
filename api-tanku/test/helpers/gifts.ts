import type { Gift, Payment } from "@tanku/shared";
import type { TestServer } from "./server.js";

// Simulated cards: the last 4 digits decide the outcome (see domain/checkout.ts).
export const approvedCard = { cardNumber: "4242 4242 4242 0000" };
export const rejectedCard = { cardNumber: "4242 4242 4242 0002" };
export const pendingCard = { cardNumber: "4242 4242 4242 0001" };

/** A gift of the seed's speaker (variants "black" and "blue"), waiting for its payment. */
export async function createSpeakerGift(
  server: TestServer,
  giverId = "user-valentina",
  recipientId = "user-santiago",
): Promise<Gift> {
  const res = await server.send("POST", "/api/gifts", {
    giverId,
    recipientId,
    productId: "product-speaker",
    variantId: "black",
  });
  return (await res.json()) as Gift;
}

export async function pay(server: TestServer, giftId: string, card = approvedCard) {
  const res = await server.send("POST", `/api/gifts/${giftId}/pay`, card);
  return (await res.json()) as { gift: Gift; payment: Payment };
}

export const accept = (server: TestServer, giftId: string) =>
  server.send("POST", `/api/gifts/${giftId}/accept`, {});

export const changeVariant = (server: TestServer, giftId: string, body: unknown) =>
  server.send("POST", `/api/gifts/${giftId}/change-variant`, body);

/** The gifts a user can see, as the API lists them. */
export async function giftsOf(server: TestServer, userId: string): Promise<Gift[]> {
  return (await (await server.get(`/api/users/${userId}/gifts`)).json()) as Gift[];
}

/** A speaker gift whose payment was approved: status "sent", visible to the recipient. */
export async function paidSpeakerGift(server: TestServer, giverId?: string, recipientId?: string): Promise<Gift> {
  const gift = await createSpeakerGift(server, giverId, recipientId);
  return (await pay(server, gift.id)).gift;
}
