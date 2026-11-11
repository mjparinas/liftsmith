// Public share links (Melvin, 2026-11-11: step 2 of sharing). A signed-in lifter can turn a share card into a short
// link, www.getliftsmith.com/w/<id>/, that shows the card and unfurls with it as the preview in messages and
// social apps. Opt-in per card, deletable any time, and gone with the account. The page has no scripts at all
// (its own CSP), and it is noindex: thousands of thin pages would hurt the site in search; the growth comes
// from people tapping the previews. The image is the card the lifter saw in the share sheet (a JPEG drawn on
// their device), so the 3D figure and every language come along. Signing in is required so every link has an
// owner who can delete it, and so abuse can be traced and removed.
import { randomBytes } from "node:crypto";

import { isMsgLang, type MsgLang } from "@/lib/messageText";
import { SHARE_PAGE_CSP } from "@/lib/securityHeaders";
import { SITE_URL } from "@/lib/site";
import * as link from "@/locales/text/link";

import { query, rateLimit, run } from "./db";

export const SHARE_KINDS = ["workout", "pr", "badge", "level", "trend", "recap"] as const;
export type ShareLinkKind = (typeof SHARE_KINDS)[number];
/** The two card sizes the app draws (shareImage.ts CARD_SIZE). */
const SIZES = new Set(["1080x1350", "1080x1920"]);
export const LIMITS = {
  /** Decoded JPEG bytes. A card at quality 0.85 is about 150 to 300 KB. */
  image: 600_000,
  title: 120,
  description: 200,
  /** Links kept per account; the oldest must be deleted before more are made. */
  perAccount: 100,
  /** New links per account per day. */
  perDay: 30,
};
/** Request bodies: the base64 image plus a little JSON. */
export const MAX_BODY = Math.ceil((LIMITS.image * 4) / 3) + 4_000;

export interface NewLink {
  kind: ShareLinkKind;
  title: string;
  description: string;
  lang: MsgLang;
  width: number;
  height: number;
  image: Buffer;
}

export interface LinkRow {
  id: string;
  kind: ShareLinkKind;
  title: string;
  description: string;
  lang: MsgLang;
  width: number;
  height: number;
  createdAt: number;
}

export const linkUrl = (id: string) => `${SITE_URL}/w/${id}/`;
export const imageUrl = (id: string) => `${SITE_URL}/w/${id}/card.jpg`;

const ID_CHARS = "0123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
/** 10 characters from 58 (no 0/O, 1/l/I confusion beyond the digits): about 58 bits, not guessable. */
export function newId(bytes: Buffer = randomBytes(10)): string {
  return [...bytes].map((b) => ID_CHARS[b % ID_CHARS.length]).join("");
}
export const isId = (x: unknown): x is string => typeof x === "string" && /^[0-9a-zA-Z]{10}$/.test(x);
/** The link id from a request: `?id=` on the API route, or the `/w/<id>/` path it was rewritten from. */
export function idFrom(req: Request): string {
  const u = new URL(req.url);
  const found = [...u.searchParams.getAll("id"), /\/w\/([^/]+)/.exec(u.pathname)?.[1] ?? ""].map((x) => x.replace(/\/+$/, ""));
  return found.find(isId) ?? "";
}

const clean = (s: unknown, max: number) =>
  typeof s === "string"
    ? s
        .replace(/[\u0000-\u001f\u007f]/g, " ")
        .trim()
        .slice(0, max)
    : "";

/** Checks a create request. Returns the link to store, or the reason it was refused. */
export function parseNew(body: unknown): NewLink | { error: string } {
  if (!body || typeof body !== "object") return { error: "Bad request." };
  const b = body as Record<string, unknown>;
  const kind = SHARE_KINDS.find((k) => k === b.kind);
  if (!kind) return { error: "Unknown card." };
  const title = clean(b.title, LIMITS.title);
  if (!title) return { error: "The card needs a title." };
  const width = Number(b.width),
    height = Number(b.height);
  if (!SIZES.has(`${width}x${height}`)) return { error: "Unknown card size." };
  const m = typeof b.image === "string" ? /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(b.image) : null;
  if (!m?.[1]) return { error: "The card must be a JPEG." };
  const image = Buffer.from(m[1], "base64");
  if (image.length > LIMITS.image) return { error: "The card is too big." };
  // A JPEG starts with FF D8 FF and ends with FF D9.
  if (image.length < 4 || image[0] !== 0xff || image[1] !== 0xd8 || image[2] !== 0xff) return { error: "The card must be a JPEG." };
  return {
    kind,
    title,
    description: clean(b.description, LIMITS.description),
    lang: isMsgLang(b.lang) ? b.lang : "en",
    width,
    height,
    image,
  };
}

export async function createLink(accountId: string, l: NewLink, now = Date.now(), id = newId()): Promise<LinkRow | "slow" | "full"> {
  if (!(await rateLimit(`share:${accountId}`, LIMITS.perDay, 86_400_000, now))) return "slow";
  const [c] = await query<{ n: number }>("SELECT COUNT(*) AS n FROM share_links WHERE account_id = ?", [accountId]);
  if (Number(c?.n ?? 0) >= LIMITS.perAccount) return "full";
  await run(
    `INSERT INTO share_links (id, account_id, created_at, kind, title, description, lang, width, height, image)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, accountId, now, l.kind, l.title, l.description, l.lang, l.width, l.height, l.image],
  );
  return { id, kind: l.kind, title: l.title, description: l.description, lang: l.lang, width: l.width, height: l.height, createdAt: now };
}

type DbRow = {
  id: string;
  kind: string;
  title: string;
  description: string;
  lang: string;
  width: number;
  height: number;
  created_at: number;
};
const toRow = (r: DbRow): LinkRow => ({
  id: String(r.id),
  kind: (SHARE_KINDS.find((k) => k === r.kind) ?? "workout") as ShareLinkKind,
  title: String(r.title),
  description: String(r.description ?? ""),
  lang: isMsgLang(r.lang) ? r.lang : "en",
  width: Number(r.width),
  height: Number(r.height),
  createdAt: Number(r.created_at),
});
const COLS = "id, kind, title, description, lang, width, height, created_at";

export async function listLinks(accountId: string): Promise<LinkRow[]> {
  const rows = await query<DbRow>(`SELECT ${COLS} FROM share_links WHERE account_id = ? ORDER BY created_at DESC`, [accountId]);
  return rows.map(toRow);
}

/** Deletes one of the account's own links. False when there was none (or it belongs to someone else). */
export async function deleteLink(accountId: string, id: string): Promise<boolean> {
  return (await run("DELETE FROM share_links WHERE id = ? AND account_id = ?", [id, accountId])) > 0;
}

export async function getLink(id: string): Promise<LinkRow | null> {
  if (!isId(id)) return null;
  const [r] = await query<DbRow>(`SELECT ${COLS} FROM share_links WHERE id = ?`, [id]);
  return r ? toRow(r) : null;
}

export async function getImage(id: string): Promise<Buffer | null> {
  if (!isId(id)) return null;
  const [r] = await query<{ image: ArrayBuffer | Uint8Array }>("SELECT image FROM share_links WHERE id = ?", [id]);
  if (!r?.image) return null;
  return Buffer.from(r.image instanceof Uint8Array ? r.image : new Uint8Array(r.image));
}

// --- The public page ---

type LinkKey = keyof typeof link.en;
const CATALOG: Record<MsgLang, Partial<Record<LinkKey, unknown>>> = {
  en: link.en,
  es: link.es,
  fr: link.fr,
  de: link.de,
  it: link.it,
  ja: link.ja,
};
const say = (lang: MsgLang, key: LinkKey, vars: Record<string, string> = {}) =>
  String(CATALOG[lang][key] ?? link.en[key]).replace(/\{(\w+)\}/g, (all, k: string) => vars[k] ?? all);

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** No scripts, nothing from other hosts; images only from our own origin. */
export const PAGE_CSP = SHARE_PAGE_CSP;

const STYLE = `
*{box-sizing:border-box}html{color-scheme:dark}body{margin:0;min-height:100vh;background:#0a0d12;color:#e8edf3;
font:16px/1.5 system-ui,-apple-system,Roboto,sans-serif;display:flex;flex-direction:column;align-items:center;padding:24px 16px 40px;
background-image:radial-gradient(60% 40% at 50% 0,#4c8dff33,transparent)}
main{width:100%;max-width:480px;text-align:center}
.brand{color:#4c8dff;font-weight:800;letter-spacing:.06em;text-decoration:none;font-size:15px}
img{display:block;width:100%;height:auto;border-radius:20px;border:1px solid #ffffff1a;margin:16px 0;box-shadow:0 20px 60px #0008}
h1{font-size:22px;margin:4px 0}p{color:#a3aebd;margin:6px 0 18px}
a.cta{display:inline-block;min-height:48px;padding:13px 26px;border-radius:14px;font-weight:700;text-decoration:none;color:#0a0d12;
background:linear-gradient(135deg,#4c8dff,#a78bfa)}
a.cta:focus-visible{outline:3px solid #e8edf3;outline-offset:3px}`;

export function pageHtml(l: LinkRow | null): string {
  const lang = l?.lang ?? "en";
  const home = `${SITE_URL}/?utm_source=share&utm_medium=link&utm_campaign=${l?.kind ?? "missing"}`;
  if (!l) {
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>${esc(say(lang, "link.gone"))} · Liftsmith</title><style>${STYLE}</style></head>
<body><main><a class="brand" href="${home}">LIFTSMITH</a><h1>${esc(say(lang, "link.gone"))}</h1><p>${esc(say(lang, "link.goneBody"))}</p>
<a class="cta" href="${home}">${esc(say(lang, "link.get"))}</a></main></body></html>`;
  }
  const title = `${l.title} · Liftsmith`;
  const desc = l.description || say(lang, "link.made");
  const img = imageUrl(l.id);
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>${esc(title)}</title><meta name="description" content="${esc(desc)}">
<meta property="og:type" content="website"><meta property="og:site_name" content="Liftsmith"><meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${esc(linkUrl(l.id))}">
<meta property="og:image" content="${esc(img)}"><meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="${l.width}"><meta property="og:image:height" content="${l.height}">
<meta property="og:image:alt" content="${esc(l.title)}"><meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${esc(img)}">
<style>${STYLE}</style></head>
<body><main><a class="brand" href="${home}">LIFTSMITH</a>
<img src="/w/${l.id}/card.jpg" width="${l.width}" height="${l.height}" alt="${esc(l.title)}">
<h1>${esc(l.title)}</h1><p>${esc(say(lang, "link.made"))}</p><a class="cta" href="${home}">${esc(say(lang, "link.get"))}</a></main></body></html>`;
}

export const PAGE_HEADERS = {
  "Content-Type": "text/html; charset=utf-8",
  "Content-Security-Policy": PAGE_CSP,
  "X-Robots-Tag": "noindex",
  // Short, so a deleted link stops showing soon.
  "Cache-Control": "public, max-age=60, s-maxage=300",
};
