import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import type { Express } from "express";
import type { Server } from "socket.io";

/**
 * Starts the app on a free port; call `close` when the tests end.
 * With `io`, Socket.io is attached to the same server and `close` shuts both down.
 */
export async function startTestServer(app: Express, io?: Server) {
  const server = createServer(app);
  io?.attach(server);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  const get = (path: string) => fetch(`${baseUrl}${path}`);
  const send = (method: "POST" | "PUT", path: string, body: unknown) =>
    fetch(`${baseUrl}${path}`, {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });

  // io.close() also closes the http server it is attached to.
  return { baseUrl, get, send, close: () => (io ? io.close() : server.close()) };
}
