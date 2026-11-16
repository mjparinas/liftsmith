import { beforeEach, describe, expect, it } from "vitest";

import { onboardUrl, refreshAccount, type PayConfig } from "./coachPay";
import { getFree, saveProgram } from "./coachPrograms";
import { resetDb, run } from "./db";
import {
  priceText,
  programEntries,
  programHtml,
  programIdOf,
  programIndexHtml,
  programSlug,
  programsPath,
  publicProgram,
  publicPrograms,
} from "./programPage";
import { PROGRAM_REVIEW_LIMITS, saveProgramReview } from "./programReviews";

const NOW = 1_800_000_000_000;
const LATER = NOW + PROGRAM_REVIEW_LIMITS.days * 86_400_000;
const YEAR = new Date(NOW).getFullYear();
const CFG: PayConfig = { secret: "sk_test_x", webhook: "whsec_test" };
const fake = async (url: string) => {
  const json = (x: unknown) => new Response(JSON.stringify(x), { status: 200 });
  if (url.endsWith("/accounts")) return json({ id: "acct_1", charges_enabled: true, default_currency: "cad" });
  if (url.endsWith("/account_links")) return json({ url: "https://connect.stripe.com/setup/x" });
  if (url.includes("/accounts/acct_1")) return json({ id: "acct_1", charges_enabled: true, default_currency: "cad" });
  return json({});
};

const profile = (who: string, name: string, age: number) =>
  run("INSERT INTO sync_records (account_id, key, body, updated_at) VALUES (?, 'profile', ?, ?)", [
    who,
    JSON.stringify({ name, birthYear: YEAR - age }),
    NOW,
  ]);

const program = (over: Record<string, unknown> = {}) => ({
  title: "Eight weeks to a bigger bench",
  about: "Three days a week, <b>built</b> around the bench.",
  level: "intermediate",
  goal: "strength",
  weeks: 8,
  days: [
    { name: "Push", code: "r1~Push~bench-press.4~dip.3" },
    { name: "Legs", code: "r1~Legs~back-squat.5" },
  ],
  price: 0,
  ...over,
});

const made = async (over: Record<string, unknown> = {}) => {
  const p = await saveProgram("coach", program(over), NOW);
  if ("error" in p) throw new Error(p.error);
  return p;
};

beforeEach(async () => {
  await resetDb();
  await profile("coach", "Sam Rivera", 30);
  for (const w of ["a", "b", "c"]) await profile(w, `Lifter ${w.toUpperCase()}`, 25);
  await onboardUrl(CFG, "coach", null, NOW, fake);
  await refreshAccount(CFG, "coach", NOW, fake);
});

describe("addresses", () => {
  it("are the title in plain letters and the id, and the id comes back out", () => {
    expect(programSlug("Élan: 8 Weeks to a Bigger Bench!")).toBe("elan-8-weeks-to-a-bigger-bench");
    expect(programSlug("ベンチ")).toBe("program");
    expect(programsPath({ id: "AbC123xYz456", title: "Bench block" })).toBe("/coach-programs/bench-block-AbC123xYz456/");
    expect(programIdOf("bench-block-AbC123xYz456")).toBe("AbC123xYz456");
    expect(programIdOf("AbC123xYz456")).toBe("AbC123xYz456");
    expect(programIdOf("bench-block")).toBeNull();
    expect(priceText("en", 29.99, "cad")).toBe("CA$29.99");
    expect(priceText("en", 30, "usd")).toBe("$30");
  });
});

describe("a program's page", () => {
  it("a free one lists each day's exercises; a paid one only how big each day is, with its price and Buy", async () => {
    const free = await made();
    const page = (await publicProgram(free.id, NOW))!;
    const html = programHtml("en", page.page, page.more);
    expect(html).toContain("Eight weeks to a bigger bench");
    expect(html).toContain("&#60;b&#62;built");
    expect(html).not.toContain("<b>built");
    expect(html).toContain("4 × ");
    expect(html).toContain("Get it free in Liftsmith");
    expect(html).toContain(`href="/app/#/program/${free.id}"`);
    expect(html).toContain('"@type":"Course"');
    expect(html).not.toContain("aggregateRating");
    expect(html).not.toContain("<script>");

    const paid = await made({ title: "Paid bench block", price: 29.99 });
    const p = (await publicProgram(paid.id, NOW))!;
    const paidHtml = programHtml("en", p.page, p.more);
    expect(paidHtml).toContain("Buy for CA$29.99");
    expect(paidHtml).not.toContain("4 × ");
    expect(paidHtml).toContain("exercises show in the app once you have the program");
    // More from the same coach links the other program.
    expect(paidHtml).toContain(programsPath(free));
  });

  it("shows the rating and reviews once three people who have it rate it", async () => {
    const p = await made();
    for (const w of ["a", "b", "c"]) await getFree(w, p.id, NOW);
    await saveProgramReview("a", p.id, 5, "Bench went up.", LATER);
    await saveProgramReview("b", p.id, 4, "", LATER);
    let page = (await publicProgram(p.id, LATER))!;
    expect(programHtml("en", page.page, page.more)).toContain("Not rated yet");
    await saveProgramReview("c", p.id, 4, "", LATER);
    page = (await publicProgram(p.id, LATER))!;
    const html = programHtml("en", page.page, page.more);
    expect(html).toContain('"aggregateRating":{"@type":"AggregateRating","ratingValue":4.3');
    expect(html).toContain("Bench went up.");
    expect(html).toContain("Lifter A.");
  });

  it("isn't public when unlisted or the coach is under 18", async () => {
    const hidden = await made({ listed: false });
    expect(await publicProgram(hidden.id, NOW)).toBeNull();
    const p = await made();
    await run("UPDATE sync_records SET body = ? WHERE account_id = 'coach'", [JSON.stringify({ name: "Sam", birthYear: YEAR - 16 })]);
    expect(await publicProgram(p.id, NOW)).toBeNull();
    expect(await publicPrograms(NOW)).toEqual([]);
  });
});

describe("the list", () => {
  it("groups programs by goal, says when there are none, and feeds the sitemap", async () => {
    expect(programIndexHtml("en", [])).toContain('<meta name="robots" content="noindex">');
    const a = await made();
    await made({ title: "Hypertrophy basics", goal: "muscle", price: 15 });
    const list = await publicPrograms(NOW);
    const html = programIndexHtml("fr", list);
    expect(html).toContain("Programmes d'entraînement de coachs");
    expect(html).toContain('id="goal-strength"');
    expect(html).toContain('id="goal-muscle"');
    expect(html).not.toContain("noindex");
    expect(programEntries(list).map((e) => e.path)).toEqual(expect.arrayContaining(["/coach-programs/", programsPath(a)]));
  });
});
