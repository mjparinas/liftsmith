// The website's gym chain pages (docs/decisions/gyms.md "Gym chains"), plain HTML with no scripts like the gym pages:
//   /gym-chains/            every chain with two locations or more, the biggest first
//   /gym-chains/<chain>/    one chain: its logo, its website and every branch, by country and city, each linking to
//                           its own gym page
// Text: src/locales/text/gp.ts (gp.chain*), in the reader's language. Map credit: OpenStreetMap (ODbL).
import type { MsgLang } from "@/lib/messageText";
import { SITE_URL } from "@/lib/site";

import { chainIndexable, type Chain, type ChainBranch } from "./gymChains";
import { crumbs, GYM_STYLE, gymPath, metaTags, say } from "./gymPage";
import { esc, framePage, icon } from "./siteFrame";

export const chainPath = (slug: string) => `/gym-chains/${slug}/`;

const logoImg = (c: Pick<Chain, "logo" | "name">, lang: MsgLang, size: number) =>
  c.logo
    ? `<img class="gym-logo" src="/api/gyms/photo/?id=${esc(c.logo)}" alt="${esc(say(lang, "gp.chainLogoAlt", { chain: c.name }))}" width="${size}" height="${size}">`
    : "";

/** "Canada" in the reader's language, or the code when the browser's data has no name for it. */
function countryName(code: string, lang: MsgLang): string {
  if (!code) return say(lang, "gp.chainElsewhere");
  try {
    return new Intl.DisplayNames([lang], { type: "region" }).of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

const officialMark = (lang: MsgLang) =>
  `<span class="tick" title="${esc(say(lang, "gp.official"))}">${icon("verified", 20)}<span class="sr">${esc(say(lang, "gp.official"))}</span></span>`;

function branchItem(b: ChainBranch, lang: MsgLang): string {
  const sub = [b.address, [b.city, b.region].filter(Boolean).join(", ")].filter(Boolean).join(", ");
  return `<li><a href="${esc(gymPath(b))}"><span class="li-name">${esc(b.name)}${b.official ? officialMark(lang) : ""}</span>${sub ? `<span class="muted small">${esc(sub)}</span>` : ""}</a></li>`;
}

/** One chain: its logo and website, then every branch, grouped by country when there's more than one. */
export function chainHtml(chain: Chain, branches: readonly ChainBranch[], lang: MsgLang): string {
  const n = new Intl.NumberFormat(lang);
  const count = n.format(branches.length);
  const heading = say(lang, "gp.chainTitle", { chain: chain.name });
  const title = `${heading} | Liftsmith`;
  const desc = say(lang, "gp.chainDescription", { chain: chain.name });
  const path = chainPath(chain.slug);
  const ld = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: chain.name,
    url: `${SITE_URL}${path}`,
    ...(chain.website ? { sameAs: [chain.website] } : {}),
    ...(chain.logo ? { logo: `${SITE_URL}/api/gyms/photo/?id=${chain.logo}` } : {}),
    subOrganization: branches.slice(0, 500).map((b) => ({
      "@type": "ExerciseGym",
      name: b.name,
      url: `${SITE_URL}${gymPath(b)}`,
      address: {
        "@type": "PostalAddress",
        ...(b.address ? { streetAddress: b.address } : {}),
        addressLocality: b.city,
        ...(b.region ? { addressRegion: b.region } : {}),
        ...(b.country ? { addressCountry: b.country } : {}),
      },
    })),
  };
  const groups = new Map<string, ChainBranch[]>();
  for (const b of branches) groups.set(b.country, [...(groups.get(b.country) ?? []), b]);
  const several = groups.size > 1;
  const lists = [...groups]
    .map(([cc, list], i) => {
      const items = `<ul class="list">${list.map((b) => branchItem(b, lang)).join("")}</ul>`;
      return several
        ? `<section class="card" aria-labelledby="cc-${i}"><h2 id="cc-${i}">${icon("pin", 16)}${esc(countryName(cc, lang))} <span class="muted small">${esc(say(lang, "gp.chainCount", { count: n.format(list.length) }))}</span></h2>${items}</section>`
        : `<section class="card" aria-labelledby="cc-${i}"><h2 id="cc-${i}">${icon("gym", 16)}${esc(heading)}</h2>${items}</section>`;
    })
    .join("");
  const site = chain.website
    ? `<p><a class="quiet" href="${esc(chain.website)}" rel="nofollow noopener">${icon("link", 16)}${esc(say(lang, "gp.chainWebsite", { chain: chain.name }))}</a></p>`
    : "";
  const body = `<main id="main" class="wrap page narrow">${crumbs(lang, [
    [say(lang, "gp.crumbs"), "/gyms/"],
    [say(lang, "gp.chainsTitle"), "/gym-chains/"],
    [chain.name, null],
  ])}
<header class="head chain-head">${logoImg(chain, lang, 64)}<p class="kicker">${esc(say(lang, "gp.chainKicker"))}</p><h1>${esc(heading)}</h1><p class="muted">${esc(say(lang, "gp.chainBody", { count }))}</p>${site}</header>
${lists}<p class="credit">${esc(say(lang, "gp.osm"))}</p></main>`;
  return framePage(lang, title, metaTags(title, desc, path, ld, chainIndexable(chain)), body, GYM_STYLE + CHAIN_STYLE, "gym");
}

/** Every chain with two locations or more, the biggest first. */
export function chainsIndexHtml(list: readonly Chain[], lang: MsgLang): string {
  const n = new Intl.NumberFormat(lang);
  const heading = say(lang, "gp.chainsTitle");
  const title = `${heading} | Liftsmith`;
  const desc = say(lang, "gp.chainsDescription");
  const ld = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: heading,
    itemListElement: list
      .slice(0, 1000)
      .map((c, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}${chainPath(c.slug)}`, name: c.name })),
  };
  const items = list
    .map(
      (c) =>
        `<li><a href="${esc(chainPath(c.slug))}"><span class="li-name">${esc(c.name)}</span><span class="muted small">${esc(say(lang, "gp.chainCount", { count: n.format(c.places) }))}</span></a></li>`,
    )
    .join("");
  const body = `<main id="main" class="wrap page narrow">${crumbs(lang, [
    [say(lang, "gp.crumbs"), "/gyms/"],
    [heading, null],
  ])}
<header class="head"><p class="kicker">${esc(say(lang, "gp.cityKicker"))}</p><h1>${esc(heading)}</h1><p class="muted">${esc(say(lang, "gp.chainsBody"))}</p></header>
${list.length ? `<section class="card" aria-label="${esc(heading)}"><ul class="list">${items}</ul></section>` : ""}<p class="credit">${esc(say(lang, "gp.osm"))}</p></main>`;
  return framePage(lang, title, metaTags(title, desc, "/gym-chains/", ld, list.length > 0), body, GYM_STYLE, "gym");
}

const CHAIN_STYLE = `
.chain-head .gym-logo{display:block}
.card h2 .muted{text-transform:none;letter-spacing:0;font-weight:500}
`;
