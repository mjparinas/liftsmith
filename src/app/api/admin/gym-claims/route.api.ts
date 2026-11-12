// GET /api/admin/gym-claims/: gym claims waiting for staff, and the last 30 days' decisions (staff). POST {id, action}
// (admins, audited): approve makes the gym the claimant's, if nobody owns it yet; reject closes the claim
// (src/server/gymClaims.ts, docs/decisions/gyms.md step 3).
import { audit, json, requireStaff } from "@/server/adminAuth";
import { readBody } from "@/server/adminBody";
import { claimQueue, decideClaim } from "@/server/gymClaims";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const gate = await requireStaff(req);
  if ("response" in gate) return gate.response;
  return json(200, { claims: await claimQueue() });
}

export async function POST(req: Request) {
  const gate = await requireStaff(req, { write: true });
  if ("response" in gate) return gate.response;
  const body = await readBody(req);
  if (!body || !(await decideClaim(body.id, body.action)))
    return json(400, { error: "That claim isn't waiting any more, or the gym already has an owner." });
  await audit(gate.staff.email, `gyms.claim.${String(body.action)}`, String(body.id));
  return json(200, { ok: true });
}
