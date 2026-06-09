import WebSocket from "ws";
import { ClientMessage } from "./types";
import { rooms, socketToPlayer, createRoom, createPlayer, removePlayer, send, broadcast, broadcastLobbyUpdate, broadcastBidUpdate, destroyRoom } from "./room";
import { MAX_PLAYERS, MIN_PLAYERS } from "./constants";
import { startGame } from "./game";
import { withContext, withPhase, withHost, withValidBid, runPipeline } from "./middleware";

// entry point for every incoming WebSocket message
export function handleMessage(ws: WebSocket, raw: string): void {
  let msg: ClientMessage;
  try { msg = JSON.parse(raw) as ClientMessage; } catch { return; }

  switch (msg.type) {
    case "join":  return handleJoin(ws, msg.name, msg.roomId);
    case "bid":   return handleBid(ws, msg.amount);
    case "start": return handleStart(ws);
  }
}

// called when a socket closes — removes the player and reassigns host if needed
export function handleDisconnect(ws: WebSocket): void {
  const result = removePlayer(ws);
  if (!result) return;
  const { player, room } = result;

  broadcast(room, { type: "player_left", name: player.name, playersLeft: room.players.size });

  if (room.players.size === 0) { destroyRoom(room.id); return; }

  if (room.phase === "lobby") {
    const all = Array.from(room.players.values());
    if (!all.some((p) => p.isHost)) {       // host left — promote next player
      const newHost = all[0];
      newHost.isHost = true;
      send(newHost.ws, { type: "joined", playerId: newHost.id, name: newHost.name, balance: newHost.balance, roomId: room.id, isHost: true });
    }
    broadcastLobbyUpdate(room);
  } else if (room.phase === "active" || room.phase === "resolving") {
    if (room.players.size < MIN_PLAYERS) {
      broadcast(room, { type: "error", message: "Not enough players — game ended" });
      const remaining = Array.from(room.players.values());
      destroyRoom(room.id);
      // delay close so the error message has time to reach clients via Redis
      // closing the socket triggers ws.onclose on the client which resets to join screen
      setTimeout(() => remaining.forEach(p => p.ws.close()), 2000);
    }
  }
}

// creates room if it doesn't exist, adds the player, sends confirmation
export function handleJoin(ws: WebSocket, name: string, roomId: string): void {
  const cleanName   = name?.trim().slice(0, 20);
  const cleanRoomId = roomId?.trim().slice(0, 20);

  if (!cleanName)   { send(ws, { type: "error", message: "Name cannot be empty" });    return; }
  if (!cleanRoomId) { send(ws, { type: "error", message: "Room ID cannot be empty" }); return; }
  if (socketToPlayer.has(ws)) { send(ws, { type: "error", message: "Already in a room" }); return; }

  let room   = rooms.get(cleanRoomId);
  const isHost = !room;

  if(room && room.players.size >= MAX_PLAYERS){
    send(ws, { type: "error", message: "Room is full" });
    return;
  }

  if(room) {
    const nameExists = Array.from(room.players.values()).some(p => p.name === cleanName);
    if(nameExists){
      send(ws, { type: "error", message: "Name already taken in this room"});
      return;
    }
  }

  if (!room) {
    room = createRoom(cleanRoomId);
  } else if (room.phase !== "lobby") {
    send(ws, { type: "error", message: "Game already in progress" });
    return;
  }

  const player = createPlayer(ws, cleanName, cleanRoomId, isHost);
  room.players.set(player.id, player);

  send(ws, { type: "joined", playerId: player.id, name: player.name, balance: player.balance, roomId: cleanRoomId, isHost });
  broadcastLobbyUpdate(room);
}

// validates the bid through the middleware pipeline then records it
export function handleBid(ws: WebSocket, amount: number): void {
  if(!Number.isInteger(amount) || amount <= 0) return;
  const ctx = withContext(ws);
  if (!ctx) return;

  if (!runPipeline(
    () => withPhase(ctx, "active"),
    () => withValidBid(ctx, amount),
  )) return;

  const round = ctx.room.rounds[ctx.room.currentRound];
  round.highestBid       = amount;
  round.highestBidderId  = ctx.player.id;
  ctx.player.currentBid  = amount;

  if(ctx.room.secondsLeft <= 5 && round.extensionLeft > 0){
    ctx.room.secondsLeft += 5;
    round.extensionLeft--;
    broadcast(ctx.room, { type: "timer", secondsLeft: ctx.room.secondsLeft });
  }

  broadcastBidUpdate(ctx.room);
}

// host-only: checks min players then kicks off the game
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
