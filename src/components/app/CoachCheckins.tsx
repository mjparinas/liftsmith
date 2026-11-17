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
  checkinTrends,
  deleteForm,
  EVERY,
  FORM_MAX,
  fromTemplate,
  KINDS,
  loadCheckin,
  loadPhoto,
  PHOTO_SIDE,
  repeatForm,
  saveForm,
  sendForm,
  sendPhoto,
  TEMPLATES,
  trendText,
  type Answer,
  type Checkin,
  type Every,
  type Form,
  type Question,
  type QuestionKind,
  type Repeat,
  type Trend,
} from "@/lib/checkins";
import { shrinkImage } from "@/lib/feedback";
import { date, parseNum, t } from "@/lib/i18n";
import { haptic, oops, sound } from "@/lib/juice";
import { liveRead } from "@/lib/liveRead";
import { useApp } from "@/lib/store";
import { currentKg } from "@/lib/tdee";
import { checkinDone, loadOverview, trainerError, useCoachNotes } from "@/lib/trainer";
import { fromKg, plainNum, toKg } from "@/lib/units";

import { Icon } from "./icons";
import { go } from "./router";
import { BumpField, Button, Chip, EmptyState, InlineSwitch, ScreenHeader, Section, Sheet } from "./ui";

const short = (ms: number) => date(ms, { month: "short", day: "numeric" });
const FIELD = "mt-1 w-full rounded-xl border border-line bg-raised px-3 py-2";

// --- The coach's side ---

/** On a client's report: send a form now or every one, two or four weeks, see each question's trend, and read the
 *  answers. */
export function ClientCheckins({
  clientId,
  forms,
  checkins,
  repeat,
  teen = false,
  onChange,
}: {
  clientId: string;
  forms: Form[];
  checkins: Checkin[];
  repeat: Repeat | null;
  /** Under 18: photo questions are left out when the form is sent (the server does it; this says so). */
  teen?: boolean;
  onChange: () => void;
}) {
  const unit = useApp((s) => s.profile.unit);
  const [pick, setPick] = useState(repeat?.formId ?? forms[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [open, setOpen] = useState<Checkin | null>(null);
  const form = forms.find((f) => f.id === pick) ?? forms[0];
  const every: Every | null = form && repeat?.formId === form.id ? (repeat.every ?? 7) : null;
  const trends = checkinTrends(checkins);
  const trendForm = checkins.find((c) => c.answeredAt && c.formId === checkins.find((x) => x.answeredAt)?.formId);

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
            <p className="mt-3 text-sm font-medium" id="chk-every">
              {t("chk.repeat")}
            </p>
            <div className="mt-1 flex flex-wrap gap-2" role="group" aria-labelledby="chk-every">
              <Chip active={every === null} onClick={() => every !== null && void run(() => repeatForm(clientId, null), "", "checkinOnce")}>
                {t("chk.every.once")}
              </Chip>
              {EVERY.map((d) => (
                <Chip
                  key={d}
                  active={every === d}
                  disabled={busy}
                  onClick={() => every !== d && void run(() => repeatForm(clientId, form.id, d), t("chk.sent"), `checkinEvery${d}`)}
                >
                  {t(`chk.every.${d}`)}
                </Chip>
              ))}
            </div>
            {every !== null && repeat && <p className="mt-1 text-sm text-muted">{t("chk.weeklyNext", { date: short(repeat.nextAt) })}</p>}
            {teen && form.questions.some((q) => q.kind === "photo") && <p className="mt-2 text-sm text-muted">{t("chk.teenPhotos")}</p>}
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
      {trends.length > 0 && trendForm && (
        <div className="card mt-2 p-4">
          <p className="font-semibold">{t("chk.trends")}</p>
          <p className="text-sm text-muted">{t("chk.trendsHint", { title: trendForm.title, count: trends[0]!.points.length })}</p>
          <ul className="mt-2 space-y-3">
            {trends.map((tr) => (
              <TrendRow key={tr.id} tr={tr} unit={unit} />
            ))}
          </ul>
        </div>
      )}
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
                <dd className="mt-0.5 whitespace-pre-line break-words font-medium">
                  {q.kind === "photo" && open.answers?.[q.id] === true ? (
                    <PhotoAnswer checkin={open.id} q={q} />
                  ) : (
                    answerText(q, open.answers?.[q.id], unit)
                  )}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </Sheet>
    </Section>
  );
}

/** One question's line in Trends: its latest answer and change, and a small line chart. */
function TrendRow({ tr, unit }: { tr: Trend; unit: "kg" | "lb" }) {
  const shown = tr.kind === "weight" ? tr.points.map((p) => Math.round(fromKg(p, unit) * 10) / 10) : tr.points;
  return (
    <li>
      <p className="text-sm text-muted">{tr.label}</p>
      <div className="flex items-center gap-3">
        <p className="num shrink-0 font-medium">{trendText(tr, unit)}</p>
        {tr.kind !== "yesno" && (
          <TrendLine
            points={shown}
            min={tr.kind === "scale" ? 1 : undefined}
            max={tr.kind === "scale" ? 5 : undefined}
            label={t("chk.trend.spark", { label: tr.label, points: shown.join(", ") })}
          />
        )}
      </div>
    </li>
  );
}

/** A small line chart that fits its own range (1 to 5 for scores). */
function TrendLine({ points, min, max, label }: { points: number[]; min?: number; max?: number; label: string }) {
  const w = 160;
  const h = 36;
  const lo = min ?? Math.min(...points);
  const hi = max ?? Math.max(...points);
  const span = hi - lo || 1;
  const x = (i: number) => (points.length === 1 ? w / 2 : (i / (points.length - 1)) * (w - 8) + 4);
  const y = (v: number) => h - 4 - ((v - lo) / span) * (h - 8);
  return (
    <svg role="img" aria-label={label} viewBox={`0 0 ${w} ${h}`} className="h-9 min-w-0 flex-1">
      <polyline
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="2"
        strokeLinejoin="round"
        points={points.map((v, i) => `${x(i)},${y(v)}`).join(" ")}
      />
      {points.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r="2.5" fill="var(--color-accent)" />
      ))}
    </svg>
  );
}

/** A photo answer, loaded when the coach opens the answers (never kept on the device). */
function PhotoAnswer({ checkin, q }: { checkin: string; q: Question }) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    loadPhoto(checkin, q.id).then(
      (p) => live && setSrc(p),
      () => live && setFailed(true),
    );
    return () => {
      live = false;
    };
  }, [checkin, q.id]);
  if (failed) return <span className="text-muted">{t("chk.photoGone")}</span>;
  if (!src) return <span className="text-muted">{t("chk.photoLoading")}</span>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={t("chk.photoAlt", { label: q.label })} className="mt-1 max-h-96 w-auto rounded-xl border border-line" />;
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
  const photos = draft?.questions.filter((q) => q.kind === "photo").length ?? 0;
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
                      <Chip
                        key={k}
                        active={q.kind === k}
                        // Up to three photo questions a form.
                        disabled={k === "photo" && q.kind !== "photo" && photos >= FORM_MAX.photos}
                        onClick={() => edit(i, { kind: k })}
                      >
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
  // Photo answers as shrunk JPEG data URLs, sent on their own before the answers.
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [photoNote, setPhotoNote] = useState<string | null>(null);
  // Weight questions start from the latest weigh-in, in the lifter's unit, and are saved as a weigh-in too.
  const unit = useApp((s) => s.profile.unit);
  const lastKg = useApp((s) => currentKg(s.events, s.profile));
  const [logWeight, setLogWeight] = useState(true);
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
      let weighIn: number | null = null;
      for (const q of c.questions) {
        if (q.kind !== "number" && q.kind !== "weight") continue;
        const text = raw[q.id] ?? (q.kind === "weight" && lastKg > 0 ? plainNum(Math.round(fromKg(lastKg, unit) * 10) / 10) : "");
        const n = parseNum(text);
        const v = Number.isFinite(n) && text.trim() !== "" ? n : null;
        all[q.id] = v === null ? null : q.kind === "weight" ? Math.round(toKg(v, unit) * 10) / 10 : v;
        if (q.kind === "weight" && v !== null) weighIn ??= all[q.id] as number;
      }
      for (const q of c.questions) {
        const p = photos[q.id];
        if (q.kind !== "photo" || !p) continue;
        await sendPhoto(c.id, q.id, p);
        all[q.id] = true;
      }
      await answerCheckin(c.id, all);
      // The weight answered goes into the lifter's own weigh-ins (and so into sync), unless it's the one already there.
      if (logWeight && weighIn !== null && Math.abs(weighIn - lastKg) >= 0.05) useApp.getState().logBodyweight(weighIn);
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
              {q.kind === "text" || q.kind === "number" || q.kind === "weight" ? (
                <label htmlFor={lid} className="block font-medium">
                  {q.kind === "weight" ? `${q.label} (${unit})` : q.label}
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
              {q.kind === "weight" && (
                <>
                  <BumpField
                    id={lid}
                    label={`${q.label} (${unit})`}
                    value={raw[q.id] ?? (lastKg > 0 ? plainNum(Math.round(fromKg(lastKg, unit) * 10) / 10) : "")}
                    onChange={(s) => setRaw((r) => ({ ...r, [q.id]: s }))}
                    step={unit === "lb" ? 0.2 : 0.1}
                    start={unit === "lb" ? 170 : 75}
                    min={unit === "lb" ? 45 : 20}
                    max={unit === "lb" ? 880 : 400}
                    className="mt-2"
                  />
                  <InlineSwitch className="mt-2" label={t("chk.weightLog")} on={logWeight} onChange={setLogWeight} />
                </>
              )}
              {q.kind === "photo" && (
                <PhotoPick
                  q={q}
                  photo={photos[q.id]}
                  coach={name}
                  onPick={(p) => setPhotos((x) => ({ ...x, [q.id]: p }))}
                  onRemove={() => setPhotos((x) => Object.fromEntries(Object.entries(x).filter(([k]) => k !== q.id)))}
                  onFail={() => setPhotoNote(t("chk.photoFailed"))}
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
      {photoNote && (
        <p className="mt-3 text-sm text-muted" role="status">
          {photoNote}
        </p>
      )}
      <Button className="mt-4 w-full" icon="send" disabled={busy} onClick={() => void submit()}>
        {busy ? t("chk.sending") : t("chk.submit")}
      </Button>
    </div>
  );
}

/** A photo question: pick or take one (the phone's own picker, which offers the camera), see it, change or remove it.
 *  Shrunk to 1080 px JPEG on the phone, which also drops the camera's location data. */
function PhotoPick({
  q,
  photo,
  coach,
  onPick,
  onRemove,
  onFail,
}: {
  q: Question;
  photo: string | undefined;
  coach: string;
  onPick: (p: string) => void;
  onRemove: () => void;
  onFail: () => void;
}) {
  return (
    <div className="mt-2">
      {photo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} alt={t("chk.photoPreview", { label: q.label })} className="mb-2 max-h-64 w-auto rounded-xl border border-line" />
      )}
      <div className="flex flex-wrap gap-2">
        <label className="press card flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 px-4 py-2 text-sm font-semibold">
          <Icon name="camera" size={18} />
          {photo ? t("chk.photoChange") : t("chk.photoAdd")}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f) return;
              const p = await shrinkImage(f, PHOTO_SIDE);
              if (p) {
                haptic("select");
                onPick(p);
              } else onFail();
            }}
          />
        </label>
        {photo && (
          <Button kind="quiet" onClick={onRemove}>
            {t("chk.photoRemove")}
          </Button>
        )}
      </div>
      <p className="mt-1 text-sm text-muted">{t("chk.photoPrivate", { name: coach })}</p>
    </div>
  );
}
