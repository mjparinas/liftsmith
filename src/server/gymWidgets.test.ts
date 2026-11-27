import { beforeEach, describe, expect, it } from "vitest";

import { encodeGym, kitOf } from "@/lib/gymShare";
import { BADGE_WIDTH, badgeWidth, WIDGET_LANGS, widgetSnippet } from "@/lib/gymWidgets";
import { LANGS } from "@/lib/i18n";
import { makeTestGym } from "@/test/factories";

import { GET } from "../app/api/gyms/widget/route.api";
import { query, resetDb, run } from "./db";
import { saveClass } from "./gymClasses";
import { say } from "./gymPage";
import { placesFromOsm, savePlaces, widgetPlace } from "./gymPlaces";
import { badgeSvg, widgetHtml, widgetRequest } from "./gymWidgets";
import { esc } from "./siteFrame";

// Website widgets for official gyms (docs/decisions/gyms.md "Website widgets").
const NOW = 1_800_000_000_000;
let gym = "";

beforeEach(async () => {
  await resetDb();
  await savePlaces(
    placesFromOsm([{ type: "node", id: 1, lat: 49.1, lon: -122.6, tags: { leisure: "fitness_centre", name: "Iron <Works>" } }], {
      city: "Langley",
      region: "BC",
      country: "CA",
    }),
    NOW,
  );
  gym = String((await query("SELECT id FROM gym_places"))[0]!.id);
  await run("UPDATE gym_places SET claimed_by = 'acc-owner', code = ? WHERE id = ?", [
    encodeGym({ ...kitOf(makeTestGym()), name: "Iron" }),
    gym,
  ]);
});

const get = (path: string) => GET(new Request(`https://www.getliftsmith.com/api/gyms/widget/${path}`));

describe("the class schedule widget", () => {
  it("shows the gym's week, escaped, with a link back to its page that opens in a new tab", async () => {
    await saveClass(
      "acc-owner",
      gym,
      { name: "Spin", kind: "cycling", days: [1], start: "18:00", minutes: 45, coach: "", room: "", note: "", off: [] },
      NOW,
    );
    const html = widgetHtml(await widgetPlace(gym, true), "schedule", "en", "light");
    expect(html).toContain("Iron &#60;Works&#62;");
    expect(html).not.toContain("<Works>");
    expect(html).toContain("Spin");
    expect(html).toContain("Monday");
    expect(html).toMatch(
      /href="https:\/\/www\.getliftsmith\.com\/gyms\/langley-bc\/[a-z-]+\/\?utm_source=gym_widget&#38;utm_medium=widget&#38;utm_campaign=schedule" target="_blank" rel="noopener"/,
    );
    expect(html).not.toContain("<script");
    expect(html).toContain('<meta name="robots" content="noindex">');
  });
  it("says so when no classes are posted, in the widget's language", async () => {
    const html = widgetHtml(await widgetPlace(gym, true), "schedule", "fr", "dark");
    expect(html).toContain('<html lang="fr">');
    expect(html).toContain("Aucun cours publié");
    expect(html).toContain("color-scheme:dark");
  });
  it("reads one row, and the classes only for a schedule", async () => {
    await saveClass(
      "acc-owner",
      gym,
      { name: "Spin", kind: "cycling", days: [1], start: "18:00", minutes: 45, coach: "", room: "", note: "", off: [] },
      NOW,
    );
    expect((await widgetPlace(gym, false))!.classes).toEqual([]);
    expect((await widgetPlace(gym, true))!.classes).toHaveLength(1);
  });
});

describe("the equipment widget", () => {
  it("lists the equipment and offers to add the gym in the app", async () => {
    const html = widgetHtml(await widgetPlace(gym), "equipment", "en", "light");
    expect(html).toContain("Barbell");
    expect(html).toContain("/app/#/gymplace/");
    expect(html).toContain("Add this gym to your Liftsmith");
  });
  it("shows a quiet line, not an error, for a gym that's no longer official or gone", async () => {
    await run("UPDATE gym_places SET claimed_by = '' WHERE id = ?", [gym]);
    for (const p of [await widgetPlace(gym), null]) {
      const html = widgetHtml(p, "equipment", "en", "light");
      expect(html).toContain(esc(say("en", "gp.w.off")));
      expect(html).not.toContain("Iron");
    }
  });
});

describe("the badge", () => {
  it("is an image that reads in every language, as wide as the app's code says", () => {
    for (const l of WIDGET_LANGS) {
      const svg = badgeSvg(l, "light");
      expect(svg).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" width="\d+" height="48"/);
      expect(svg).toContain(`width="${BADGE_WIDTH[l]}"`);
      expect(BADGE_WIDTH[l]).toBe(badgeWidth(say(l, "gp.w.findUs"), "Liftsmith"));
      expect(svg).not.toContain("<script");
    }
    expect(badgeSvg("de", "dark")).toContain("Finde uns auf");
  });
  it("covers the app's ten languages", () => expect([...WIDGET_LANGS]).toEqual([...LANGS]));
});

describe("the code an owner pastes", () => {
  const g = { id: "0123456789abcdef", name: 'Iron "Works"', citySlug: "langley-bc", slug: "iron-works" };
  it("frames the widget sandboxed and lazy, with a plain link to the gym's page outside the frame", () => {
    const code = widgetSnippet(g, "schedule", { lang: "fr", theme: "dark" });
    expect(code).toContain('src="https://www.getliftsmith.com/embed/gym/0123456789abcdef/schedule/?lang=fr&amp;theme=dark"');
    expect(code).toContain('sandbox="allow-popups allow-popups-to-escape-sandbox"');
    expect(code).toContain('loading="lazy"');
    expect(code).toContain('<a href="https://www.getliftsmith.com/gyms/langley-bc/iron-works/">Iron &quot;Works&quot;</a>');
  });
  it("puts the badge straight in the page, so the link is the host page's own", () => {
    const code = widgetSnippet(g, "badge", { lang: "en", theme: "light" });
    expect(code).not.toContain("<iframe");
    expect(code).toMatch(
      /^<a href="https:\/\/www\.getliftsmith\.com\/gyms\/langley-bc\/iron-works\/" title="[^"]+"><img src="https:\/\/www\.getliftsmith\.com\/embed\/gym\/0123456789abcdef\/badge\.svg" alt=/,
    );
  });
});

describe("the route", () => {
  it("answers each kind with its own type and caching", async () => {
    const badge = await get(`?id=${gym}&kind=badge&lang=ja`);
    expect(badge.headers.get("Content-Type")).toContain("image/svg+xml");
    expect(await badge.text()).toContain(esc(say("ja", "gp.w.findUs")));
    const page = await get(`?id=${gym}&kind=equipment`);
    expect(page.status).toBe(200);
    expect(page.headers.get("Content-Security-Policy")).toContain("frame-ancestors http: https:");
    expect(page.headers.get("X-Frame-Options")).toBeNull();
    expect(page.headers.get("Cache-Control")).toContain("s-maxage=");
    expect((await get(`?id=ffffffffffffffff&kind=schedule`)).status).toBe(404);
    expect((await get(`?id=${gym}&kind=nope`)).status).toBe(404);
  });
  it("falls back to English and the light look for anything it doesn't know", () => {
    const r = widgetRequest(new URLSearchParams("id=x&kind=badge&lang=xx&theme=neon"));
    expect(r).toMatchObject({ kind: "badge", lang: "en", theme: "light" });
  });
});
