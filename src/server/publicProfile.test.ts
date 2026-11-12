import { beforeEach, describe, expect, it } from "vitest";

import { navFor } from "@/components/site/nav";

import { query, resetDb } from "./db";
import { calendarUtc, usualDaysUtc } from "./profilePage";
import { bestSetText, langFrom, PAGE_COMMENTS, profileHtml, publicProfile, sitemapPeople, sitemapXml, unitFrom } from "./publicProfile";
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
    // No script runs: the only script element is the JSON-LD data block.
    expect(html.match(/<script/g)).toHaveLength(1);
    expect(html).toContain('<script type="application/ld+json">');
    expect(html).toContain('"@type":"ProfilePage"');
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

  it("wears the site's header and footer, with the profile's extras and calls to try the app", async () => {
    await call("acc-a", "update", {
      public: true,
      avatar: "av-bolt",
      level: 12,
      streak: 5,
      showLifts: true,
      lifts: [{ id: "bench-press", w: 110, r: 3, at: NOW - 86_400_000 }],
    });
    const p = await publicProfile("alex", NOW);
    expect(p).toMatchObject({ avatar: "av-bolt", level: 12, streak: 5, lifts: [{ id: "bench-press", w: 110, r: 3 }] });
    expect(p!.trained).toHaveLength(1);
    const html = profileHtml(p, "en", "kg", NOW);
    // The same header links as every other public page.
    for (const l of navFor("en")) expect(html).toContain(`href="${l.href}"`);
    expect(html).toContain('href="/privacy/"');
    expect(html).toContain("Level 12");
    expect(html).toContain("Best lifts");
    expect(html).toContain("110 kg × 3");
    // Followed links to our own pages, with no UTM tags.
    expect(html).toContain('<a href="/exercises/bench-press/">');
    expect(html).toContain('href="/tools/"');
    expect(html).not.toMatch(/href="\/[^"]*utm_/);
    expect(html).not.toContain("nofollow");
    expect(html.match(/href="\/app\/"/g)!.length).toBeGreaterThanOrEqual(4);
    expect(html).toContain("Workouts posted in the last 12 weeks: 1");
  });

  it("shows likes, cheers and comments read-only, without the try card", async () => {
    await call("acc-a", "update", { public: true });
    await call("acc-b", "join", { handle: "blair", name: "Blair", agree: true });
    await call("acc-b", "update", { public: true });
    await call("acc-c", "join", { handle: "casey", name: "Casey", agree: true }); // private
    await call("acc-d", "join", { handle: "dana", name: "Dana", agree: true });
    await call("acc-e", "join", { handle: "eli", name: "Eli", agree: true });
    for (const who of ["acc-b", "acc-c", "acc-d", "acc-e"]) await call(who, "update", { public: true });
    await call("acc-c", "update", { public: false });
    const [post] = await query<{ id: string }>("SELECT id FROM posts WHERE account_id = 'acc-a'");
    const id = String(post!.id);
    await call("acc-b", "like", { id });
    await call("acc-c", "like", { id });
    const first = await call("acc-b", "comment", { id, text: "Strong <session>" });
    await call("acc-c", "comment", { id, text: "Nice bench", replyTo: (first.body.comment as { id: string }).id });
    await call("acc-d", "comment", { id, text: "Suspended later" });
    await call("acc-e", "comment", { id, text: "Blocked later" });
    await query("UPDATE social_profiles SET suspended = 1 WHERE account_id = 'acc-d'");
    await call("acc-a", "block", { handle: "eli" });
    // Two cheers during this workout (its session id is the post's workout id), one during another.
    for (const [cid, session] of [
      ["c1", "s1"],
      ["c2", "s1"],
      ["c3", "s9"],
    ])
      await query("INSERT INTO cheers (id, from_id, to_id, session_id, emoji, created_at) VALUES (?, 'acc-b', 'acc-a', ?, '🔥', ?)", [
        cid,
        session,
        NOW,
      ]);
    const p = await publicProfile("alex", NOW);
    expect(p!.recent[0]).toMatchObject({ likes: 2, cheers: 2, commentCount: 2 });
    expect(p!.recent[0]!.comments.map(({ c, reply }) => [c.name, c.handle, reply])).toEqual([
      ["Blair", "blair", false],
      ["Casey", "", true], // a private writer keeps their name, without a handle or a link
    ]);
    const html = profileHtml(p, "en", "kg", NOW);
    expect(html).toContain("Strong &#60;session&#62;");
    expect(html).toContain('<a href="/u/blair/">Blair</a>');
    expect(html).not.toContain("/u/casey/");
    expect(html).not.toContain("Suspended later");
    expect(html).not.toContain("Blocked later");
    expect(html).toMatch(/title="Likes">.*?<span class="n">2<\/span><span class="sr"> Likes<\/span>/);
    expect(html).toMatch(/title="Cheers">.*?<span class="n">2<\/span><span class="sr"> Cheers<\/span>/);
    // Read-only, and the extra "Train with a plan" card is gone.
    expect(html).not.toContain("<form");
    expect(html).not.toContain("<button");
    expect(html).not.toContain("Train with a plan");
    expect(html).not.toContain("See all");
  });

  it("links to the app when a workout has more comments than the page shows", async () => {
    await call("acc-a", "update", { public: true });
    const [post] = await query<{ id: string }>("SELECT id FROM posts WHERE account_id = 'acc-a'");
    for (let i = 0; i < PAGE_COMMENTS + 2; i++)
      await query("INSERT INTO post_comments (id, post_id, account_id, created_at, body, hidden) VALUES (?, ?, 'acc-a', ?, ?, 0)", [
        `k${i}`,
        String(post!.id),
        NOW + i,
        `Note ${i}`,
      ]);
    const p = await publicProfile("alex", NOW);
    expect(p!.recent[0]!.comments).toHaveLength(PAGE_COMMENTS);
    const html = profileHtml(p, "en", "kg", NOW);
    expect(html).toContain(`See all ${PAGE_COMMENTS + 2} comments in the app`);
    expect(html).toContain('href="/app/#/person/alex"');
  });

  it("hides the best lifts while weights are hidden, and draws the not-public page in the site frame", async () => {
    await call("acc-a", "update", { public: true, weights: false, showLifts: true, lifts: [{ id: "bench-press", w: 110, r: 3, at: NOW }] });
    expect((await publicProfile("alex", NOW))!.lifts).toEqual([]);
    const gone = profileHtml(null, "de");
    expect(gone).toContain("noindex");
    expect(gone).toContain('href="/de/pricing/"');
    expect(gone).not.toContain("<script");
  });

  it("works out the calendar and usual days in UTC", () => {
    const mon = Date.UTC(2026, 10, 9, 18); // Monday 9 November 2026
    const weeks = calendarUtc([mon, mon + 2 * 86_400_000], mon + 3 * 86_400_000);
    expect(weeks).toHaveLength(12);
    expect(weeks.at(-1)!.days).toEqual([true, false, true, false, false, false, false]);
    const trained = [0, 1, 2, 3].flatMap((w) => [mon - w * 7 * 86_400_000, mon - w * 7 * 86_400_000 + 2 * 86_400_000]);
    expect(usualDaysUtc(trained)).toEqual([1, 3]);
    expect(usualDaysUtc(trained.slice(0, 3))).toEqual([]);
  });
});
