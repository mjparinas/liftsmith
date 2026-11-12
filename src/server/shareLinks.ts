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
import { APP_PATH, SITE_URL } from "@/lib/site";
import { localPath } from "@/lib/siteLang";
import { siteText } from "@/locales/site";
import * as link from "@/locales/text/link";

import { query, rateLimit, run } from "./db";
import { esc, framePage, icon, say as sayPub } from "./siteFrame";

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

/** No scripts, nothing from other hosts; images only from our own origin. */
export const PAGE_CSP = SHARE_PAGE_CSP;

/**
 * The page a share link opens (Melvin, 2026-11-12, after the profile redesign: the same site header, footer and calls
 * to try Liftsmith, siteFrame.ts). The card sits beside its title and a "Get a plan built around you" card on wide
 * screens and above them on phones. Still noindex (docs/decisions/sharing.md), still no scripts, and links to our own
 * pages carry no UTM tags.
 */
export function pageHtml(l: LinkRow | null): string {
  const lang = l?.lang ?? "en";
  const start = siteText(lang).chrome.startFree;
  if (!l) {
    return framePage(
      lang,
      `${say(lang, "link.gone")} · Liftsmith`,
      '<meta name="robots" content="noindex">',
      `<main id="main" class="wrap gone"><div class="card center">${icon("link", 28, "gone-icon")}<h1>${esc(say(lang, "link.gone"))}</h1>
<p class="muted">${esc(say(lang, "link.goneBody"))}</p><a class="btn btn-primary" href="${APP_PATH}">${esc(start)}</a></div></main>`,
      SHARE_STYLE,
      "share",
    );
  }
  const title = `${l.title} · Liftsmith`;
  const desc = l.description || say(lang, "link.made");
  const img = imageUrl(l.id);
  const meta = `<meta name="robots" content="noindex"><meta name="description" content="${esc(desc)}">
<meta property="og:type" content="website"><meta property="og:site_name" content="Liftsmith"><meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${esc(linkUrl(l.id))}">
<meta property="og:image" content="${esc(img)}"><meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="${l.width}"><meta property="og:image:height" content="${l.height}">
<meta property="og:image:alt" content="${esc(l.title)}"><meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${esc(img)}">`;
  const features = `${localPath(lang, "/")}#features`;
  return framePage(
    lang,
    title,
    meta,
    `<main id="main" class="wrap share"><figure class="shot"><img src="/w/${l.id}/card.jpg" width="${l.width}" height="${l.height}" alt="${esc(l.title)}"></figure>
<div class="share-side"><p class="kicker">${esc(say(lang, "link.kicker"))}</p><h1>${esc(l.title)}</h1>${l.description ? `<p class="muted">${esc(l.description)}</p>` : ""}
<section class="card try" aria-labelledby="try-h"><h2 id="try-h" class="try-h">${esc(say(lang, "link.tryTitle"))}</h2><p class="muted">${esc(sayPub(lang, "pub.ctaBody"))}</p>
<a class="btn btn-primary" href="${APP_PATH}">${esc(say(lang, "link.get"))}</a><a class="quiet" href="${esc(features)}">${esc(sayPub(lang, "pub.ctaFeatures"))} ›</a></section></div></main>`,
    SHARE_STYLE,
    "share",
  );
}

const SHARE_STYLE = `
.share{display:grid;gap:24px;padding-top:28px;padding-bottom:48px;align-items:start}
.shot{margin:0}.shot img{display:block;width:100%;height:auto;max-width:560px;margin:0 auto;border-radius:20px;border:1px solid var(--line);box-shadow:0 24px 60px -20px rgb(0 0 0/.7)}
.share-side{display:grid;gap:12px;align-content:start}
.share-side h1{font-size:1.75rem;line-height:1.15;font-weight:800;letter-spacing:-.02em;overflow-wrap:anywhere}
.share-side .try{margin-top:8px}.try .quiet{width:100%;justify-content:center}
@media (min-width:900px){.share{grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:40px;padding-top:44px}.shot img{margin:0}.share-side{position:sticky;top:96px}}`;

export const PAGE_HEADERS = {
  "Content-Type": "text/html; charset=utf-8",
  "Content-Security-Policy": PAGE_CSP,
  "X-Robots-Tag": "noindex",
  // Short, so a deleted link stops showing soon.
  "Cache-Control": "public, max-age=60, s-maxage=300",
};
