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
  item: { name: string; description: string; imageEmoji: string };
  timeLimit: number;
  startingBid: number;
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

export interface LeaderboardEntry {
  name: string;
  balance: number;
  profit: number;
  itemsWon: number;
}

export type ServerMessage =
  | JoinedMessage
  | LobbyUpdateMessage
  | RoundStartMessage
  | BidUpdateMessage
  | TimerMessage
  | RoundEndMessage
  | GameOverMessage
  | { type: "error"; message: string }
  | { type: "player_left"; name: string; playersLeft: number };
