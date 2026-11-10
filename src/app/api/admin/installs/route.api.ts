// GET /api/admin/installs/: the latest installs and the audit log. POST {id, test}: marks an install as a
// test device (the owner's phones, CI), which leaves it out of every number. Admins only; audited.
import { audit, json, requireStaff } from "@/server/adminAuth";
import { auditLog, recentInstalls } from "@/server/adminData";
import { run } from "@/server/db";

export async function GET(req: Request) {
  const gate = await requireStaff(req);
  if ("response" in gate) return gate.response;
  const [installs, log] = await Promise.all([recentInstalls(200), auditLog(100)]);
  return json(200, { installs, audit: log, staff: gate.staff });
}

export async function POST(req: Request) {
  const gate = await requireStaff(req, { write: true });
  if ("response" in gate) return gate.response;
  let body: { id?: unknown; test?: unknown };
  try {
    const raw = await req.text();
    if (raw.length > 1000) return json(413, { error: "Too large" });
    body = JSON.parse(raw) as typeof body;
  } catch {
    return json(400, { error: "Not JSON" });
  }
  if (typeof body.id !== "string" || !/^[A-Za-z0-9_-]{8,64}$/.test(body.id) || typeof body.test !== "boolean")
    return json(400, { error: "Give an install id and test: true or false." });
  const changed = await run("UPDATE installs SET test = ? WHERE id = ?", [body.test ? 1 : 0, body.id]);
  if (!changed) return json(404, { error: "No install with that id." });
  await audit(gate.staff.email, body.test ? "install.test" : "install.real", body.id);
  return json(200, { ok: true });
}
