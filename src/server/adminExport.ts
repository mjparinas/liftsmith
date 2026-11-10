// CSV downloads for the admin panel (Gradelings' /api/admin/export/). Device, account and subscription rows only:
// never a synced event body, a health reading, anything the lifter typed, or an IP address. Cells that a
// spreadsheet would run as a formula are escaped (src/lib/csv.ts).
import { isoTime, toCsv, type Cell } from "@/lib/csv";

import { query } from "./db";

export const EXPORTS = ["installs", "accounts", "subscriptions"] as const;
export type ExportType = (typeof EXPORTS)[number];
export const isExport = (v: unknown): v is ExportType => (EXPORTS as readonly unknown[]).includes(v);

const MAX = 100_000;
const v = (x: unknown): Cell => (x == null ? null : typeof x === "number" || typeof x === "string" ? x : String(x));

export async function exportCsv(type: ExportType): Promise<string> {
  switch (type) {
    case "installs": {
      const rows = await query(
        `SELECT i.*, (SELECT COUNT(*) FROM events e WHERE e.install_id = i.id AND e.name = 'workout_finish') AS workouts
         FROM installs i ORDER BY first_seen LIMIT ${MAX}`,
      );
      return toCsv(
        [
          "install_id",
          "first_seen",
          "last_seen",
          "platform",
          "store",
          "app_version",
          "os",
          "os_version",
          "manufacturer",
          "model",
          "form_factor",
          "locale",
          "country",
          "region",
          "source",
          "medium",
          "campaign",
          "referrer",
          "asa_campaign",
          "workouts",
          "test",
        ],
        rows.map((r) => [
          v(r.id),
          isoTime(Number(r.first_seen)),
          isoTime(Number(r.last_seen)),
          v(r.platform),
          v(r.store),
          v(r.app_version),
          v(r.os),
          v(r.os_version),
          v(r.manufacturer),
          v(r.model),
          v(r.form_factor),
          v(r.locale),
          v(r.country),
          v(r.region),
          v(r.source),
          v(r.medium),
          v(r.campaign),
          v(r.referrer),
          v(r.asa_campaign),
          Number(r.workouts ?? 0),
          Number(r.test) === 1 ? "yes" : "no",
        ]),
      );
    }
    case "accounts": {
      const rows = await query(
        `SELECT a.id, a.email, a.created_at, a.last_seen,
          (SELECT GROUP_CONCAT(DISTINCT provider) FROM account_identities i WHERE i.account_id = a.id) AS providers,
          (SELECT COUNT(*) FROM account_sessions x WHERE x.account_id = a.id) AS devices,
          (SELECT COUNT(*) FROM sync_events e WHERE e.account_id = a.id AND e.body IS NOT NULL) AS events
         FROM accounts a ORDER BY a.created_at LIMIT ${MAX}`,
      );
      return toCsv(
        ["account_id", "email", "created", "last_seen", "sign_in", "devices", "synced_events"],
        rows.map((r) => [
          v(r.id),
          v(r.email),
          isoTime(Number(r.created_at)),
          isoTime(Number(r.last_seen)),
          (r.providers == null ? "" : String(r.providers)).split(",").sort().join(" "),
          Number(r.devices ?? 0),
          Number(r.events ?? 0),
        ]),
      );
    }
    case "subscriptions": {
      const rows = await query(`SELECT * FROM subscription_events ORDER BY at LIMIT ${MAX}`);
      return toCsv(
        ["at", "install_id", "subscription", "store", "kind", "plan", "price", "currency", "usd", "country", "reason", "source"],
        rows.map((r) => [
          isoTime(Number(r.at)),
          v(r.install_id),
          v(r.subscription),
          v(r.store),
          v(r.kind),
          v(r.plan),
          r.price_micros == null ? null : Number(r.price_micros) / 1e6,
          v(r.currency),
          r.usd_micros == null ? null : Number(r.usd_micros) / 1e6,
          v(r.country),
          v(r.reason),
          v(r.source),
        ]),
      );
    }
  }
}
