// GET ?post=<id> (signed in): the screenshot on your own bug report, for you only (src/server/community.ts). Staff see
// it through /api/admin/community/. Never cached by anyone in between: it can show someone's own data.
import { cors, preflight, reply, signedIn } from "@/server/accountHttp";
import { shotFor } from "@/server/community";

export const OPTIONS = preflight;

export async function GET(req: Request) {
  const s = await signedIn(req);
  if (s instanceof Response) return s;
  const img = await shotFor(new URL(req.url).searchParams.get("post"), s.accountId);
  if (!img) return reply(req, 404, { error: "gone" });
  return new Response(new Uint8Array(img), {
    headers: {
      ...cors(req.headers.get("origin")),
      "Content-Type": "image/jpeg",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
