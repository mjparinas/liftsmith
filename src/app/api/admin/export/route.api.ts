// GET /api/admin/export/?type=installs|accounts|subscriptions: a CSV download (src/server/adminExport.ts). Admins
// only, because it holds every account's email; each download is in the audit log.
import { audit, json, requireStaff } from "@/server/adminAuth";
import { exportCsv, isExport } from "@/server/adminExport";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const gate = await requireStaff(req, { write: true });
  if ("response" in gate) return gate.response;
  const type = new URL(req.url).searchParams.get("type");
  if (!isExport(type)) return json(400, { error: "Ask for type=installs, accounts or subscriptions." });
  const csv = await exportCsv(type);
  await audit(gate.staff.email, "export", type);
  const day = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="liftsmith-${type}-${day}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
