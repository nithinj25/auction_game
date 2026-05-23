import WebSocket from "ws";
import { Room, Player, RoomPhase } from "./types";
import { rooms, socketToPlayer, send } from "./room";

export interface Context {ws: WebSocket; room: Room; player: Player; }

//builds a contest from a socket basilly this extracts the data from the socket
export function withContext(ws: WebSocket): Context | null {
  const entry = socketToPlayer.get(ws);
  if (!entry) return null;              // ← guard

  const room = rooms.get(entry.roomId);
  if (!room) return null;               // ← guard

  const player = room.players.get(entry.playerId);
  if (!player) return null;             // ← guard

  return { ws, room, player };
}

export function withPhase(ctx: Context, phase: RoomPhase): boolean {
  if(ctx.room.phase !== phase){
    send(ctx.ws, { type: "error", message: `Action not allowed in '${ctx.room.phase}' phase` })
    return false;
  }
  return true;
}

export function withHost(ctx: Context): boolean {
  if(!ctx.player.isHost){
    send(ctx.ws, { type: "error", message: "only the host can do that job"});
    return false;
  }
  return true;
}

export function withValidBid(ctx: Context, amount : number): boolean{
  const round = ctx.room.rounds[ctx.room.currentRound];
  if(!round) return false;
  if(amount <= round.highestBid){
    send(ctx.ws, { type: "error", message: `bid must exceed current price`});
    return false;
  }

  if(amount > ctx.player.balance){
    send(ctx.ws, { type: "error", message: "Insufficient balance"});
    return false;
  }
  return true;
}

//run all the gaurds in roder; stops at the first failure
export function runPipeline(...gaurds: (() => boolean)[]): boolean {
  return gaurds.every((g) => g());
}