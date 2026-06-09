
import WebSocket from "ws";
import { publish } from "./redis";
import {
  Room,
  Player,
  ServerMessage,
  LeaderboardEntry,
  LobbyUpdateMessage,
  BidUpdateMessage,
} from "./types";
import { STARTING_BALANCE } from "./constants";

export const rooms = new Map<string, Room>();
export const socketToPlayer = new Map<WebSocket, { roomId: string; playerId: string }>();

export function generateId(): string {
  return crypto.randomUUID();
}

export function createRoom(roomId: string): Room {
  const room: Room = {
    id: roomId,
    phase: "lobby",
    players: new Map(),
    rounds: [],
    currentRound: 0,
    timer: null,
    secondsLeft: 0,
    startedAt: null,
    dbGameId: null,
  };
  rooms.set(roomId, room);
  console.log(`[room] created -> ${roomId}`);
  return room;
}

export function destroyRoom(roomId: string): void {
  const room = rooms.get(roomId);
  if (!room) return;

  if (room.timer) {
    clearInterval(room.timer);
    room.timer = null;
  }

  room.players.forEach((player) => {
    socketToPlayer.delete(player.ws);
  });

  rooms.delete(roomId);
  console.log(`[room] destroyed -> ${roomId}`);
}

export function createPlayer(
  ws: WebSocket,
  name: string,
  roomId: string,
  isHost: boolean
): Player {
  const id = generateId();

  const player: Player = {
    id,
    name,
    ws,
    balance: STARTING_BALANCE,
    profit: 0,
    itemsWon: 0,
    isHost,
    currentBid: null,
  };

  socketToPlayer.set(ws, { roomId, playerId: id });
  console.log(`[player] created -> ${name} (${id}) in room ${roomId}`);
  return player;
}

export function removePlayer(ws: WebSocket): { player: Player; room: Room } | null {
  const entry = socketToPlayer.get(ws);
  if (!entry) return null;

  const { roomId, playerId } = entry;
  const room = rooms.get(roomId);
  if (!room) return null;

  const player = room.players.get(playerId);
  if (!player) return null;

  room.players.delete(playerId);
  socketToPlayer.delete(ws);

  console.log(`[player] removed -> ${player.name} from room ${roomId}`);
  return { player, room };
}

export function send(ws: WebSocket, msg: ServerMessage): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

export function broadcast(room: Room, msg: ServerMessage): void{
  publish(room.id,  msg);
}

export function broadcastPersonalized(
  room: Room,
  builder: (player: Player) => ServerMessage
): void {
  room.players.forEach((player) => send(player.ws, builder(player)));
}

export function broadcastLobbyUpdate(room: Room): void {
  const msg: LobbyUpdateMessage = {
    type: "lobby_update",
    players: Array.from(room.players.values()).map((p) => ({
      name: p.name,
      isHost: p.isHost,
    })),
  };
  broadcast(room, msg);
}

export function resetBids(room: Room): void {
  room.players.forEach((player) => {
    player.currentBid = null;
  });
}

export function broadcastBidUpdate(room: Room): void {
  const round = room.rounds[room.currentRound];
  if (!round) return;

  const highestBidder = round.highestBidderId
    ? room.players.get(round.highestBidderId)?.name ?? null
    : null;

  broadcastPersonalized(room, (player) => {
    const msg: BidUpdateMessage = {
      type: "bid_update",
      highestBid: round.highestBid,
      highestBidder,
      yourBid: player.currentBid,
    };
    return msg;
  });
}

export function buildLeaderboard(room: Room): LeaderboardEntry[] {
  return Array.from(room.players.values())
    .sort((a, b) => b.profit - a.profit)
    .map((p) => ({
      name: p.name,
      balance: p.balance,
      profit: p.profit,
      itemsWon: p.itemsWon,
    }));
}
