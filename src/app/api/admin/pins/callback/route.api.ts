// Pinterest sends the admin back here after Connect Pinterest on the Pins tab (pins.ts finishConnect). Only a signed-in
// admin's browser gets through; the code is swapped for tokens and the tab opens again with how it went.
import { requireStaff } from "@/server/adminAuth";
import { finishConnect } from "@/server/pins";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const gate = await requireStaff(req, { write: true });
  if ("response" in gate) return gate.response;
  const q = new URL(req.url).searchParams;
  const problem = q.get("error")
    ? "Pinterest didn't allow it."
    : await finishConnect((q.get("code") ?? "").slice(0, 2000), (q.get("state") ?? "").slice(0, 100));
  const back = new URL("/admin/", req.url);
  back.searchParams.set("tab", "Pins");
  back.searchParams.set("pinterest", problem ? problem.slice(0, 200) : "connected");
  return Response.redirect(back.toString(), 303);
}
