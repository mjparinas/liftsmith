// The admin Pins tab (src/components/admin/Pins.tsx, docs/decisions/pinterest.md): GET the queue, the settings and the
// Pinterest link; POST { action } to approve, skip, retry, edit or post a pin now, change the settings, or connect and
// disconnect Pinterest. Changes are admins only and audited.
import { audit, json, requireStaff } from "@/server/adminAuth";
import { readBody } from "@/server/adminBody";
import {
  changePins,
  connectUrl,
  disconnectPinterest,
  pinQueue,
  pinSettings,
  pinterestStatus,
  postNow,
  savePinSettings,
  type PinSettings,
} from "@/server/pins";

export const dynamic = "force-dynamic";
export const maxDuration = 90;

export async function GET(req: Request) {
  const gate = await requireStaff(req);
  if ("response" in gate) return gate.response;
  const [queue, settings, pinterest] = await Promise.all([pinQueue(), pinSettings(), pinterestStatus()]);
  return json(200, { ...queue, settings, pinterest, now: Date.now() });
}

export async function POST(req: Request) {
  const gate = await requireStaff(req, { write: true });
  if ("response" in gate) return gate.response;
  const body = await readBody(req, 8_000);
  const action = String(body?.action ?? "");
  const id = typeof body?.id === "string" ? body.id.slice(0, 120) : null;
  const who = gate.staff.email;
  switch (action) {
    case "approve":
    case "approveAll":
    case "skip":
    case "retry":
    case "edit": {
      const n = await changePins(action, id, { title: String(body?.title ?? ""), description: String(body?.description ?? "") });
      await audit(who, `pins.${action}`, id, { changed: n });
      return json(200, { ok: true, changed: n });
    }
    case "post": {
      if (!id) return json(400, { error: "Which pin?" });
      try {
        const status = await postNow(id);
        await audit(who, "pins.post", id, { status });
        return json(200, { ok: true, status });
      } catch (e) {
        return json(400, { error: e instanceof Error ? e.message : "Pinterest didn't answer." });
      }
    }
    case "settings": {
      const s = await savePinSettings((body?.settings ?? {}) as Partial<PinSettings>);
      await audit(who, "pins.settings", null, s);
      return json(200, { ok: true, settings: s });
    }
    case "connect": {
      const url = await connectUrl();
      if (!url) return json(400, { error: "Set PINTEREST_APP_ID and PINTEREST_APP_SECRET in Vercel first." });
      return json(200, { url });
    }
    case "disconnect":
      await disconnectPinterest();
      await audit(who, "pins.disconnect", null);
      return json(200, { ok: true });
  }
  return json(400, { error: "Unknown action" });
}
