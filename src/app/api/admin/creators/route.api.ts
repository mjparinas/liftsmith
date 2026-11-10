// GET /api/admin/creators/?days=28: every creator with sign-ups, trials, paying subscribers and commission
// (src/lib/creatorMetrics.ts), plus the payout history. ?format=csv: this month's payout list.
// POST {action: "save", ...creator} adds or edits a creator; {action: "payout", code, usd, note} records a
// payout made outside the app. Changes need an admin and are audited.
import { payoutCsv } from "@/lib/creatorMetrics";
import { audit, json, requireStaff } from "@/server/adminAuth";
import { checkCreator, loadCreators, recordPayout, saveCreator } from "@/server/creators";

const DAY = 86_400_000;

export async function GET(req: Request) {
  const gate = await requireStaff(req);
  if ("response" in gate) return gate.response;
  const q = new URL(req.url).searchParams;
  const days = Math.min(365, Math.max(1, Number(q.get("days") ?? 28) || 28));
  const now = Date.now();
  const data = await loadCreators(now, now - days * DAY);
  if (q.get("format") === "csv") {
    const day = new Date(now).toISOString().slice(0, 10);
    return new Response(payoutCsv(data.rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="liftsmith-creator-payouts-${day}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }
  return json(200, { ...data, staff: gate.staff });
}

export async function POST(req: Request) {
  const gate = await requireStaff(req, { write: true });
  if ("response" in gate) return gate.response;
  let body: Record<string, unknown>;
  try {
    const raw = await req.text();
    if (raw.length > 4000) return json(413, { error: "Too large" });
    body = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return json(400, { error: "Not JSON" });
  }
  if (body.action === "save") {
    const c = checkCreator(body);
    if (!c.ok) return json(400, { error: c.error });
    await saveCreator(c.creator);
    await audit(gate.staff.email, "creator.save", c.creator.code, {
      rate: c.creator.rate,
      months: c.creator.months,
      active: c.creator.active,
    });
    return json(200, { ok: true });
  }
  if (body.action === "payout") {
    const usd = Number(body.usd);
    const code = typeof body.code === "string" ? body.code : "";
    if (!Number.isFinite(usd) || usd <= 0 || usd > 100_000) return json(400, { error: "Give the amount paid in US dollars." });
    const note = typeof body.note === "string" && body.note.trim() ? body.note.trim().slice(0, 200) : null;
    if (!(await recordPayout(code, Math.round(usd * 100) / 100, gate.staff.email, note)))
      return json(404, { error: "No creator with that code." });
    await audit(gate.staff.email, "creator.payout", code, { usd });
    return json(200, { ok: true });
  }
  return json(400, { error: "Unknown action" });
}
