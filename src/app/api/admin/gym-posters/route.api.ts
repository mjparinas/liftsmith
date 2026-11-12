// GET /api/admin/gym-posters/: posters and stands to print and mail, and the last 60 days' (staff). POST (admins,
// audited): {action: "order", place, items, shipTo, address, lang} adds an order for any gym; {id, action: printed |
// shipped | cancel | reopen} moves one along (src/server/gymPosters.ts, docs/decisions/gyms.md step 4).
import { audit, json, requireStaff } from "@/server/adminAuth";
import { readBody } from "@/server/adminBody";
import { actOnOrder, posterQueue, staffOrder } from "@/server/gymPosters";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const gate = await requireStaff(req);
  if ("response" in gate) return gate.response;
  return json(200, { orders: await posterQueue() });
}

export async function POST(req: Request) {
  const gate = await requireStaff(req, { write: true });
  if ("response" in gate) return gate.response;
  const body = await readBody(req);
  if (!body) return json(400, { error: "Bad request." });
  if (body.action === "order") {
    const r = await staffOrder(body);
    if (!r.ok)
      return json(r.error === "open" ? 409 : 400, {
        error:
          r.error === "open"
            ? "This gym already has an order waiting. Print or cancel that one first."
            : r.error === "address"
              ? "Add the gym's mailing address."
              : "That gym wasn't found.",
      });
    await audit(gate.staff.email, "gyms.posters.order", String(body.place));
    return json(200, r);
  }
  if (!(await actOnOrder(body.id, body.action))) return json(400, { error: "That order has already moved on." });
  await audit(gate.staff.email, `gyms.posters.${String(body.action)}`, String(body.id));
  return json(200, { ok: true });
}
