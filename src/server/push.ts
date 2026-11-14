// Friends push notifications (Friends stage 2, docs/decisions/friends.md). The phones register a push token with
// the account (`pushToken` in social.ts); when someone follows, asks to follow, accepts, likes, comments or sends a
// workout, the server tells the other lifter through Firebase Cloud Messaging (Android) or APNs (iOS), in the
// language their phone registered with, if they left that kind on in Friends settings. Reminders stay local
// (reminders-and-lifecycle-messages.md); only things the phone can't work out itself come through here.
//
// Off until the keys are set in Vercel: FCM_SERVICE_ACCOUNT_JSON (a Google service account allowed to send with
// Firebase Cloud Messaging, from the Firebase project for com.getliftsmith.app) and APNS_KEY_P8, APNS_KEY_ID and
// APNS_TEAM_ID (an APNs auth key; APNS_TOPIC defaults to the bundle id, APNS_SANDBOX=1 for development builds).
// Sending never holds up or fails the action that caused it: errors are swallowed and it gives up after 4 s.
import { createPrivateKey, createSign, sign as signWith, type KeyObject } from "node:crypto";
import { connect, type ClientHttp2Session } from "node:http2";

import { isMsgLang, type MsgLang } from "@/lib/messageText";
import * as text from "@/locales/text/push";

import { query, run } from "./db";

export type PushKind =
  | "follow"
  | "request"
  | "accept"
  | "like"
  | "comment"
  | "sent"
  | "challenge"
  | "tag"
  | "mention"
  | "reply"
  | "cheer"
  | "posted"
  | "best"
  | "checkin";
/** Which Friends settings switch covers each kind (the columns on social_profiles). */
export const PUSH_PREF: Record<
  PushKind,
  "push_follows" | "push_likes" | "push_comments" | "push_sent" | "push_cheers" | "push_posts" | "push_checkins"
> = {
  follow: "push_follows",
  request: "push_follows",
  accept: "push_follows",
  like: "push_likes",
  comment: "push_comments",
  sent: "push_sent",
  // A challenge invite is someone reaching out, like a follow; a tag is a reply to a workout, like a comment.
  challenge: "push_follows",
  tag: "push_comments",
  // Someone naming you in a comment, or answering yours, is part of a conversation: the comments switch.
  mention: "push_comments",
  reply: "push_comments",
  cheer: "push_cheers",
  // A workout from someone the lifter rang the bell for; "best" when it has a new best in it.
  posted: "push_posts",
  best: "push_posts",
  // A friend at the gym (Check in on Today).
  checkin: "push_checkins",
};
/** Tokens kept per account (phones and tablets); the oldest go first. */
export const MAX_TOKENS = 10;
const TIMEOUT_MS = 4000;

/** Coaching pushes (trainer mode, 2026-11-12): a chat message, and the coach's alerts about a client. */
export type CoachPushKind =
  | "coachMsg"
  | "coachTrained"
  | "coachQuiet"
  | "coachCheckin"
  | "coachCheckinDone"
  | "coachBooked"
  | "coachCancelled"
  | "coachPaid"
  | "coachFull"
  | "coachPain";

/** A real gym's pushes (gymExtras.ts): an announcement to the gym's club, and a problem report or trainer to its owner. */
export type GymPushKind = "gymNews" | "gymIssue" | "gymTrainer";

export interface PushMessage {
  token: string;
  platform: "android" | "ios";
  body: string;
  /** The app screen a tap opens (#/friends, #/routine/<code> or #/trainer…). */
  route: string;
  kind: PushKind | CoachPushKind | GymPushKind;
}
/** Sends one message; "gone" means the token is dead and is deleted. */
export type PushSender = (m: PushMessage) => Promise<"ok" | "gone" | "error">;

type Key = keyof typeof text.en;
const CATALOG: Record<MsgLang, Partial<Record<Key, unknown>>> = {
  en: text.en,
  es: text.es,
  fr: text.fr,
  de: text.de,
  it: text.it,
  ja: text.ja,
};
export const pushText = (lang: MsgLang, key: Key, vars: Record<string, string>) =>
  String(CATALOG[lang][key] ?? text.en[key]).replace(/\{(\w+)\}/g, (all, k: string) => vars[k] ?? all);

// --- Tokens ---

export async function saveToken(accountId: string, token: string, platform: string, lang: string, now = Date.now()): Promise<boolean> {
  if (!/^[\w:.-]{20,4096}$/.test(token) || (platform !== "android" && platform !== "ios")) return false;
  await run(
    `INSERT INTO push_tokens (token, account_id, platform, lang, updated_at) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT (token) DO UPDATE SET account_id = excluded.account_id, platform = excluded.platform, lang = excluded.lang, updated_at = excluded.updated_at`,
    [token, accountId, platform, isMsgLang(lang) ? lang : "en", now],
  );
  await run(
    `DELETE FROM push_tokens WHERE account_id = ?1 AND token NOT IN
       (SELECT token FROM push_tokens WHERE account_id = ?1 ORDER BY updated_at DESC LIMIT ${MAX_TOKENS})`,
    [accountId],
  );
  return true;
}

export async function dropToken(accountId: string, token: string): Promise<void> {
  await run("DELETE FROM push_tokens WHERE token = ? AND account_id = ?", [token, accountId]);
}

// --- Sending ---

let testSender: PushSender | null = null;
/** Tests replace the network with this. */
export function setPushSender(s: PushSender | null) {
  testSender = s;
}

export function pushConfigured(env: Record<string, string | undefined> = process.env): { fcm: boolean; apns: boolean } {
  return { fcm: !!env.FCM_SERVICE_ACCOUNT_JSON, apns: !!(env.APNS_KEY_P8 && env.APNS_KEY_ID && env.APNS_TEAM_ID) };
}

/**
 * Tells `to` that `from` did something, on every phone they registered, if they have that kind switched on.
 * Never throws and never takes more than a few seconds.
 */
export async function notify(to: string, from: string, kind: PushKind, vars: { text?: string; workout?: string; code?: string } = {}) {
  const sender = testSender ?? (pushConfigured().fcm || pushConfigured().apns ? networkSender : null);
  if (!sender || to === from) return;
  try {
    await Promise.race([send(sender, to, from, kind, vars), new Promise((r) => setTimeout(r, TIMEOUT_MS))]);
  } catch (e) {
    // a push is a nicety; the Activity list still has it
    console.warn(`push ${kind}: ${e instanceof Error ? e.message : "failed"}`);
  }
}

async function send(
  sender: PushSender,
  to: string,
  from: string,
  kind: PushKind,
  vars: { text?: string; workout?: string; code?: string },
) {
  const pref = PUSH_PREF[kind];
  const [who] = await query<{ name: string }>("SELECT name FROM social_profiles WHERE account_id = ?", [from]);
  const [prefs] = await query<Record<string, number>>(`SELECT ${pref} AS on_ FROM social_profiles WHERE account_id = ? AND suspended = 0`, [
    to,
  ]);
  if (!who || !prefs || !Number(prefs.on_)) return;
  const tokens = await query<{ token: string; platform: "android" | "ios"; lang: string }>(
    "SELECT token, platform, lang FROM push_tokens WHERE account_id = ?",
    [to],
  );
  // No ids or tokens in the logs: the kind and the outcome are enough to see where a push stopped.
  if (!tokens.length) console.info(`push ${kind}: recipient has no registered phone`);
  const name = String(who.name);
  // A cheer opens the workout it was for; everything else opens its routine or Friends.
  // A bell's push opens the poster's profile, where the workout is on top.
  const route =
    kind === "sent" && vars.code
      ? `#/routine/${vars.code}`
      : kind === "cheer"
        ? "#/workout"
        : (kind === "posted" || kind === "best") && vars.code
          ? `#/person/${vars.code}`
          : "#/friends";
  const short = (s = "") => (s.length > 120 ? `${s.slice(0, 119)}…` : s);
  await Promise.all(
    tokens.map(async (t) => {
      const lang: MsgLang = isMsgLang(t.lang) ? t.lang : "en";
      const body = pushText(lang, `push.${kind}`, { name, text: short(vars.text), workout: vars.workout ?? "" });
      const r = await sender({ token: String(t.token), platform: t.platform, body, route, kind });
      if (r !== "ok") console.warn(`push ${kind} to ${t.platform}: ${r}`);
      if (r === "gone") await run("DELETE FROM push_tokens WHERE token = ?", [t.token]);
    }),
  );
}

/**
 * A coaching push: a message from a coach or client, or an alert to a coach about a client. Coaching doesn't need
 * Friends, so the name is the sender's profile name and there's no Friends switch; the coach's alert switch is checked
 * by the caller (coach.ts). Like `notify`, it never throws and gives up after a few seconds.
 */
export async function notifyCoach(to: string, kind: CoachPushKind, vars: { name: string; text?: string }, route: string) {
  return notifyPlain(to, kind, vars, route);
}

/**
 * A push with no Friends switch behind it (the caller decided it's wanted): coaching, and a gym's own news to its club
 * or a report to its owner. `name` is the sender or the gym. Never throws and gives up after a few seconds.
 */
export async function notifyPlain(to: string, kind: CoachPushKind | GymPushKind, vars: { name: string; text?: string }, route: string) {
  const sender = testSender ?? (pushConfigured().fcm || pushConfigured().apns ? networkSender : null);
  if (!sender) return;
  try {
    await Promise.race([
      (async () => {
        const tokens = await query<{ token: string; platform: "android" | "ios"; lang: string }>(
          "SELECT token, platform, lang FROM push_tokens WHERE account_id = ?",
          [to],
        );
        const short = (s = "") => (s.length > 120 ? `${s.slice(0, 119)}…` : s);
        await Promise.all(
          tokens.map(async (t) => {
            const lang: MsgLang = isMsgLang(t.lang) ? t.lang : "en";
            const body = pushText(lang, `push.${kind}`, { name: vars.name || pushText(lang, "push.someone", {}), text: short(vars.text) });
            const r = await sender({ token: String(t.token), platform: t.platform, body, route, kind });
            if (r === "gone") await run("DELETE FROM push_tokens WHERE token = ?", [t.token]);
          }),
        );
      })(),
      new Promise((r) => setTimeout(r, TIMEOUT_MS)),
    ]);
  } catch (e) {
    console.warn(`push ${kind}: ${e instanceof Error ? e.message : "failed"}`);
  }
}

const networkSender: PushSender = (m) => (m.platform === "android" ? sendFcm(m) : sendApns(m));

// --- Firebase Cloud Messaging (HTTP v1) ---

let fcmAuth: { token: string; until: number } | null = null;

async function fcmAccessToken(sa: { client_email: string; private_key: string }): Promise<string> {
  if (fcmAuth && fcmAuth.until > Date.now() + 60_000) return fcmAuth.token;
  const now = Math.floor(Date.now() / 1000);
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const unsigned = `${b64({ alg: "RS256", typ: "JWT" })}.${b64({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  })}`;
  const jwt = `${unsigned}.${createSign("RSA-SHA256").update(unsigned).sign(sa.private_key, "base64url")}`;
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
  });
  const j = (await r.json()) as { access_token?: string; expires_in?: number };
  if (!j.access_token) {
    console.warn(`push: FCM sign-in refused (${r.status})`);
    throw new Error("FCM auth failed");
  }
  fcmAuth = { token: j.access_token, until: Date.now() + (j.expires_in ?? 3600) * 1000 };
  return j.access_token;
}

async function sendFcm(m: PushMessage): Promise<"ok" | "gone" | "error"> {
  const raw = process.env.FCM_SERVICE_ACCOUNT_JSON;
  if (!raw) return "error";
  const sa = JSON.parse(raw) as { project_id: string; client_email: string; private_key: string };
  const r = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
    method: "POST",
    headers: { Authorization: `Bearer ${await fcmAccessToken(sa)}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      message: {
        token: m.token,
        notification: { body: m.body },
        data: { route: m.route, kind: m.kind },
        android: {
          priority: "high",
          notification: {
            channel_id: "friends",
            tag: m.kind === "like" ? "friends-like" : m.kind === "cheer" ? "friends-cheer" : undefined,
          },
        },
      },
    }),
  });
  if (r.ok) return "ok";
  const err = (await r.json().catch(() => ({}))) as { error?: { status?: string; details?: { errorCode?: string }[] } };
  const code = err.error?.details?.find((d) => d.errorCode)?.errorCode ?? err.error?.status;
  if (code !== "UNREGISTERED" && r.status !== 404) console.warn(`push: FCM refused a message (${r.status} ${code ?? ""})`);
  return code === "UNREGISTERED" || r.status === 404 ? "gone" : "error";
}

// --- APNs (token auth, HTTP/2) ---

let apnsAuth: { token: string; until: number } | null = null;
let apnsKey: KeyObject | null = null;

function apnsJwt(env: NodeJS.ProcessEnv = process.env): string {
  if (apnsAuth && apnsAuth.until > Date.now()) return apnsAuth.token;
  apnsKey ??= createPrivateKey(String(env.APNS_KEY_P8).replace(/\\n/g, "\n"));
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const unsigned = `${b64({ alg: "ES256", kid: env.APNS_KEY_ID })}.${b64({ iss: env.APNS_TEAM_ID, iat: Math.floor(Date.now() / 1000) })}`;
  const sig = signWith("sha256", Buffer.from(unsigned), { key: apnsKey, dsaEncoding: "ieee-p1363" }).toString("base64url");
  // Apple wants a new token at most once every 20 minutes and refuses one older than an hour.
  apnsAuth = { token: `${unsigned}.${sig}`, until: Date.now() + 40 * 60_000 };
  return apnsAuth.token;
}

function sendApns(m: PushMessage): Promise<"ok" | "gone" | "error"> {
  const env = process.env;
  if (!pushConfigured(env).apns) return Promise.resolve("error");
  const host = env.APNS_SANDBOX === "1" ? "https://api.sandbox.push.apple.com" : "https://api.push.apple.com";
  return new Promise((resolve) => {
    let session: ClientHttp2Session;
    try {
      session = connect(host);
    } catch {
      resolve("error");
      return;
    }
    session.on("error", () => resolve("error"));
    const req = session.request({
      ":method": "POST",
      ":path": `/3/device/${m.token}`,
      authorization: `bearer ${apnsJwt(env)}`,
      "apns-topic": env.APNS_TOPIC || "com.getliftsmith.app",
      "apns-push-type": "alert",
      "content-type": "application/json",
    });
    let status = 0;
    let data = "";
    req.on("response", (h) => (status = Number(h[":status"])));
    req.on("data", (c: Buffer) => (data += c.toString()));
    req.on("end", () => {
      session.close();
      const reason = (() => {
        try {
          return (JSON.parse(data) as { reason?: string }).reason ?? "";
        } catch {
          return "";
        }
      })();
      resolve(status === 200 ? "ok" : status === 410 || reason === "BadDeviceToken" || reason === "Unregistered" ? "gone" : "error");
    });
    req.on("error", () => resolve("error"));
    req.end(
      JSON.stringify({
        aps: { alert: { body: m.body }, sound: "default", "thread-id": `friends-${m.kind}` },
        route: m.route,
        kind: m.kind,
      }),
    );
  });
}
