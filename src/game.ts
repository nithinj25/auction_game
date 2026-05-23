import { Room } from "./types";
import {
  rooms,
  broadcast,
  broadcastBidUpdate,
  resetBids,
  buildLeaderboard,
  destroyRoom,
} from "./room";
import { TOTAL_ROUNDS, ROUND_DURATION, RESOLVE_DELAY, TIMER_INTERVAL } from "./constants";
import { generateRounds } from "./items";

export function startGame(room: Room): void {
  room.rounds = generateRounds();
  room.currentRound = 0;
  console.log(`[game] starting in room ${room.id}`);
  startRound(room);
}

function startRound(room: Room): void {
  const round = room.rounds[room.currentRound];
  resetBids(room);

  round.highestBid = round.startingBid;
  round.highestBidderId = null;
  round.startedAt = Date.now();

  room.secondsLeft = ROUND_DURATION;
  room.phase = "active";

  broadcast(room, {
    type: "round_start",
    round: room.currentRound + 1,
    totalRounds: TOTAL_ROUNDS,
    item: {
      name: round.item.name,
      description: round.item.description,
      imageEmoji: round.item.imageEmoji,
    },
    timeLimit: ROUND_DURATION,
    startingBid: round.startingBid,
  });

  broadcastBidUpdate(room);
  room.timer = setInterval(() => tickTimer(room), TIMER_INTERVAL);
}

function tickTimer(room: Room): void {
  room.secondsLeft--;

  broadcast(room, { type: "timer", secondsLeft: room.secondsLeft });

  if (room.secondsLeft <= 0) {
    clearInterval(room.timer!);
    room.timer = null;
    resolveRound(room);
  }
}

function resolveRound(room: Room): void {
  room.phase = "resolving";
  const round = room.rounds[room.currentRound];

  const winner = round.highestBidderId
    ? room.players.get(round.highestBidderId) ?? null
    : null;

  const profit = winner ? round.trueValue - round.highestBid : 0;

  if (winner) {
    winner.balance -= round.highestBid;
    winner.profit += profit;
    winner.itemsWon += 1;
  }

  broadcast(room, {
    type: "round_end",
    winner: winner?.name ?? null,
    winningBid: round.highestBid,
    trueValue: round.trueValue,
    profit,
    leaderboard: buildLeaderboard(room),
  });

  setTimeout(() => {
    if(!rooms.get(room.id)) return;
    if (room.currentRound + 1 >= TOTAL_ROUNDS) {
      endGame(room);
    } else {
      room.currentRound++;
      startRound(room);
    }
  }, RESOLVE_DELAY);
}

function endGame(room: Room): void {
  room.phase = "ended";
  const leaderboard = buildLeaderboard(room);
  const winner = leaderboard[0]?.name ?? "Nobody";

  broadcast(room, { type: "game_over", leaderboard, winner });
  console.log(`[game] ended in room ${room.id}, winner: ${winner}`);

  setTimeout(() => destroyRoom(room.id), 60_000);
}
