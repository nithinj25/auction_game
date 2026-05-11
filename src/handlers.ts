import WebSocket from "ws";
import { ClientMessage } from "./types";
import {
  rooms,
  socketToPlayer,
  createRoom,
  createPlayer,
  removePlayer,
  send,
  broadcast,
  broadcastLobbyUpdate,
  broadcastBidUpdate,
  destroyRoom,
} from "./room";
import { MIN_PLAYERS } from "./constants";
import { startGame } from "./game";
import { withContext, withPhase, withHost, withValidBid, runPipeline } from "./middleware";

export function handleMessage(ws: WebSocket, raw: string): void {
  let msg: ClientMessage;
  try {
    msg = JSON.parse(raw) as ClientMessage;
  } catch {
    return;
  }

  switch (msg.type) {
    case "join":  return handleJoin(ws, msg.name, msg.roomId);
    case "bid":   return handleBid(ws, msg.amount);
    case "start": return handleStart(ws);
    default:      return;
  }
}

export function handleDisconnect(ws: WebSocket): void {
  const result = removePlayer(ws);
  if (!result) return;
  const { player, room } = result;

  console.log(`[disconnect] ${player.name} left room ${room.id}`);

  broadcast(room, { type: "player_left", name: player.name, playersLeft: room.players.size });

  if (room.players.size === 0) {
    destroyRoom(room.id);
    return;
  }

  if (room.phase === "lobby") {
    const allPlayers = Array.from(room.players.values());
    if (!allPlayers.some((p) => p.isHost)) {
      const newHost = allPlayers[0];
      newHost.isHost = true;
      send(newHost.ws, {
        type: "joined",
        playerId: newHost.id,
        name: newHost.name,
        balance: newHost.balance,
        roomId: room.id,
        isHost: true,
      });
      console.log(`[host] promoted ${newHost.name} in room ${room.id}`);
    }
    broadcastLobbyUpdate(room);
  }
}

export function handleJoin(ws: WebSocket, name: string, roomId: string): void {
  const cleanName = name?.trim().slice(0, 20);
  if (!cleanName) {
    send(ws, { type: "error", message: "Name cannot be empty" });
    return;
  }

  const cleanRoomId = roomId?.trim().slice(0, 20);
  if (!cleanRoomId) {
    send(ws, { type: "error", message: "Room ID cannot be empty" });
    return;
  }

  if (socketToPlayer.has(ws)) {
    send(ws, { type: "error", message: "Already in a room" });
    return;
  }

  let room = rooms.get(cleanRoomId);
  const isHost = !room;

  if (!room) {
    room = createRoom(cleanRoomId);
  } else if (room.phase !== "lobby") {
    send(ws, { type: "error", message: "Game already in progress" });
    return;
  }

  const player = createPlayer(ws, cleanName, cleanRoomId, isHost);
  room.players.set(player.id, player);

  send(ws, {
    type: "joined",
    playerId: player.id,
    name: player.name,
    balance: player.balance,
    roomId: cleanRoomId,
    isHost,
  });

  broadcastLobbyUpdate(room);
}

export function handleBid(ws: WebSocket, amount: number): void {
  const ctx = withContext(ws);
  if (!ctx) return;

  if (!runPipeline(
    () => withPhase(ctx, "active"),
    () => withValidBid(ctx, amount),
  )) return;

  const round = ctx.room.rounds[ctx.room.currentRound];
  round.highestBid = amount;
  round.highestBidderId = ctx.player.id;
  ctx.player.currentBid = amount;

  broadcastBidUpdate(ctx.room);
}

export function handleStart(ws: WebSocket): void {
  const ctx = withContext(ws);
  if (!ctx) return;

  if (!runPipeline(
    () => withPhase(ctx, "lobby"),
    () => withHost(ctx),
  )) return;

  if (ctx.room.players.size < MIN_PLAYERS) {
    send(ws, { type: "error", message: `Need at least ${MIN_PLAYERS} players to start` });
    return;
  }

  startGame(ctx.room);
}
