import http from "http";
import fs from "fs";
import path from "path";
import { WebSocketServer } from "ws";
import { handleMessage, handleDisconnect } from "./handlers";

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC = path.join(__dirname, "..", "public");

const MIME: Record<string, string> = {
  ".html": "text/html",
  ".js":   "application/javascript",
  ".css":  "text/css",
};

const server = http.createServer((req, res) => {
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

const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  console.log("[ws] client connected");

  ws.on("message", (raw) => handleMessage(ws, raw.toString()));

  ws.on("close", () => {
    handleDisconnect(ws);
    console.log("[ws] client disconnected");
  });

  ws.on("error", (err) => console.error("[ws] error:", err.message));
});

server.listen(PORT, () => {
  console.log(`[server] http://localhost:${PORT}`);
});
