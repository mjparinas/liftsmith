// The website's "Report a problem" page for a real gym (/gyms/<city>/<gym>/report/, docs/decisions/gyms.md "Reporting a gym
// page"): a plain form with no scripts, like the gym pages, that posts back to itself. Its policy is the gym pages' with
// `form-action 'self'`, so the form can send (REPORT_PAGE_CSP). Never indexed. The report itself: gymPlaceReports.ts.
import { PLACE_REPORT_LIMITS, PLACE_REPORT_REASONS } from "@/lib/gymPlaceReport";
import type { MsgLang } from "@/lib/messageText";
import { REPORT_PAGE_CSP } from "@/lib/securityHeaders";

import { GYM_STYLE, gymPath, say } from "./gymPage";
import type { Place } from "./gymPlaces";
import { esc, framePage, icon } from "./siteFrame";

export const GYM_REPORT_HEADERS = {
  "Content-Type": "text/html; charset=utf-8",
  "Content-Security-Policy": REPORT_PAGE_CSP,
  "Cache-Control": "private, no-store",
  "X-Robots-Tag": "noindex",
};

export type ReportPageState = "form" | "sent" | "pick" | "slow" | "failed";

const STYLE = `
.report{max-width:560px}.report h1{font-size:1.75rem;font-weight:800;line-height:1.15;margin:8px 0 8px}
.report form{margin-top:16px}.report fieldset{border:0;padding:0;margin:0}.report legend{font-weight:700;margin-bottom:8px}
.report .opt{display:flex;align-items:center;gap:12px;min-height:48px;padding:0 14px;margin-top:8px;border:1px solid var(--line);border-radius:12px;background:var(--surface);cursor:pointer}
.report .opt input{width:20px;height:20px;accent-color:var(--accent)}
.report label.note{display:block;margin:18px 0 6px;color:var(--muted)}
.report textarea{width:100%;min-height:96px;padding:12px 14px;border:1px solid var(--line);border-radius:12px;background:var(--surface);color:var(--ink);font:inherit}
.report .btn{margin-top:18px;width:100%;border:0;font:inherit;font-weight:700;cursor:pointer}
.report .msg{margin-top:12px;padding:12px 14px;border-radius:12px;border:1px solid var(--line);background:var(--raised)}
.report .hp{position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden}`;

export function reportPageHtml(p: Pick<Place, "name" | "citySlug" | "slug">, lang: MsgLang, state: ReportPageState = "form"): string {
  const back = `<a class="quiet" href="${esc(gymPath(p))}">‹ ${esc(say(lang, "gp.reportBack", { name: p.name }))}</a>`;
  const title = `${say(lang, "gp.reportTitle")}: ${p.name} | Liftsmith`;
  if (state === "sent") {
    const body = `<main id="main" class="wrap page report">${back}<h1>${esc(say(lang, "gp.reportTitle"))}</h1>
<p class="msg" role="status">${icon("check", 16)} ${esc(say(lang, "gp.reportThanks"))}</p></main>`;
    return framePage(lang, title, '<meta name="robots" content="noindex">', body, GYM_STYLE + STYLE, "gym");
  }
  const msg =
    state === "form"
      ? ""
      : `<p class="msg" role="alert">${esc(say(lang, state === "pick" ? "gp.reportPick" : state === "slow" ? "gp.reportSlow" : "gp.reportFailed"))}</p>`;
  const options = PLACE_REPORT_REASONS.map(
    (r) => `<label class="opt"><input type="radio" name="reason" value="${r}" required>${esc(say(lang, `gp.reason.${r}`))}</label>`,
  ).join("");
  const body = `<main id="main" class="wrap page report">${back}<h1>${esc(say(lang, "gp.reportTitle"))}</h1>
<p class="muted">${esc(say(lang, "gp.reportIntro", { name: p.name }))}</p>${msg}
<form method="post" action="${esc(`${gymPath(p)}report/`)}"><fieldset><legend>${esc(say(lang, "gp.reportWhy"))}</legend>${options}</fieldset>
<label class="note" for="note">${esc(say(lang, "gp.reportNote"))}</label><textarea id="note" name="note" maxlength="${PLACE_REPORT_LIMITS.note}"></textarea>
<div class="hp" aria-hidden="true"><label for="hp-site">Website</label><input id="hp-site" name="site" tabindex="-1" autocomplete="off"></div>
<button class="btn btn-primary" type="submit">${esc(say(lang, "gp.reportSend"))}</button></form></main>`;
  return framePage(lang, title, '<meta name="robots" content="noindex">', body, GYM_STYLE + STYLE, "gym");
}
