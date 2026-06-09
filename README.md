# WS Auction

A real-time multiplayer auction game built with WebSockets, Node.js, TypeScript, and React — wrapped in an 80s pixel-arcade UI.

Players join a room, bid on mystery items with hidden true values, and compete to make the most profit. Game results persist to PostgreSQL, and a global all-time leaderboard lives in Redis. Redis Pub/Sub fans broadcasts across server instances so the game scales horizontally.

**Live demo:** _deploy URL here_

---

## Tech Stack

| Layer       | Tech                                                                    |
|-------------|-------------------------------------------------------------------------|
| Backend     | Node.js 20, TypeScript, [`ws`](https://github.com/websockets/ws)        |
| Frontend    | React 19, Vite, Tailwind CSS v4                                         |
| Transport   | WebSocket (native), JSON messages                                       |
| Pub/Sub     | Redis (`ioredis`) — cross-instance broadcast + sorted-set leaderboard   |
| Persistence | PostgreSQL (`pg`) — games, results, round history                       |
| Hosting     | Render (server) · Supabase (PostgreSQL) · Upstash (Redis)               |
| UI          | Press Start 2P / VT323 fonts, pixel-art sprites, CRT scanline effects   |

---

## Architecture

```
                    ┌──────────────────────────────────────────┐
                    │              Node.js Server               │
                    │                                           │
  HTTP  ───────────▶│  http.Server                             │
  (static + API)    │   ├── serves React build from /public    │
                    │   └── GET /leaderboard  → Redis top 10   │
                    │                                           │
  WS    ◀──────────▶│  WebSocketServer (ws)                    │
                    │   ├── handleMessage   (join/bid/start)    │
                    │   ├── handleDisconnect                    │
                    │   └── 30s ping/pong heartbeat             │
                    └──────────────┬───────────────┬───────────┘
                                   │               │
                        ┌──────────▼─────┐   ┌─────▼──────────┐
                        │     Redis      │   │   PostgreSQL   │
                        │  pub / sub     │   │  games         │
                        │  psubscribe    │   │  game_results  │
                        │  room:*        │   │  round_history │
                        │  leaderboard   │   │                │
                        │  (sorted set)  │   │                │
                        └────────────────┘   └────────────────┘

  Client → Server        Server → Client
  ──────────────         ──────────────────────────────────────
  join                   joined, lobby_update, round_start,
  bid                    bid_update, timer, round_end,
  start                  game_over, error, player_left
```

### In-memory room state

```
Room
 ├── players       Map<id, Player>
 ├── rounds        AuctionRound[]
 ├── currentRound  number
 ├── timer         NodeJS.Timeout
 ├── phase         lobby | active | resolving | ended
 ├── startedAt     Date
 └── dbGameId      number   (foreign key to the persisted game row)
```

### Request pipeline

Every incoming message flows through a guard chain before touching state:

```
withContext   → player + room + socket all exist?
withPhase     → is this action valid in the room's current phase?
withHost      → is this player the host?           (start only)
withValidBid  → bid > highestBid AND ≤ balance AND ≥ min increment?
```

### Game loop

```
startGame()     generate rounds procedurally, record startedAt
startRound()    broadcast item + private hint per player, start timer
tickTimer()     decrement secondsLeft every 1 s, broadcast timer
                └── late bid in last 5 s? extend timer (max 3×)
resolveRound()  find winner, deduct balance, award profit
endGame()       sort leaderboard, persist to PG, update Redis, cleanup
```

---

## Key Design Trade-offs

### 1. WebSockets over HTTP polling

**Chosen:** persistent WebSocket connections per player  
**Alternative:** short-poll or SSE  
**Trade-off:** WebSockets give sub-100 ms latency and bidirectional push at the cost of connection state on the server. For an auction game where every bid must land in real-time and the timer ticks every second, polling would either hammer the server or feel laggy. The added complexity (heartbeat, reconnect logic, disconnect cleanup) is worth it.

---

### 2. In-memory room state vs. full database state

**Chosen:** rooms and round timers live entirely in server memory; only final results go to Postgres  
**Alternative:** store every bid in the database, read state from DB  
**Trade-off:** in-memory gives microsecond reads and zero DB round-trips during a live auction (critical for a 20-second timer). The downside is that a server restart loses all active games — acceptable here because games are short-lived (< 5 minutes). Persisting every bid would add 5–20 ms of latency per bid event and is unnecessary for the current scale.

---

### 3. Redis Pub/Sub for horizontal scaling

**Chosen:** every `broadcast()` publishes to a Redis channel; all server instances subscribe  
**Alternative:** sticky sessions (pin each room to one server)  
**Trade-off:** Pub/Sub lets us add server instances without reconfiguring the load balancer. The cost is two extra Redis connections per process and slight latency (~1 ms on Upstash). Sticky sessions are simpler but create uneven load and break if a server restarts mid-game. The two-connection requirement (pub and sub must be separate — a subscribed connection is read-only) is a non-obvious constraint worth documenting.

---

### 4. `broadcastPersonalized` vs `broadcast`

**Chosen:** private hints bypass Redis and go direct to each WebSocket  
**Alternative:** encrypt or hash hints inside the shared broadcast  
**Trade-off:** Redis Pub/Sub sends the same JSON string to every subscriber. Per-player hints require different payloads, so they must skip the pub/sub path and write to each socket directly. This means private hints don't fan out across instances — acceptable because the player's socket is always on the instance that received the `round_start` trigger. Encrypting hints in a shared broadcast would be simpler to scale but leaks information if a client intercepts another player's traffic.

---

### 5. Procedural item generation vs. a static item list

**Chosen:** 7 conditions × 8 origins × 10 base items = 560+ combinations generated at runtime  
**Alternative:** a hardcoded list of 20–30 items  
**Trade-off:** procedural generation prevents players from memorizing item values after a few games, making every auction feel fresh. The `Allegedly Authentic` condition (0.05× multiplier) creates trap items that punish overbidding. The cost is slightly more code and less editorial control over individual items.

---

### 6. Minimum bid increment

**Chosen:** `max($25, 10% of current highest bid)`  
**Alternative:** fixed $1 increment  
**Trade-off:** a percentage-based floor prevents low-value snipe bids (e.g. bidding $1,001 over $1,000) while keeping early rounds accessible. At high bid values it creates meaningful commitment — you can't nibble your way to winning.

---

### 7. Timer extension on late bids

**Chosen:** a bid in the last 5 seconds adds 5 seconds, up to 3 extensions per round  
**Alternative:** fixed timer, no extensions  
**Trade-off:** extensions prevent sniping (winning by bidding in the last half-second) and reward aggressive play. The 3-extension cap ensures rounds still end. Without extensions, the optimal strategy is to bid as late as possible, which isn't fun.

---

### 8. Disconnect handling

**Chosen:** if a player disconnects mid-game and the room drops below `MIN_PLAYERS`, broadcast an error then close all remaining WebSockets after a 2-second delay  
**Alternative:** pause the game and wait for reconnect  
**Trade-off:** closing sockets triggers `ws.onclose` on the clients, which resets their view to the join screen — a clean UX reset. Waiting for reconnect requires session tokens, reconnect logic, and a timeout decision, adding significant complexity for a casual game. The 2-second delay gives the error message time to reach clients before the connection drops.

---

## Project Structure

```
ws-auction/
  src/
    constants.ts      game config (balance, rounds, timer, player limits)
    types.ts          all interfaces + client/server message shapes
    items.ts          procedural item generator (conditions × origins × bases)
    room.ts           room/player state + helpers (create/destroy/host transfer)
    game.ts           game loop (start → tick → resolve → end)
    middleware.ts     validation guards (context, phase, host, bid)
    handlers.ts       message routing (join, bid, start, disconnect)
    redis.ts          Pub/Sub fan-out + global leaderboard (sorted set)
    db.ts             PostgreSQL persistence (games, results, rounds)
    server.ts         HTTP (static + /leaderboard) + WebSocket server
  client/
    index.html        loads Press Start 2P + VT323 fonts
    src/
      index.css       design system — palette vars, CRT effects, components
      types.ts        client-side message types
      App.tsx         root — state (useReducer) + WebSocket lifecycle
      views/
        JoinView.tsx
        LobbyView.tsx
        AuctionView.tsx
        ResultsView.tsx
      components/
        PixelSprite.tsx        pixel-art sprite renderer (auctioneer, trophy)
        ConnectionStatus.tsx   live WebSocket status badge
        RoundEndOverlay.tsx
        leaderboard.tsx
  public/             React build output (served by the Node server)
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- Redis instance (local or [Upstash](https://upstash.com))
- PostgreSQL instance (local or [Supabase](https://supabase.com))

### Environment variables

Create a `.env` file in the project root:

```env
REDIS_URL=rediss://default:PASSWORD@HOST.upstash.io:6379
PG_URL=postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres
NODE_ENV=production
PORT=3000
```

For local development without these services, the server falls back to `redis://127.0.0.1:6379` and a local Postgres instance.

### Database schema

```sql
CREATE TABLE games (
  id           SERIAL PRIMARY KEY,
  room_id      TEXT        NOT NULL,
  winner_name  TEXT        NOT NULL,
  total_rounds INT         NOT NULL,
  started_at   TIMESTAMPTZ NOT NULL,
  ended_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE game_results (
  id            SERIAL PRIMARY KEY,
  game_id       INT  NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_name   TEXT NOT NULL,
  profit        INT  NOT NULL,
  final_balance INT  NOT NULL,
  items_won     INT  NOT NULL,
  rank          INT  NOT NULL
);

CREATE TABLE round_history (
  id           SERIAL PRIMARY KEY,
  game_id      INT  NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  round_number INT  NOT NULL,
  item_name    TEXT NOT NULL,
  true_value   INT  NOT NULL,
  winning_bid  INT  NOT NULL,
  winner_name  TEXT
);
```

### Development

```bash
# Terminal 1 — backend (ts-node, port 3000)
npm run dev

# Terminal 2 — frontend (Vite dev server, port 5173)
cd client && npm run dev
```

Open **http://localhost:5173**. In dev, the client proxies WebSocket connections to `ws://localhost:3000`.

### Production build

```bash
npm run build   # compiles backend TS + builds the React client into public/
npm start       # node dist/server.js  — serves UI + WebSocket on $PORT
```

---

## HTTP API

| Method | Path           | Description                                    |
|--------|----------------|------------------------------------------------|
| `GET`  | `/leaderboard` | Top 10 all-time players (profit) from Redis    |
| `GET`  | `/*`           | Serves the React SPA from `public/`            |

---

## Game Rules

- Each player starts with **$1,000**.
- **5 rounds** per game; each round auctions one mystery item for **20 seconds**.
- Rooms take **2–8 players**; the first to join is the host.
- Every item has a hidden **true value** — each player gets a private hint with varying accuracy (expert estimate → wild gut feeling).
- Items are generated procedurally: condition (`Mint` → `Allegedly Authentic`) × origin × base item = 560+ combinations.
- **Profit** for a round = `true value − winning bid` (winner only; losers' balances are unchanged).
- Bidding in the last 5 seconds extends the timer by 5 seconds (max 3 extensions per round).
- Minimum bid = `highest bid + max($25, 10% of highest bid)`.
- The player with the highest total profit after all rounds **wins**.
