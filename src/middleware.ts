import WebSocket from "ws";
import { Room, Player, RoomPhase } from "./types";
import { rooms, socketToPlayer, send } from "./room";

export interface Context {
  ws: WebSocket;
  room: Room;
  player: Player;
}

export function withContext(ws: WebSocket): Context | null {
  const entry = socketToPlayer.get(ws);
  if (!entry) return null;
  const room = rooms.get(entry.roomId);
  if (!room) return null;
  const player = room.players.get(entry.playerId);
  if (!player) return null;
  return { ws, room, player };
}

export function withPhase(ctx: Context, phase: RoomPhase): boolean {
  if (ctx.room.phase !== phase) {
    send(ctx.ws, { type: "error", message: `Action not allowed outside ${phase} phase` });
    return false;
  }
  return true;
}

export function withHost(ctx: Context): boolean {
  if (!ctx.player.isHost) {
    send(ctx.ws, { type: "error", message: "Only the host can do that" });
    return false;
  }
  return true;
}

export function withValidBid(ctx: Context, amount: number): boolean {
  const round = ctx.room.rounds[ctx.room.currentRound];
  if (!round) return false;
  if (amount <= round.highestBid) {
    send(ctx.ws, { type: "error", message: `Bid must exceed current high of ${round.highestBid}` });
    return false;
  }
  if (amount > ctx.player.balance) {
    send(ctx.ws, { type: "error", message: "Insufficient balance" });
    return false;
  }
  return true;
}

export function runPipeline(...guards: (() => boolean)[]): boolean {
  return guards.every((g) => g());
}
