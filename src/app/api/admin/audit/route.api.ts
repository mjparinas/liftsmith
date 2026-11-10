// GET /api/admin/audit/: the change log, the latest 200 sign-ins and changes made in the panel (staff).
import { json, requireStaff } from "@/server/adminAuth";
import { auditLog } from "@/server/adminData";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const gate = await requireStaff(req);
  if ("response" in gate) return gate.response;
  return json(200, { audit: await auditLog(200) });
}
