// The words and layout of every reminder email. Plain text first (it's what most people read on a
// phone), with a simple HTML twin. Every email carries the same footer: why it was sent, where to
// change it, a one-click unsubscribe link and the sender's postal address (CAN-SPAM and CASL).
import { BRAND } from "@/lib/brand";
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

function wrap(title: string, paras: string[], cta: { label: string; url: string } | null, footer: Footer | null, why: string): Mail {
  const foot = footer
    ? [
        why,
        `Choose which emails you get in the app under Settings, Reminders.`,
        `Unsubscribe from all ${BRAND.name} emails: ${footer.unsubscribeUrl}`,
        `${BRAND.name}, ${footer.postalAddress}`,
      ]
    : [why, "If you didn't ask for this, ignore it and you won't hear from us again."];
  const text = [title, "", ...paras.flatMap((p) => [p, ""]), ...(cta ? [`${cta.label}: ${cta.url}`, ""] : []), "--", ...foot].join("\n");
  const html = `<!doctype html><html><body style="margin:0;background:#0a0d12;color:#e8edf4;font-family:Roboto,-apple-system,Segoe UI,Arial,sans-serif">
<div style="max-width:520px;margin:0 auto;padding:32px 20px">
<p style="color:#4c8dff;font-weight:700;margin:0 0 24px">${esc(BRAND.name)}</p>
<h1 style="font-size:22px;margin:0 0 16px">${esc(title)}</h1>
${paras.map((p) => `<p style="font-size:16px;line-height:1.5;margin:0 0 14px">${esc(p)}</p>`).join("\n")}
${cta ? `<p style="margin:24px 0"><a href="${esc(cta.url)}" style="display:inline-block;background:#4c8dff;color:#fff;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:14px">${esc(cta.label)}</a></p>` : ""}
<hr style="border:0;border-top:1px solid #222a35;margin:28px 0 16px">
${foot.map((l) => `<p style="font-size:12px;line-height:1.5;color:#808c9d;margin:0 0 6px">${l.startsWith("Unsubscribe") && footer ? `<a href="${esc(footer.unsubscribeUrl)}" style="color:#808c9d">Unsubscribe from all ${esc(BRAND.name)} emails</a>` : esc(l)}</p>`).join("\n")}
</div></body></html>`;
  return { subject: title, text, html };
}

const appUrl = (route = "today") => `${SITE_URL}${APP_PATH}#/${route}`;

export function confirmMail(confirmUrl: string): Mail {
  return wrap(
    `Confirm your ${BRAND.name} emails`,
    ["Tap the button to start getting workout reminders by email. Nothing is sent until you do."],
    { label: "Confirm my email", url: confirmUrl },
    null,
    `Someone (hopefully you) entered this address in ${BRAND.name}.`,
  );
}

export function welcomeMail(footer: Footer): Mail {
  return wrap(
    `Welcome to ${BRAND.name}`,
    [
      "You're all set. Each workout is planned when you open the app, from your gym's equipment, what's recovered and how your last sets went.",
      "Log a set with one tap. The next set is filled in and the rest timer starts itself, so you can put the phone down and lift.",
      "We'll email you on Monday with your training week, and only when it helps after that. You can turn any of it off in Settings.",
    ],
    { label: "Open today's workout", url: appUrl() },
    footer,
    "You're getting this because you turned on email from the app.",
  );
}

/** A planned message (messages.ts) or a milestone, as an email. */
export function messageMail(m: { title: string; body: string; route?: string; kind: string }, footer: Footer): Mail {
  const cta =
    m.kind === "pro" ? { label: "See Pro", url: appUrl("settings") } : { label: "Open today's workout", url: appUrl(m.route ?? "today") };
  return wrap(
    m.title,
    [m.body],
    cta,
    footer,
    `You're getting this because you turned on ${m.kind === "pro" ? "Pro trial and offer" : "reminder"} emails in the app.`,
  );
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
