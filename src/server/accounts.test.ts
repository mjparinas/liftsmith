import { generateKeyPairSync, sign } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { accountInfo, appleClientSecret, deleteAccount, sessionOf, signInWith, startEmail, verifyEmail } from "./accounts";
import { query, resetDb } from "./db";
import { clearKeys, sha256hex, verifiedEmail, verifyIdToken, type Claims } from "./idToken";
import { checkSync, sync } from "./sync";

const NOW = 1_800_000_000_000;
const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const jwk = { ...publicKey.export({ format: "jwk" }), kid: "k1", alg: "RS256", use: "sig" };
const get = async () => ({ ok: true, json: async () => ({ keys: [jwk] }) });

function jwt(claims: Partial<Claims>, kid = "k1") {
  const enc = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const data = `${enc({ alg: "RS256", kid })}.${enc(claims)}`;
  return `${data}.${sign("RSA-SHA256", Buffer.from(data), privateKey).toString("base64url")}`;
}
const google = (over: Partial<Claims> = {}) => ({ iss: "https://accounts.google.com", aud: "web-id", sub: "g-1", exp: NOW / 1000 + 600, email: "Lifter@Example.com", email_verified: true, nonce: sha256hex("raw-nonce"), ...over });
const opts = { aud: new Set(["web-id"]), get, now: NOW };

beforeEach(async () => {
  await resetDb();
  clearKeys();
});

describe("checking ID tokens", () => {
  it("accepts a token signed by the provider's key for our client id and nonce", async () => {
    const r = await verifyIdToken("google", jwt(google()), "raw-nonce", opts);
    expect(r.ok).toBe(true);
    if (r.ok) expect(verifiedEmail(r.claims)).toBe("lifter@example.com");
  });

  it("refuses a wrong audience, issuer, nonce, expiry, key or signature", async () => {
    expect(await verifyIdToken("google", jwt(google({ aud: "someone-else" })), "raw-nonce", opts)).toMatchObject({ ok: false, error: "audience" });
    expect(await verifyIdToken("google", jwt(google({ iss: "https://evil.example" })), "raw-nonce", opts)).toMatchObject({ ok: false, error: "issuer" });
    expect(await verifyIdToken("google", jwt(google()), "other-nonce", opts)).toMatchObject({ ok: false, error: "nonce" });
    expect(await verifyIdToken("google", jwt(google({ exp: NOW / 1000 - 3600 })), "raw-nonce", opts)).toMatchObject({ ok: false, error: "expired" });
    expect(await verifyIdToken("google", jwt(google(), "k2"), "raw-nonce", opts)).toMatchObject({ ok: false, error: "kid" });
    const t = jwt(google());
    const forged = t.slice(0, t.lastIndexOf(".")) + "." + jwt(google({ sub: "g-2" })).split(".")[2];
    expect(await verifyIdToken("google", forged, "raw-nonce", opts)).toMatchObject({ ok: false, error: "signature" });
    expect(await verifyIdToken("apple", jwt(google({ iss: "https://appleid.apple.com", aud: "com.getliftsmith.app" })), "raw-nonce", { ...opts, aud: new Set(["com.getliftsmith.app"]) })).toMatchObject({ ok: true });
  });

  it("only trusts a verified email", () => {
    expect(verifiedEmail(google({ email_verified: false }) as Claims)).toBeNull();
    expect(verifiedEmail(google({ email_verified: "true" }) as Claims)).toBe("lifter@example.com");
  });
});

const verify = (sub: string, email: string | undefined, iss = "https://accounts.google.com") => async () => ({ ok: true as const, claims: { iss, aud: "x", sub, exp: 0, email, email_verified: true } });

describe("accounts", () => {
  it("signs in with Google, reuses the account next time, and joins Apple and email by verified email", async () => {
    const a = await signInWith("google", { idToken: "t", nonce: "n", platform: "android" }, { verify: verify("g-1", "lifter@example.com"), now: NOW });
    expect(a.code).toBe(200);
    const id = (a.body.account as { id: string }).id;
    const again = await signInWith("google", { idToken: "t", nonce: "n", platform: "web" }, { verify: verify("g-1", "lifter@example.com"), now: NOW });
    expect((again.body.account as { id: string }).id).toBe(id);
    const apple = await signInWith("apple", { idToken: "t", nonce: "n", platform: "ios" }, { verify: verify("a-1", "lifter@example.com", "https://appleid.apple.com"), now: NOW });
    expect((apple.body.account as { id: string }).id).toBe(id);
    const sent = await startEmail("lifter@example.com", null, NOW);
    const code = String(sent.body.devCode);
    expect(code).toMatch(/^\d{6}$/);
    const byEmail = await verifyEmail("lifter@example.com", code, "web", NOW);
    expect((byEmail.body.account as { id: string; providers: string[] }).providers).toEqual(["apple", "email", "google"]);
    expect((byEmail.body.account as { id: string }).id).toBe(id);
    // A different person gets their own account.
    const other = await signInWith("google", { idToken: "t", nonce: "n", platform: "web" }, { verify: verify("g-2", "someone@example.com"), now: NOW });
    expect((other.body.account as { id: string }).id).not.toBe(id);
  });

  it("refuses a bad token", async () => {
    const r = await signInWith("google", { idToken: "t", nonce: "n", platform: "web" }, { verify: async () => ({ ok: false, error: "nonce" }), now: NOW });
    expect(r.code).toBe(401);
  });

  it("email codes work once, expire, and lock after five wrong tries", async () => {
    const code = String((await startEmail("a@b.co", null, NOW)).body.devCode);
    expect((await verifyEmail("a@b.co", code, "web", NOW + 11 * 60_000)).code).toBe(401);
    const code2 = String((await startEmail("a@b.co", null, NOW)).body.devCode);
    expect((await verifyEmail("a@b.co", code2, "web", NOW)).code).toBe(200);
    expect((await verifyEmail("a@b.co", code2, "web", NOW)).code).toBe(401);
    const code3 = String((await startEmail("a@b.co", null, NOW)).body.devCode);
    const wrong = code3 === "000000" ? "111111" : "000000";
    for (let i = 0; i < 5; i++) await verifyEmail("a@b.co", wrong, "web", NOW);
    expect((await verifyEmail("a@b.co", code3, "web", NOW)).code).toBe(401);
    // Five codes a day per address.
    await startEmail("a@b.co", null, NOW);
    await startEmail("a@b.co", null, NOW);
    expect((await startEmail("a@b.co", null, NOW)).code).toBe(429);
    expect((await startEmail("a@b.co", null, NOW + 86_400_001)).code).toBe(200);
  });

  it("counts parallel guesses, so a burst can't get past five tries", async () => {
    const code = String((await startEmail("burst@b.co", null, NOW)).body.devCode);
    const wrong = code === "000000" ? "111111" : "000000";
    await Promise.all(Array.from({ length: 20 }, () => verifyEmail("burst@b.co", wrong, "web", NOW)));
    expect((await query<{ tries: number }>("SELECT tries FROM account_codes WHERE email = 'burst@b.co'"))[0].tries).toBe(5);
    expect((await verifyEmail("burst@b.co", code, "web", NOW)).code).toBe(401);
  });

  it("finds the session from a Bearer token, and deleting the account removes everything", async () => {
    const r = await signInWith("google", { idToken: "t", nonce: "n", platform: "web" }, { verify: verify("g-1", "x@y.co"), now: NOW });
    const token = String(r.body.token);
    const req = (t: string) => new Request("https://x/api/account/", { headers: { Authorization: `Bearer ${t}` } });
    const s = await sessionOf(req(token), NOW);
    expect(s).not.toBeNull();
    expect(await sessionOf(req("nope"), NOW)).toBeNull();
    // Only the hash is stored.
    expect((await query("SELECT * FROM account_sessions WHERE token_hash = ?", [token])).length).toBe(0);
    await sync(s!.accountId, s!.session, { cursor: 0, events: [{ id: "e1", at: 1, type: "set" } as never], deleted: [], records: [], first: true });
    let revoked = 0;
    await deleteAccount(s!.accountId, async () => revoked++);
    expect(await accountInfo(s!.accountId)).toBeNull();
    expect(await sessionOf(req(token), NOW)).toBeNull();
    expect((await query("SELECT * FROM sync_events")).length).toBe(0);
    expect(revoked).toBe(0);
  });

  it("makes an Apple client secret only when the key is configured", () => {
    expect(appleClientSecret("com.getliftsmith.app", {} as NodeJS.ProcessEnv)).toBeNull();
    const { privateKey: ec } = generateKeyPairSync("ec", { namedCurve: "P-256" });
    const pem = ec.export({ format: "pem", type: "pkcs8" }).toString();
    const s = appleClientSecret("com.getliftsmith.app", { APPLE_TEAM_ID: "T", APPLE_KEY_ID: "K", APPLE_PRIVATE_KEY: pem } as unknown as NodeJS.ProcessEnv, NOW)!;
    const [h, p, sig] = s.split(".");
    expect(JSON.parse(Buffer.from(h, "base64url").toString())).toEqual({ alg: "ES256", kid: "K" });
    expect(JSON.parse(Buffer.from(p, "base64url").toString())).toMatchObject({ iss: "T", sub: "com.getliftsmith.app", aud: "https://appleid.apple.com" });
    expect(Buffer.from(sig, "base64url").length).toBe(64);
  });
});

describe("sync", () => {
  const ev = (id: string, at = 1) => ({ id, at, type: "set" });
  const req = (over: Partial<Parameters<typeof sync>[2]> = {}) => ({ cursor: 0, events: [], deleted: [], records: [], first: false, ...over });

  it("checks the request", () => {
    expect(checkSync({ cursor: 0, events: [ev("a")] }).ok).toBe(true);
    expect(checkSync({ cursor: -1 }).ok).toBe(false);
    expect(checkSync({ events: [{ id: "a b", at: 1, type: "x" }] }).ok).toBe(false);
    expect(checkSync({ records: [{ key: "secret", value: {}, updatedAt: 1 }] }).ok).toBe(false);
    expect(checkSync({ records: [{ key: "profile", value: null, updatedAt: 1 }] }).ok).toBe(false);
  });

  it("pushes from one device, pulls on another, and never echoes a device's own events", async () => {
    const a = await sync("acc", "phone", req({ events: [ev("e1"), ev("e2")] as never }));
    expect(a.events).toEqual([]);
    const b = await sync("acc", "web", req());
    expect(b.events.map((e) => (e as { id: string }).id)).toEqual(["e1", "e2"]);
    // Pushing the same events again adds nothing, and the cursor means nothing comes twice.
    await sync("acc", "phone", req({ events: [ev("e1")] as never, cursor: a.cursor }));
    expect((await sync("acc", "web", req({ cursor: b.cursor }))).events).toEqual([]);
    // Another account sees none of it.
    expect((await sync("other", "x", req())).events).toEqual([]);
  });

  it("turns a delete into a tombstone that other devices get, and never brings the event back", async () => {
    const a = await sync("acc", "phone", req({ events: [ev("e1")] as never }));
    const w = await sync("acc", "web", req());
    await sync("acc", "phone", req({ cursor: a.cursor, deleted: ["e1"] }));
    const w2 = await sync("acc", "web", req({ cursor: w.cursor }));
    expect(w2.deleted).toEqual(["e1"]);
    await sync("acc", "tablet", req({ events: [ev("e1")] as never }));
    const fresh = await sync("acc", "new", req());
    expect(fresh.events).toEqual([]);
    expect(fresh.deleted).toEqual(["e1"]);
  });

  it("keeps the newer profile and gym, removes a gym, and lets the account's profile win on a device's first sync", async () => {
    await sync("acc", "phone", req({ records: [{ key: "profile", value: { name: "Phone" }, updatedAt: 10 }, { key: "gym:g1", value: { id: "g1" }, updatedAt: 10 }] }));
    // Older edits lose.
    let r = await sync("acc", "web", req({ records: [{ key: "profile", value: { name: "Old" }, updatedAt: 5 }] }));
    expect(r.records.find((x) => x.key === "profile")?.value).toEqual({ name: "Phone" });
    // A new device's fresh setup doesn't overwrite the account's profile, even if newer.
    r = await sync("acc", "tablet", req({ first: true, records: [{ key: "profile", value: { name: "Fresh" }, updatedAt: 99 }, { key: "gym:g2", value: { id: "g2" }, updatedAt: 99 }] }));
    expect(r.records.find((x) => x.key === "profile")?.value).toEqual({ name: "Phone" });
    expect(r.records.map((x) => x.key).sort()).toEqual(["gym:g1", "gym:g2", "profile"]);
    // Newer edits win; a removed gym stays removed.
    r = await sync("acc", "web", req({ records: [{ key: "profile", value: { name: "New" }, updatedAt: 100 }, { key: "gym:g1", value: null, updatedAt: 100 }] }));
    expect(r.records.find((x) => x.key === "profile")?.value).toEqual({ name: "New" });
    expect(r.records.find((x) => x.key === "gym:g1")?.value).toBeNull();
  });

  it("pages through a long history", async () => {
    const many = Array.from({ length: 700 }, (_, i) => ev(`e${i}`, i));
    await sync("acc", "phone", req({ events: many as never }));
    const p1 = await sync("acc", "web", req());
    expect(p1.events.length).toBe(500);
    expect(p1.more).toBe(true);
    const p2 = await sync("acc", "web", req({ cursor: p1.cursor }));
    expect(p2.events.length).toBe(200);
    expect(p2.more).toBe(false);
  });
});
