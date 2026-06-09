import WebSocket from "ws";

export interface JoinMessage {
  type: "join";
  name: string;
  roomId: string;
}

export interface BidMessage {
  type: "bid";
  amount: number;
}

export interface StartMessage {
  type: "start";
}

export type ClientMessage = JoinMessage | BidMessage | StartMessage;

export interface JoinedMessage {
  type: "joined";
  playerId: string;
  name: string;
  balance: number;
  roomId: string;
  isHost: boolean;
}

export interface LobbyUpdateMessage {
  type: "lobby_update";
  players: { name: string; isHost: boolean }[];
}

export interface RoundStartMessage {
  type: "round_start";
  round: number;
  totalRounds: number;
  item: {
    name: string;
    description: string;
    imageEmoji: string;
  };
  timeLimit: number;
  startingBid: number;
  hint: string;
}

export interface BidUpdateMessage {
  type: "bid_update";
  highestBid: number;
  highestBidder: string | null;
  yourBid: number | null;
}

export interface TimerMessage {
  type: "timer";
  secondsLeft: number;
}

export interface RoundEndMessage {
  type: "round_end";
  winner: string | null;
  winningBid: number;
  trueValue: number;
  profit: number;
  leaderboard: LeaderboardEntry[];
}

export interface GameOverMessage {
  type: "game_over";
  leaderboard: LeaderboardEntry[];
  winner: string;
}

export interface ErrorMessage {
  type: "error";
  message: string;
}

export interface PlayerLeftMessage {
  type: "player_left";
  name: string;
  playersLeft: number;
}

export type ServerMessage =
  | JoinedMessage
  | LobbyUpdateMessage
  | RoundStartMessage
  | BidUpdateMessage
  | TimerMessage
  | RoundEndMessage
  | GameOverMessage
  | ErrorMessage
  | PlayerLeftMessage;

export interface Player {
  id: string;
  name: string;
  ws: WebSocket;
  balance: number;
  profit: number;
  itemsWon: number;
  isHost: boolean;
  currentBid: number | null;
}

export interface ItemTemplate {
  name: string;
  description: string;
  imageEmoji: string;
  minValue: number;
  maxValue: number;
}

export interface AuctionRound {
  item: ItemTemplate;
  trueValue: number;
  startingBid: number;
  highestBid: number;
  highestBidderId: string | null;
  startedAt: number;
  extensionLeft: number
}

export type RoomPhase = "lobby" | "active" | "resolving" | "ended";

export interface Room {
  id: string;
  phase: RoomPhase;
  players: Map<string, Player>;
  rounds: AuctionRound[];
  currentRound: number;
  timer: NodeJS.Timeout | null;
  secondsLeft: number;
  startedAt: Date | null;
  dbGameId: number | null;
}

export interface LeaderboardEntry {
  name: string;
  balance: number;
  profit: number;
  itemsWon: number;
}