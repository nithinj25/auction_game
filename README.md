# WS Auction

A real-time multiplayer auction game built with WebSockets, Node.js, TypeScript, and React.

Players join a room, bid on mystery items with hidden true values, and compete to make the most profit.

---

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌──────────────────────────┐
│   Tradable  │────▶│   Server    │────▶│        WebSocket         │
│    Items    │     │  (Node.js)  │◀────│         Server           │
└─────────────┘     └─────────────┘     └──────────────────────────┘
                                                 │        ▲
                          Server Messages        │        │  Client Messages
                    JoinedMessage, LobbyUpdate   │        │  JoinMessage
                    BidUpdate, Timer, RoundEnd   ▼        │  BidMessage
                                         ┌───────────────┐│  StartMessage
                                         │   client 1    │
                                         │   client 2    │
                                         │   client 3    │
                                         └───────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Room State                                                     │
│  ├── players  Map<id, Player>                                   │
│  ├── rounds   AuctionRound[]                                    │
│  ├── currentRound  number                                       │
│  ├── timer    NodeJS.Timeout                                    │
│  ├── phase    lobby | active | resolving | ended               │
│  └── roomId   string                                           │
│                                                                 │
│  Operations                                                     │
│  ├── createRoom()     create room, return with id              │
│  ├── destroyRoom()    clear timer, remove all players          │
│  ├── createPlayer()   set initial balance + state              │
│  └── removePlayer()   handle host transfer to next player      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Handlers / Middleware Pipeline                                 │
│  ├── withContext    player + room + socket all exist?          │
│  ├── withPhase      action allowed in current room phase?      │
│  ├── withHost       is this player the host?                   │
│  └── withValidBid   bid > current highest AND <= balance?      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Game Loop                                                      │
│  ├── startGame()      generate rounds, set initial values      │
│  ├── startRound()     broadcast item, start countdown timer    │
│  ├── tickTimer()      decrement secondsLeft every 1s          │
│  ├── resolveRound()   find winner, deduct balance, profit      │
│  └── endGame()        sort leaderboard, broadcast, cleanup     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer     | Tech                        |
|-----------|-----------------------------|
| Backend   | Node.js, TypeScript, `ws`   |
| Frontend  | React, Vite, TypeScript     |
| Transport | WebSocket (native)          |

---

## Project Structure

```
ws-auction/
  src/
    constants.ts     game config (balance, rounds, timer)
    types.ts         all interfaces and message shapes
    items.ts         tradable item pool
    room.ts          room/player state + helpers
    game.ts          game loop (start → tick → resolve → end)
    middleware.ts    validation guards pipeline
    handlers.ts      message routing (join, bid, start)
    server.ts        HTTP + WebSocket server
  client/
    src/
      types.ts             client-side message types
      App.tsx              root — state (useReducer) + WebSocket
      views/
        JoinView.tsx
        LobbyView.tsx
        AuctionView.tsx
        ResultsView.tsx
      components/
        Leaderboard.tsx
        RoundEndOverlay.tsx
  public/            React build output (served by Node)
```

---

## Getting Started

### Development

```bash
# Terminal 1 — backend
npm run dev

# Terminal 2 — frontend
cd client && npm run dev
```

Open `http://localhost:5173`

### Production Build

```bash
npm run build   # compiles TypeScript + builds React into public/
npm start       # node dist/server.js
```

---

## Game Rules

- Each player starts with **$1,000**
- Every round, one mystery item is auctioned
- Items have a hidden **true value** — revealed after the round
- Your **profit** = true value − what you paid
- Winner is the player with the highest total profit after all rounds
