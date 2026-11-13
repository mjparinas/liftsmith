// A gym's logo and photos (src/server/gymMedia.ts, docs/decisions/gyms.md). Server build only.
// GET ?id=<id>: the JPEG, kept a year (an id is never reused; a new picture gets a new id).
// POST {op: "add", place, kind: "logo" | "photo", image: data URL} or {op: "remove", place, id}: the gym's owner, signed in.
import { preflight, readJson, reply, signedIn } from "@/server/accountHttp";
import { addMedia, MEDIA_BODY, mediaImage, removeMedia } from "@/server/gymMedia";

export const dynamic = "force-dynamic";
export const OPTIONS = preflight;

export async function GET(req: Request) {
  const image = await mediaImage(new URL(req.url).searchParams.get("id")).catch(() => null);
  if (!image) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(image), {
    headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" },
  });
}

export async function POST(req: Request) {
  const body = await readJson(req, MEDIA_BODY);
  if (!body || typeof body !== "object") return reply(req, 400, { error: "image" });
  const b = body as Record<string, unknown>;
  const s = await signedIn(req);
  if (s instanceof Response) return s;
  if (b.op === "remove")
    return (await removeMedia(s.accountId, b.place, b.id)) ? reply(req, 200, { ok: true }) : reply(req, 403, { error: "owner" });
  const r = await addMedia(s.accountId, b);
  if (r.ok) return reply(req, 200, { id: r.id });
  return reply(req, r.error === "owner" ? 403 : r.error === "slow" ? 429 : r.error === "full" ? 409 : 400, { error: r.error });
}
