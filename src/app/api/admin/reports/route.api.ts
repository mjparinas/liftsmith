// GET /api/admin/reports/: open reports on Friends, grouped by what was reported (staff). POST {kind, id, action}
// (admins, audited): remove, dismiss, suspend or unsuspend (src/server/social.ts, docs/decisions/friends.md).
import type { ReportKind } from "@/lib/socialTypes";
import { audit, json, requireStaff } from "@/server/adminAuth";
import { readBody } from "@/server/adminBody";
import { adminReports, resolveReports, type ReportAction } from "@/server/social";

export const dynamic = "force-dynamic";

const ACTIONS = new Set<ReportAction>(["remove", "dismiss", "suspend", "unsuspend"]);

export async function GET(req: Request) {
  const gate = await requireStaff(req);
  if ("response" in gate) return gate.response;
  return json(200, { reports: await adminReports() });
}

export async function POST(req: Request) {
  const gate = await requireStaff(req, { write: true });
  if ("response" in gate) return gate.response;
  const body = await readBody(req);
  const action = String(body?.action) as ReportAction;
  const kind = String(body?.kind) as ReportKind;
  const id = String(body?.id ?? "");
  if (!body || !ACTIONS.has(action) || !(await resolveReports(kind, id, action)))
    return json(400, { error: "Which report, and what to do?" });
  await audit(gate.staff.email, `report.${action}`, `${kind}:${id}`);
  return json(200, { ok: true });
}
