// The words and layout of every reminder email. Plain text first (it's what most people read on a
// phone), with a simple HTML twin. Every email carries the same footer: why it was sent, where to
// change it, a one-click unsubscribe link and the sender's postal address (CAN-SPAM and CASL).
import { BRAND } from "@/lib/brand";
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
}

/** Every lifter email: the app icon and name, the title, the words, an optional screen and button, and the footer.
 *  Plain text first (it's what most people read on a phone), with an HTML twin in the app's dark style. */
export function brandedMail(lang: MsgLang | undefined, m: Branded): Mail {
  const { title, paras, cta, footer, why, image, kicker } = m;
  const unsubscribe = say(lang, "rmd.mail.unsubscribe", { brand: BRAND.name });
  const foot = footer
    ? [
        why,
        say(lang, "rmd.mail.choose"),
        say(lang, "rmd.mail.link", { label: unsubscribe, url: footer.unsubscribeUrl }),
        `${BRAND.name}, ${footer.postalAddress}`,
      ]
    : [why, say(lang, "rmd.mail.ignore")];
  const text = [
    ...(kicker ? [kicker] : []),
    title,
    "",
    ...paras.flatMap((p) => [p, ""]),
    ...(cta ? [say(lang, "rmd.mail.link", { label: cta.label, url: cta.url }), ""] : []),
    "--",
    ...foot,
  ].join("\n");
  const html = `<!doctype html><html lang="${esc(lang ?? "en")}"><head><meta charset="utf-8"><meta name="color-scheme" content="dark light"></head>
<body style="margin:0;background:#0a0d12;color:#e8edf4;font-family:Roboto,-apple-system,Segoe UI,Arial,sans-serif">
<div style="max-width:520px;margin:0 auto;padding:28px 20px">
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 22px"><tr>
<td style="padding-right:10px"><img src="${esc(SITE_URL)}/icon-192.png" width="36" height="36" alt="" style="display:block;border-radius:9px"></td>
<td style="color:#4c8dff;font-weight:700;font-size:17px">${esc(BRAND.name)}</td></tr></table>
${kicker ? `<p style="font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#a78bfa;font-weight:700;margin:0 0 8px">${esc(kicker)}</p>` : ""}
<h1 style="font-size:22px;margin:0 0 16px">${esc(title)}</h1>
${paras.map((p) => `<p style="font-size:16px;line-height:1.5;margin:0 0 14px">${esc(p)}</p>`).join("\n")}
${cta ? `<p style="margin:24px 0"><a href="${esc(cta.url)}" style="display:inline-block;background:#4c8dff;color:#fff;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:14px">${esc(cta.label)}</a></p>` : ""}
${image ? `<p style="margin:8px 0 0;text-align:center"><a href="${esc(cta?.url ?? SITE_URL)}"><img src="${esc(image.url)}" width="300" alt="${esc(image.alt)}" style="display:inline-block;width:300px;max-width:100%;height:auto;border-radius:18px;border:1px solid #222a35"></a></p>` : ""}
<hr style="border:0;border-top:1px solid #222a35;margin:28px 0 16px">
${foot.map((l, i) => `<p style="font-size:12px;line-height:1.5;color:#808c9d;margin:0 0 6px">${i === 2 && footer ? `<a href="${esc(footer.unsubscribeUrl)}" style="color:#808c9d">${esc(unsubscribe)}</a>` : esc(l)}</p>`).join("\n")}
</div></body></html>`;
  return { subject: title, text, html };
}

function wrap(
  lang: MsgLang | undefined,
  title: string,
  paras: string[],
  cta: { label: string; url: string } | null,
  footer: Footer | null,
  why: string,
): Mail {
  return brandedMail(lang, { title, paras, cta, footer, why });
}

const appUrl = (route = "today") => `${SITE_URL}${APP_PATH}#/${route}`;

export function confirmMail(confirmUrl: string, lang?: MsgLang): Mail {
  const brand = BRAND.name;
  return wrap(
    lang,
    say(lang, "rmd.mail.confirm", { brand }),
    [say(lang, "rmd.mail.confirmBody")],
    { label: say(lang, "rmd.mail.confirmButton"), url: confirmUrl },
    null,
    say(lang, "rmd.mail.confirmWhy", { brand }),
  );
}

export function welcomeMail(footer: Footer, lang?: MsgLang): Mail {
  return wrap(
    lang,
    say(lang, "rmd.mail.welcome", { brand: BRAND.name }),
    [say(lang, "rmd.mail.welcome1"), say(lang, "rmd.mail.welcome2"), say(lang, "rmd.mail.welcome3")],
    { label: say(lang, "rmd.mail.open"), url: appUrl() },
    footer,
    say(lang, "rmd.mail.whyOn"),
  );
}

/** A planned message (messages.ts) or a milestone, as an email. */
export function messageMail(m: { title: string; body: string; route?: string; kind: string }, footer: Footer, lang?: MsgLang): Mail {
  const pro = m.kind === "pro";
  const cta = pro
    ? { label: say(lang, "rmd.mail.seePro"), url: appUrl("settings") }
    : { label: say(lang, "rmd.mail.open"), url: appUrl(m.route ?? "today") };
  return wrap(lang, m.title, [m.body], cta, footer, say(lang, pro ? "rmd.mail.whyPro" : "rmd.mail.whyReminder"));
}

/** The page shown after following a link from an email: a button that POSTs, so mail scanners that open links can't act for the reader. */
export function page(title: string, body: string, form?: { action: string; fields: Record<string, string>; button: string }): string {
  const fields = form
    ? Object.entries(form.fields)
        .map(([k, v]) => `<input type="hidden" name="${esc(k)}" value="${esc(v)}">`)
        .join("")
    : "";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${esc(title)} · ${esc(BRAND.name)}</title></head>
<body style="margin:0;background:#0a0d12;color:#e8edf4;font-family:Roboto,-apple-system,Segoe UI,Arial,sans-serif"><main style="max-width:480px;margin:0 auto;padding:48px 20px">
<p style="color:#4c8dff;font-weight:700">${esc(BRAND.name)}</p><h1 style="font-size:24px">${esc(title)}</h1><p style="font-size:16px;line-height:1.5">${esc(body)}</p>
${form ? `<form method="post" action="${esc(form.action)}">${fields}<button type="submit" style="min-height:48px;padding:0 22px;border:0;border-radius:14px;background:#4c8dff;color:#fff;font-size:16px;font-weight:700">${esc(form.button)}</button></form>` : ""}
</main></body></html>`;
}
