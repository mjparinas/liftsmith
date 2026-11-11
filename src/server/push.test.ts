import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { query, resetDb } from "./db";
import { MAX_TOKENS, pushConfigured, setPushSender, type PushMessage } from "./push";
import { handle } from "./social";

const NOW = 1_800_000_000_000;
const call = (who: string, op: string, b: Record<string, unknown> = {}) => handle(who, { op, ...b }, NOW);
const TOKEN = (k: string) => `tok-${k}-${"x".repeat(30)}`;
let sent: PushMessage[] = [];

beforeEach(async () => {
  await resetDb();
  sent = [];
  setPushSender(async (m) => (sent.push(m), m.token.startsWith("tok-dead") ? "gone" : "ok"));
  await call("acc-a", "join", { handle: "alex", name: "Alex", agree: true });
  await call("acc-b", "join", { handle: "blair", name: "Blair", agree: true });
});
afterEach(() => setPushSender(null));

describe("Friends push notifications", () => {
  it("tells the other lifter in their phone's language, and opens Friends", async () => {
    await call("acc-a", "pushToken", { token: TOKEN("a"), platform: "android", lang: "fr" });
    await call("acc-b", "follow", { handle: "alex" });
    expect(sent).toMatchObject([{ token: TOKEN("a"), platform: "android", body: "Blair demande à te suivre.", route: "#/friends" }]);
    await call("acc-b", "pushToken", { token: TOKEN("b"), platform: "ios", lang: "en" });
    await call("acc-a", "answer", { handle: "blair", accept: true });
    expect(sent[1]).toMatchObject({ platform: "ios", body: "Alex accepted your follow request." });
  });

  it("leaves likes off until the lifter turns them on, and respects every switch", async () => {
    await call("acc-a", "pushToken", { token: TOKEN("a"), platform: "android", lang: "en" });
    await call("acc-a", "update", { open: true });
    await call("acc-b", "follow", { handle: "alex" });
    const id = (
      await call("acc-a", "post", {
        workoutId: "s1",
        at: NOW - 3_600_000,
        body: {
          seconds: 3000,
          sets: 12,
          volume: 4200,
          prs: 0,
          muscles: ["chest"],
          exercises: [{ id: "bench-press", name: "Bench", sets: 4, w: 100, r: 5 }],
        },
      })
    ).body.id as string;
    sent = [];
    await call("acc-b", "like", { id });
    expect(sent).toEqual([]);
    await call("acc-b", "comment", { id, text: "Strong!" });
    expect(sent.map((m) => m.body)).toEqual(["Blair commented: “Strong!”"]);
    await call("acc-a", "update", { push: { comments: false, likes: true } });
    sent = [];
    await call("acc-b", "comment", { id, text: "Again" });
    await call("acc-b", "like", { id, on: false });
    await call("acc-b", "like", { id });
    expect(sent.map((m) => m.kind)).toEqual(["like"]);
  });

  it("opens a sent workout straight to its preview", async () => {
    await call("acc-a", "follow", { handle: "blair" });
    await call("acc-b", "answer", { handle: "alex", accept: true });
    await call("acc-b", "follow", { handle: "alex" });
    await call("acc-a", "answer", { handle: "blair", accept: true });
    await call("acc-b", "pushToken", { token: TOKEN("b"), platform: "ios", lang: "en" });
    sent = [];
    const code = `r1~${Buffer.from("Leg day").toString("base64url")}~back-squat.4`;
    await call("acc-a", "send", { handle: "blair", code });
    expect(sent).toMatchObject([{ body: "Alex sent you a workout: Leg day", route: `#/routine/${code}` }]);
  });

  it("forgets dead tokens, keeps the newest few, and drops them on sign-out", async () => {
    await call("acc-a", "pushToken", { token: "tok-dead-aaaaaaaaaaaaaaaaaaaaaaaaaa", platform: "android", lang: "en" });
    await call("acc-b", "follow", { handle: "alex" });
    expect(await query("SELECT * FROM push_tokens")).toEqual([]);
    for (let i = 0; i < MAX_TOKENS + 2; i++)
      await handle("acc-a", { op: "pushToken", token: TOKEN(`p${i}`), platform: "android", lang: "en" }, NOW + i);
    expect(await query("SELECT * FROM push_tokens WHERE account_id = 'acc-a'")).toHaveLength(MAX_TOKENS);
    await call("acc-a", "pushOff", { token: TOKEN(`p${MAX_TOKENS + 1}`) });
    expect(await query("SELECT * FROM push_tokens WHERE account_id = 'acc-a'")).toHaveLength(MAX_TOKENS - 1);
    expect((await call("acc-a", "pushToken", { token: "short", platform: "android" })).body.error).toBe("token");
  });

  it("stays off until the keys are set", () => {
    expect(pushConfigured({})).toEqual({ fcm: false, apns: false });
    expect(pushConfigured({ FCM_SERVICE_ACCOUNT_JSON: "{}", APNS_KEY_P8: "k", APNS_KEY_ID: "i", APNS_TEAM_ID: "t" })).toEqual({
      fcm: true,
      apns: true,
    });
  });
});
