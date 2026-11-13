"use client";

// Check-in forms and questionnaires (2026-11-13; Melvin: "check-in forms and questionnaires"; server:
// src/server/coachForms.ts, docs/decisions/trainer-mode.md). A coach keeps up to ten forms (#/trainer/forms), made
// from a template or blank, sends one to a client from their report now or every week, and reads the answers there;
// a waiting check-in or a low score goes under What to look at first. The client answers at #/trainer/f.<id>, from a
// notification, a card on Today or the Coaching screen. Answers are taps where they can be: 1 to 5, yes or no, and a
// bump box for numbers; only questions asking for words need typing.
import { useEffect, useState } from "react";

import { track } from "@/lib/analytics";
import {
  answerCheckin,
  answerText,
  deleteForm,
  FORM_MAX,
  fromTemplate,
  KINDS,
  loadCheckin,
  repeatForm,
  saveForm,
  sendForm,
  TEMPLATES,
  type Answer,
  type Checkin,
  type Form,
  type Question,
  type QuestionKind,
  type Repeat,
} from "@/lib/checkins";
import { date, parseNum, t } from "@/lib/i18n";
import { haptic, oops, sound } from "@/lib/juice";
import { liveRead } from "@/lib/liveRead";
import { checkinDone, loadOverview, trainerError, useCoachNotes } from "@/lib/trainer";

import { Icon } from "./icons";
import { go } from "./router";
import { BumpField, Button, Chip, EmptyState, InlineSwitch, ScreenHeader, Section, Sheet } from "./ui";

const short = (ms: number) => date(ms, { month: "short", day: "numeric" });
const FIELD = "mt-1 w-full rounded-xl border border-line bg-raised px-3 py-2";

// --- The coach's side ---

/** On a client's report: send a form now or weekly, and read the answers. */
export function ClientCheckins({
  clientId,
  forms,
  checkins,
  repeat,
  onChange,
}: {
  clientId: string;
  forms: Form[];
  checkins: Checkin[];
  repeat: Repeat | null;
  onChange: () => void;
}) {
  const [pick, setPick] = useState(repeat?.formId ?? forms[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [open, setOpen] = useState<Checkin | null>(null);
  const form = forms.find((f) => f.id === pick) ?? forms[0];
  const weekly = !!form && repeat?.formId === form.id;

  const run = async (what: () => Promise<unknown>, done: string, detail: string) => {
    setBusy(true);
    try {
      await what();
      haptic("success");
      track("feature", { name: "trainer", detail });
      setNote(done);
      onChange();
    } catch (e) {
      oops();
      setNote(trainerError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Section title={t("chk.title")} icon="check">
      <div className="card p-4">
        <p className="text-sm text-muted">{t("chk.hint")}</p>
        {form ? (
          <>
            <p className="mt-3 text-sm font-medium" id="chk-pick">
              {t("chk.pick")}
            </p>
            <div className="mt-1 flex flex-wrap gap-2" role="group" aria-labelledby="chk-pick">
              {forms.map((f) => (
                <Chip key={f.id} active={f.id === form.id} onClick={() => setPick(f.id)}>
                  {f.title}
                </Chip>
              ))}
            </div>
            <Button
              className="mt-3 w-full"
              icon="send"
              disabled={busy}
              onClick={() => void run(() => sendForm(clientId, form.id), t("chk.sent"), "checkinSend")}
            >
              {t("chk.send")}
            </Button>
            <InlineSwitch
              className="mt-3"
              label={t("chk.weekly")}
              hint={weekly && repeat ? t("chk.weeklyNext", { date: short(repeat.nextAt) }) : undefined}
              on={weekly}
              onChange={(on) =>
                void run(() => repeatForm(clientId, on ? form.id : null), on ? t("chk.sent") : "", on ? "checkinWeekly" : "checkinOnce")
              }
            />
          </>
        ) : (
          <p className="mt-3 text-sm text-muted">{t("chk.noForms")}</p>
        )}
        <Button kind="ghost" className="mt-3 w-full" icon="edit" onClick={() => go("trainer", "forms")}>
          {form ? t("chk.editForms") : t("chk.makeForm")}
        </Button>
        {note && (
          <p className="mt-2 text-sm text-muted" role="status">
            {note}
          </p>
        )}
      </div>
      {checkins.length > 0 ? (
        <ul className="card mt-2 divide-y divide-line">
          {checkins.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                disabled={!c.answeredAt}
                onClick={() => setOpen(c)}
                className="press flex w-full items-center gap-3 px-4 py-3 text-left disabled:cursor-default"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{c.title}</span>
                  <span className={`block text-sm ${c.answeredAt ? "text-good" : "text-muted"}`}>
                    {c.answeredAt ? t("chk.answered", { date: short(c.answeredAt) }) : t("chk.waiting", { date: short(c.sentAt) })}
                  </span>
                </span>
                {c.answeredAt && (
                  <span aria-hidden className="text-faint">
                    ›
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 px-1 text-sm text-muted">{t("chk.none")}</p>
      )}
      <Sheet open={!!open} onClose={() => setOpen(null)} title={open?.title ?? t("chk.showAnswers")}>
        {open && (
          <dl className="space-y-3">
            {open.questions.map((q) => (
              <div key={q.id}>
                <dt className="text-sm text-muted">{q.label}</dt>
                <dd className="mt-0.5 whitespace-pre-line break-words font-medium">{answerText(q, open.answers?.[q.id])}</dd>
              </div>
            ))}
          </dl>
        )}
      </Sheet>
    </Section>
  );
}

type Draft = { id?: string; title: string; questions: Question[] };
let qn = 0;
const newQ = (): Question => ({ id: `n${Date.now().toString(36)}${(qn++).toString(36)}`, kind: "scale", label: "" });

/** #/trainer/forms: the coach's forms, new ones from a template, and the editor. */
/** The coach's check-in forms: its own screen (#/trainer/forms), or the Check-ins page of Coaching (`embedded`). */
export function FormsScreen({ embedded = false }: { embedded?: boolean }) {
  const [forms, setForms] = useState<Form[] | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let live = true;
    liveRead("coach.overview", loadOverview, (o) => live && setForms(o.forms ?? [])).catch((e: unknown) => {
      if (!live) return;
      setForms([]);
      setNote(trainerError(e));
    });
    return () => {
      live = false;
    };
  }, [version]);
  const back = { label: t("trn.back"), onClick: () => go("trainer") };
  const full = (forms?.length ?? 0) >= FORM_MAX.forms;

  const save = async () => {
    if (!draft) return;
    setBusy(true);
    try {
      await saveForm({ ...draft, questions: draft.questions.filter((q) => q.label.trim()) });
      sound.done();
      haptic("success");
      track("feature", { name: "trainer", detail: "form" });
      setNote(t("chk.saved"));
      setDraft(null);
      setVersion((n) => n + 1);
    } catch (e) {
      oops();
      setNote(trainerError(e));
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    if (!draft?.id) return;
    setBusy(true);
    try {
      await deleteForm(draft.id);
      haptic("toggle");
      setNote(t("chk.deleted"));
      setDraft(null);
      setVersion((n) => n + 1);
    } catch (e) {
      oops();
      setNote(trainerError(e));
    } finally {
      setBusy(false);
    }
  };
  const edit = (i: number, x: Partial<Question>) =>
    setDraft((d) => d && { ...d, questions: d.questions.map((q, j) => (j === i ? { ...q, ...x } : q)) });

  return (
    <div className="pb-2">
      {!embedded && <ScreenHeader back={back} title={t("chk.formsTitle")} />}
      <p className="mt-2 text-muted">{t("chk.formsLead")}</p>
      {note && (
        <p className="mt-3 text-sm text-muted" role="status">
          {note}
        </p>
      )}
      {forms && forms.length > 0 && (
        <ul className="card mt-4 divide-y divide-line">
          {forms.map((f) => (
            <li key={f.id}>
              <button
                type="button"
                onClick={() => setDraft({ id: f.id, title: f.title, questions: f.questions })}
                className="press flex w-full items-center gap-3 px-4 py-3 text-left"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{f.title}</span>
                  <span className="block text-sm text-muted">{t("chk.count", { count: f.questions.length })}</span>
                </span>
                <span aria-hidden className="text-faint">
                  ›
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <Section title={t("chk.new")} icon="plus">
        {full ? (
          <p className="px-1 text-sm text-muted">{t("chk.full")}</p>
        ) : (
          <div className="flex flex-wrap gap-2" role="group" aria-label={t("chk.from")}>
            {TEMPLATES.map((k) => (
              <Chip key={k} onClick={() => setDraft(fromTemplate(k))}>
                {t(`chk.tpl.${k}`)}
              </Chip>
            ))}
          </div>
        )}
      </Section>
      <Sheet open={!!draft} onClose={() => setDraft(null)} title={draft?.id ? draft.title || t("chk.formName") : t("chk.new")}>
        {draft && (
          <div>
            <label htmlFor="chk-title" className="block text-sm font-medium">
              {t("chk.formName")}
            </label>
            <input
              id="chk-title"
              value={draft.title}
              maxLength={FORM_MAX.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              className={FIELD}
            />
            <ol className="mt-4 space-y-3">
              {draft.questions.map((q, i) => (
                <li key={q.id} className="card p-3">
                  <div className="flex items-center justify-between gap-2">
                    <label htmlFor={`chk-q-${q.id}`} className="text-sm font-medium">
                      {t("chk.question", { n: i + 1 })}
                    </label>
                    {draft.questions.length > 1 && (
                      <button
                        type="button"
                        aria-label={t("chk.removeQuestion", { n: i + 1 })}
                        onClick={() => setDraft({ ...draft, questions: draft.questions.filter((_, j) => j !== i) })}
                        className="press -m-2 grid h-11 w-11 place-items-center text-muted"
                      >
                        <Icon name="trash" size={18} />
                      </button>
                    )}
                  </div>
                  <input
                    id={`chk-q-${q.id}`}
                    value={q.label}
                    maxLength={FORM_MAX.label}
                    onChange={(e) => edit(i, { label: e.target.value })}
                    className={FIELD}
                  />
                  <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label={t("chk.kind")}>
                    {KINDS.map((k: QuestionKind) => (
                      <Chip key={k} active={q.kind === k} onClick={() => edit(i, { kind: k })}>
                        {t(`chk.kind.${k}`)}
                      </Chip>
                    ))}
                  </div>
                </li>
              ))}
            </ol>
            {draft.questions.length < FORM_MAX.questions && (
              <Button
                kind="ghost"
                icon="plus"
                className="mt-3 w-full"
                onClick={() => setDraft({ ...draft, questions: [...draft.questions, newQ()] })}
              >
                {t("chk.addQuestion")}
              </Button>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                className="flex-1"
                disabled={busy || !draft.title.trim() || !draft.questions.some((q) => q.label.trim())}
                onClick={() => void save()}
              >
                {t("chk.save")}
              </Button>
              {draft.id && (
                <Button kind="danger" disabled={busy} onClick={() => void remove()}>
                  {t("chk.delete")}
                </Button>
              )}
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}

// --- The client's side: free ---

/** Under Your coach: check-ins waiting for an answer. */
export function PendingCheckins({ checkins }: { checkins: (Checkin & { coach: string })[] }) {
  if (!checkins.length) return null;
  return (
    <ul className="mb-3 space-y-2">
      {checkins.map((c) => (
        <li key={c.id}>
          <CheckinRow c={c} />
        </li>
      ))}
    </ul>
  );
}

function CheckinRow({ c }: { c: Checkin & { coach: string } }) {
  return (
    <button
      type="button"
      onClick={() => go("trainer", `f.${c.id}`)}
      className="press card card-tint flex w-full items-center gap-3 px-4 py-3 text-left"
      style={{ ["--tint" as string]: "var(--color-mint)" }}
    >
      <Icon name="check" />
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{t("chk.fromCoach", { name: c.coach || t("trn.noName") })}</span>
        <span className="block truncate text-sm text-muted">{c.title}</span>
      </span>
      <span className="shrink-0 text-sm font-semibold text-accent">{t("chk.open")}</span>
    </button>
  );
}

/** Today: the oldest check-in waiting, one row (loaded with the coach's notes, so nothing is fetched here). */
export function CheckinToday() {
  const c = useCoachNotes((s) => s.checkins.at(-1));
  if (!c) return null;
  return (
    <div className="mt-3">
      <CheckinRow c={c} />
    </div>
  );
}

const SCALE = [1, 2, 3, 4, 5];

/** #/trainer/f.<id>: the client fills a check-in in. Anything can be skipped. */
export function CheckinScreen({ id }: { id: string }) {
  const [c, setC] = useState<Checkin | null>(null);
  const [coach, setCoach] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  // Number answers as typed, so "72." stays while typing; turned into numbers on send.
  const [raw, setRaw] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  useEffect(() => {
    let live = true;
    liveRead(
      `coach.checkin.${id}`,
      () => loadCheckin(id),
      (x) => {
        if (!live) return;
        setC(x);
        setCoach(useCoachNotes.getState().checkins.find((y) => y.id === id)?.coach ?? "");
      },
    ).catch((e: unknown) => live && setError(trainerError(e)));
    return () => {
      live = false;
    };
  }, [id]);
  const back = { label: t("trn.back"), onClick: () => go("trainer") };
  if (done || error || (c && c.answeredAt))
    return (
      <div className="pb-2">
        <ScreenHeader back={back} title={t("chk.title")} />
        <EmptyState
          icon="check"
          mascot={done ? "cheer" : undefined}
          title={done ? t("chk.thanks", { name: coach || t("trn.noName") }) : (error ?? t("chk.already"))}
          action={<Button onClick={() => go("trainer")}>{t("trn.back")}</Button>}
        />
      </div>
    );
  if (!c) return <ScreenHeader back={back} title={t("trn.loading")} />;
  const name = coach || t("trn.noName");
  const set = (q: string, v: Answer) => setAnswers((a) => ({ ...a, [q]: v }));
  const submit = async () => {
    setBusy(true);
    try {
      const all = { ...answers };
      for (const q of c.questions) {
        if (q.kind !== "number") continue;
        const n = parseNum(raw[q.id] ?? "");
        all[q.id] = Number.isFinite(n) && (raw[q.id] ?? "").trim() !== "" ? n : null;
      }
      await answerCheckin(c.id, all);
      checkinDone(c.id);
      sound.done();
      haptic("success");
      track("feature", { name: "trainer", detail: "checkinAnswer" });
      setDone(true);
    } catch (e) {
      oops();
      setError(trainerError(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="pb-2">
      <ScreenHeader back={back} kicker={t("chk.fromCoach", { name })} title={c.title} />
      <p className="mt-2 text-muted">{t("chk.fillLead", { name })}</p>
      <ol className="mt-4 space-y-3">
        {c.questions.map((q) => {
          const v = answers[q.id];
          const lid = `chk-a-${q.id}`;
          return (
            <li key={q.id} className="card p-4">
              {q.kind === "text" || q.kind === "number" ? (
                <label htmlFor={lid} className="block font-medium">
                  {q.label}
                </label>
              ) : (
                <p id={lid} className="font-medium">
                  {q.label}
                </p>
              )}
              {q.kind === "scale" && (
                <>
                  <div className="mt-2 grid grid-cols-5 gap-2" role="group" aria-labelledby={lid}>
                    {SCALE.map((n) => (
                      <Chip key={n} active={v === n} onClick={() => set(q.id, v === n ? null : n)}>
                        <span className="num w-full text-center">{n}</span>
                      </Chip>
                    ))}
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-muted" aria-hidden>
                    <span>{t("chk.scaleLow")}</span>
                    <span>{t("chk.scaleHigh")}</span>
                  </div>
                </>
              )}
              {q.kind === "yesno" && (
                <div className="mt-2 flex gap-2" role="group" aria-labelledby={lid}>
                  <Chip active={v === true} onClick={() => set(q.id, v === true ? null : true)}>
                    {t("chk.yes")}
                  </Chip>
                  <Chip active={v === false} onClick={() => set(q.id, v === false ? null : false)}>
                    {t("chk.no")}
                  </Chip>
                </div>
              )}
              {q.kind === "number" && (
                <BumpField
                  id={lid}
                  label={q.label}
                  value={raw[q.id] ?? ""}
                  onChange={(s) => setRaw((r) => ({ ...r, [q.id]: s }))}
                  // Half steps, so a weight like 81.5 can be typed or bumped.
                  step={0.5}
                  start={0}
                  min={0}
                  max={9999}
                  className="mt-2"
                />
              )}
              {q.kind === "text" && (
                <textarea
                  id={lid}
                  value={typeof v === "string" ? v : ""}
                  maxLength={FORM_MAX.text}
                  rows={3}
                  placeholder={t("chk.typeHere")}
                  onChange={(e) => set(q.id, e.target.value)}
                  className={FIELD}
                />
              )}
            </li>
          );
        })}
      </ol>
      <Button className="mt-4 w-full" icon="send" disabled={busy} onClick={() => void submit()}>
        {t("chk.submit")}
      </Button>
    </div>
  );
}
