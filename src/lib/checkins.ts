// Check-in forms and questionnaires on the phone (Melvin, 2026-11-13; server: src/server/coachForms.ts). A coach's
// forms, the templates new ones start from, the calls, and what a coach should look at in a client's answers.
import { api, AuthError, readAccount } from "./auth";
import { t } from "./i18n";
import type { Unit } from "./types";
import { fmtBodyweight, fmtNum } from "./units";

// 2026-11-17 (Melvin: "coach client check-in forms"): body weight (in kilograms, filled in from the client's latest
// weigh-in) and photos (never asked of a client under 18) join the question kinds, a form repeats every one, two or
// four weeks, and the coach sees each question's trend across the answers.
export type QuestionKind = "scale" | "number" | "yesno" | "text" | "weight" | "photo";
export const KINDS: QuestionKind[] = ["scale", "number", "yesno", "text", "weight", "photo"];
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
export type Every = 7 | 14 | 28;
export const EVERY: Every[] = [7, 14, 28];
export interface Repeat {
  formId: string;
  nextAt: number;
  /** Days between check-ins. Older servers send none, which means weekly. */
  every?: Every;
}

/** The server's FORM_LIMITS, for the editor. */
export const FORM_MAX = { forms: 10, questions: 12, title: 80, label: 160, text: 1000, photos: 3 };
/** Longest side of a photo answer, in pixels: enough for a coach to see posture, small enough to send on gym signal. */
export const PHOTO_SIDE = 1080;

function token(): string {
  const a = readAccount();
  if (!a) throw new AuthError("signedOut", 401);
  return a.token;
}
const post = <T>(body: Record<string, unknown>) => api<T>("/api/coach/", { token: token(), body });

export const saveForm = async (form: Omit<Form, "id" | "at"> & { id?: string }) =>
  (await post<{ form: Form }>({ action: "form", form })).form;
export const deleteForm = async (id: string) => void (await post({ action: "deleteForm", id }));
export const sendForm = async (client: string, id: string) =>
  (await post<{ checkin: Checkin }>({ action: "sendForm", client, id })).checkin;
export const repeatForm = async (client: string, id: string | null, every: Every = 7) =>
  (await post<{ repeat: Repeat | null }>({ action: "repeatForm", client, id, every })).repeat;
/** Sends a photo answer (a JPEG data URL) before the answers themselves. */
export const sendPhoto = async (id: string, q: string, photo: string) =>
  void (await api("/api/coach/photo/", { token: token(), body: { id, q, photo } }));
export const loadPhoto = async (id: string, q: string) =>
  (await api<{ photo: string }>(`/api/coach/photo/?checkin=${encodeURIComponent(id)}&q=${encodeURIComponent(q)}`, { token: token() }))
    .photo;
export const answerCheckin = async (id: string, answers: Record<string, Answer>) =>
  (await post<{ checkin: Checkin }>({ action: "answer", id, answers })).checkin;
export const loadCheckin = async (id: string) =>
  (await api<{ checkin: Checkin }>(`/api/coach/?checkin=${encodeURIComponent(id)}`, { token: token() })).checkin;

export type Template = "weekly" | "progress" | "intake" | "blank";
export const TEMPLATES: Template[] = ["weekly", "progress", "intake", "blank"];

/** A new form from a template, in the coach's language (the words are theirs to change). */
export function fromTemplate(kind: Template): Omit<Form, "id" | "at"> {
  const q = (id: string, k: QuestionKind) => ({ id, kind: k, label: t(`chk.q.${id}` as "chk.q.sleep") });
  switch (kind) {
    case "weekly":
      return {
        title: t("chk.tpl.weekly"),
        questions: [
          q("sleep", "scale"),
          q("energy", "scale"),
          q("plan", "scale"),
          q("weight", "weight"),
          q("wins", "text"),
          q("change", "text"),
        ],
      };
    case "progress":
      return {
        title: t("chk.tpl.progress"),
        questions: [
          q("weight", "weight"),
          q("front", "photo"),
          q("side", "photo"),
          q("energy", "scale"),
          q("hunger", "scale"),
          q("plan", "scale"),
          q("change", "text"),
        ],
      };
    case "intake":
      return {
        title: t("chk.tpl.intake"),
        questions: [
          q("goal", "text"),
          q("years", "number"),
          q("days", "number"),
          q("gym", "yesno"),
          q("injuries", "text"),
          q("else", "text"),
        ],
      };
    case "blank":
      return { title: t("chk.tpl.blank"), questions: [{ id: "q1", kind: "text", label: "" }] };
  }
}

/** What a coach should look at in a client's check-ins: one waiting 3+ days, or a low score (1 or 2 of 5) in the latest. */
export type CheckinFlag =
  | { kind: "checkinWaiting"; title: string; days: number }
  | { kind: "checkinLow"; label: string; value: number }
  | { kind: "checkinDrop"; label: string; from: number; to: number };

export function checkinFlags(checkins: readonly Checkin[], now: number): CheckinFlag[] {
  const out: CheckinFlag[] = [];
  const latest = checkins[0];
  if (!latest) return out;
  if (!latest.answeredAt) {
    const days = Math.floor((now - latest.sentAt) / 86_400_000);
    if (days >= 3) out.push({ kind: "checkinWaiting", title: latest.title, days });
  }
  const answered = checkins.find((c) => c.answeredAt && now - c.answeredAt <= 14 * 86_400_000);
  for (const q of answered?.questions ?? []) {
    const v = answered?.answers?.[q.id];
    if (q.kind === "scale" && typeof v === "number" && v <= 2) out.push({ kind: "checkinLow", label: q.label, value: v });
  }
  // A score that fell 2 or more across the last three answers, while it isn't low enough to show above.
  if (answered)
    for (const tr of checkinTrends(checkins)) {
      if (tr.kind !== "scale") continue;
      const last3 = tr.points.slice(-3);
      const from = Math.max(...last3.slice(0, -1));
      const to = last3.at(-1)!;
      if (last3.length >= 2 && from - to >= 2 && !out.some((f) => f.kind === "checkinLow" && f.label === tr.label))
        out.push({ kind: "checkinDrop", label: tr.label, from, to });
    }
  return out.slice(0, 3);
}

/** One question's answers over time, oldest first, from the check-ins of one form. */
export interface Trend {
  id: string;
  label: string;
  kind: "scale" | "number" | "weight" | "yesno";
  /** Numbers (kilograms for weight), or 1 for yes and 0 for no. */
  points: number[];
  /** When each point was answered. */
  at: number[];
}
const TREND_KINDS = new Set<QuestionKind>(["scale", "number", "weight", "yesno"]);

/**
 * The trends a coach sees on a client's report: every 1 to 5, number, weight and yes or no question of the form
 * answered most recently, across that form's answered check-ins (oldest first). A question needs two answers to show.
 * Matched by the question's id and kind, so a question the coach rewrote into another kind starts a new line.
 */
export function checkinTrends(checkins: readonly Checkin[]): Trend[] {
  const answered = checkins.filter((c) => c.answeredAt && c.answers).sort((a, b) => (a.answeredAt ?? 0) - (b.answeredAt ?? 0));
  const latest = answered.at(-1);
  if (!latest) return [];
  const same = answered.filter((c) => c.formId === latest.formId);
  const out: Trend[] = [];
  for (const q of latest.questions) {
    if (!TREND_KINDS.has(q.kind)) continue;
    const points: number[] = [];
    const at: number[] = [];
    for (const c of same) {
      if (!c.questions.some((x) => x.id === q.id && x.kind === q.kind)) continue;
      const v = c.answers?.[q.id];
      const n = q.kind === "yesno" ? (typeof v === "boolean" ? (v ? 1 : 0) : null) : typeof v === "number" ? v : null;
      if (n === null) continue;
      points.push(n);
      at.push(c.answeredAt ?? 0);
    }
    if (points.length >= 2) out.push({ id: q.id, label: q.label, kind: q.kind as Trend["kind"], points, at });
  }
  return out;
}

/** A trend's latest value and its change from the first, in words: "4 of 5, up 1", "81.2 kg, down 1.4 kg", "Yes 5 of 6". */
export function trendText(tr: Trend, unit: Unit): string {
  const last = tr.points.at(-1)!;
  if (tr.kind === "yesno") return t("chk.trend.yes", { yes: tr.points.filter((p) => p === 1).length, count: tr.points.length });
  const diff = last - tr.points[0]!;
  const now = tr.kind === "weight" ? fmtBodyweight(last, unit) : tr.kind === "scale" ? t("chk.scaleValue", { value: last }) : fmtNum(last);
  if (Math.abs(diff) < 0.05) return t("chk.trend.same", { now });
  const by = tr.kind === "weight" ? fmtBodyweight(Math.abs(diff), unit) : fmtNum(Math.round(Math.abs(diff) * 10) / 10);
  return t(diff > 0 ? "chk.trend.up" : "chk.trend.down", { now, by });
}

/** An answer in words, for the coach's list (a photo shows itself; this is its line when skipped). */
export function answerText(q: Question, v: Answer | undefined, unit: Unit = "kg"): string {
  if (v === null || v === undefined || v === "") return t("chk.skipped");
  if (q.kind === "scale") return t("chk.scaleValue", { value: Number(v) });
  if (q.kind === "yesno") return v ? t("chk.yes") : t("chk.no");
  if (q.kind === "weight") return typeof v === "number" ? fmtBodyweight(v, unit) : t("chk.skipped");
  if (q.kind === "photo") return t("chk.photoSent");
  return String(v);
}
