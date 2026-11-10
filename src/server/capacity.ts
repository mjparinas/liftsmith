// The database's size for the System tab's Capacity card (Gradelings' capacity check): page count times page
// size, one sample a day kept 90 days to show growth, and how long until DATABASE_SIZE_LIMIT_MB at that rate.
import { query, run } from "./db";

const DAY = 86_400_000;

export async function dbSize(): Promise<number> {
  const [pages] = await query<{ page_count: number }>("PRAGMA page_count");
  const [size] = await query<{ page_size: number }>("PRAGMA page_size");
  return Number(pages?.page_count ?? 0) * Number(size?.page_size ?? 0);
}

/** Records today's size (once a day, from the admin cron) and drops samples older than 90 days. */
export async function sampleDbSize(now = Date.now()): Promise<number> {
  const bytes = await dbSize();
  const day = Math.floor(now / DAY);
  await run("INSERT INTO db_size_samples (day, bytes) VALUES (?, ?) ON CONFLICT(day) DO UPDATE SET bytes = excluded.bytes", [day, bytes]);
  await run("DELETE FROM db_size_samples WHERE day < ?", [day - 90]);
  return bytes;
}

export async function sizeSamples(): Promise<{ day: number; bytes: number }[]> {
  const rows = await query("SELECT day, bytes FROM db_size_samples ORDER BY day");
  return rows.map((r) => ({ day: Number(r.day), bytes: Number(r.bytes) }));
}
