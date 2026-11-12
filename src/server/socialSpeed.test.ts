// How long the Friends tab takes to open, counted in database round trips (thread "Speed up the Friends screen",
// 2026-11-12). Every call to the database is a network hop from Vercel to Turso in production, so the count of hops
// one after another is what the lifter waits for. The client here adds a fixed delay to each hop and counts them.
import { createHash } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const HOP_MS = 25;
const stats = { hops: 0, delay: HOP_MS };

vi.mock("@libsql/client", async (orig) => {
  const real = await orig<typeof import("@libsql/client")>();
  return {
    ...real,
    createClient: (cfg: Parameters<typeof real.createClient>[0]) => {
      const c = real.createClient(cfg);
      const hop = async <T>(f: () => Promise<T>) => {
        stats.hops++;
        await new Promise((r) => setTimeout(r, stats.delay));
        return f();
      };
      return new Proxy(c, {
        get(target, prop, recv) {
          if (prop === "execute") return (s: Parameters<typeof c.execute>[0]) => hop(() => target.execute(s));
          if (prop === "batch")
            return (s: Parameters<typeof c.batch>[0], m?: Parameters<typeof c.batch>[1]) => hop(() => target.batch(s, m));
          const v = Reflect.get(target, prop, recv) as unknown;
          return typeof v === "function" ? (v as (...a: unknown[]) => unknown).bind(target) : v;
        },
      });
    },
  };
});

const { query, resetDb, run } = await import("./db");
const { handle } = await import("./social");
const { POST } = await import("@/app/api/social/route.api");

const NOW = Date.now();
const token = (who: string) => `tok-${who}`;
const post = (who: string, body: Record<string, unknown>) =>
  POST(
    new Request("https://x/api/social/", {
      method: "POST",
      headers: { Authorization: `Bearer ${token(who)}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );

/** Wall time and hops for `f`. */
async function measure(f: () => Promise<unknown>): Promise<{ ms: number; hops: number }> {
  const h = stats.hops;
  const t = performance.now();
  await f();
  return { ms: Math.round(performance.now() - t), hops: stats.hops - h };
}

const report: string[] = [];

beforeAll(async () => {
  await resetDb();
  const cold = await measure(() => query("SELECT 1"));
  report.push(`first query on a cold server: ${cold.hops} hops, ${cold.ms} ms`);
  stats.delay = 0;
  // A lifter who follows ten friends, each with a few workouts, likes and a training partner.
  for (const who of ["me", ...Array.from({ length: 10 }, (_, i) => `f${i}`)]) {
    await run(
      "INSERT INTO account_sessions (token_hash, account_id, created_at, expires_at, last_seen, platform) VALUES (?, ?, ?, ?, ?, 'web')",
      [createHash("sha256").update(token(who)).digest("hex"), who, NOW, NOW + 86_400_000 * 365, NOW],
    );
    await handle(who, { op: "join", handle: who === "me" ? "melvin" : `friend_${who}`, name: who, agree: true, open: true }, NOW);
  }
  for (let i = 0; i < 10; i++) {
    await handle("me", { op: "follow", handle: `friend_f${i}` }, NOW);
    await handle(`f${i}`, { op: "follow", handle: "melvin" }, NOW);
    for (let k = 0; k < 3; k++)
      await handle(
        `f${i}`,
        {
          op: "post",
          workoutId: `w${i}-${k}`,
          at: NOW - (i * 3 + k) * 3_600_000,
          body: {
            seconds: 3000,
            sets: 12,
            volume: 4200,
            prs: 0,
            muscles: ["chest"],
            exercises: [{ id: "bench", name: "Bench", sets: 4, w: 100, r: 5 }],
          },
        },
        NOW,
      );
  }
  stats.delay = HOP_MS;
}, 60_000);

afterAll(() => {
  if (process.env.SPEED_REPORT) process.stdout.write(`\nFriends tab speed (${HOP_MS} ms per database hop):\n  ${report.join("\n  ")}\n`);
});

describe("opening the Friends tab", () => {
  it("measures each request", async () => {
    for (const op of ["me", "feed", "training", "suggest", "home"]) {
      const m = await measure(async () => {
        const r = await post("me", { op });
        expect(r.status, op).toBe(200);
      });
      report.push(`${op}: ${m.hops} hops, ${m.ms} ms`);
    }
  });

  it("measures what the tab waits for", async () => {
    // Before: "me", and once it answered, the feed, training now and suggestions side by side.
    const before = await measure(async () => {
      await post("me", { op: "me" });
      await Promise.all([post("me", { op: "feed" }), post("me", { op: "training" }), post("me", { op: "suggest" })]);
    });
    report.push(`old open (me, then feed + training + suggest): ${before.ms} ms over ${before.hops} hops`);
    const after = await measure(() => post("me", { op: "home" }));
    report.push(`new open (one "home" request): ${after.ms} ms over ${after.hops} hops`);
    // One request of a few hops in a row, where the old way waited for `me`, then three more requests.
    expect(after.hops).toBeLessThan(before.hops);
    expect(after.ms).toBeLessThan(before.ms);
  });
});
