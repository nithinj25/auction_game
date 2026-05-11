/* ── state ──────────────────────────────────────────────────────────────── */
const state = {
  ws: null,
  playerId: null,
  isHost: false,
  balance: 0,
  profit: 0,
  roundTimeLimit: 20,
};

/* ── DOM refs ────────────────────────────────────────────────────────────── */
const $ = (id) => document.getElementById(id);

const views = {
  join:    $("view-join"),
  lobby:   $("view-lobby"),
  auction: $("view-auction"),
  results: $("view-results"),
};

/* ── view switching ──────────────────────────────────────────────────────── */
function showView(name) {
  Object.values(views).forEach((v) => v.classList.remove("active"));
  views[name].classList.add("active");
}

/* ── toast ───────────────────────────────────────────────────────────────── */
let toastTimer;
function showToast(msg) {
  const el = $("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 3000);
}

/* ── connect ──────────────────────────────────────────────────────────────── */
function connect(name, roomId) {
  const proto = location.protocol === "https:" ? "wss" : "ws";
  state.ws = new WebSocket(`${proto}://${location.host}`);

  state.ws.addEventListener("open", () => {
    send({ type: "join", name, roomId });
  });

  state.ws.addEventListener("message", (ev) => {
    try {
      handleServer(JSON.parse(ev.data));
    } catch (e) {
      console.error("bad message", e);
    }
  });

  state.ws.addEventListener("close", () => {
    showToast("Disconnected from server");
    showView("join");
  });

  state.ws.addEventListener("error", () => {
    showToast("Connection error");
  });
}

function send(msg) {
  if (state.ws && state.ws.readyState === WebSocket.OPEN) {
    state.ws.send(JSON.stringify(msg));
  }
}

/* ── server message router ───────────────────────────────────────────────── */
function handleServer(msg) {
  switch (msg.type) {
    case "joined":       return onJoined(msg);
    case "lobby_update": return onLobbyUpdate(msg);
    case "round_start":  return onRoundStart(msg);
    case "bid_update":   return onBidUpdate(msg);
    case "timer":        return onTimer(msg);
    case "round_end":    return onRoundEnd(msg);
    case "game_over":    return onGameOver(msg);
    case "player_left":  return onPlayerLeft(msg);
    case "error":        return showToast(msg.message);
  }
}

/* ── handlers ────────────────────────────────────────────────────────────── */
function onJoined(msg) {
  state.playerId = msg.playerId;
  state.isHost   = msg.isHost;
  state.balance  = msg.balance;
  state.profit   = 0;

  $("lobby-room-id").textContent = msg.roomId;
  $("btn-start").style.display = msg.isHost ? "block" : "none";
  showView("lobby");
}

function onLobbyUpdate(msg) {
  const list = $("player-list");
  list.innerHTML = msg.players
    .map((p) => `<li>${p.isHost ? '<span class="badge">host</span>' : ""} ${esc(p.name)}</li>`)
    .join("");

  const count = msg.players.length;
  $("lobby-status").textContent =
    count < 2 ? `Waiting for more players… (${count}/2 minimum)` : `${count} player${count > 1 ? "s" : ""} ready`;
}

function onRoundStart(msg) {
  $("round-end-overlay").classList.remove("show");
  showView("auction");

  state.roundTimeLimit = msg.timeLimit;

  $("round-label").textContent = `Round ${msg.round} of ${msg.totalRounds}`;
  $("item-emoji").textContent  = msg.item.imageEmoji;
  $("item-name").textContent   = msg.item.name;
  $("item-desc").textContent   = msg.item.description;
  $("stat-balance").textContent = fmt(state.balance);
  $("stat-profit").textContent  = fmt(state.profit);
  $("stat-highest").textContent = fmt(msg.startingBid);
  $("stat-yours").textContent   = "—";
  $("bid-input").value = "";
  $("bid-input").min   = msg.startingBid + 1;

  setTimerBar(msg.timeLimit, msg.timeLimit);
}

function onBidUpdate(msg) {
  $("stat-highest").textContent = fmt(msg.highestBid);
  $("stat-yours").textContent   = msg.yourBid !== null ? fmt(msg.yourBid) : "—";
  if (msg.highestBidder) {
    $("bid-input").min = msg.highestBid + 1;
  }
}

function onTimer(msg) {
  $("timer-label").textContent = `${msg.secondsLeft}s`;
  setTimerBar(msg.secondsLeft, state.roundTimeLimit);
}

function onRoundEnd(msg) {
  state.balance = msg.leaderboard.find((e) => {
    // find our entry by matching profit (best proxy without storing name)
    return true; // we'll update from leaderboard below
  })?.balance ?? state.balance;

  // find our own entry
  const me = msg.leaderboard.find((e) => {
    // we don't have name stored in state, so update balance from server msg
    return false;
  });

  // update balance/profit from leaderboard — find by profit contribution
  // simplest: trust the server values and reflect them via the overlay close → round_start
  const profitEl  = $("round-end-profit");
  const isWinner  = msg.winner !== null;
  const weWon     = false; // we'll detect by checking yourBid == winningBid (tracked client-side would be better, skip for now)

  $("round-end-title").textContent =
    isWinner ? `🏆 ${esc(msg.winner)} wins!` : "No bids — item unsold";

  profitEl.textContent = isWinner
    ? `${msg.profit >= 0 ? "+" : ""}${fmt(msg.profit)} profit`
    : "";
  profitEl.className = "round-end-profit " + (msg.profit >= 0 ? "profit-pos" : "profit-neg");

  $("round-end-detail").textContent =
    `Winning bid: ${fmt(msg.winningBid)} · True value: ${fmt(msg.trueValue)}`;

  $("round-leaderboard").innerHTML = renderLeaderboard(msg.leaderboard);
  $("round-end-overlay").classList.add("show");
}

function onGameOver(msg) {
  $("round-end-overlay").classList.remove("show");
  $("results-winner").textContent = `Winner: ${esc(msg.winner)} 🎉`;
  $("final-leaderboard").innerHTML = renderLeaderboard(msg.leaderboard);
  showView("results");
}

function onPlayerLeft(msg) {
  showToast(`${esc(msg.name)} left (${msg.playersLeft} remaining)`);
}

/* ── helpers ──────────────────────────────────────────────────────────────── */
function fmt(n) {
  return "$" + Number(n).toLocaleString();
}

function esc(str) {
  return String(str).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

function setTimerBar(secondsLeft, total) {
  const pct = Math.max(0, (secondsLeft / total) * 100);
  $("timer-bar").style.width = pct + "%";
  $("timer-bar").style.background = pct < 25 ? "#f44336" : pct < 50 ? "#ff9800" : "#6c63ff";
}

function renderLeaderboard(entries) {
  return entries
    .map(
      (e, i) => `
      <div class="lb-row">
        <span class="lb-rank">#${i + 1}</span>
        <span class="lb-name">${esc(e.name)}</span>
        <span class="lb-profit ${e.profit >= 0 ? "profit-pos" : "profit-neg"}">${e.profit >= 0 ? "+" : ""}${fmt(e.profit)}</span>
        <span style="color:#888;margin-left:12px;font-size:0.85rem">${fmt(e.balance)}</span>
      </div>`
    )
    .join("");
}

/* ── UI events ───────────────────────────────────────────────────────────── */
$("btn-join").addEventListener("click", () => {
  const name   = $("inp-name").value.trim();
  const roomId = $("inp-room").value.trim();
  if (!name || !roomId) { showToast("Enter your name and a room code"); return; }
  connect(name, roomId);
});

$("inp-name").addEventListener("keydown", (e) => { if (e.key === "Enter") $("inp-room").focus(); });
$("inp-room").addEventListener("keydown", (e) => { if (e.key === "Enter") $("btn-join").click(); });

$("btn-start").addEventListener("click", () => {
  send({ type: "start" });
});

$("btn-bid").addEventListener("click", () => {
  const amount = parseInt($("bid-input").value, 10);
  if (isNaN(amount) || amount <= 0) { showToast("Enter a valid bid"); return; }
  send({ type: "bid", amount });
  $("bid-input").value = "";
});

$("bid-input").addEventListener("keydown", (e) => { if (e.key === "Enter") $("btn-bid").click(); });

$("btn-play-again").addEventListener("click", () => {
  if (state.ws) state.ws.close();
  showView("join");
});
