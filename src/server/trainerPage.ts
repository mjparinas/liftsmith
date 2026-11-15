// The trainer, coach and physio directory's pages (/trainers/ and /trainers/<city>/; trainerDirectory.ts,
// docs/decisions/public-pages-and-seo.md "Trainer directory"). Plain HTML with no scripts in the site's frame, like the
// gym pages they link to, in the reader's language. A city with fewer than DIRECTORY_MIN people is noindex and left out
// of the sitemap; one with nobody is a 404.
import type { MsgLang } from "@/lib/messageText";
import { SITE_URL } from "@/lib/site";

import { cityPath, crumbs, GYM_STYLE, gymPath, metaTags, say, type GpKey } from "./gymPage";
import { esc, framePage, icon } from "./siteFrame";
import { DIRECTORY_MIN, type DirectoryCity, type DirectoryPerson } from "./trainerDirectory";

export const trainersPath = (citySlug?: string) => (citySlug ? `/trainers/${citySlug}/` : "/trainers/");
const place = (c: { city: string; region: string }) => [c.city, c.region].filter(Boolean).join(", ");

function person(lang: MsgLang, p: DirectoryPerson): string {
  const gyms = p.gyms.map((g) => `<a href="${esc(gymPath(g))}">${esc(g.name)}</a>`).join(", ");
  return `<li><p class="li-name">${esc(p.name)}</p>${p.role ? `<p class="muted small">${esc(say(lang, `gp.role.${p.role}` as GpKey))}</p>` : ""}<p class="muted small">${say(lang, "gp.dirAt", { gyms: "\u0000" }).split("\u0000").map(esc).join(gyms)}</p>${p.bio ? `<p>${esc(p.bio)}</p>` : ""}<p><a href="/app/#/trainer/${esc(p.code)}" rel="nofollow">${esc(say(lang, "gp.trainWith", { name: p.name }))} ›</a></p></li>`;
}

export function trainerCityHtml(lang: MsgLang, citySlug: string, c: { city: string; region: string; people: DirectoryPerson[] }): string {
  const city = place(c);
  const title = `${say(lang, "gp.dirTitle", { city })} | Liftsmith`;
  const desc = say(lang, "gp.dirDescription", { count: c.people.length, city });
  const path = trainersPath(citySlug);
  const ld = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: say(lang, "gp.dirTitle", { city }),
    url: `${SITE_URL}${path}`,
    itemListElement: c.people.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Person",
        name: p.name,
        ...(p.role ? { jobTitle: say("en", `gp.role.${p.role}` as GpKey) } : {}),
        worksFor: p.gyms.map((g) => ({ "@type": "ExerciseGym", name: g.name, url: `${SITE_URL}${gymPath(g)}` })),
      },
    })),
  };
  const physios = c.people.filter((p) => p.role === "physio");
  const trainers = c.people.filter((p) => p.role !== "physio");
  const section = (id: string, label: string, list: DirectoryPerson[]) =>
    list.length
      ? `<section class="card" aria-labelledby="${id}"><h2 id="${id}">${icon("people", 16)}${esc(label)}</h2><ul class="trainers">${list.map((p) => person(lang, p)).join("")}</ul></section>`
      : "";
  const body = `<main id="main" class="wrap page narrow">${crumbs(lang, [
    [say(lang, "gp.dirKicker"), trainersPath()],
    [city, null],
  ])}
<header class="head"><p class="kicker">${esc(say(lang, "gp.dirKicker"))}</p><h1>${esc(say(lang, "gp.dirTitle", { city }))}</h1><p class="muted">${esc(say(lang, "gp.dirIntro"))}</p></header>
${section("trainers-h", say(lang, "gp.dirTrainers"), trainers)}${section("physios-h", say(lang, "gp.dirPhysios"), physios)}
<p><a class="quiet" href="${esc(cityPath(citySlug))}">${esc(say(lang, "gp.dirJoin"))} ›</a></p></main>`;
  return framePage(lang, title, metaTags(title, desc, path, ld, c.people.length >= DIRECTORY_MIN), body, GYM_STYLE, "trainers");
}

export function trainerIndexHtml(lang: MsgLang, list: DirectoryCity[]): string {
  const title = `${say(lang, "gp.dirIndexTitle")} | Liftsmith`;
  const desc = say(lang, "gp.dirIndexDescription");
  const n = new Intl.NumberFormat(lang);
  const ld = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: say(lang, "gp.dirIndexTitle"),
    url: `${SITE_URL}${trainersPath()}`,
  };
  const items = list
    .map(
      (c) =>
        `<li><a href="${esc(trainersPath(c.citySlug))}"><span class="li-name">${esc(place(c))}</span><span class="muted small">${esc(
          c.people === 1 ? say(lang, "gp.dirCount1") : say(lang, "gp.dirCountN", { count: n.format(c.people) }),
        )}</span></a></li>`,
    )
    .join("");
  const content = list.length
    ? `<section class="card"><ul class="list">${items}</ul></section>`
    : `<section class="card"><h2>${esc(say(lang, "gp.dirEmpty"))}</h2><p>${esc(say(lang, "gp.dirEmptyBody"))}</p></section>`;
  const body = `<main id="main" class="wrap page narrow">
<header class="head"><p class="kicker">${esc(say(lang, "gp.dirKicker"))}</p><h1>${esc(say(lang, "gp.dirIndexTitle"))}</h1><p class="muted">${esc(say(lang, "gp.dirIndexBody"))}</p></header>
${content}<p><a class="quiet" href="/gyms/">${esc(say(lang, "gp.dirJoin"))} ›</a></p></main>`;
  const indexed = list.some((c) => c.people >= DIRECTORY_MIN);
  return framePage(lang, title, metaTags(title, desc, trainersPath(), ld, indexed), body, GYM_STYLE, "trainers");
}

/** The directory's cities worth indexing, for the gym sitemap. */
export const directoryEntries = (list: DirectoryCity[], updatedAt: number) => {
  const shown = list.filter((c) => c.people >= DIRECTORY_MIN);
  return shown.length
    ? [
        { path: trainersPath(), lastModified: updatedAt },
        ...shown.map((c) => ({ path: trainersPath(c.citySlug), lastModified: updatedAt })),
      ]
    : [];
};
