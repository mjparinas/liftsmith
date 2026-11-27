import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { query, resetDb } from "./db";
import {
  addMade,
  changePins,
  connectUrl,
  finishConnect,
  madeExercises,
  okUpload,
  pickNext,
  pinQueue,
  pinterestStatus,
  postDue,
  postNow,
  queuedCount,
  savePinSettings,
  setPinterestFetch,
  setPinWait,
  toMake,
  type PinRow,
} from "./pins";
import { getSetting } from "./settings";

const NOW = 1_800_000_000_000;
const HOUR = 3_600_000;
const BLOB = "https://abc123.public.blob.vercel-storage.com";
const files = (id: string, stamp = "s1") => ({
  image: `${BLOB}/pins/${id}/${stamp}-pin.jpg`,
  video: `${BLOB}/pins/${id}/${stamp}-clip.mp4`,
  cover: `${BLOB}/pins/${id}/${stamp}-cover.jpg`,
});

/** A stand-in Pinterest: records calls, makes boards and pins, and processes a video after `videoLooks` looks. */
function fakePinterest(opts: { videoLooks?: number; pinStatus?: number; expiresIn?: number } = {}) {
  const calls: { method: string; url: string; body: unknown }[] = [];
  const boards: { id: string; name: string }[] = [];
  let looks = 0;
  let n = 0;
  const reply = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
  setPinterestFetch(async (url, init) => {
    const method = init?.method ?? "GET";
    let body: unknown = init?.body;
    if (typeof body === "string" && body.startsWith("{")) body = JSON.parse(body);
    if (body instanceof URLSearchParams) body = Object.fromEntries(body);
    calls.push({ method, url, body });
    if (url.endsWith("/oauth/token"))
      return reply(200, {
        access_token: `access-${++n}`,
        refresh_token: "refresh-1",
        expires_in: n === 1 && opts.expiresIn ? opts.expiresIn : 2_592_000,
      });
    if (url.endsWith("/user_account")) return reply(200, { username: "liftsmith" });
    if (url.includes("/boards") && method === "GET") return reply(200, { items: boards });
    if (url.endsWith("/boards")) {
      const b = { id: `b${boards.length + 1}`, name: (body as { name: string }).name };
      boards.push(b);
      return reply(201, b);
    }
    if (url.endsWith("/pins")) return opts.pinStatus ? reply(opts.pinStatus, { message: "Busy" }) : reply(201, { id: `p${++n}` });
    if (url.endsWith("/media") && method === "POST")
      return reply(201, { media_id: "m1", upload_url: "https://upload.example/s3", upload_parameters: { key: "k", policy: "x" } });
    if (url.includes("/media/m1")) return reply(200, { status: ++looks > (opts.videoLooks ?? 1) ? "succeeded" : "registered" });
    if (url.startsWith(BLOB)) return new Response(new Uint8Array([0, 0, 0, 24]), { status: 200 });
    if (url === "https://upload.example/s3") return new Response(null, { status: 204 });
    return reply(404, { message: `No fake for ${method} ${url}` });
  });
  return { calls, boards };
}

async function connect(at = NOW) {
  const url = new URL((await connectUrl(at))!);
  expect(await finishConnect("code", url.searchParams.get("state")!, at)).toBeNull();
}

beforeEach(async () => {
  await resetDb();
  process.env.PINTEREST_APP_ID = "app";
  process.env.PINTEREST_APP_SECRET = "app-secret";
  setPinWait(async () => {});
});
afterEach(() => {
  setPinterestFetch(null);
  setPinWait(null);
  delete process.env.PINTEREST_APP_ID;
  delete process.env.PINTEREST_APP_SECRET;
});

describe("what the pin maker may upload", () => {
  it("takes only our public Blob store, under the exercise's own folder", () => {
    expect(okUpload(files("bench-press").image, "bench-press", "jpg")).toBe(true);
    expect(okUpload(files("bench-press").video, "bench-press", "mp4")).toBe(true);
    expect(okUpload(files("deadlift").image, "bench-press", "jpg")).toBe(false);
    expect(okUpload(files("bench-press").image, "bench-press", "mp4")).toBe(false);
    expect(okUpload("https://evil.example/pins/bench-press/a-pin.jpg", "bench-press", "jpg")).toBe(false);
    expect(okUpload(`${files("bench-press").image}?x=1`, "bench-press", "jpg")).toBe(false);
    expect(okUpload(42, "bench-press", "jpg")).toBe(false);
  });

  it("stops making pins once three weeks are waiting", () => {
    expect(toMake(10, 0, 2)).toBe(10);
    expect(toMake(10, 36, 2)).toBe(3);
    expect(toMake(10, 50, 2)).toBe(0);
  });
});

describe("the queue", () => {
  it("adds a pin and a clip per exercise, waiting for a look", async () => {
    expect(await addMade("bench-press", files("bench-press"), NOW)).toEqual({ ok: true, replaced: [] });
    const q = await pinQueue();
    expect(q.pins.map((p) => [p.id, p.status, p.board])).toEqual([
      ["bench-press:image", "review", "Chest"],
      ["bench-press:video", "review", "Chest"],
    ]);
    expect(q.pins[1]!.cover_url).toBe(files("bench-press").cover);
    expect(await madeExercises()).toEqual(["bench-press"]);
    expect(await queuedCount()).toBe(2);
  });

  it("refuses files from elsewhere and unknown exercises", async () => {
    expect(await addMade("bench-press", { ...files("bench-press"), video: "https://x.example/a.mp4" })).toEqual({
      ok: false,
      error: "files",
    });
    expect(await addMade("nope", files("nope"))).toEqual({ ok: false, error: "exercise" });
  });

  it("goes straight to the queue when review is off", async () => {
    await savePinSettings({ review: false });
    await addMade("bench-press", files("bench-press"), NOW);
    expect((await pinQueue()).counts.ready).toBe(2);
  });

  it("replaces pins not yet posted when an exercise is made again, and keeps posted ones", async () => {
    await addMade("bench-press", files("bench-press", "s1"), NOW);
    await query("UPDATE pins SET status = 'posted', posted_at = ? WHERE id = 'bench-press:image'", [NOW]);
    const r = await addMade("bench-press", files("bench-press", "s2"), NOW + 1);
    expect(r).toEqual({ ok: true, replaced: [files("bench-press", "s1").video, files("bench-press", "s1").cover] });
    const rows = await query<{ id: string; media_url: string; status: string }>("SELECT id, media_url, status FROM pins ORDER BY id");
    expect(rows.map((x) => [x.id, x.media_url, x.status])).toEqual([
      ["bench-press:image", files("bench-press", "s1").image, "posted"],
      ["bench-press:video", files("bench-press", "s2").video, "review"],
    ]);
  });

  it("approves, skips, edits and retries", async () => {
    await addMade("bench-press", files("bench-press"), NOW);
    await addMade("deadlift", files("deadlift"), NOW);
    expect(await changePins("skip", "deadlift:video", {}, NOW)).toBe(1);
    expect(await changePins("approveAll", null, {}, NOW)).toBe(3);
    expect(await changePins("edit", "bench-press:image", { title: "  Bench press cues ", description: "Three cues." }, NOW)).toBe(1);
    expect(await changePins("edit", "bench-press:image", { title: "", description: "x" }, NOW)).toBe(0);
    expect(await changePins("retry", "bench-press:image", {}, NOW)).toBe(0);
    const q = await pinQueue();
    expect(q.counts).toMatchObject({ ready: 3, skipped: 1, review: 0 });
    expect(q.pins.find((p) => p.id === "bench-press:image")!.title).toBe("Bench press cues");
  });
});

describe("taking turns", () => {
  const row = (id: string, kind: "image" | "video") => ({ id, kind }) as PinRow;
  const s = { perDay: 2, video: true, review: true, paused: false, sandbox: false };
  it("alternates images and clips, oldest first", () => {
    const ready = [row("a:image", "image"), row("b:image", "image"), row("a:video", "video")];
    expect(pickNext(ready, null, s)!.id).toBe("a:image");
    expect(pickNext(ready, "image", s)!.id).toBe("a:video");
    expect(pickNext(ready, "video", s)!.id).toBe("a:image");
  });
  it("leaves clips out in the sandbox or when video pins are off", () => {
    const ready = [row("a:video", "video"), row("b:image", "image")];
    expect(pickNext(ready, "image", { ...s, sandbox: true })!.id).toBe("b:image");
    expect(pickNext(ready, "image", { ...s, video: false })!.id).toBe("b:image");
    expect(pickNext([row("a:video", "video")], null, { ...s, video: false })).toBeNull();
  });
});

describe("Pinterest", () => {
  it("connects with a one-time state and keeps the tokens sealed", async () => {
    const fake = fakePinterest();
    expect(await finishConnect("code", "wrong", NOW)).toMatch(/run out/);
    const url = new URL((await connectUrl(NOW))!);
    expect(url.origin + url.pathname).toBe("https://www.pinterest.com/oauth/");
    expect(url.searchParams.get("scope")).toContain("pins:write");
    const state = url.searchParams.get("state")!;
    expect(await finishConnect("code", state, NOW)).toBeNull();
    expect(await finishConnect("code", state, NOW)).toMatch(/run out/);
    const kept = (await getSetting("pins.pinterest"))!;
    expect(kept).not.toContain("access-1");
    expect(kept).not.toContain("refresh-1");
    expect(await pinterestStatus()).toMatchObject({ connected: true, user: "liftsmith", sandbox: false });
    expect(fake.calls[0]!.url).toBe("https://api.pinterest.com/v5/oauth/token");
  });

  it("uses Pinterest's sandbox when the switch is on", async () => {
    const fake = fakePinterest();
    await savePinSettings({ sandbox: true });
    await connect();
    expect(fake.calls[0]!.url).toBe("https://api-sandbox.pinterest.com/v5/oauth/token");
    await addMade("bench-press", files("bench-press"), NOW);
    await expect(postNow("bench-press:video", NOW)).rejects.toThrow(/sandbox/);
  });

  it("does nothing until connected, or while paused", async () => {
    fakePinterest();
    expect(await postDue(NOW)).toEqual({ posted: 0, skipped: "not connected" });
    await connect();
    await savePinSettings({ paused: true });
    expect(await postDue(NOW)).toEqual({ posted: 0, skipped: "paused" });
  });

  it("posts at its pace: an image, then a clip, on a board made once, each run claimed once", async () => {
    const fake = fakePinterest({ videoLooks: 1 });
    await connect();
    await addMade("bench-press", files("bench-press"), NOW);
    expect(await postDue(NOW)).toEqual({ posted: 0, skipped: "queue empty" });
    await changePins("approveAll", null, {}, NOW);

    expect(await postDue(NOW + HOUR)).toEqual({ posted: 1 });
    expect(await postDue(NOW + HOUR + 60_000)).toEqual({ posted: 0, skipped: "already ran" });
    expect(await postDue(NOW + 3 * HOUR)).toEqual({ posted: 0, skipped: "not due" });
    const pin = fake.calls.find((c) => c.url.endsWith("/pins"))!.body as Record<string, unknown>;
    expect(pin).toMatchObject({ board_id: "b1", title: "Barbell bench press: 3 form cues", media_source: { source_type: "image_url" } });
    expect(String(pin.link)).toContain("utm_source=pinterest");

    expect(await postDue(NOW + 13 * HOUR)).toEqual({ posted: 1 });
    const video = fake.calls.filter((c) => c.url.endsWith("/pins"))[1]!.body as Record<string, unknown>;
    expect(video).toMatchObject({
      board_id: "b1",
      media_source: { source_type: "video_id", media_id: "m1", cover_image_url: files("bench-press").cover },
    });
    expect(fake.boards).toHaveLength(1);
    const q = await pinQueue();
    expect(q.counts.posted).toBe(2);
    expect(q.pins.every((p) => p.pin_id)).toBe(true);
  });

  it("leaves a slow video to the next run", async () => {
    fakePinterest({ videoLooks: 6 });
    await connect();
    await savePinSettings({ review: false });
    await addMade("bench-press", files("bench-press"), NOW);
    await changePins("skip", "bench-press:image", {}, NOW);
    expect(await postDue(NOW + HOUR)).toEqual({ posted: 0 });
    expect((await pinQueue()).counts.processing).toBe(1);
    expect(await postDue(NOW + 3 * HOUR)).toMatchObject({ posted: 0 });
    // Four looks in the first run, one in each run after: the seventh succeeds.
    for (let h = 5; h < 12 && (await pinQueue()).counts.processing; h += 2) await postDue(NOW + h * HOUR);
    expect((await pinQueue()).counts.posted).toBe(1);
  });

  it("puts a pin back after Pinterest is busy, and stops after three tries", async () => {
    fakePinterest({ pinStatus: 503 });
    await connect();
    await savePinSettings({ review: false });
    await addMade("bench-press", files("bench-press"), NOW);
    await changePins("skip", "bench-press:video", {}, NOW);
    for (const h of [1, 13, 25]) await postDue(NOW + h * HOUR);
    const pin = (await pinQueue()).pins.find((p) => p.id === "bench-press:image")!;
    expect(pin.status).toBe("failed");
    expect(pin.error).toBe("Busy");
    expect(await changePins("retry", pin.id, {}, NOW)).toBe(1);
  });

  it("refreshes the token before it runs out", async () => {
    const fake = fakePinterest({ expiresIn: 86_400 });
    // Tokens are checked against the real clock when a call is made.
    await connect(Date.now());
    await savePinSettings({ review: false });
    await addMade("bench-press", files("bench-press"), NOW);
    await postNow("bench-press:image", NOW);
    await postNow("bench-press:video", NOW);
    const tokenCalls = fake.calls.filter((c) => c.url.endsWith("/oauth/token"));
    expect(tokenCalls.map((c) => (c.body as Record<string, string>).grant_type)).toEqual(["authorization_code", "refresh_token"]);
  });
});
