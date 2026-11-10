// GET /api/admin/system/?check=<id> or ?page=<name>: one card of the System page (src/server/systemHealth.ts),
// cached for a minute; &refresh=1 checks again. Each card loads on its own so a slow provider can't hold up the rest.
// Staff only (support can look). Tokens stay on the server; only results come back.
// POST {action: "restore-drill", date: "YYYY-MM-DD"} records a practised restore for the Backups card (admins, audited).
import { audit, json, requireStaff } from "@/server/adminAuth";
import { readBody } from "@/server/adminBody";
import { setSetting } from "@/server/settings";
import { isCheckId, isStatusPageName, runCheck, runStatusPage } from "@/server/systemHealth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const gate = await requireStaff(req);
  if ("response" in gate) return gate.response;
  const q = new URL(req.url).searchParams;
  const refresh = q.get("refresh") === "1";
  const check = q.get("check");
  if (check) {
    if (!isCheckId(check)) return json(404, { error: "No such check" });
    return json(200, await runCheck(check, { refresh }));
  }
  const page = q.get("page");
  if (page) {
    if (!isStatusPageName(page)) return json(404, { error: "No such status page" });
    return json(200, await runStatusPage(page, { refresh }));
  }
  return json(400, { error: "Ask for ?check= or ?page=" });
}

export async function POST(req: Request) {
  const gate = await requireStaff(req, { write: true });
  if ("response" in gate) return gate.response;
  const body = await readBody(req);
  if (body?.action !== "restore-drill") return json(400, { error: "Unknown action" });
  const date = typeof body.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.date) ? Date.parse(`${body.date}T12:00:00Z`) : NaN;
  if (!Number.isFinite(date) || date > Date.now() + 86_400_000)
    return json(400, { error: "Give the day it was practised, not in the future." });
  await setSetting("restore-drill", JSON.stringify({ at: date, by: gate.staff.email }));
  await audit(gate.staff.email, "restore-drill.record", String(body.date));
  return json(200, { ok: true });
}
