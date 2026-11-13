// Check-in forms and questionnaires on the phone (Melvin, 2026-11-13; server: src/server/coachForms.ts). A coach's
// forms, the templates new ones start from, the calls, and what a coach should look at in a client's answers.
import { api, AuthError, readAccount } from "./auth";
import { t } from "./i18n";

export type QuestionKind = "scale" | "number" | "yesno" | "text";
export const KINDS: QuestionKind[] = ["scale", "number", "yesno", "text"];
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
export interface Repeat {
  formId: string;
  nextAt: number;
}

/** The server's FORM_LIMITS, for the editor. */
export const FORM_MAX = { forms: 10, questions: 12, title: 80, label: 160, text: 1000 };

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
export const repeatForm = async (client: string, id: string | null) =>
  (await post<{ repeat: Repeat | null }>({ action: "repeatForm", client, id })).repeat;
export const answerCheckin = async (id: string, answers: Record<string, Answer>) =>
  (await post<{ checkin: Checkin }>({ action: "answer", id, answers })).checkin;
export const loadCheckin = async (id: string) =>
  (await api<{ checkin: Checkin }>(`/api/coach/?checkin=${encodeURIComponent(id)}`, { token: token() })).checkin;

export type Template = "weekly" | "intake" | "blank";
export const TEMPLATES: Template[] = ["weekly", "intake", "blank"];

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
          q("weight", "number"),
          q("wins", "text"),
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
export type CheckinFlag = { kind: "checkinWaiting"; title: string; days: number } | { kind: "checkinLow"; label: string; value: number };

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
  return out.slice(0, 3);
}

/** An answer in words, for the coach's list. */
export function answerText(q: Question, v: Answer | undefined): string {
  if (v === null || v === undefined || v === "") return t("chk.skipped");
  if (q.kind === "scale") return t("chk.scaleValue", { value: Number(v) });
  if (q.kind === "yesno") return v ? t("chk.yes") : t("chk.no");
  return String(v);
}
