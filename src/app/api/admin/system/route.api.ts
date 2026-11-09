// GET /api/admin/system/?check=<id> or ?page=<name>: one card of the System page (src/server/systemHealth.ts),
// cached for a minute; &refresh=1 checks again. Each card loads on its own so a slow provider can't hold up the rest.
// Staff only (support can look). Tokens stay on the server; only results come back.
import { json, requireStaff } from "@/server/adminAuth";
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
