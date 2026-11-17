// The admin Seasons tab (src/components/admin/Seasons.tsx): GET the schedule and the reward sets this build has,
// PUT { seasons: [...] } to replace it (admins, audited). A season that has started can't change (seasons.ts changeProblem).
import { KITS, type SeasonDef } from "@/lib/seasons";
import { audit, json, requireStaff } from "@/server/adminAuth";
import { readBody } from "@/server/adminBody";
import { saveSeasons, seasonSchedule } from "@/server/seasons";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const gate = await requireStaff(req);
  if ("response" in gate) return gate.response;
  return json(200, { seasons: await seasonSchedule(), kits: Object.keys(KITS), now: Date.now() });
}

export async function PUT(req: Request) {
  const gate = await requireStaff(req, { write: true });
  if ("response" in gate) return gate.response;
  const body = await readBody(req, 20_000);
  const list = body?.seasons;
  if (!Array.isArray(list)) return json(400, { error: "Send the whole schedule as seasons: [...]" });
  const problem = await saveSeasons(list as SeasonDef[]);
  if (problem) return json(400, { error: problem });
  await audit(gate.staff.email, "seasons.save", null, { count: list.length });
  return json(200, { ok: true, seasons: await seasonSchedule() });
}
