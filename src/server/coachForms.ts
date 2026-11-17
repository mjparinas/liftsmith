// Check-in forms and questionnaires (Melvin, 2026-11-13: "check-in forms and questionnaires"). A coach keeps a few
// forms (a weekly check-in, a new-client questionnaire, their own), sends one to a client now or every week, and
// the client answers on their phone. Each send keeps the questions as they were, so editing a form never changes
// what a client already answered. Answers go only to the coach who asked. Decision record:
// docs/decisions/trainer-mode.md "Check-ins".
import { randomBytes } from "node:crypto";

import { isAccountId, isClient, nameOf } from "./coach";
import { batch, query, rateLimit, run } from "./db";
import { notifyCoach } from "./push";
import { isMinor } from "./teams";

export const FORM_LIMITS = {
  forms: 10,
  questions: 12,
  title: 80,
  label: 160,
  text: 1000,
  /** Unanswered check-ins a client can have from one coach; the oldest goes when another arrives. */
  pending: 3,
  /** Check-ins a coach sees per client, newest first: about six months of weekly ones, for the trends. Photos are kept
   *  only for these. */
  history: 24,
  /** A repeating check-in goes out again this many days after the last one: every week, two weeks or four weeks. */
  everyDays: [7, 14, 28] as const,
  /** Photo questions on one form. */
  photos: 3,
  /** A photo answer, as a JPEG data URL (the app sends it shrunk to 1080 px, usually 100 to 250 kB). */
  photoChars: 700_000,
};
const DAY_MS = 86_400_000;
export type Every = (typeof FORM_LIMITS.everyDays)[number];
const isEvery = (x: unknown): x is Every => FORM_LIMITS.everyDays.includes(x as Every);

// 2026-11-17 (Melvin: "coach client check-in forms"): a body weight question, answered in kilograms from the client's
// latest weigh-in, and a photo question (never asked of a client under 18).
export type QuestionKind = "scale" | "number" | "yesno" | "text" | "weight" | "photo";
const KINDS = new Set<QuestionKind>(["scale", "number", "yesno", "text", "weight", "photo"]);
export interface Question {
  id: string;
  kind: QuestionKind;
  label: string;
}
export interface Form {
  id: string;
  title: string;
  questions: Question[];
  at: number;
}
export type Answer = number | boolean | string | null;
export interface Checkin {
  id: string;
  coachId: string;
  clientId: string;
  formId: string;
  title: string;
  questions: Question[];
  sentAt: number;
  answers: Record<string, Answer> | null;
  answeredAt: number | null;
}

const line = (x: unknown, max: number) =>
  typeof x === "string"
    ? x
        .replace(/[\u0000-\u001f\u007f]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, max)
        .trim()
    : "";

/** A form's title and questions, tidied: unknown kinds and empty labels dropped, ids made unique. */
export function cleanForm(x: unknown): { title: string; questions: Question[] } | null {
  const f = (x ?? {}) as { title?: unknown; questions?: unknown };
  const title = line(f.title, FORM_LIMITS.title);
  const raw = Array.isArray(f.questions) ? f.questions : [];
  const questions: Question[] = [];
  const ids = new Set<string>();
  for (const q of raw.slice(0, FORM_LIMITS.questions * 2)) {
    const r = (q ?? {}) as { id?: unknown; kind?: unknown; label?: unknown };
    const label = line(r.label, FORM_LIMITS.label);
    if (!label || !KINDS.has(r.kind as QuestionKind)) continue;
    if (r.kind === "photo" && questions.filter((x) => x.kind === "photo").length >= FORM_LIMITS.photos) continue;
    let id = typeof r.id === "string" && /^[\w-]{1,24}$/.test(r.id) ? r.id : `q${questions.length + 1}`;
    while (ids.has(id)) id = `${id}x`;
    ids.add(id);
    questions.push({ id, kind: r.kind as QuestionKind, label });
    if (questions.length === FORM_LIMITS.questions) break;
  }
  return title && questions.length ? { title, questions } : null;
}

/** Answers that fit their questions: scale 1 to 5, a number, yes or no, text, or a body weight in kilograms; anything
 *  else is left empty. A photo answer is true only when the photo itself reached the server (`photos`), whatever the
 *  answers say. */
export function cleanAnswers(questions: readonly Question[], x: unknown, photos: ReadonlySet<string> = new Set()): Record<string, Answer> {
  const a = (x ?? {}) as Record<string, unknown>;
  const out: Record<string, Answer> = {};
  for (const q of questions) {
    const v = a[q.id];
    if (q.kind === "photo") out[q.id] = photos.has(q.id) ? true : null;
    else if (q.kind === "weight")
      out[q.id] = typeof v === "number" && Number.isFinite(v) && v >= 20 && v <= 400 ? Math.round(v * 10) / 10 : null;
    else if (q.kind === "scale") out[q.id] = typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= 5 ? v : null;
    else if (q.kind === "number")
      out[q.id] = typeof v === "number" && Number.isFinite(v) && Math.abs(v) < 1e6 ? Math.round(v * 100) / 100 : null;
    else if (q.kind === "yesno") out[q.id] = typeof v === "boolean" ? v : null;
    else {
      const s =
        typeof v === "string"
          ? v
              .replace(/\r\n?/g, "\n")
              .replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, " ")
              .replace(/\n{3,}/g, "\n\n")
              .trim()
              .slice(0, FORM_LIMITS.text)
          : "";
      out[q.id] = s || null;
    }
  }
  return out;
}

const parse = <T>(s: unknown, fallback: T): T => {
  try {
    return (JSON.parse(String(s)) as T) ?? fallback;
  } catch {
    return fallback;
  }
};
type FormRow = { id: string; title: string; questions: string; updated_at: number };
const form = (r: FormRow): Form => ({
  id: String(r.id),
  title: String(r.title),
  questions: parse(r.questions, []),
  at: Number(r.updated_at),
});
type CheckinRow = {
  id: string;
  coach_id: string;
  client_id: string;
  form_id: string;
  title: string;
  questions: string;
  sent_at: number;
  answers: string | null;
  answered_at: number | null;
};
const checkin = (r: CheckinRow): Checkin => ({
  id: String(r.id),
  coachId: String(r.coach_id),
  clientId: String(r.client_id),
  formId: String(r.form_id),
  title: String(r.title),
  questions: parse(r.questions, []),
  sentAt: Number(r.sent_at),
  answers: r.answers == null ? null : parse(r.answers, {}),
  answeredAt: r.answered_at == null ? null : Number(r.answered_at),
});
const newId = () => randomBytes(9).toString("base64url");

export async function forms(coachId: string): Promise<Form[]> {
  return (await query<FormRow>("SELECT * FROM coach_forms WHERE coach_id = ? ORDER BY updated_at DESC", [coachId])).map(form);
}

/** Saves a new form, or changes one of the coach's own. */
export async function saveForm(coachId: string, x: unknown, now = Date.now(), id = newId()): Promise<Form | { error: "bad" | "full" }> {
  const f = cleanForm(x);
  if (!f) return { error: "bad" };
  const given = (x as { id?: unknown } | null)?.id;
  if (typeof given === "string" && given) {
    const [own] = await query<{ id: string }>("SELECT id FROM coach_forms WHERE id = ? AND coach_id = ?", [given, coachId]);
    if (!own) return { error: "bad" };
    await run("UPDATE coach_forms SET title = ?, questions = ?, updated_at = ? WHERE id = ?", [
      f.title,
      JSON.stringify(f.questions),
      now,
      given,
    ]);
    return { id: given, ...f, at: now };
  }
  const [n] = await query<{ n: number }>("SELECT COUNT(*) AS n FROM coach_forms WHERE coach_id = ?", [coachId]);
  if (Number(n?.n ?? 0) >= FORM_LIMITS.forms) return { error: "full" };
  await run("INSERT INTO coach_forms (id, coach_id, title, questions, updated_at) VALUES (?, ?, ?, ?, ?)", [
    id,
    coachId,
    f.title,
    JSON.stringify(f.questions),
    now,
  ]);
  return { id, ...f, at: now };
}

/** Deletes one of the coach's forms and stops it repeating. Check-ins already sent keep their own copy. */
export async function deleteForm(coachId: string, id: unknown): Promise<void> {
  if (typeof id !== "string") return;
  await batch([
    { sql: "DELETE FROM coach_forms WHERE id = ? AND coach_id = ?", args: [id, coachId] },
    { sql: "DELETE FROM coach_checkin_repeats WHERE form_id = ? AND coach_id = ?", args: [id, coachId] },
  ]);
}

export type SendError = "notClient" | "noForm" | "teen";

/** Sends one of the coach's forms to their client now, and tells the client's phones. */
export async function sendForm(
  coachId: string,
  clientId: unknown,
  formId: unknown,
  now = Date.now(),
  id = newId(),
): Promise<Checkin | { error: SendError }> {
  if (!isAccountId(clientId) || !(await isClient(coachId, clientId))) return { error: "notClient" };
  const [f] =
    typeof formId === "string" ? await query<FormRow>("SELECT * FROM coach_forms WHERE id = ? AND coach_id = ?", [formId, coachId]) : [];
  if (!f) return { error: "noForm" };
  return deliver(coachId, clientId, form(f), now, id);
}

/** A form as a client gets it: a client under 18 is never asked for a photo (teen-safe, like body composition). */
async function forClient(f: Form, clientId: string, now: number): Promise<Form | null> {
  if (!f.questions.some((q) => q.kind === "photo") || !(await isMinor(clientId, now))) return f;
  const questions = f.questions.filter((q) => q.kind !== "photo");
  return questions.length ? { ...f, questions } : null;
}

async function deliver(coachId: string, clientId: string, whole: Form, now: number, id: string): Promise<Checkin | { error: "teen" }> {
  const f = await forClient(whole, clientId, now);
  if (!f) return { error: "teen" };
  await batch([
    {
      sql: `INSERT INTO coach_checkins (id, coach_id, client_id, form_id, title, questions, sent_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [id, coachId, clientId, f.id, f.title, JSON.stringify(f.questions), now],
    },
    // Only the newest few unanswered ones stay waiting, so a client back from a break isn't faced with a pile.
    {
      sql: `DELETE FROM coach_checkins WHERE coach_id = ? AND client_id = ? AND answered_at IS NULL AND id NOT IN
              (SELECT id FROM coach_checkins WHERE coach_id = ? AND client_id = ? AND answered_at IS NULL ORDER BY sent_at DESC LIMIT ?)`,
      args: [coachId, clientId, coachId, clientId, FORM_LIMITS.pending],
    },
    prunePhotos(coachId, clientId),
  ]);
  await notifyCoach(clientId, "coachCheckin", { name: await nameOf(coachId), text: f.title }, `#/trainer/f.${id}`);
  return { id, coachId, clientId, formId: f.id, title: f.title, questions: f.questions, sentAt: now, answers: null, answeredAt: null };
}

export interface Repeat {
  formId: string;
  nextAt: number;
  /** Days between check-ins: 7, 14 or 28. */
  every: Every;
}

/** Turns a repeating check-in on (sending it now) every one, two or four weeks, or off, for one client. One repeating
 *  form per client. */
export async function setRepeat(
  coachId: string,
  clientId: unknown,
  formId: unknown,
  now = Date.now(),
  everyDays: unknown = 7,
): Promise<Repeat | null | { error: SendError }> {
  if (!isAccountId(clientId) || !(await isClient(coachId, clientId))) return { error: "notClient" };
  if (formId === null || formId === undefined || formId === "") {
    await run("DELETE FROM coach_checkin_repeats WHERE coach_id = ? AND client_id = ?", [coachId, clientId]);
    return null;
  }
  const every = isEvery(everyDays) ? everyDays : 7;
  const sent = await sendForm(coachId, clientId, formId, now);
  if ("error" in sent) return sent;
  const nextAt = now + every * DAY_MS;
  await run(
    `INSERT INTO coach_checkin_repeats (coach_id, client_id, form_id, next_at, every_days) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT (coach_id, client_id) DO UPDATE SET form_id = excluded.form_id, next_at = excluded.next_at, every_days = excluded.every_days`,
    [coachId, clientId, sent.formId, nextAt, every],
  );
  return { formId: sent.formId, nextAt, every };
}

const everyOf = (x: unknown): Every => (isEvery(Number(x)) ? (Number(x) as Every) : 7);

/** The daily job: sends every repeating check-in that's due. Returns how many went out. */
export async function sendDueCheckins(now = Date.now()): Promise<number> {
  const due = await query<{ coach_id: string; client_id: string; form_id: string; next_at: number; every_days: number }>(
    "SELECT * FROM coach_checkin_repeats WHERE next_at <= ?",
    [now],
  );
  let sent = 0;
  for (const r of due) {
    const coach = String(r.coach_id);
    const client = String(r.client_id);
    const [f] = await query<FormRow>("SELECT * FROM coach_forms WHERE id = ? AND coach_id = ?", [r.form_id, coach]);
    if (!f || !(await isClient(coach, client))) {
      await run("DELETE FROM coach_checkin_repeats WHERE coach_id = ? AND client_id = ?", [coach, client]);
      continue;
    }
    // Steps forward whole periods at a time, so a missed day doesn't shift the client's check-in day.
    const step = everyOf(r.every_days) * DAY_MS;
    let next = Number(r.next_at);
    while (next <= now) next += step;
    await run("UPDATE coach_checkin_repeats SET next_at = ? WHERE coach_id = ? AND client_id = ?", [next, coach, client]);
    if (!("error" in (await deliver(coach, client, form(f), now, newId())))) sent += 1;
  }
  return sent;
}

/** The client answers a check-in sent to them (once), and the coach's phones are told. */
export async function answerCheckin(
  clientId: string,
  id: unknown,
  answers: unknown,
  now = Date.now(),
): Promise<Checkin | { error: "unknown" | "answered" | "empty" }> {
  const [r] =
    typeof id === "string" ? await query<CheckinRow>("SELECT * FROM coach_checkins WHERE id = ? AND client_id = ?", [id, clientId]) : [];
  if (!r) return { error: "unknown" };
  if (r.answered_at != null) return { error: "answered" };
  const c = checkin(r);
  const clean = cleanAnswers(c.questions, answers, await photosOf(c.id));
  if (Object.values(clean).every((v) => v === null)) return { error: "empty" };
  // Answered once: a second phone sending the same check-in finds it already done.
  const done = await query<{ id: string }>(
    "UPDATE coach_checkins SET answers = ?, answered_at = ? WHERE id = ? AND answered_at IS NULL RETURNING id",
    [JSON.stringify(clean), now, c.id],
  );
  if (!done.length) return { error: "answered" };
  const prune = prunePhotos(c.coachId, clientId);
  await run(prune.sql, prune.args);
  await notifyCoach(c.coachId, "coachCheckinDone", { name: await nameOf(clientId) }, `#/trainer/c.${clientId}`);
  return { ...c, answers: clean, answeredAt: now };
}

/** The check-ins waiting for this client to answer, newest first. */
export async function pendingCheckins(clientId: string): Promise<Checkin[]> {
  return (
    await query<CheckinRow>("SELECT * FROM coach_checkins WHERE client_id = ? AND answered_at IS NULL ORDER BY sent_at DESC", [clientId])
  ).map(checkin);
}

/** One check-in of this client's, to fill in. */
export async function checkinFor(clientId: string, id: unknown): Promise<Checkin | null> {
  if (typeof id !== "string") return null;
  const [r] = await query<CheckinRow>("SELECT * FROM coach_checkins WHERE id = ? AND client_id = ?", [id, clientId]);
  return r ? checkin(r) : null;
}

/** What a coach sees for one client: the latest check-ins (answered or waiting), and the form that repeats. */
export async function checkinsOf(coachId: string, clientId: string): Promise<{ checkins: Checkin[]; repeat: Repeat | null }> {
  const rows = await query<CheckinRow>("SELECT * FROM coach_checkins WHERE coach_id = ? AND client_id = ? ORDER BY sent_at DESC LIMIT ?", [
    coachId,
    clientId,
    FORM_LIMITS.history,
  ]);
  const [rep] = await query<{ form_id: string; next_at: number; every_days: number }>(
    "SELECT * FROM coach_checkin_repeats WHERE coach_id = ? AND client_id = ?",
    [coachId, clientId],
  );
  return {
    checkins: rows.map(checkin),
    repeat: rep ? { formId: String(rep.form_id), nextAt: Number(rep.next_at), every: everyOf(rep.every_days) } : null,
  };
}

// ---------- Photo answers (2026-11-17) ----------
// A photo goes up on its own before the answers (it's too big for the coach route's 8 kB body), into its own table so
// listing check-ins never reads it. It is the client's choice, one photo per question, seen only by the coach who
// asked and the client. Kept only for the check-ins a coach can still see (FORM_LIMITS.history), and deleted with the
// check-in, on unlinking and with either account. Progress photos in the app stay on the phone (photos.ts); this is a
// separate copy the client picked to send.

/** The question ids of a check-in that have a photo on the server. */
async function photosOf(checkinId: string): Promise<Set<string>> {
  const rows = await query<{ question_id: string }>("SELECT question_id FROM coach_checkin_photos WHERE checkin_id = ?", [checkinId]);
  return new Set(rows.map((r) => String(r.question_id)));
}

/** Photos of a pair whose check-in is gone or older than what the coach can see. */
function prunePhotos(coachId: string, clientId: string): { sql: string; args: (string | number)[] } {
  return {
    sql: `DELETE FROM coach_checkin_photos WHERE coach_id = ? AND client_id = ? AND checkin_id NOT IN
            (SELECT id FROM coach_checkins WHERE coach_id = ? AND client_id = ? ORDER BY sent_at DESC LIMIT ?)`,
    args: [coachId, clientId, coachId, clientId, FORM_LIMITS.history],
  };
}

/** A JPEG data URL of a sensible size, or null. Checks the bytes start like a JPEG, not only the label. */
export function cleanPhoto(x: unknown): string | null {
  if (typeof x !== "string" || x.length > FORM_LIMITS.photoChars) return null;
  const m = /^data:image\/jpeg;base64,([A-Za-z0-9+/]+={0,2})$/.exec(x);
  if (!m?.[1] || m[1].length < 200) return null;
  const head = Buffer.from(m[1].slice(0, 8), "base64");
  return head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff ? x : null;
}

export type PhotoError = "unknown" | "answered" | "bad" | "teen" | "busy";

/** The client attaches a photo to a photo question of a check-in waiting for them. Sending again replaces it. */
export async function savePhoto(
  clientId: string,
  id: unknown,
  questionId: unknown,
  data: unknown,
  now = Date.now(),
): Promise<true | { error: PhotoError }> {
  const [r] =
    typeof id === "string" ? await query<CheckinRow>("SELECT * FROM coach_checkins WHERE id = ? AND client_id = ?", [id, clientId]) : [];
  if (!r) return { error: "unknown" };
  if (r.answered_at != null) return { error: "answered" };
  const c = checkin(r);
  if (!c.questions.some((q) => q.id === questionId && q.kind === "photo")) return { error: "bad" };
  const photo = cleanPhoto(data);
  if (!photo) return { error: "bad" };
  if (await isMinor(clientId, now)) return { error: "teen" };
  if (!(await rateLimit(`checkinPhoto:${clientId}`, 30, 3_600_000, now))) return { error: "busy" };
  await run(
    `INSERT INTO coach_checkin_photos (checkin_id, question_id, coach_id, client_id, data, at) VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT (checkin_id, question_id) DO UPDATE SET data = excluded.data, at = excluded.at`,
    [c.id, String(questionId), c.coachId, clientId, photo, now],
  );
  return true;
}

/** One photo answer, for the coach who sent the check-in or the client who answered it. */
export async function photoFor(accountId: string, id: unknown, questionId: unknown): Promise<string | null> {
  if (typeof id !== "string" || typeof questionId !== "string") return null;
  const [r] = await query<{ data: string }>(
    "SELECT data FROM coach_checkin_photos WHERE checkin_id = ? AND question_id = ? AND (coach_id = ? OR client_id = ?)",
    [id, questionId, accountId, accountId],
  );
  return r ? String(r.data) : null;
}
