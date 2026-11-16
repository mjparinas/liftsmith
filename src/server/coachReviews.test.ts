import { beforeEach, describe, expect, it } from "vitest";

import { MSG_LANGS } from "@/lib/messageText";

import { coachCleanup } from "./coach";
import {
  deleteReview,
  eligibility,
  isReviewId,
  mineFor,
  ratingOf,
  replyToReview,
  reportReview,
  REVIEW_LIMITS,
  reviewId,
  reviewsOf,
  saveReview,
  shortName,
} from "./coachReviews";
import { batch, query, resetDb, run } from "./db";
import { adminReports, resolveReports } from "./social";
import { trainerCityHtml } from "./trainerPage";

// Ratings and reviews of coaches (docs/decisions/coach-reviews.md).
const DAY = 86_400_000;
const NOW = Date.UTC(2026, 10, 15);

async function profile(id: string, name: string, birthYear = 1990) {
  await run("INSERT OR REPLACE INTO sync_records (account_id, key, body, updated_at) VALUES (?, 'profile', ?, ?)", [
    id,
    JSON.stringify({ name, birthYear }),
    NOW,
  ]);
}
/** A client linked to `coach` `daysAgo` days before NOW. */
async function link(coach: string, client: string, daysAgo = 40) {
  await run("INSERT OR IGNORE INTO coach_links (coach_id, client_id, created_at) VALUES (?, ?, ?)", [coach, client, NOW - daysAgo * DAY]);
}
async function trained(client: string, daysAgo: number) {
  await run("INSERT INTO sync_events (account_id, id, at, body) VALUES (?, ?, ?, ?)", [
    client,
    `end-${client}-${daysAgo}`,
    NOW - daysAgo * DAY,
    JSON.stringify({ type: "sessionEnd", at: NOW - daysAgo * DAY }),
  ]);
}

beforeEach(async () => {
  await resetDb();
  await profile("coach", "Casey Coach");
  await run("INSERT INTO coach_accounts (account_id, created_at, via) VALUES ('coach', ?, 'app')", [NOW]);
});

describe("who can review", () => {
  it("needs a linked adult client after four weeks, or two sessions paid or held", async () => {
    await profile("new", "Nia New");
    await link("coach", "new", 3);
    expect(await eligibility("coach", "new", NOW)).toEqual({ ok: false, why: "wait", readyAt: NOW - 3 * DAY + 28 * DAY });
    expect(await saveReview("new", "coach", 5, "", NOW)).toEqual({ error: "wait" });
    // Two sessions that have ended count instead of the four weeks.
    await batch([
      {
        sql: "INSERT INTO coach_slots (id, coach_id, start_at, minutes, client_id, booked_at) VALUES ('s1', 'coach', ?, 60, 'new', ?)",
        args: [NOW - 2 * DAY, NOW - 3 * DAY],
      },
      {
        sql: "INSERT INTO coach_payments (id, coach_id, client_id, amount, currency, kind, at) VALUES ('p1', 'coach', 'new', 40, 'usd', 'session', ?)",
        args: [NOW - DAY],
      },
    ]);
    expect(await eligibility("coach", "new", NOW)).toEqual({ ok: true });
    // A session that hasn't ended yet doesn't count.
    await run("DELETE FROM coach_payments");
    await run("INSERT INTO coach_slots (id, coach_id, start_at, minutes, client_id, booked_at) VALUES ('s2', 'coach', ?, 60, 'new', ?)", [
      NOW + DAY,
      NOW,
    ]);
    expect((await eligibility("coach", "new", NOW)).ok).toBe(false);
  });

  it("never lets an under-18, a stranger or the coach themselves review", async () => {
    await profile("teen", "Tia Teen", 2011);
    await link("coach", "teen");
    expect(await eligibility("coach", "teen", NOW)).toEqual({ ok: false, why: "teen" });
    expect(await saveReview("teen", "coach", 5, "", NOW)).toEqual({ error: "teen" });
    await profile("stranger", "Sam Stranger");
    expect(await saveReview("stranger", "coach", 1, "", NOW)).toEqual({ error: "notClient" });
    expect(await eligibility("coach", "coach", NOW)).toEqual({ ok: false, why: "notClient" });
  });

  it("takes 1 to 5 whole stars and filters the words like Friends", async () => {
    await profile("ana", "Ana Lopez");
    await link("coach", "ana");
    expect(await saveReview("ana", "coach", 6, "", NOW)).toEqual({ error: "bad" });
    expect(await saveReview("ana", "coach", 4.5, "", NOW)).toEqual({ error: "bad" });
    expect(await saveReview("ana", "coach", 5, "see https://spam.example", NOW)).toEqual({ error: "link" });
    const r = await saveReview("ana", "coach", 5, "  Fixed my squat.  ", NOW);
    expect("review" in r && r.review).toMatchObject({ stars: 5, text: "Fixed my squat.", name: "Ana L." });
  });
});

describe("what others see", () => {
  async function three() {
    for (const [id, name, stars] of [
      ["a", "Ana Lopez", 5],
      ["b", "Ben", 4],
      ["c", "Cleo Park Smith", 4],
    ] as const) {
      await profile(id, name);
      await link("coach", id);
      await saveReview(id, "coach", stars, `Review from ${name}`, NOW + stars);
    }
  }

  it("hides the rating and reviews from others until there are three, but not from the coach", async () => {
    await profile("a", "Ana Lopez");
    await link("coach", "a");
    await saveReview("a", "coach", 2, "Meh", NOW);
    expect((await ratingOf("coach", NOW)).average).toBeNull();
    expect(await reviewsOf("coach", "someone")).toEqual([]);
    expect((await reviewsOf("coach", "coach")).map((r) => r.text)).toEqual(["Meh"]);
    await run("DELETE FROM coach_reviews");
    await three();
    const rating = await ratingOf("coach", NOW);
    expect(rating).toMatchObject({ count: 3, average: 4.3 });
    expect((await reviewsOf("coach", "someone")).map((r) => r.name)).toEqual(["Ana L.", "Ben", "Cleo S."]);
  });

  it("shows how many clients trained in the last two weeks once there are three clients", async () => {
    await three();
    await trained("a", 2);
    await trained("b", 20);
    expect((await ratingOf("coach", NOW)).outcome).toEqual({ clients: 3, active: 1 });
    await run("DELETE FROM coach_links WHERE client_id = 'c'");
    expect((await ratingOf("coach", NOW)).outcome).toBeNull();
  });

  it("lets the coach reply once, change it or clear it, and only to their own reviews", async () => {
    await three();
    const id = reviewId("coach", "a");
    expect(await replyToReview("coach", id, "Thanks Ana!", NOW)).toEqual({ reply: "Thanks Ana!" });
    expect(await replyToReview("coach", id, "Thanks again, Ana!", NOW)).toEqual({ reply: "Thanks again, Ana!" });
    expect((await reviewsOf("coach", "x")).find((r) => r.id === id)?.reply).toBe("Thanks again, Ana!");
    expect(await replyToReview("someone", id, "Not mine", NOW)).toEqual({ error: "gone" });
    expect(await replyToReview("coach", id, "", NOW)).toEqual({ reply: "" });
  });

  it("keeps a review after the client leaves; the client can still delete it", async () => {
    await three();
    await run("DELETE FROM coach_links WHERE client_id = 'a'");
    const mine = await mineFor("a", "coach", NOW);
    expect(mine.review?.stars).toBe(5);
    expect(mine.can).toEqual({ ok: false, why: "notClient" });
    await deleteReview("a", "coach");
    expect((await ratingOf("coach", NOW)).count).toBe(2);
  });

  it("uses a public id that gives away neither account", () => {
    const id = reviewId("coach", "a");
    expect(isReviewId(id)).toBe(true);
    expect(id).not.toContain("coach");
    expect(reviewId("coach", "b")).not.toBe(id);
    expect(shortName("  jordan  park ")).toBe("jordan P.");
    expect(shortName("")).toBe("");
  });
});

describe("reports", () => {
  it("hides a review after three people report it, and staff remove or dismiss it on the Reports tab", async () => {
    for (const id of ["a", "b", "c"]) {
      await profile(id, id.toUpperCase());
      await link("coach", id);
      await saveReview(id, "coach", 1, "Bad", NOW);
    }
    const target = reviewId("coach", "a");
    expect(await reportReview("a", target, "review", "spam", "", NOW)).toEqual({ error: "bad" });
    expect(await reportReview("x", target, "review", "cheating", "", NOW)).toEqual({ error: "bad" });
    for (const who of ["x", "y", "z"]) expect(await reportReview(who, target, "review", "abuse", "", NOW)).toEqual({ ok: true });
    expect((await ratingOf("coach", NOW)).count).toBe(2);
    expect((await reviewsOf("coach", "coach")).find((r) => r.id === target)?.hidden).toBe(true);
    const group = (await adminReports()).find((g) => g.kind === "review");
    expect(group).toMatchObject({ targetId: target, reports: 3, hidden: true });
    expect(group?.content).toContain("Bad");
    expect(await resolveReports("review", target, "dismiss")).toBe(true);
    expect((await ratingOf("coach", NOW)).count).toBe(3);
    await reportReview("x", target, "review", "hate", "", NOW + 1);
    expect(await resolveReports("review", target, "remove")).toBe(true);
    expect((await ratingOf("coach", NOW)).count).toBe(2);
  });

  it("reports the coach's reply on its own, and removing it keeps the review", async () => {
    for (const id of ["a", "b", "c"]) {
      await profile(id, id.toUpperCase());
      await link("coach", id);
      await saveReview(id, "coach", 5, "Great", NOW);
    }
    const id = reviewId("coach", "a");
    expect(await reportReview("x", id, "reply", "abuse", "", NOW)).toEqual({ error: "gone" });
    await replyToReview("coach", id, "Rude reply", NOW);
    expect(await reportReview("coach", id, "reply", "abuse", "", NOW)).toEqual({ error: "bad" });
    for (const who of ["a", "y", "z"]) await reportReview(who, id, "reply", "abuse", "", NOW);
    expect((await reviewsOf("coach", "x")).find((r) => r.id === id)?.reply).toBe("");
    expect(await resolveReports("review", `${id}.reply`, "remove")).toBe(true);
    const r = (await reviewsOf("coach", "coach")).find((x) => x.id === id);
    expect(r).toMatchObject({ text: "Great", reply: "" });
  });
});

describe("the trainer directory", () => {
  it("shows stars, reviews and structured data only once a coach has enough reviews", async () => {
    const reviews = [5, 4, 4].map((stars, i) => ({
      id: reviewId("coach", String(i)),
      stars,
      text: `Good ${i}`,
      name: "Ana L.",
      at: NOW,
      reply: i ? "" : "Thanks",
      replyAt: NOW,
    }));
    const person = {
      code: "ABCD2345",
      name: "Casey",
      role: "coach" as const,
      bio: "",
      gyms: [{ name: "Iron Works", citySlug: "toronto-on", slug: "iw" }],
    };
    const city = (
      rating: { count: number; average: number | null; outcome: { clients: number; active: number } | null },
      list = reviews,
    ) => ({
      city: "Toronto",
      region: "ON",
      people: [{ ...person, rating, reviews: list }],
    });
    for (const lang of MSG_LANGS) {
      const html = trainerCityHtml(lang, "toronto-on", city({ count: 3, average: 4.3, outcome: { clients: 4, active: 3 } }));
      expect(html, lang).toContain('"aggregateRating"');
      expect(html, lang).toContain('"reviewCount":3');
      expect(html, lang).toContain("Good 0");
      expect(html, lang).toContain("★★★★☆");
      expect(html, lang).not.toMatch(/\{\w+\}|undefined|NaN/);
      const fresh = trainerCityHtml(lang, "toronto-on", city({ count: 1, average: null, outcome: null }, []));
      expect(fresh, lang).not.toContain("aggregateRating");
      expect(fresh, lang).not.toContain("★");
    }
  });

  it("goes with the account when it's deleted", async () => {
    await profile("a", "Ana");
    await link("coach", "a");
    await saveReview("a", "coach", 5, "", NOW);
    await batch(coachCleanup("a"));
    expect(await query("SELECT * FROM coach_reviews")).toEqual([]);
  });
});

it("keeps its limits sane", () => {
  expect(REVIEW_LIMITS.shown).toBe(3);
  expect(REVIEW_LIMITS.days).toBe(28);
});
