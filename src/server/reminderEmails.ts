// The words and layout of every reminder email. Plain text first (it's what most people read on a
// phone), with a simple HTML twin. Every email carries the same footer: why it was sent, where to
// change it, a one-click unsubscribe link and the sender's postal address (CAN-SPAM and CASL).
import { BRAND } from "@/lib/brand";
import { listOf, type MessageKind } from "@/lib/messages";
import { say, type MsgLang } from "@/lib/messageText";
import { APP_PATH, SITE_URL } from "@/lib/site";

export interface Mail {
  subject: string;
  text: string;
  html: string;
}

export interface Footer {
  unsubscribeUrl: string;
  postalAddress: string;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** The icon tile at the top of an email (public/email/icons/, made by scripts/email-icons.mjs from the app's icons). */
export type EmailIcon =
  "calendar" | "dumbbell" | "flame" | "medal" | "sparkle" | "chart" | "trophy" | "people" | "heart" | "flag" | "bell" | "lock";

/** The streak card: the weeks in a row, and this week's workouts against the goal as dots when known. */
export interface StreakStat {
  weeks: number;
  done?: number;
  goal?: number;
}

export interface Branded {
  title: string;
  paras: string[];
  cta: { label: string; url: string } | null;
  /** Null for the confirmation email: no unsubscribe, since nothing is sent until it's confirmed. */
  footer: Footer | null;
  why: string;
  /** A real app screen (the feature tour), shown under the text. */
  image?: { url: string; alt: string };
  /** A small line above the title ("Getting started · 2 of 8"). */
  kicker?: string;
  /** A short list after the paragraphs (the weekly tips' points). */
  points?: string[];
  /** Paragraphs after the list (the weekly tips' Pro or Labs line). */
  after?: string[];
  /** A "Did you know?" line, its label in bold, last before the button. */
  dyk?: { label: string; text: string };
  /** The kind's icon on a tinted tile above the title. */
  icon?: EmailIcon;
  /** The streak card under the title (streak warnings and milestones). */
  streak?: StreakStat;
  /** A one-time code in a big box after the first paragraph (sign-in, gym claim and school coach codes). */
  code?: string;
  /** The footer's lines when there's no unsubscribe footer (codes, staff email, replies); `why` and the ignore line otherwise. */
  foot?: string[];
  /** Turn web addresses in the paragraphs into links (staff email, where a line names a page). */
  links?: boolean;
}

// The app's dark palette (globals.css), written out because mail apps don't read CSS variables.
export const C = {
  bg: "#080b10",
  card: "#10151d",
  raised: "#151c26",
  line: "#232d3a",
  ink: "#eef2f7",
  soft: "#c4ccd8",
  muted: "#94a1b2",
  faint: "#808c9d",
  blue: "#4c8dff",
  gradA: "#5b9cff",
  gradB: "#7f8bff",
  gradC: "#9b86ff",
  btnInk: "#06122a",
  violet: "#a78bfa",
  cyan: "#38d6e8",
  ember: "#ff8a3d",
  emberTint: "#1d1712",
  mint: "#34d399",
} as const;
export const FONT = "Roboto,-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";
/** "1-week" never breaks after the hyphen: a number and its word stay on one line. */
const keepTogether = (s: string) => s.replace(/(\d)-(?=\p{L})/gu, "$1\u2011");
/** A solid colour Gmail's dark mode leaves alone: it inverts background colours but not background images. */
export const solid = (c: string) => `background-color:${c};background-image:linear-gradient(${c},${c})`;

/** This week's workouts as dots: done ones filled mint with a tick, the rest ringed in ember. Outlook squares them. */
function weekDots(lang: MsgLang | undefined, done: number, goal: number): string {
  const n = Math.max(1, Math.min(7, goal));
  const d = Math.max(0, Math.min(n, done));
  const dots = Array.from({ length: n }, (_, i) =>
    i < d
      ? `<td width="30" height="30" align="center" valign="middle" bgcolor="${C.mint}" style="width:30px;height:30px;border-radius:15px;${solid(C.mint)};color:${C.bg};font-size:15px;font-weight:800;line-height:30px">&#10003;</td>`
      : `<td width="26" height="26" align="center" valign="middle" style="width:26px;height:26px;border-radius:15px;border:2px dashed ${C.ember};font-size:1px;line-height:1px">&nbsp;</td>`,
  ).join(`<td width="8" style="width:8px;font-size:1px">&nbsp;</td>`);
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 8px"><tr>${dots}</tr></table>
<p style="margin:0;font-size:13px;line-height:1.4;color:${C.muted}">${esc(say(lang, "rmd.mail.weekDone", { done: d, goal: n }))}</p>`;
}

/** The streak card: the flame, the weeks in a big number, and this week's dots. */
function streakCard(lang: MsgLang | undefined, s: StreakStat): string {
  const dots = s.goal !== undefined && s.done !== undefined ? weekDots(lang, s.done, s.goal) : "";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.emberTint}" style="${solid(C.emberTint)};border:1px solid #3a2617;border-radius:18px;margin:0 0 22px">
<tr><td width="88" valign="middle" style="width:88px;padding:16px 0 16px 16px"><img src="${esc(SITE_URL)}/email/icons/streak.png" width="72" height="72" alt="" style="display:block;width:72px;height:72px;border:0"></td>
<td valign="middle" style="padding:16px 18px 16px 10px">
<p style="margin:0;font-size:44px;line-height:1;font-weight:800;color:${C.ember};font-variant-numeric:tabular-nums">${s.weeks}</p>
<p style="margin:6px 0 0;font-size:12px;line-height:1.3;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:${C.soft}">${esc(say(lang, "rmd.mail.streakLabel"))}</p>
</td></tr>
${dots ? `<tr><td colspan="2" style="padding:0 18px 18px">${dots}</td></tr>` : ""}
</table>`;
}

/** A one-time code, big and spaced out so it's easy to read and type, in a raised box. */
function codeBox(code: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.raised}" style="${solid(C.raised)};border:1px solid ${C.line};border-radius:16px;margin:6px 0 20px"><tr>
<td align="center" style="padding:20px 12px;font-family:${FONT};font-size:38px;line-height:1.1;font-weight:800;letter-spacing:.28em;text-indent:.28em;color:${C.ink};font-variant-numeric:tabular-nums">${esc(code)}</td></tr></table>`;
}

/** Web addresses in already-escaped text as links in the brand blue. */
const linkify = (html: string) =>
  html.replace(/https?:\/\/[^\s<]+[^\s<.,;:)]/g, (u) => `<a href="${u}" style="color:${C.blue};word-break:break-all">${u}</a>`);

/** The main button: the app's blue-to-violet primary with dark ink, full width like the app's. Outlook gets the flat blue. */
export function button(cta: { label: string; url: string }): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0 4px"><tr>
<td align="center" bgcolor="${C.gradA}" style="border-radius:14px;background-color:${C.gradA};background-image:linear-gradient(90deg,${C.gradA},${C.gradB},${C.gradC})">
<a href="${esc(cta.url)}" style="display:block;padding:15px 22px;font-family:${FONT};font-size:16px;font-weight:800;line-height:1.25;color:${C.btnInk};text-decoration:none;border-radius:14px">${esc(cta.label)}</a>
</td></tr></table>`;
}

/** Every lifter email: the app icon and name, the title, the words, an optional screen and button, and the footer.
 *  Plain text first (it's what most people read on a phone), with an HTML twin in the app's dark style: tables and
 *  inline styles so Gmail, Outlook and Apple Mail draw it the same, colours Gmail's dark mode can't flip, and a
 *  preview line from the first paragraph. */
export function brandedMail(lang: MsgLang | undefined, m: Branded): Mail {
  const { title, paras, cta, footer, why, image, kicker, points = [], after = [], dyk, icon, streak, code, links } = m;
  const unsubscribe = say(lang, "rmd.mail.unsubscribe", { brand: BRAND.name });
  const foot = footer
    ? [
        why,
        say(lang, "rmd.mail.choose"),
        say(lang, "rmd.mail.link", { label: unsubscribe, url: footer.unsubscribeUrl }),
        `${BRAND.name}, ${footer.postalAddress}`,
      ]
    : (m.foot ?? [why, say(lang, "rmd.mail.ignore")]);
  const text = [
    ...(kicker ? [kicker] : []),
    title,
    "",
    ...(streak ? [`${say(lang, "rmd.mail.streakLabel")}: ${streak.weeks}`, ""] : []),
    ...paras.flatMap((p, i) => [p, "", ...(code && i === 0 ? [code, ""] : [])]),
    ...(code && !paras.length ? [code, ""] : []),
    ...(points.length ? [...points.map((p) => `• ${p}`), ""] : []),
    ...after.flatMap((p) => [p, ""]),
    ...(dyk ? [`${dyk.label} ${dyk.text}`, ""] : []),
    ...(cta ? [say(lang, "rmd.mail.link", { label: cta.label, url: cta.url }), ""] : []),
    "--",
    ...foot,
  ].join("\n");
  const site = esc(SITE_URL);
  const preview = paras[0] ?? "";
  const html = `<!doctype html><html lang="${esc(lang ?? "en")}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark"><title>${esc(title)}</title>
<style>:root{color-scheme:dark}body{margin:0;padding:0}a{color:${C.blue}}@media (max-width:480px){.px{padding-left:20px!important;padding-right:20px!important}}</style></head>
<body bgcolor="${C.bg}" style="margin:0;padding:0;${solid(C.bg)};color:${C.ink};font-family:${FONT};-webkit-text-size-adjust:100%">
${preview ? `<div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:${C.bg}">${esc(preview)}${"&#8199;&#65279;&#847; ".repeat(40)}</div>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.bg}" style="${solid(C.bg)}"><tr><td align="center" style="padding:28px 12px 36px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%">
<tr><td style="padding:0 4px 18px"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td style="padding-right:10px"><a href="${site}"><img src="${site}/icon-192.png" width="36" height="36" alt="" style="display:block;width:36px;height:36px;border:0;border-radius:9px"></a></td>
<td style="font-family:${FONT};font-size:19px;font-weight:800;letter-spacing:-.01em;color:${C.ink}">${esc(BRAND.name)}</td></tr></table></td></tr>
<tr><td class="px" bgcolor="${C.card}" style="${solid(C.card)};background-image:linear-gradient(180deg,#152038 0,${C.card} 160px);border:1px solid ${C.line};border-radius:22px;padding:30px 28px 28px;font-family:${FONT};color:${C.ink}">
${icon ? `<img src="${site}/email/icons/${icon}.png" width="56" height="56" alt="" style="display:block;width:56px;height:56px;border:0;margin:0 0 18px">` : ""}
${kicker ? `<p style="font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:${C.violet};font-weight:700;margin:0 0 8px">${esc(kicker)}</p>` : ""}
<h1 style="font-size:26px;line-height:1.2;font-weight:800;letter-spacing:-.01em;margin:0 0 16px;color:${C.ink}">${esc(title)}</h1>
${streak ? streakCard(lang, streak) : ""}
${paras.map((p, i) => `<p style="font-size:16px;line-height:1.55;margin:0 0 14px;color:${C.ink}">${links ? linkify(esc(p)).replace(/\n/g, "<br>") : esc(keepTogether(p))}</p>${code && i === 0 ? codeBox(code) : ""}`).join("\n")}
${code && !paras.length ? codeBox(code) : ""}
${points.length ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 14px">${points.map((p) => `<tr><td width="22" valign="top" style="width:22px;padding:0 0 10px;color:${C.mint};font-size:16px;line-height:1.5;font-weight:800">&#10003;</td><td valign="top" style="padding:0 0 10px;font-size:16px;line-height:1.5;color:${C.ink}">${esc(p)}</td></tr>`).join("")}</table>` : ""}
${after.map((p) => `<p style="font-size:15px;line-height:1.5;margin:0 0 14px;color:${C.soft}">${esc(p)}</p>`).join("\n")}
${dyk ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.raised}" style="${solid(C.raised)};border-left:3px solid ${C.cyan};border-radius:12px;margin:4px 0 14px"><tr><td style="padding:12px 14px;font-size:15px;line-height:1.5;color:${C.ink}"><strong style="color:${C.cyan}">${esc(dyk.label)}</strong> ${esc(dyk.text)}</td></tr></table>` : ""}
${cta ? button(cta) : ""}
${image ? `<p style="margin:22px 0 0;text-align:center"><a href="${esc(cta?.url ?? SITE_URL)}"><img src="${esc(image.url)}" width="300" alt="${esc(image.alt)}" style="display:inline-block;width:300px;max-width:100%;height:auto;border-radius:18px;border:1px solid ${C.line}"></a></p>` : ""}
</td></tr>
<tr><td style="padding:22px 8px 0;font-family:${FONT}">
${foot.map((l, i) => `<p style="font-size:12px;line-height:1.5;color:${C.faint};margin:0 0 6px">${i === 2 && footer ? `<a href="${esc(footer.unsubscribeUrl)}" style="color:${C.faint}">${esc(unsubscribe)}</a>` : esc(l)}</p>`).join("\n")}
</td></tr>
</table></td></tr></table></body></html>`;
  return { subject: title, text, html };
}

const appUrl = (route = "today") => `${SITE_URL}${APP_PATH}#/${route}`;

export function confirmMail(confirmUrl: string, lang?: MsgLang): Mail {
  const brand = BRAND.name;
  return brandedMail(lang, {
    title: say(lang, "rmd.mail.confirm", { brand }),
    paras: [say(lang, "rmd.mail.confirmBody")],
    cta: { label: say(lang, "rmd.mail.confirmButton"), url: confirmUrl },
    footer: null,
    why: say(lang, "rmd.mail.confirmWhy", { brand }),
    icon: "bell",
  });
}

/** The welcome, with the first workout already planned when the phone sent it (before any workout). */
export function welcomeMail(footer: Footer, lang?: MsgLang, next?: { names: string[]; minutes: number }): Mail {
  const plan = next?.names.length ? [say(lang, "rmd.mail.welcomePlan", { list: listOf(lang, next.names), minutes: next.minutes })] : [];
  return brandedMail(lang, {
    title: say(lang, "rmd.mail.welcome", { brand: BRAND.name }),
    paras: [say(lang, "rmd.mail.welcome1"), ...plan, say(lang, "rmd.mail.welcome2"), say(lang, "rmd.mail.welcome3")],
    cta: { label: say(lang, "rmd.mail.open"), url: appUrl() },
    footer,
    why: say(lang, "rmd.mail.whyOn"),
    icon: "dumbbell",
  });
}

/** Each kind of planned message's icon tile (scripts/email-icons.mjs). */
export const EMAIL_ICONS: Record<MessageKind, EmailIcon> = {
  reminder: "calendar",
  missed: "dumbbell",
  streak: "flame",
  milestone: "medal",
  pro: "sparkle",
  trial: "sparkle",
  tour: "bell",
  weekly: "bell",
  recap: "chart",
  records: "trophy",
  friends: "people",
  rehab: "heart",
  season: "flag",
};

/** A planned message (messages.ts) or a milestone, as an email. Streak warnings and milestones show the streak card. */
export function messageMail(
  m: { title: string; body: string; route?: string; kind: string; streak?: StreakStat },
  footer: Footer,
  lang?: MsgLang,
): Mail {
  const pro = m.kind === "pro" || m.kind === "trial";
  // Recaps, bests, friends, seasons and milestones point at what they're about, not today's workout.
  const elsewhere = m.kind === "recap" || m.kind === "records" || m.kind === "friends" || m.kind === "season" || m.kind === "milestone";
  const cta = pro
    ? { label: say(lang, "rmd.mail.seePro"), url: appUrl("settings") }
    : {
        label: elsewhere ? say(lang, "rmd.mail.openApp", { brand: BRAND.name }) : say(lang, "rmd.mail.open"),
        url: appUrl(m.route ?? "today"),
      };
  return brandedMail(lang, {
    title: m.title,
    paras: [m.body],
    cta,
    footer,
    why: say(lang, pro ? "rmd.mail.whyPro" : "rmd.mail.whyReminder"),
    icon: m.streak ? undefined : (EMAIL_ICONS as Partial<Record<string, EmailIcon>>)[m.kind],
    streak: m.streak,
  });
}

const siteLine = () => `${BRAND.name} · ${SITE_URL.replace(/^https?:\/\//, "")}`;

/** A one-time code email (sign-in, gym claim, school coach): the code in a big box, how long it works, and why it came.
 *  English, like the screens that ask for them on the server; the app shows the code box in the lifter's language. */
export function codeMail(o: { subject: string; title: string; intro: string; code: string; note: string; ignore: string }): Mail {
  const m = brandedMail("en", {
    title: o.title,
    paras: [o.intro, o.note],
    code: o.code,
    cta: null,
    footer: null,
    why: o.ignore,
    foot: [o.ignore, siteLine()],
    icon: "lock",
  });
  return { ...m, subject: o.subject };
}

/** An email to staff (admin sign-in, alerts, the gym import) or a reply from the team: the same layout, the lines as
 *  paragraphs with their links, an optional button, and a footer line saying why it came. */
export function plainMail(o: {
  subject: string;
  title?: string;
  lines: string[];
  cta?: { label: string; url: string } | null;
  why: string;
  icon?: EmailIcon;
}): Mail {
  // Blank lines only separate paragraphs in the text version; a bulleted run becomes the list.
  const lines = o.lines.filter((l) => l.trim());
  const paras = lines.filter((l) => !/^[-•] /.test(l));
  const points = lines.filter((l) => /^[-•] /.test(l)).map((l) => l.replace(/^[-•] /, ""));
  const m = brandedMail("en", {
    title: o.title ?? o.subject,
    paras,
    points,
    cta: o.cta ?? null,
    footer: null,
    why: o.why,
    foot: [o.why, siteLine()],
    icon: o.icon,
    links: true,
  });
  // The text version keeps the lines exactly as written.
  const text = [...o.lines, ...(o.cta ? ["", `${o.cta.label}: ${o.cta.url}`] : []), "", "--", o.why, siteLine()].join("\n");
  return { subject: o.subject, text, html: m.html };
}

/** The page shown after following a link from an email: a button that POSTs, so mail scanners that open links can't act for the reader. */
export function page(title: string, body: string, form?: { action: string; fields: Record<string, string>; button: string }): string {
  const fields = form
    ? Object.entries(form.fields)
        .map(([k, v]) => `<input type="hidden" name="${esc(k)}" value="${esc(v)}">`)
        .join("")
    : "";
  const site = esc(SITE_URL);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><meta name="color-scheme" content="dark"><title>${esc(title)} · ${esc(BRAND.name)}</title></head>
<body style="margin:0;background:${C.bg};color:${C.ink};font-family:${FONT}"><main style="max-width:480px;margin:0 auto;padding:40px 16px">
<p style="margin:0 0 18px;display:flex;align-items:center;gap:10px;font-size:19px;font-weight:800;color:${C.ink}"><img src="${site}/icon-192.png" width="36" height="36" alt="" style="border-radius:9px">${esc(BRAND.name)}</p>
<div style="background:${C.card};background-image:linear-gradient(180deg,#152038 0,${C.card} 160px);border:1px solid ${C.line};border-radius:22px;padding:28px 24px">
<h1 style="font-size:24px;line-height:1.2;font-weight:800;margin:0 0 12px">${esc(title)}</h1><p style="font-size:16px;line-height:1.55;margin:0 0 4px">${esc(body)}</p>
${form ? `<form method="post" action="${esc(form.action)}" style="margin:20px 0 0">${fields}<button type="submit" style="width:100%;min-height:52px;padding:0 22px;border:0;border-radius:14px;background:${C.gradA};background-image:linear-gradient(90deg,${C.gradA},${C.gradB},${C.gradC});color:${C.btnInk};font:800 16px ${FONT};cursor:pointer">${esc(form.button)}</button></form>` : ""}
</div></main></body></html>`;
}
