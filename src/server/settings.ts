// Small admin settings kept in the database (admin_settings), as in Gradelings: maintenance mode, the alert
// switches, running costs, saved replies, the last restore practice and when each alert last went out.
import { query, run } from "./db";

export async function getSetting(key: string): Promise<string | null> {
  const rows = await query<{ value: string }>("SELECT value FROM admin_settings WHERE key = ?", [key]);
  return rows[0] ? String(rows[0].value) : null;
}

export async function setSetting(key: string, value: string, now = Date.now()): Promise<void> {
  await run(
    "INSERT INTO admin_settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
    [key, value, now],
  );
}

/** A JSON setting, or `fallback` when it's missing or unreadable. */
export async function getJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const v = await getSetting(key);
    return v == null ? fallback : (JSON.parse(v) as T);
  } catch {
    return fallback;
  }
}
