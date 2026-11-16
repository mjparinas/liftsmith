// Coaches' programs (src/server/coachPrograms.ts, docs/decisions/coach-programs.md). Server build only.
// GET ?id=<id>: one program (signed in or not; a session adds whether you have it and, if you do, its days).
// GET ?mine=1 (signed in): { mine, owned, pay }: the programs you made with their sales, the programs you have, and
// whether you can set a price (your Stripe account takes payments; Stripe Connect is set up on the server).
// GET (signed in or not): listed programs, newest first; ?free=1 for free ones only (the phone apps ask for these:
// they never show a paid program you don't have), ?coach=<id> for one coach's.
// POST { action } (signed in): "save" (`program`), "delete" (`id`), "get" (a free one: `id`), "drop" (a free one off
// your list: `id`) and "buy" (`id`: a Stripe Checkout page on the coach's account; the web app only).
import { preflight, readJson, reply, signedIn } from "@/server/accountHttp";
import { sessionOf } from "@/server/accounts";
import { payAccount, payConfig } from "@/server/coachPay";
import {
  browsePrograms,
  deleteProgram,
  dropProgram,
  getFree,
  myPrograms,
  ownedPrograms,
  programCheckout,
  programFor,
  saveProgram,
} from "@/server/coachPrograms";
import { rateLimit } from "@/server/db";

export const OPTIONS = preflight;

async function viewerOf(req: Request): Promise<string | null> {
  if (!req.headers.get("authorization")) return null;
  try {
    return (await sessionOf(req))?.accountId ?? null;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  if (q.has("mine")) {
    const s = await signedIn(req);
    if (s instanceof Response) return s;
    const [mine, owned] = await Promise.all([myPrograms(s.accountId), ownedPrograms(s.accountId)]);
    const acc = payConfig() ? await payAccount(s.accountId) : null;
    return reply(req, 200, { mine, owned, pay: { ready: !!acc?.ready, currency: acc?.currency ?? null } });
  }
  const viewer = await viewerOf(req);
  const id = q.get("id");
  if (id !== null) {
    const p = await programFor(id, viewer);
    return p ? reply(req, 200, { program: p }) : reply(req, 404, { error: "gone" });
  }
  // Without Stripe Connect on the server nothing paid can be bought, so only free programs are listed.
  const freeOnly = q.get("free") === "1" || !payConfig();
  return reply(req, 200, { programs: await browsePrograms(viewer, { freeOnly, coach: q.get("coach") ?? undefined }) });
}

export async function POST(req: Request) {
  const s = await signedIn(req);
  if (s instanceof Response) return s;
  const body = (await readJson(req, 40_000)) as { action?: unknown; id?: unknown; program?: unknown } | undefined;
  if (!body || typeof body !== "object") return reply(req, 400, { error: "Bad request." });
  if (!(await rateLimit(`programs:${s.accountId}`, 120, 3_600_000).catch(() => true))) return reply(req, 429, { error: "slow" });
  switch (body.action) {
    case "save": {
      const r = await saveProgram(s.accountId, body.program);
      if ("error" in r) return reply(req, r.error === "notYours" ? 404 : r.error === "full" ? 409 : 400, r);
      return reply(req, 200, { program: r });
    }
    case "delete": {
      const r = await deleteProgram(s.accountId, body.id);
      return r ? reply(req, 200, { result: r }) : reply(req, 404, { error: "gone" });
    }
    case "get": {
      const r = await getFree(s.accountId, body.id);
      return "error" in r ? reply(req, r.error === "gone" ? 404 : 409, r) : reply(req, 200, { program: r });
    }
    case "drop":
      return reply(req, 200, { ok: await dropProgram(s.accountId, body.id) });
    case "buy": {
      const cfg = payConfig();
      if (!cfg) return reply(req, 503, { error: "Payments aren't set up yet." });
      try {
        const r = await programCheckout(cfg, s.accountId, body.id);
        return typeof r === "string" ? reply(req, 200, { url: r }) : reply(req, r.error === "gone" ? 404 : 409, r);
      } catch (e) {
        console.error(`program buy: ${e instanceof Error ? e.message : String(e)}`);
        return reply(req, 502, { error: "stripe" });
      }
    }
    default:
      return reply(req, 400, { error: "Bad request." });
  }
}
