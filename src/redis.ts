import Redis from "ioredis";
import type { Room } from "./types";
import WebSocket from "ws";

// two separate connections — required for Pub/Sub
// a connection in subscribe mode can ONLY listen, not send
// so we need one for publishing and one for subscribing
const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
export const pub = new Redis(REDIS_URL);
export const sub = new Redis(REDIS_URL);

pub.on("error", (err) => console.error("[redis:pub]", err.message));
sub.on("error", (err) => console.error("[redis:sub]", err.message));

// ── Key helpers ──────────────────────────────────────────────────
// room:{roomId}:state     → room phase, currentRound
// room:{roomId}:players   → hash of player data
// leaderboard:global      → sorted set of all-time profits
export const keys = {
  roomState:   (roomId: string) => `room:${roomId}:state`,
  roomPlayers: (roomId: string) => `room:${roomId}:players`,
  leaderboard: () => `leaderboard:global`,
};

// ── Pub/Sub helpers ──────────────────────────────────────────────
export function roomChannel(roomId: string): string {
  return `room:${roomId}`;
}

export async function publish(roomId: string, msg: object): Promise<void> {
  await pub.publish(roomChannel(roomId), JSON.stringify(msg));
}

// setupSubscriber comes AFTER pub/sub are declared above
// psubscribe listens to ALL room channels at once using a pattern
export function setupSubscriber(rooms: Map<string, Room>): void {
  sub.psubscribe("room:*");

  sub.on("pmessage", (_pattern, channel, message) => {
    // channel = "room:finals" → extract "finals"
    const roomId = channel.replace("room:", "");
    const room = rooms.get(roomId);
    if (!room) return;

    // deliver to all local WebSocket clients in this room
    room.players.forEach((player) => {
      if (player.ws.readyState === WebSocket.OPEN) {
        player.ws.send(message); // already a JSON string, no need to stringify again
      }
    });
  });
}

// ── Leaderboard (Sorted Set) ─────────────────────────────────────
// ZADD adds/updates a player's score
// ZREVRANGE returns members sorted by score highest first
export async function updateLeaderboard(
  playerName: string,
  profit: number
): Promise<void> {
  await pub.zadd(keys.leaderboard(), profit, playerName);
}

export async function getTopPlayers(count = 10): Promise<{ name: string; profit: number }[]> {
  const raw = await pub.zrevrange(keys.leaderboard(), 0, count - 1, "WITHSCORES");
  const result = [];
  for (let i = 0; i < raw.length; i += 2) {
    result.push({ name: raw[i], profit: Number(raw[i + 1]) });
  }
  return result;
}
