// GET /api/admin/stats/?days=7|28|90|365: every number on the admin panel. Counts and sums only.
import { json, requireStaff } from "@/server/adminAuth";
import { adminMetrics } from "@/server/adminData";

const PERIODS = new Set([7, 28, 90, 365]);

export async function GET(req: Request) {
  const gate = await requireStaff(req);
  if ("response" in gate) return gate.response;
  const days = Number(new URL(req.url).searchParams.get("days") ?? 28);
  if (!PERIODS.has(days)) return json(400, { error: "Pick 7, 28, 90 or 365 days." });
  return json(200, { ...(await adminMetrics(days)), staff: gate.staff });
}
