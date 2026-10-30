import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import type { Express } from "express";

/** Starts the app on a free port; call `close` when the tests end. */
export async function startTestServer(app: Express) {
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  return { baseUrl, close: () => server.close() };
}
