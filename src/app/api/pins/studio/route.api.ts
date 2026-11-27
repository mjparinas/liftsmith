// Where the "Pins" GitHub workflow (scripts/pins.mjs) hands over what it made (docs/decisions/pinterest.md). Every call
// carries the run's GitHub OIDC token (githubOidc.ts): only this repo's pins.yml on main or staging gets in, so there's no
// secret to keep in two places. POST { action }:
//   made                      → { made: [exercise ids that already have pins], queued, perDay }
//   start { exercise }        → three upload tokens for the public Blob store, one per file, under pins/<exercise>/
//   finish { exercise, image, video, cover } → the pin and the clip join the queue (review or ready, per the Pins tab)
import { pinContent } from "@/lib/pinContent";
import { readBody } from "@/server/adminBody";
import { bearer, verifyActionsToken } from "@/server/githubOidc";
import { addMade, madeExercises, pinSettings, queuedCount, uploadPaths } from "@/server/pins";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const json = (status: number, body: unknown) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
const MB = 1024 * 1024;

export async function POST(req: Request) {
  const v = await verifyActionsToken(bearer(req)).catch(() => ({ ok: false as const, error: "keys" }));
  if (!v.ok) return json(401, { error: `Not allowed (${v.error})` });
  const body = await readBody(req, 8_000);
  const action = body?.action;
  if (action === "made") {
    const [made, queued, s] = await Promise.all([madeExercises(), queuedCount(), pinSettings()]);
    return json(200, { made, queued, perDay: s.perDay });
  }
  const exercise = typeof body?.exercise === "string" ? body.exercise : "";
  if (!pinContent(exercise)) return json(400, { error: "Unknown exercise" });
  if (action === "start") {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) return json(503, { error: "No Blob store (BLOB_READ_WRITE_TOKEN) on this deployment" });
    const { generateClientTokenFromReadWriteToken } = await import("@vercel/blob/client");
    const paths = uploadPaths(exercise);
    const until = Date.now() + 30 * 60_000;
    const tokenFor = (pathname: string, type: string, bytes: number) =>
      generateClientTokenFromReadWriteToken({
        token,
        pathname,
        allowedContentTypes: [type],
        maximumSizeInBytes: bytes,
        validUntil: until,
        addRandomSuffix: false,
        allowOverwrite: false,
      });
    return json(200, {
      image: { path: paths.image, token: await tokenFor(paths.image, "image/jpeg", 4 * MB) },
      video: { path: paths.video, token: await tokenFor(paths.video, "video/mp4", 40 * MB) },
      cover: { path: paths.cover, token: await tokenFor(paths.cover, "image/jpeg", 4 * MB) },
    });
  }
  if (action === "finish") {
    const r = await addMade(exercise, {
      image: String(body?.image ?? ""),
      video: String(body?.video ?? ""),
      cover: String(body?.cover ?? ""),
    });
    if (!r.ok) return json(400, { error: r.error });
    if (r.replaced.length && process.env.BLOB_READ_WRITE_TOKEN) {
      const { del } = await import("@vercel/blob");
      await del(r.replaced).catch(() => {});
    }
    return json(200, { ok: true });
  }
  return json(400, { error: "Unknown action" });
}
