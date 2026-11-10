// GET /api/admin/installs/: the latest installs. GET ?id=: one install's page (device, event counts and the latest
// events by name, subscription events, entitlement, creator code). POST {id, test}: marks an install as a
// test device (the owner's phones, CI), which leaves it out of every number. Admins only; audited.
import { audit, json, requireStaff } from "@/server/adminAuth";
import { recentInstalls } from "@/server/adminData";
import { installDetail } from "@/server/adminUsers";
import { run } from "@/server/db";

export async function GET(req: Request) {
  const gate = await requireStaff(req);
  if ("response" in gate) return gate.response;
  const id = new URL(req.url).searchParams.get("id");
  if (id != null) {
    if (!/^[A-Za-z0-9_-]{8,64}$/.test(id)) return json(400, { error: "Bad id" });
    const detail = await installDetail(id);
    return detail ? json(200, detail) : json(404, { error: "No install with that id." });
  }
  return json(200, { installs: await recentInstalls(200), staff: gate.staff });
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
