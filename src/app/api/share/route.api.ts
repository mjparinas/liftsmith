// Public share links (src/server/shareLinks.ts). Signed in only. Server build only.
// GET: the account's links. POST: make a link from a card. DELETE ?id=: delete one.
import { preflight, readJson, reply, signedIn } from "@/server/accountHttp";
import { createLink, deleteLink, isId, linkUrl, listLinks, MAX_BODY, parseNew } from "@/server/shareLinks";

export const OPTIONS = preflight;

export async function GET(req: Request) {
  const s = await signedIn(req);
  if (s instanceof Response) return s;
  const links = await listLinks(s.accountId);
  return reply(req, 200, { links: links.map((l) => ({ ...l, url: linkUrl(l.id) })) });
}

export async function POST(req: Request) {
  const s = await signedIn(req);
  if (s instanceof Response) return s;
  const body = await readJson(req, MAX_BODY);
  if (body === undefined) return reply(req, 413, { error: "The card is too big." });
  const l = parseNew(body);
  if ("error" in l) return reply(req, 400, l);
  const made = await createLink(s.accountId, l);
  if (made === "slow") return reply(req, 429, { error: "slow" });
  if (made === "full") return reply(req, 409, { error: "full" });
  return reply(req, 200, { link: { ...made, url: linkUrl(made.id) } });
}

export async function DELETE(req: Request) {
  const s = await signedIn(req);
  if (s instanceof Response) return s;
  const id = new URL(req.url).searchParams.get("id");
  if (!isId(id)) return reply(req, 400, { error: "Bad request." });
  await deleteLink(s.accountId, id);
  return reply(req, 200, { ok: true });
}
