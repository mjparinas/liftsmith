// Website widgets for official gyms (docs/decisions/gyms.md "Website widgets"; traffic idea 3, Melvin 2026-11-27). An
// owner pastes one line of code into the gym's own website and it shows the gym's class schedule, its equipment, or a
// "Find us on Liftsmith" badge, always up to date and linking back to the gym's page here, which earns the page a link
// from a local business site.
//
//   schedule, equipment   an <iframe> of /embed/gym/<id>/<kind>/ (plain HTML, no scripts), then a plain link to the gym's
//                         page outside the frame, because only a link in the host page itself counts for search
//   badge                 a link to the gym's page around an <img> of /embed/gym/<id>/badge.svg: no frame at all
//
// This file is shared: the server draws the widgets (src/server/gymWidgets.ts) and the owner's page in the app builds the
// code (GymWidgets.tsx). The code itself carries no words in any language, only the gym's name and the brand, so it reads
// the same whatever language the widget is set to.
import { BRAND } from "./brand";
import type { Lang } from "./i18n";
import { SITE_URL } from "./site";

export const WIDGET_KINDS = ["schedule", "equipment", "badge"] as const;
export type WidgetKind = (typeof WIDGET_KINDS)[number];
export const WIDGET_THEMES = ["light", "dark"] as const;
export type WidgetTheme = (typeof WIDGET_THEMES)[number];

export const isWidgetKind = (x: unknown): x is WidgetKind => typeof x === "string" && (WIDGET_KINDS as readonly string[]).includes(x);
export const isWidgetTheme = (x: unknown): x is WidgetTheme => typeof x === "string" && (WIDGET_THEMES as readonly string[]).includes(x);
/** The app's ten languages (LANGS in i18n.ts, kept equal by gymWidgets.test.ts), listed here so the server's widget
 * route doesn't load the app's catalogue. */
export const WIDGET_LANGS: readonly Lang[] = ["en", "es", "fr", "de", "it", "ja", "pt", "ko", "pl", "tr"];
export const isWidgetLang = (x: unknown): x is Lang => typeof x === "string" && (WIDGET_LANGS as readonly string[]).includes(x);

/** The framed widgets' height in CSS pixels: a week of classes or a full kit list scrolls inside it past that. */
export const WIDGET_HEIGHT: Record<Exclude<WidgetKind, "badge">, number> = { schedule: 560, equipment: 400 };
/** The widest a framed widget is drawn; on a narrower column it fills it. */
export const WIDGET_MAX_WIDTH = 480;
/** The badge's height; its width follows its words in each language (badgeWidth). */
export const BADGE_HEIGHT = 48;
/**
 * The badge's width in each language, so the code the app builds (which has only the app's own language loaded) gives
 * the image its real size and the host page doesn't jump. gymWidgets.test.ts checks each one is badgeWidth of the words.
 */
export const BADGE_WIDTH: Record<Lang, number> = {
  en: 158,
  es: 160,
  fr: 179,
  de: 158,
  it: 158,
  ja: 158,
  pt: 186,
  ko: 158,
  pl: 158,
  tr: 173,
};

export interface WidgetGym {
  id: string;
  name: string;
  citySlug: string;
  slug: string;
}

export interface WidgetOptions {
  lang: Lang;
  theme: WidgetTheme;
}

/** "?lang=fr&theme=dark": English and light are the defaults, so they're left off. */
export function widgetQuery({ lang, theme }: WidgetOptions): string {
  const q = new URLSearchParams();
  if (lang !== "en") q.set("lang", lang);
  if (theme !== "light") q.set("theme", theme);
  const s = q.toString();
  return s ? `?${s}` : "";
}

export const widgetUrl = (id: string, kind: WidgetKind, opts: WidgetOptions) =>
  `${SITE_URL}/embed/gym/${id}/${kind === "badge" ? "badge.svg" : `${kind}/`}${widgetQuery(opts)}`;

/**
 * The gym's page, as the code links it. utm_source tells the admin Traffic tab a visit came from a gym's widget (the
 * gym page names itself as canonical, so the tag never becomes an address of its own for search).
 */
export const widgetGymUrl = (g: Pick<WidgetGym, "citySlug" | "slug">, kind: WidgetKind) =>
  `${SITE_URL}/gyms/${g.citySlug}/${g.slug}/?utm_source=gym_widget&utm_medium=widget&utm_campaign=${kind}`;

/** The page the link outside the frame goes to, without tags: this is the link search engines count. */
export const widgetCanonical = (g: Pick<WidgetGym, "citySlug" | "slug">) => `${SITE_URL}/gyms/${g.citySlug}/${g.slug}/`;

const attr = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * The code an owner pastes. Frames are sandboxed (our page has no scripts, and only needs to open links in a new tab)
 * and load lazily, so they never slow the gym's own page down.
 */
export function widgetSnippet(g: WidgetGym, kind: WidgetKind, opts: WidgetOptions): string {
  const name = attr(`${g.name} · ${BRAND.name}`);
  if (kind === "badge")
    return `<a href="${attr(widgetCanonical(g))}" title="${name}"><img src="${attr(widgetUrl(g.id, "badge", opts))}" alt="${name}" width="${BADGE_WIDTH[opts.lang]}" height="${BADGE_HEIGHT}" loading="lazy" style="border:0"></a>`;
  return [
    `<iframe src="${attr(widgetUrl(g.id, kind, opts))}" title="${name}" width="100%" height="${WIDGET_HEIGHT[kind]}" style="border:0;max-width:${WIDGET_MAX_WIDTH}px;border-radius:16px" loading="lazy" sandbox="allow-popups allow-popups-to-escape-sandbox" referrerpolicy="strict-origin-when-cross-origin"></iframe>`,
    `<p style="max-width:${WIDGET_MAX_WIDTH}px;font-size:14px"><a href="${attr(widgetCanonical(g))}">${attr(g.name)}</a> · ${BRAND.name}</p>`,
  ].join("\n");
}

/**
 * The badge's width for its words: about how wide the system font draws them at the badge's two sizes, plus the mark
 * and padding. CJK and Hangul are about twice as wide as Latin letters.
 */
export function badgeWidth(small: string, big: string): number {
  const em = (s: string) => [...s].reduce((w, c) => w + (/[　-鿿가-힯＀-￯]/.test(c) ? 1 : 0.58), 0);
  const text = Math.max(em(small) * 11, em(big) * 18);
  return Math.ceil(48 + text + 16);
}
