import { beforeEach, describe, expect, it } from "vitest";

import { resetDb } from "./db";
import { bestSetText, langFrom, profileHtml, publicProfile, sitemapPeople, sitemapXml, unitFrom } from "./publicProfile";
import { handle, resolveReports } from "./social";

const NOW = Date.now();
const call = (who: string, op: string, b: Record<string, unknown> = {}) => handle(who, { op, ...b }, NOW);
const workout = (id: string) => ({
  workoutId: id,
  at: NOW - 3_600_000,
  body: {
    seconds: 3000,
    sets: 12,
    volume: 4200,
    prs: 1,
    muscles: ["chest"],
    exercises: [{ id: "bench-press", name: "Bench press", sets: 4, w: 100, r: 5 }],
  },
});
const req = (lang: string) =>
  new Request("https://www.getliftsmith.com/api/people/page/?handle=alex", { headers: { "accept-language": lang } });

beforeEach(async () => {
  await resetDb();
  await call("acc-a", "join", { handle: "alex", name: "Alex <b>", agree: true });
  await call("acc-a", "post", workout("s1"));
});

describe("public profiles on the web", () => {
  it("shows nothing for a private profile, and the page once it's public", async () => {
    expect(await publicProfile("alex")).toBeNull();
    expect(await sitemapPeople()).toEqual([]);
    await call("acc-a", "update", { public: true });
    const p = await publicProfile("@Alex");
    expect(p).toMatchObject({ handle: "alex", posts: 1, followers: 0 });
    const html = profileHtml(p, "en");
    expect(html).toContain("Bench press");
    expect(html).toContain("100 kg × 5");
    expect(html).toContain('<link rel="canonical" href="https://www.getliftsmith.com/u/alex/">');
    expect(html).not.toContain("<script");
    expect(html).not.toContain("<b>"); // the name is escaped
    expect(html).not.toContain("noindex");
    expect(profileHtml(null, "fr")).toContain("noindex");
  });

  it("lists only public profiles with a workout in the sitemap", async () => {
    await call("acc-b", "join", { handle: "blair", agree: true });
    await call("acc-b", "update", { public: true }); // public, but nothing posted
    await call("acc-c", "join", { handle: "casey", agree: true });
    await call("acc-c", "post", workout("s2")); // posted, but private
    await call("acc-a", "update", { public: true });
    expect((await sitemapPeople()).map((p) => p.handle)).toEqual(["alex"]);
    expect(sitemapXml(await sitemapPeople())).toContain("<loc>https://www.getliftsmith.com/u/alex/</loc>");
    await resolveReports("profile", "acc-a", "suspend");
    expect(await sitemapPeople()).toEqual([]);
    expect(await publicProfile("alex")).toBeNull();
  });

  it("follows the reader's language and units", () => {
    expect(langFrom(req("de-DE,de;q=0.9,en;q=0.8"))).toBe("de");
    expect(langFrom(req("pt-BR"))).toBe("en");
    expect(unitFrom(req("en-US,en;q=0.9"))).toBe("lb");
    expect(unitFrom(req("en-CA"))).toBe("kg");
    expect(bestSetText({ id: "bench-press", name: "", sets: 3, w: 100, r: 5 }, "lb", "en")).toBe("220 lb × 5");
    expect(bestSetText({ id: "bench-press", name: "", sets: 3, w: null, r: 8 }, "kg", "en")).toBe("× 8");
  });
});
