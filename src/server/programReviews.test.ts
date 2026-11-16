import { beforeEach, describe, expect, it } from "vitest";

import { dropProgram, getFree, saveProgram } from "./coachPrograms";
import { reportReview, resolveReview, reviewReport } from "./coachReviews";
import { batch, query, resetDb, run } from "./db";
import {
  deleteProgramReview,
  myProgramReview,
  PROGRAM_REVIEW_LIMITS,
  programEligibility,
  programRating,
  programReviewCleanup,
  programReviewsOf,
  replyToProgramReview,
  saveProgramReview,
} from "./programReviews";
import { saveToken, setPushSender, type PushMessage } from "./push";

const NOW = 1_800_000_000_000;
const DAY = 86_400_000;
const LATER = NOW + PROGRAM_REVIEW_LIMITS.days * DAY;
const YEAR = new Date(NOW).getFullYear();

const profile = (who: string, name: string, age: number) =>
  run("INSERT INTO sync_records (account_id, key, body, updated_at) VALUES (?, 'profile', ?, ?)", [
    who,
    JSON.stringify({ name, birthYear: YEAR - age }),
    NOW,
  ]);

const sent: PushMessage[] = [];
let id = "";

beforeEach(async () => {
  await resetDb();
  sent.length = 0;
  setPushSender(async (m) => {
    sent.push(m);
    return "ok";
  });
  await profile("coach", "Sam Coach", 30);
  for (const [who, name] of [
    ["a", "Ana Lopez"],
    ["b", "Ben Ito"],
    ["c", "Cleo Park"],
    ["d", "Dev Shah"],
  ])
    await profile(who!, name!, 25);
  await profile("teen", "Kid", 15);
  await saveToken("coach", "tok-coach-0123456789abcdef", "android", "en", NOW);
  const p = await saveProgram(
    "coach",
    {
      title: "Eight weeks to a bigger bench",
      about: "Three days a week.",
      level: "intermediate",
      goal: "strength",
      weeks: 8,
      days: [{ name: "Push", code: "r1~Push~bench-press.4~dip.3" }],
      price: 0,
    },
    NOW,
  );
  if ("error" in p) throw new Error(p.error);
  id = p.id;
  for (const who of ["a", "b", "c", "teen"]) await getFree(who, id, NOW);
});

describe("who can rate a program", () => {
  it("only someone who has had it two weeks, never its coach or a teen", async () => {
    expect(await programEligibility(id, "d", LATER)).toEqual({ ok: false, why: "notOwner" });
    expect(await programEligibility(id, "coach", LATER)).toEqual({ ok: false, why: "yours" });
    expect(await programEligibility(id, "teen", LATER)).toEqual({ ok: false, why: "teen" });
    expect(await programEligibility(id, "a", NOW + DAY)).toEqual({ ok: false, why: "wait", readyAt: LATER });
    expect(await programEligibility(id, "a", LATER)).toEqual({ ok: true });
    expect(await saveProgramReview("a", id, 5, "", NOW)).toEqual({ error: "wait" });
    expect(await saveProgramReview("a", id, 6, "", LATER)).toEqual({ error: "bad" });
    expect(await saveProgramReview("a", id, 4, "see www.example.com", LATER)).toEqual({ error: "link" });
  });
});

describe("what people see", () => {
  it("nothing until three reviews; the coach sees them all from the first and hears about each new one once", async () => {
    const r = await saveProgramReview("a", id, 5, "Bench went up 10 kg.", LATER);
    expect(r).toMatchObject({ review: { stars: 5, name: "Ana L.", text: "Bench went up 10 kg." } });
    await saveProgramReview("a", id, 4, "Bench went up 10 kg.", LATER + 1);
    expect(sent).toHaveLength(1);
    expect(sent[0]!.body).toContain("Ana Lopez");
    await saveProgramReview("b", id, 4, "", LATER);
    expect(await programRating(id)).toEqual({ count: 2, average: null, outcome: null });
    expect(await programReviewsOf(id, false)).toEqual([]);
    expect(await programReviewsOf(id, true)).toHaveLength(2);
    await saveProgramReview("c", id, 3, "", LATER);
    expect(await programRating(id)).toEqual({ count: 3, average: 3.7, outcome: null });
    expect((await programReviewsOf(id, false)).map((v) => v.stars).sort()).toEqual([3, 4, 4]);
    expect((await myProgramReview("a", id, LATER)).review?.stars).toBe(4);
    await deleteProgramReview("a", id);
    expect((await myProgramReview("a", id, LATER)).review).toBeNull();
  });

  it("the coach replies once to a review; nobody else can", async () => {
    const r = await saveProgramReview("a", id, 5, "", LATER);
    if ("error" in r) throw new Error(r.error);
    expect(await replyToProgramReview("b", r.review.id, "Thanks!", LATER)).toEqual({ error: "gone" });
    expect(await replyToProgramReview("coach", r.review.id, "Thanks, Ana!", LATER)).toEqual({ reply: "Thanks, Ana!" });
    expect((await programReviewsOf(id, true))[0]?.reply).toBe("Thanks, Ana!");
  });
});

describe("reports and deleting", () => {
  it("go through the coach review path: three reports hide it, and staff can remove it", async () => {
    const r = await saveProgramReview("a", id, 1, "Terrible", LATER);
    if ("error" in r) throw new Error(r.error);
    expect(await reportReview("a", r.review.id, "review", "spam", "", LATER)).toEqual({ error: "bad" });
    for (const who of ["b", "c", "d"]) expect(await reportReview(who, r.review.id, "review", "spam", "", LATER)).toEqual({ ok: true });
    expect((await reviewReport(r.review.id))?.content).toContain("Eight weeks to a bigger bench");
    expect((await reviewReport(r.review.id))?.hidden).toBe(true);
    expect((await programReviewsOf(id, true))[0]?.hidden).toBe(true);
    expect(await resolveReview(r.review.id, "remove", "removed")).toBe(true);
    expect(await query("SELECT * FROM program_reviews")).toEqual([]);
  });

  it("deleting an account removes the reviews it wrote and the reviews of its programs", async () => {
    await saveProgramReview("a", id, 5, "", LATER);
    await batch(programReviewCleanup("coach"));
    expect(await query("SELECT * FROM program_reviews")).toEqual([]);
  });

  it("count only while the writer still has it, and paid ones say Verified purchase", async () => {
    for (const who of ["a", "b", "c"]) await saveProgramReview(who, id, 4, "", LATER);
    expect((await programRating(id)).count).toBe(3);
    expect((await programReviewsOf(id, false)).some((r) => r.verified)).toBe(false);

    // A paid copy (as the Stripe webhook records it) marks the review; a refund deletes the copy and the review stops counting.
    await run("UPDATE program_owners SET payment_id = 'pi_test' WHERE program_id = ? AND account_id = 'a'", [id]);
    const name = (await myProgramReview("a", id, LATER)).review?.name;
    expect((await programReviewsOf(id, false)).find((r) => r.name === name)?.verified).toBe(true);
    await run("DELETE FROM program_owners WHERE payment_id = 'pi_test'");
    expect(await programRating(id)).toMatchObject({ count: 2, average: null });
    expect(await programReviewsOf(id, true)).toHaveLength(2);

    // Dropping a free copy does the same; getting it back brings the review back.
    expect(await dropProgram("b", id)).toBe(true);
    expect((await programRating(id)).count).toBe(1);
    await getFree("b", id, LATER);
    expect((await programRating(id)).count).toBe(2);
  });
});
