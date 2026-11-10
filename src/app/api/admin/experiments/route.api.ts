// GET /api/admin/experiments/: every A/B test with its results (staff). POST (admins, audited):
//   {action: "create", flag, description, variants: [{value, weight}]}  a draft (everyone sees the control)
//   {action: "start", flag}            installs get a variant and are counted
//   {action: "stop", flag, winner?}    everyone gets the winner (or the control)
//   {action: "delete", flag}           a draft or stopped test, and its assignments
import { validateExperiment, type Variant } from "@/lib/experiments";
import { allowed, isFlagName } from "@/lib/flags";
import { audit, json, requireStaff } from "@/server/adminAuth";
import { readBody } from "@/server/adminBody";
import {
  createExperiment,
  deleteExperiment,
  experimentResults,
  getExperiment,
  listExperiments,
  startExperiment,
  stopExperiment,
} from "@/server/flags";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const gate = await requireStaff(req);
  if ("response" in gate) return gate.response;
  const list = await listExperiments();
  const experiments = await Promise.all(list.map(async (e) => ({ ...e, results: await experimentResults(e) })));
  return json(200, { experiments });
}

export async function POST(req: Request) {
  const gate = await requireStaff(req, { write: true });
  if ("response" in gate) return gate.response;
  const body = await readBody(req);
  if (!body) return json(400, { error: "Not JSON" });
  if (!isFlagName(body.flag)) return json(400, { error: "Which flag?" });
  const flag = body.flag;
  const who = gate.staff.email;
  switch (body.action) {
    case "create": {
      const err = validateExperiment(flag, body.variants, body.description ?? "");
      if (err) return json(400, { error: err });
      if (!(await createExperiment(flag, String(body.description ?? ""), body.variants as Variant[])))
        return json(409, { error: "That flag already has a test. Delete it first." });
      await audit(who, "experiment.create", flag, { variants: body.variants });
      return json(200, { ok: true });
    }
    case "start":
      if (!(await startExperiment(flag))) return json(409, { error: "Only a draft can start." });
      await audit(who, "experiment.start", flag);
      return json(200, { ok: true });
    case "stop": {
      const e = await getExperiment(flag);
      const winner = body.winner == null ? null : body.winner;
      if (winner != null && (!allowed(flag, winner) || !e?.variants.some((v) => v.value === winner)))
        return json(400, { error: "The winner must be one of the test's variants." });
      if (!(await stopExperiment(flag, winner))) return json(409, { error: "Only a running test can stop." });
      await audit(who, "experiment.stop", flag, { winner });
      return json(200, { ok: true });
    }
    case "delete":
      if (!(await deleteExperiment(flag))) return json(409, { error: "Stop the test before deleting it." });
      await audit(who, "experiment.delete", flag);
      return json(200, { ok: true });
    default:
      return json(400, { error: "Unknown action" });
  }
}
