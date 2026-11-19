import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { joinCoach, makeInvite } from "./coach";
import { batch, query, resetDb, run } from "./db";
import {
  addNote,
  blobConfigured,
  cleanMs,
  cleanNote,
  deleteNote,
  deleteVideo,
  dropPairVideos,
  dropVideosOf,
  finishVideo,
  openVideo,
  presignedPayload,
  presignVideo,
  sendState,
  setVideoStore,
  startVideo,
  VIDEO_LIMITS,
  videosOf,
  videosWaiting,
  type VideoStore,
} from "./formVideos";
import { saveToken, setPushSender, type PushMessage } from "./push";

const NOW = 1_800_000_000_000;
const MB = 1024 * 1024;

/** A store in memory: what was uploaded, what was removed, and the tokens handed out. */
function memoryStore(oidc = false) {
  const files = new Map<string, number>();
  const removed: string[] = [];
  const tokens: { path: string; bytes: number; types: string[] }[] = [];
  const presigned: { path: string; bytes: number; until: number }[] = [];
  const s: VideoStore = {
    uploadToken: async (path, bytes, types) => {
      if (oidc) return null;
      tokens.push({ path, bytes, types });
      return `token-for-${path}`;
    },
    presignUpload: async (path, bytes, _types, until) => {
      presigned.push({ path, bytes, until });
      return { delegationToken: `d-${path}`, signature: "sig", params: {} };
    },
    size: async (path) => files.get(path) ?? null,
    watchUrl: async (path, until) => `https://blob.test/${path}?until=${until}`,
    remove: async (paths) => {
      for (const p of paths) {
        files.delete(p);
        removed.push(p);
      }
    },
  };
  return { s, files, removed, tokens, presigned };
}

let mem = memoryStore();
const sent: PushMessage[] = [];
beforeEach(async () => {
  await resetDb();
  mem = memoryStore();
  setVideoStore(mem.s);
  sent.length = 0;
  setPushSender(async (m) => {
    sent.push(m);
    return "ok";
  });
  await makeInvite("coach", NOW, "CCCCDDDD");
  await joinCoach("client", "CCCCDDDD", NOW);
  await saveToken("client", "tok-client-0123456789abcdef", "android", "en", NOW);
  await saveToken("coach", "tok-coach-0123456789abcdef", "ios", "en", NOW);
});
afterEach(() => setVideoStore(null));

const SQUAT = { coach: "coach", lift: "Back squat", question: "Knees?", bytes: 12 * MB, secs: 24, type: "video/mp4" };

/** Starts a video, "uploads" it and finishes it. */
async function send(id: string, at = NOW, over: Partial<typeof SQUAT> = {}) {
  const s = await startVideo("client", { ...SQUAT, ...over }, at, id);
  if ("error" in s) throw new Error(s.error);
  mem.files.set(s.path, over.bytes ?? SQUAT.bytes);
  const v = await finishVideo("client", id, at);
  if ("error" in v) throw new Error(v.error);
  return v;
}

describe("sending", () => {
  it("hands a token for one path, size and the video types, and shows nothing until the upload finishes", async () => {
    const s = await startVideo("client", SQUAT, NOW, "v1");
    expect(s).toEqual({ id: "v1", path: "form-videos/v1.mp4", token: "token-for-form-videos/v1.mp4" });
    expect(mem.tokens[0]!.bytes).toBeLessThanOrEqual(VIDEO_LIMITS.bytes);
    expect(mem.tokens[0]!.bytes).toBeGreaterThanOrEqual(SQUAT.bytes);
    expect(mem.tokens[0]!.types).toEqual(["video/mp4", "video/webm", "video/quicktime"]);
    expect(await videosOf("coach")).toEqual([]);
    // Nothing reached the store yet.
    expect(await finishVideo("client", "v1", NOW)).toEqual({ error: "missing" });
    mem.files.set("form-videos/v1.mp4", SQUAT.bytes);
    const v = await finishVideo("client", "v1", NOW + 5);
    expect(v).toMatchObject({ id: "v1", lift: "Back squat", question: "Knees?", secs: 24, bytes: SQUAT.bytes });
    expect(sent.map((m) => [m.token.slice(0, 9), m.kind, m.route])).toEqual([["tok-coach", "coachVideo", "#/trainer/v.v1"]]);
    const [forCoach] = await videosOf("coach");
    expect(forCoach).toMatchObject({ id: "v1", unseen: true, newNotes: 0 });
    expect(await videosWaiting("coach")).toBe(1);
    expect(await videosWaiting("client")).toBe(0);
  });

  it("keeps WebM's codecs out of the type and names the file by it", async () => {
    const s = await startVideo("client", { ...SQUAT, type: "video/webm;codecs=vp9" }, NOW, "w1");
    expect(s).toMatchObject({ path: "form-videos/w1.webm" });
  });

  it("refuses anyone who isn't the coach's client, odd files, long or big clips, and too many a day", async () => {
    expect(await startVideo("stranger", SQUAT, NOW)).toEqual({ error: "notClient" });
    expect(await startVideo("client", { ...SQUAT, coach: "nobody" }, NOW)).toEqual({ error: "notClient" });
    expect(await startVideo("client", { ...SQUAT, type: "image/png" }, NOW)).toEqual({ error: "bad" });
    expect(await startVideo("client", { ...SQUAT, bytes: 0 }, NOW)).toEqual({ error: "bad" });
    expect(await startVideo("client", { ...SQUAT, bytes: VIDEO_LIMITS.bytes + 1 }, NOW)).toEqual({ error: "big" });
    expect(await startVideo("client", { ...SQUAT, secs: VIDEO_LIMITS.secs + 2 }, NOW)).toEqual({ error: "long" });
    expect(await startVideo("client", { ...SQUAT, secs: VIDEO_LIMITS.secs + 0.5 }, NOW, "ok")).toMatchObject({ id: "ok" });
    for (let i = 1; i < VIDEO_LIMITS.perDay; i++) expect(await startVideo("client", SQUAT, NOW, `r${i}`)).toMatchObject({ id: `r${i}` });
    expect(await startVideo("client", SQUAT, NOW)).toEqual({ error: "slow" });
  });

  it("throws away an upload bigger than the limit, file and all", async () => {
    const s = await startVideo("client", SQUAT, NOW, "huge");
    if ("error" in s) throw new Error(s.error);
    mem.files.set(s.path, VIDEO_LIMITS.bytes + 1);
    expect(await finishVideo("client", "huge", NOW)).toEqual({ error: "big" });
    expect(mem.removed).toEqual([s.path]);
    expect(await query("SELECT id FROM coach_videos")).toEqual([]);
  });

  it("is off when storage isn't set up", async () => {
    setVideoStore(null);
    const was = process.env.VIDEO_BLOB_READ_WRITE_TOKEN;
    delete process.env.VIDEO_BLOB_READ_WRITE_TOKEN;
    try {
      expect(await startVideo("client", SQUAT, NOW)).toEqual({ error: "off" });
      expect(await sendState("client", NOW)).toBe("off");
    } finally {
      if (was !== undefined) process.env.VIDEO_BLOB_READ_WRITE_TOKEN = was;
    }
  });

  it("never lets a client under 18 send one", async () => {
    const year = new Date(NOW).getUTCFullYear() - 16;
    await run("INSERT INTO sync_records (account_id, key, body, updated_at) VALUES (?, 'profile', ?, ?)", [
      "client",
      JSON.stringify({ birthYear: year }),
      NOW,
    ]);
    expect(await sendState("client", NOW)).toBe("teen");
    expect(await startVideo("client", SQUAT, NOW)).toEqual({ error: "teen" });
    expect(await sendState("coach", NOW)).toBe("ok");
  });

  it("keeps the newest few per coach and client, and deletes the oldest file with its notes", async () => {
    await send("first", NOW);
    await addNote("coach", { id: "first", ms: 1000, text: "Brace" }, NOW + 1, "n1");
    for (let i = 1; i <= VIDEO_LIMITS.keep; i++) {
      // A new day, so the daily limit doesn't stop the test.
      await batch([{ sql: "DELETE FROM rate_limits", args: [] }]);
      await send(`v${i}`, NOW + i * 1000);
    }
    const left = await videosOf("client");
    expect(left).toHaveLength(VIDEO_LIMITS.keep);
    expect(left.some((v) => v.id === "first")).toBe(false);
    expect(mem.removed).toContain("form-videos/first.mp4");
    expect(await query("SELECT id FROM coach_video_notes")).toEqual([]);
  });

  it("drops uploads started long ago and never finished", async () => {
    const s = await startVideo("client", SQUAT, NOW, "stale");
    if ("error" in s) throw new Error(s.error);
    await startVideo("client", SQUAT, NOW + 2 * VIDEO_LIMITS.uploadMs + 1, "fresh");
    expect((await query<{ id: string }>("SELECT id FROM coach_videos")).map((r) => r.id)).toEqual(["fresh"]);
  });
});

describe("watching and notes", () => {
  it("hands a link only to the coach and the client, and opening marks it seen", async () => {
    await send("v1");
    expect(await openVideo("stranger", "v1", NOW)).toBeNull();
    const o = await openVideo("coach", "v1", NOW + 10);
    expect(o?.url).toBe(`https://blob.test/form-videos/v1.mp4?until=${NOW + 10 + VIDEO_LIMITS.watchMs}`);
    expect(o?.video.unseen).toBe(true);
    expect(await videosWaiting("coach")).toBe(0);
  });

  it("pins notes inside the clip, tells the other side, and counts what's new for each", async () => {
    await send("v1");
    const n = await addNote("coach", { id: "v1", ms: 7_400, text: "  Knees cave\n\n\n\nhere " }, NOW + 10, "n1");
    expect(n).toEqual({ id: "n1", authorId: "coach", ms: 7_400, text: "Knees cave\n\nhere", at: NOW + 10 });
    expect(sent.at(-1)).toMatchObject({ kind: "coachVideoNote", route: "#/trainer/v.v1", token: "tok-client-0123456789abcdef" });
    // Past the end of a 24-second clip: kept at the end.
    expect(await addNote("coach", { id: "v1", ms: 99_000, text: "End" }, NOW + 11, "n2")).toMatchObject({ ms: 24_000 });
    expect(await videosWaiting("client")).toBe(2);
    expect(await videosWaiting("coach")).toBe(0);
    await openVideo("client", "v1", NOW + 20);
    expect(await videosWaiting("client")).toBe(0);
    await addNote("client", { id: "v1", ms: 7_000, text: "Like this?" }, NOW + 30, "n3");
    expect(await videosWaiting("coach")).toBe(1);
    const [v] = await videosOf("coach");
    expect(v!.notes.map((x) => x.id)).toEqual(["n3", "n1", "n2"]);
  });

  it("refuses empty notes, strangers' notes and more than the limit", async () => {
    await send("v1");
    expect(await addNote("coach", { id: "v1", ms: 0, text: "   " }, NOW)).toEqual({ error: "empty" });
    expect(await addNote("coach", { id: "v1", ms: -1, text: "x" }, NOW)).toEqual({ error: "empty" });
    expect(await addNote("stranger", { id: "v1", ms: 0, text: "x" }, NOW)).toEqual({ error: "unknown" });
    for (let i = 0; i < VIDEO_LIMITS.notes; i++) await addNote("coach", { id: "v1", ms: i, text: `n${i}` }, NOW, `n${i}`);
    expect(await addNote("coach", { id: "v1", ms: 0, text: "one more" }, NOW)).toEqual({ error: "full" });
  });

  it("lets only a note's author take it back", async () => {
    await send("v1");
    await addNote("coach", { id: "v1", ms: 0, text: "Brace" }, NOW, "n1");
    await deleteNote("client", "n1");
    expect(await query("SELECT id FROM coach_video_notes")).toHaveLength(1);
    await deleteNote("coach", "n1");
    expect(await query("SELECT id FROM coach_video_notes")).toEqual([]);
  });
});

describe("deleting", () => {
  it("either side deletes a video, file and notes", async () => {
    await send("v1");
    await addNote("coach", { id: "v1", ms: 0, text: "Brace" }, NOW, "n1");
    expect(await deleteVideo("stranger", "v1")).toBe(false);
    expect(await deleteVideo("coach", "v1")).toBe(true);
    expect(mem.removed).toEqual(["form-videos/v1.mp4"]);
    expect(await query("SELECT id FROM coach_video_notes")).toEqual([]);
  });

  it("ending coaching or deleting the account takes every video and file between them", async () => {
    await send("v1");
    await dropPairVideos("coach", "client");
    expect(mem.removed).toEqual(["form-videos/v1.mp4"]);
    await batch([{ sql: "DELETE FROM rate_limits", args: [] }]);
    await send("v2");
    await dropVideosOf("client");
    expect(await videosOf("coach")).toEqual([]);
    expect(mem.removed).toContain("form-videos/v2.mp4");
  });
});

describe("cleaning", () => {
  it("notes are tidied and moments kept inside the clip", () => {
    expect(cleanNote("  a\r\nb  ")).toBe("a\nb");
    expect(cleanNote(5)).toBe("");
    expect(cleanNote("x".repeat(900))).toHaveLength(VIDEO_LIMITS.note);
    expect(cleanMs(1234.6, 10)).toBe(1235);
    expect(cleanMs(20_000, 10)).toBe(10_000);
    expect(cleanMs(Number.NaN, 10)).toBeNull();
    expect(cleanMs("5", 10)).toBeNull();
  });
});

describe("a store connected through OIDC", () => {
  beforeEach(() => {
    mem = memoryStore(true);
    setVideoStore(mem.s);
  });

  it("hands back no token, and presigns only the client's own unfinished upload while its window lasts", async () => {
    const s = await startVideo("client", SQUAT, NOW, "v1");
    expect(s).toEqual({ id: "v1", path: "form-videos/v1.mp4", token: null });
    expect(await presignVideo("client", "form-videos/v1.mp4", NOW + 60_000)).toEqual({
      delegationToken: "d-form-videos/v1.mp4",
      signature: "sig",
      params: {},
    });
    expect(mem.presigned[0]).toMatchObject({ path: "form-videos/v1.mp4", until: NOW + VIDEO_LIMITS.uploadMs });
    expect(mem.presigned[0]!.bytes).toBeGreaterThanOrEqual(SQUAT.bytes);
    expect(mem.presigned[0]!.bytes).toBeLessThanOrEqual(VIDEO_LIMITS.bytes);
    // Someone else, another path, after the window, or once it's finished: nothing.
    expect(await presignVideo("coach", "form-videos/v1.mp4", NOW)).toBeNull();
    expect(await presignVideo("client", "form-videos/other.mp4", NOW)).toBeNull();
    expect(await presignVideo("client", 42, NOW)).toBeNull();
    expect(await presignVideo("client", "form-videos/v1.mp4", NOW + VIDEO_LIMITS.uploadMs)).toBeNull();
    mem.files.set("form-videos/v1.mp4", SQUAT.bytes);
    await finishVideo("client", "v1", NOW + 60_000);
    expect(await presignVideo("client", "form-videos/v1.mp4", NOW + 120_000)).toBeNull();
    expect(mem.presigned).toHaveLength(1);
  });

  it("turns a presigned link back into the payload the Blob client sends", () => {
    const link =
      "https://vercel.com/api/blob/?pathname=form-videos%2Fv1.mp4&vercel-blob-valid-until=5&vercel-blob-maximum-size-in-bytes=9" +
      "&vercel-blob-delegation=DEL.SIG&vercel-blob-signature=abc";
    expect(presignedPayload(link)).toEqual({
      delegationToken: "DEL.SIG",
      signature: "abc",
      params: { "vercel-blob-valid-until": "5", "vercel-blob-maximum-size-in-bytes": "9" },
    });
  });

  it("counts the store id alone as set up", () => {
    expect(blobConfigured({ VIDEO_BLOB_STORE_ID: "store_x" } as unknown as NodeJS.ProcessEnv)).toBe(true);
    expect(blobConfigured({} as unknown as NodeJS.ProcessEnv)).toBe(false);
  });
});
