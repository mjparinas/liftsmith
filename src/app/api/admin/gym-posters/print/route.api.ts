// GET /api/admin/gym-posters/print/?id=<order>[&only=letter|poster|stand]: the print sheet for one order (gymPrint.ts).
// Admins only, because the first print of an unclaimed gym's order makes its one-time claim code. Audited.
import { audit, requireStaff } from "@/server/adminAuth";
import { printOrder } from "@/server/gymPosters";
import { PRINT_HEADERS, printHtml } from "@/server/gymPrint";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const gate = await requireStaff(req, { write: true });
  if ("response" in gate) return gate.response;
  const u = new URL(req.url).searchParams;
  const order = await printOrder(u.get("id"));
  if (!order) return new Response("That order wasn't found.", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  const only = (["letter", "poster", "stand"] as const).find((k) => k === u.get("only"));
  await audit(gate.staff.email, "gyms.posters.print", order.row.id);
  return new Response(printHtml(order.row, order.code, { only }), { headers: PRINT_HEADERS });
}
