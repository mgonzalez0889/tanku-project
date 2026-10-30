import { createServer } from "node:http";
import { createApp } from "./app.js";
import { createStore } from "./data/store.js";
import { createRealtime } from "./realtime.js";

const port = Number(process.env.PORT ?? 3001);

const store = createStore();
const realtime = createRealtime(store.users);
const httpServer = createServer(createApp(store, realtime.notifier));
realtime.io.attach(httpServer);

httpServer.listen(port, () => {
  console.log(`api-tanku listening on port ${port}`);
});
