import { existsSync } from "node:fs";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { createApp } from "./app.js";
import { createStore } from "./data/store.js";
import { createRealtime } from "./realtime.js";

const port = Number(process.env.PORT ?? 3001);

// The built front, if there is one: in production this one process serves everything. In
// development there is none (Vite serves the front) and the API answers only /api and the socket.
const frontDir = process.env.STATIC_DIR ?? resolve(import.meta.dirname, "../../front-tanku/dist");
const staticDir = existsSync(frontDir) ? frontDir : undefined;
// A deploy without its front would pass the health check and answer 404 at the root: fail loudly instead.
if (process.env.NODE_ENV === "production" && !staticDir) {
  throw new Error(`NODE_ENV=production but there is no front build at ${frontDir}: run "npm run build" first`);
}

const store = createStore();
const realtime = createRealtime(store.users);
const httpServer = createServer(createApp(store, realtime.notifier, { staticDir }));
realtime.io.attach(httpServer);

httpServer.listen(port, () => {
  console.log(`api-tanku listening on port ${port}`);
  console.log(staticDir ? `serving the front from ${staticDir}` : "no front build found: API only");
});
