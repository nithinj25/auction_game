import http from "http";
import fs from "fs";
import path from "path";
import { WebSocketServer } from "ws";
import { handleMessage, handleDisconnect } from "./handlers";
import { rooms } from "./room";
import { setupSubscriber, getTopPlayers } from "./redis";

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC = path.join(__dirname, "..", "public");

const MIME: Record<string, string> = {
  ".html": "text/html",
  ".js":   "application/javascript",
  ".css":  "text/css",
};

const server = http.createServer(async (req, res) => {
  if (req.url === "/leaderboard" && req.method === "GET") {
    const top = await getTopPlayers();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(top));
    return;
  }

  const urlPath = req.url === "/" ? "/index.html" : (req.url ?? "/index.html");
  const filePath = path.join(PUBLIC, urlPath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { "Content-Type": MIME[ext] ?? "text/plain" });
    res.end(data);
  });
});

const wss = new WebSocketServer({ server, maxPayload: 1024 });
setupSubscriber(rooms);

wss.on("connection", (ws) => {
  (ws as any).isAlive = true;
  ws.on("pong", () => { (ws as any).isAlive = true; });
  console.log("[ws] client connected");

  ws.on("message", (raw) => handleMessage(ws, raw.toString()));

  ws.on("close", () => {
    handleDisconnect(ws);
    console.log("[ws] client disconnected");
  });

  ws.on("error", (err) => console.error("[ws] error:", err.message));
});

setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!(ws as any).isAlive) { ws.terminate(); return; }
    (ws as any).isAlive = false;
    ws.ping();
  });
}, 30_000);

server.listen(PORT, () => {
  console.log(`[server] http://localhost:${PORT}`);
});
