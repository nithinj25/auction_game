import { Room } from "./types";
import {
  rooms,
  broadcast,
  broadcastPersonalized,
  broadcastBidUpdate,
  resetBids,
  buildLeaderboard,
  destroyRoom,
} from "./room";
import { updateLeaderboard } from "./redis";
import { saveGame, saveGameResults, saveRound } from "./db";
import { TOTAL_ROUNDS, ROUND_DURATION, RESOLVE_DELAY, TIMER_INTERVAL } from "./constants";
import { generateRounds } from "./items";
import { findSourceMap } from "module";
import { totalmem } from "os";
import { groupEnd } from "console";

export function startGame(room: Room): void {
  room.rounds = generateRounds();
  room.currentRound = 0;
  room.startedAt = new Date();
  console.log(`[game] starting in room ${room.id}`);
  startRound(room);
}

const HINT_GENERATORS = [
  (v: number) => {
    const lo = Math.round(v * 0.9);
    const hi = Math.round(v * 1.1);
    return `a Specialist estimates this is worth betwen $${lo} and $${hi}`;
  },
  (v : number) => {
    const comparable = Math.round(v * (0.8 + Math.random() * 0.4));
    return `A similar item sold at christie's last year for $${comparable}`;
  },
  (v: number) => {
    const estimate = Math.round(v * (0.7 + Math.random() * 0.4));
    return `the raw Materials and craftsmanship are worth approximatley $${estimate}`;
  },
  (v: number) => {
    const rumor = Math.round(v * (0.5 + Math.random() * 1.0));
    return `You overheard a dealar mentioned $${rumor} under their breath`;
  },
  (_v: number) => {
    const gut = [
      "Something about this feels likes a serious find",
      "Your instincts says this isn't worht the trouble",
      "You've seen things like this before. They go either way",
      "A cold feeling tells you others know something you don't.",
      "This one feels underpriced. Or maybe that's what they want you to think.",
    ];
    return gut[Math.floor(Math.random() * gut.length)];
  },
]

function generateHint(trueVale: number): string {
  const fn = HINT_GENERATORS[Math.floor(Math.random() * HINT_GENERATORS.length)];
  return fn(trueVale);
}

function startRound(room: Room): void {
  const round = room.rounds[room.currentRound];
  resetBids(room);

  round.highestBid = round.startingBid;
  round.highestBidderId = null;
  round.startedAt = Date.now();

  room.secondsLeft = ROUND_DURATION;
  room.phase = "active";

  broadcastPersonalized(room, (player) => ({
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
    hint: generateHint(round.trueValue),
  }));

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

async function endGame(room: Room): Promise<void> {
  room.phase = "ended";
  const leaderboard = buildLeaderboard(room);
  const winner = leaderboard[0]?.name ?? "Nobody";

  broadcast(room, { type: "game_over", leaderboard, winner });
  console.log(`[game] ended in room ${room.id}, winner: ${winner}`);

  for (const entry of leaderboard) {
    await updateLeaderboard(entry.name, entry.profit);
  }

  const gameId = await saveGame(room.id, winner, room.rounds.length, room.startedAt ?? new Date());

  for (let i = 0; i < room.rounds.length; i++) {
    const r = room.rounds[i];
    const roundWinner = r.highestBidderId ? (room.players.get(r.highestBidderId)?.name ?? null) : null;
    await saveRound(gameId, i + 1, r.item.name, r.trueValue, r.highestBid, roundWinner);
  }

  await saveGameResults(gameId, leaderboard.map((e, i) => ({
    name: e.name,
    profit: e.profit,
    balance: e.balance,
    itemsWon: e.itemsWon,
    rank: i + 1,
  })));

  setTimeout(() => destroyRoom(room.id), 60_000);
}
