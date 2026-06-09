import { Pool } from "pg";

const pool = process.env.PG_URL
  ? new Pool({
      connectionString: process.env.PG_URL,
      ssl: { rejectUnauthorized: false },
    })
  : new Pool({
      host:     "127.0.0.1",
      port:     5432,
      database: "auction",
      user:     "postgres",
      password: "higgsboson",
    });

pool.on("error", (err) => console.error("[db] pool error: ", err.message));

export async function query<T = unknown> (
    sql: string,
    params: unknown[] = []
): Promise<T[]>{
    const result = await pool.query(sql, params);
    return result.rows;
}

export async function saveGame(
    roomId: string,
    winnerName: string,
    totalRounds: number,
    startedAt: Date
) : Promise<number> {
    const rows = await query<{ id: number }>(
        `INSERT INTO games (room_id, winner_name, total_rounds, started_at)
        VALUES ($1, $2, $3, $4)
        RETURNING id`,
        [roomId, winnerName, totalRounds, startedAt]
    );
    return rows[0].id;
}

export async function saveGameResults(
  gameId: number,
  results: { name: string; profit: number; balance: number; itemsWon: number; rank: number }[]
): Promise<void> {
  for (const r of results) {
    await query(
      `INSERT INTO game_results (game_id, player_name, profit, final_balance, items_won, rank)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [gameId, r.name, r.profit, r.balance, r.itemsWon, r.rank]
    );
  }
}

export async function saveRound(
    gameId: number,
    roundNumber: number,
    itemName: string,
    trueValue: number,
    winningBid: number,
    winnerName: string | null
): Promise<void> {
  await query(
    `INSERT INTO round_history (game_id, round_number, item_name, true_value, winning_bid, winner_name)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [gameId, roundNumber, itemName, trueValue, winningBid, winnerName]
  );    
}