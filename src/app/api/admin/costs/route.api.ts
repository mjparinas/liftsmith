// The Revenue tab's running costs (src/lib/runningCosts.ts): GET the list (staff), PUT { costs: [{ name, monthly }] }
// to replace it (admins, audited).
import { costsProblem, type RunningCost } from "@/lib/runningCosts";
import { audit, json, requireStaff } from "@/server/adminAuth";
import { readBody } from "@/server/adminBody";
import { getJson, setSetting } from "@/server/settings";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const gate = await requireStaff(req);
  if ("response" in gate) return gate.response;
  const list = await getJson<unknown>("running_costs", []);
  return json(200, { costs: costsProblem(list) ? [] : (list as RunningCost[]) });
}

export async function PUT(req: Request) {
  const gate = await requireStaff(req, { write: true });
  if ("response" in gate) return gate.response;
  const body = await readBody(req);
  const problem = costsProblem(body?.costs);
  if (problem) return json(400, { error: problem });
  const costs = (body!.costs as RunningCost[]).map((c) => ({ name: c.name.trim(), monthly: Math.round(c.monthly * 100) / 100 }));
  await setSetting("running_costs", JSON.stringify(costs));
  await audit(gate.staff.email, "costs.save", null, { count: costs.length });
  return json(200, { ok: true });
}
