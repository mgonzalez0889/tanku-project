import { createServer } from "node:http";
import { Server } from "socket.io";
import { createApp } from "./app.js";

const port = Number(process.env.PORT ?? 3001);

const httpServer = createServer(createApp());
new Server(httpServer);

httpServer.listen(port, () => {
  console.log(`api-tanku listening on port ${port}`);
});
