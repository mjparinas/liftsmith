// The admin AI helpers (src/server/ai.ts, src/server/aiHelpers.ts, docs/decisions/admin-ai.md). GET: whether they can run
// now, today's spend and the cap (staff). POST (admins, audited): {task: "triage", report} or {task: "triagePlace",
// place} suggests one action for a report; {task: "gymFill", id} reads a gym's website for its missing details;
// {task: "gymFillSave", id, fields} saves the ones staff kept (no AI); {task: "gymDupes", citySlug} lists likely
// duplicates in a city; {task: "ask", question, metrics} answers from the Overview's numbers. Nothing here acts on a
// report, merges a gym or sends anything: the panel shows the answer beside the button that does.
import { audit, json, requireStaff } from "@/server/adminAuth";
import { readBody } from "@/server/adminBody";
import { AiError, aiStatus } from "@/server/ai";
import { askData, fillGym, findDupes, saveGymFill, triagePlace, triageSocial, type SocialReportInput } from "@/server/aiHelpers";
import type { ReportedPlace } from "@/server/gymPlaceReports";

export const dynamic = "force-dynamic";
// A gym's website gets eight seconds, then Claude reads it.
export const maxDuration = 60;

export async function GET(req: Request) {
  const gate = await requireStaff(req);
  if ("response" in gate) return gate.response;
  return json(200, await aiStatus());
}

export async function POST(req: Request) {
  const gate = await requireStaff(req, { write: true });
  if ("response" in gate) return gate.response;
  // Room for the Overview's numbers over a year.
  const body = await readBody(req, 500_000);
  if (!body) return json(400, { error: "Bad request." });
  const who = gate.staff.email;
  try {
    switch (body.task) {
      case "triage": {
        const suggestion = await triageSocial(body.report as SocialReportInput);
        await audit(who, "ai.triage", "", { action: suggestion.action });
        return json(200, { suggestion });
      }
      case "triagePlace": {
        const place = body.place as ReportedPlace;
        const suggestion = await triagePlace(place);
        await audit(who, "ai.triagePlace", String(place?.id ?? ""), { action: suggestion.action });
        return json(200, { suggestion });
      }
      case "gymFill": {
        const fill = await fillGym(body.id);
        await audit(who, "ai.gymFill", fill.id, { found: Object.keys(fill.found) });
        return json(200, { fill });
      }
      case "gymFillSave": {
        const r = await saveGymFill(body.id, body.fields);
        if (!r.ok) return json(400, { error: r.error });
        await audit(who, "ai.gymFillSave", String(body.id), { saved: r.saved });
        return json(200, r);
      }
      case "gymDupes": {
        const pairs = await findDupes(body.citySlug);
        await audit(who, "ai.gymDupes", String(body.citySlug), { pairs: pairs.length });
        return json(200, { pairs });
      }
      case "ask": {
        const answer = await askData(body.question, body.metrics);
        await audit(who, "ai.ask", "", { question: String(body.question).slice(0, 200) });
        return json(200, { answer });
      }
      default:
        return json(400, { error: "Which helper?" });
    }
  } catch (e) {
    if (e instanceof AiError) return json(409, { error: e.message });
    console.error("admin ai", e);
    return json(502, { error: "The AI helper didn't work. Try again." });
  }
}
