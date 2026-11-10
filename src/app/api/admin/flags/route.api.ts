// GET /api/admin/flags/: every flag in src/lib/flags.ts with its default, options and what an admin set (staff).
// POST (admins, audited): {name, value, rollout} sets it for that share of installs; {name, reset: true} goes back
// to the default in code.
import { allowed, FLAGS, isFlagName } from "@/lib/flags";
import { audit, json, requireStaff } from "@/server/adminAuth";
import { readBody } from "@/server/adminBody";
import { flagStates, getExperiment, resetFlag, setFlag } from "@/server/flags";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const gate = await requireStaff(req);
  if ("response" in gate) return gate.response;
  const states = await flagStates();
  const flags = await Promise.all(
    (Object.keys(FLAGS) as (keyof typeof FLAGS)[]).map(async (name) => {
      const d = FLAGS[name];
      const e = await getExperiment(name);
      return {
        name,
        label: d.label,
        description: d.description,
        default: d.default,
        options: [...d.options],
        state: states.get(name) ?? null,
        experiment: e && e.status !== "draft" ? e.status : null,
      };
    }),
  );
  return json(200, { flags });
}

export async function POST(req: Request) {
  const gate = await requireStaff(req, { write: true });
  if ("response" in gate) return gate.response;
  const body = await readBody(req);
  if (!body || !isFlagName(body.name)) return json(400, { error: "Which flag?" });
  if (body.reset === true) {
    await resetFlag(body.name);
    await audit(gate.staff.email, "flag.reset", body.name);
    return json(200, { ok: true });
  }
  if (!allowed(body.name, body.value)) return json(400, { error: `Pick one of ${FLAGS[body.name].options.join(", ")}.` });
  const rollout = Number(body.rollout ?? 100);
  if (!Number.isInteger(rollout) || rollout < 0 || rollout > 100) return json(400, { error: "Roll out to 0 to 100% of installs." });
  await setFlag(body.name, body.value, rollout, gate.staff.email);
  await audit(gate.staff.email, "flag.set", body.name, { value: body.value, rollout });
  return json(200, { ok: true });
}
