"use client";

// Trainer mode (#/trainer, docs/decisions/trainer-mode.md). Coaching's pages for each side live in CoachHome.tsx (a client
// sees only their coach; a coach gets a page per job; coachMode.ts decides). This file routes #/trainer/<arg> and holds a
// client's report (#/trainer/c.<id>), with the coach's note to them, and Today's cards from a coach. An invite link is
// #/trainer/<code>, which fills in the code.
// Physio support (2026-11-13) lives in CoachRehab.tsx: the Physio role, pain and injuries, rehab programs.
// School teams (SchoolTeams.tsx) sit at the bottom; a team link is #/trainer/team.<code>.
import { useEffect, useState } from "react";

import { track } from "@/lib/analytics";
import { useAccount } from "@/lib/auth";
import { savePendingCoach } from "@/lib/coachInvite";
import { COACH_TABS } from "@/lib/coachMode";
import { can } from "@/lib/entitlements";
import { date, list, t } from "@/lib/i18n";
import { haptic, oops, sound } from "@/lib/juice";
import { rehabName } from "@/lib/rehab";
import { encodeRoutine } from "@/lib/routineShare";
import { useApp } from "@/lib/store";
import { teamCodeFrom } from "@/lib/teams";
import {
  assignPlan,
  clientReport,
  codeFrom,
  dismissNote,
  flagText,
  liftName,
  loadClient,
  NOTE_MAX,
  noteId,
  removePlan,
  saveNote,
  showCode,
  trainerError,
  unlinkPerson,
  useCoachNotes,
  type BodyShare,
  type ClientView,
  type Note,
  type PlanProgress,
  type Readiness,
  type Report,
  type ShareKind,
  type ShownNote,
  type Targets,
} from "@/lib/trainer";
import type { Routine } from "@/lib/types";
import { fmtNum, fmtWeight } from "@/lib/units";

import { ClientBody } from "./CoachBody";
import { backToCoaching, ChatScreen } from "./CoachChat";
import { CheckinScreen, CheckinToday, ClientCheckins, FormsScreen } from "./CoachCheckins";
import { CoachHome, NoteCard } from "./CoachHome";
import { ClientPayments } from "./CoachPay";
import { ClientPain, PerWeekPicker, RehabPrograms } from "./CoachRehab";
import { ClientSessions, SessionToday } from "./CoachSessions";
import { ClientTargets } from "./CoachTargets";
import { Icon } from "./icons";
import { go } from "./router";
import { Button, EmptyState, ScreenHeader, Section, Sheet } from "./ui";

const CLIENT = "c.";
const CHAT = "m.";
const TEAM = "team.";
const CHECKIN = "f.";

export function Trainer({ arg }: { arg?: string }) {
  const account = useAccount((s) => s.account);
  const code = arg && !arg.includes(".") && !(COACH_TABS as readonly string[]).includes(arg) ? codeFrom(arg) : "";
  if (!account) return <SignedOut code={code} />;
  if (arg?.startsWith(CLIENT)) return <ClientScreen id={arg.slice(CLIENT.length)} />;
  if (arg?.startsWith(CHAT)) return <ChatScreen id={arg.slice(CHAT.length)} />;
  // A school team's link (#/trainer/team.<code>, SchoolTeams.tsx) fills in the team code instead.
  if (arg?.startsWith(TEAM)) return <CoachHome team={teamCodeFrom(arg.slice(TEAM.length))} />;
  if (arg?.startsWith(CHECKIN)) return <CheckinScreen id={arg.slice(CHECKIN.length)} />;
  if (arg === "forms") return <FormsScreen />;
  // Back from paying a coach on Stripe's page.
  if (arg === "paid") return <CoachHome tab="mine" paid />;
  // Back from buying a coach plan on Stripe's page (CoachPlan.tsx).
  if (arg === "plan") return <CoachHome tab="clients" planPaid />;
  // One of Coaching's pages (#/trainer/clients and friends, coachMode.ts), the first page that asks, or a code.
  if (arg && !code) return <CoachHome tab={arg} />;
  return <CoachHome code={code} />;
}

/**
 * Signed out. A coach's code that came with the link waits on the device (coachInvite.ts) through signing in or making
 * an account, and Coaching opens with it once the lifter is signed in (App.tsx; Melvin, 2026-11-13: "it should remember
 * that when i create an account").
 */
function SignedOut({ code }: { code: string }) {
  useEffect(() => {
    if (code) savePendingCoach(code);
  }, [code]);
  return (
    <div className="pb-2">
      <ScreenHeader back={{ label: t("settings.back"), onClick: () => go("settings") }} title={t("trn.title")} />
      <EmptyState
        icon="lock"
        title={code ? t("trn.signInCode") : t("trn.signIn")}
        body={code ? t("trn.signInCodeBody", { code: showCode(code) }) : t("trn.signInBody")}
        action={<Button onClick={() => go("account")}>{t("account.signIn")}</Button>}
      />
    </div>
  );
}

/**
 * Today: the newest note from the lifter's coach, until "Got it" (it shows again when the coach changes it). Loaded on
 * open and on return to the app (refreshCoachNotes), so nothing is fetched by this card.
 */
export function CoachNoteToday() {
  const notes = useCoachNotes((s) => s.notes);
  const seen = useCoachNotes((s) => s.seen);
  const unread = useCoachNotes((s) => s.unread);
  const n = notes.find((x) => !seen.includes(noteId(x)));
  const u = unread[0];
  const waiting = useCoachNotes((s) => s.checkins.length > 0 || s.sessions.length > 0);
  if (!n && !u && !waiting) return null;
  return (
    <>
      <SessionToday />
      <CheckinToday />
      {u && (
        <button
          type="button"
          onClick={() => go("trainer", `${CHAT}${u.id}`)}
          className="press card card-tint mt-3 flex w-full items-center gap-3 px-4 py-3 text-left"
          style={{ ["--tint" as string]: "var(--color-accent)" }}
        >
          <Icon name="chat" />
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">{t("trn.newFrom", { name: u.name || t("trn.noName") })}</span>
            <span className="block text-sm text-muted">{t("trn.unread", { count: u.count })}</span>
          </span>
          <span aria-hidden className="text-faint">
            ›
          </span>
        </button>
      )}
      {n && <NoteToday n={n} />}
    </>
  );
}

function NoteToday({ n }: { n: ShownNote }) {
  return (
    <Section title={n.role === "trainer" ? t("trn.fromTrainer") : t("trn.fromCoach")} icon="chat">
      <NoteCard note={n} coach={n.coach} />
      <div className="flex flex-wrap gap-2">
        <Button kind="ghost" className="flex-1" onClick={() => go("trainer")}>
          {t("trn.noteOpen")}
        </Button>
        <Button
          kind="quiet"
          onClick={() => {
            haptic("tick");
            dismissNote(n);
          }}
        >
          {t("coach.gotIt")}
        </Button>
      </div>
    </Section>
  );
}

// --- The coach's side: Pro ---

/** The coach's note to one client: shown on the client's Today and under Coaching until the coach changes it. */
function NoteToClient({ clientId, saved, onChange }: { clientId: string; saved: Note | null; onChange: () => void }) {
  const [text, setText] = useState(saved?.text ?? "");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const save = async (value: string) => {
    setBusy(true);
    try {
      const n = await saveNote(clientId, value);
      if (!n) setText("");
      haptic("success");
      track("feature", { name: "trainer", detail: n ? "note" : "unnote" });
      setNote(n ? t("trn.noteSaved") : t("trn.noteCleared"));
      onChange();
    } catch (e) {
      oops();
      setNote(trainerError(e));
    } finally {
      setBusy(false);
    }
  };
  const changed = text.trim() !== (saved?.text ?? "");
  return (
    <Section title={t("trn.note")} icon="chat">
      <div className="card p-4">
        <label htmlFor="trn-note" className="block text-sm text-muted">
          {t("trn.noteHint")}
        </label>
        <textarea
          id="trn-note"
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, NOTE_MAX))}
          maxLength={NOTE_MAX}
          rows={4}
          placeholder={t("trn.notePlaceholder")}
          className="mt-2 w-full rounded-xl border border-line bg-raised px-3 py-2"
        />
        {saved && (
          <p className="mt-1 text-xs text-muted">{t("trn.noteWhen", { date: date(saved.at, { month: "short", day: "numeric" }) })}</p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button className="flex-1" disabled={busy || !changed || !text.trim()} onClick={() => void save(text)}>
            {t("trn.noteSave")}
          </Button>
          {saved && (
            <Button kind="ghost" disabled={busy} onClick={() => void save("")}>
              {t("trn.noteClear")}
            </Button>
          )}
        </div>
        {note && (
          <p className="mt-2 text-sm text-muted" role="status">
            {note}
          </p>
        )}
      </div>
    </Section>
  );
}

/** The coach's routines for one client (stage 2): how each is going, take one back, or assign another. */
function ClientPlans({
  clientId,
  plans,
  physio,
  onChange,
}: {
  clientId: string;
  plans: PlanProgress[];
  physio: boolean;
  onChange: () => void;
}) {
  const saved = useApp((s) => s.profile.routines);
  const routines = saved ?? [];
  const [picking, setPicking] = useState(false);
  const [perWeek, setPerWeek] = useState<number | undefined>(physio ? 3 : undefined);
  const [note, setNote] = useState<string | null>(null);
  const give = async (r: Pick<Routine, "name" | "items" | "rehab">) => {
    try {
      await assignPlan(clientId, r.name, encodeRoutine(r), perWeek);
      haptic("success");
      sound.done();
      track("feature", { name: "trainer", detail: r.rehab ? "rehab" : "assign" });
      setPicking(false);
      setNote(t("trn.assigned"));
      onChange();
    } catch (e) {
      oops();
      setNote(trainerError(e));
    }
  };
  const takeBack = async (p: PlanProgress) => {
    try {
      await removePlan(p.plan.id);
      haptic("toggle");
      track("feature", { name: "trainer", detail: "unassign" });
      onChange();
    } catch (e) {
      oops();
      setNote(trainerError(e));
    }
  };
  return (
    <Section title={t("trn.plans")} icon="layers">
      {plans.length > 0 && (
        <ul className="card mb-3 divide-y divide-line">
          {plans.map((p) => (
            <li key={p.plan.id} className="flex items-center gap-2 py-2 pl-4 pr-1">
              <span className="min-w-0 flex-1 py-1">
                <span className="block truncate font-medium">{p.plan.name}</span>
                <span className="block text-xs text-muted">
                  {p.done
                    ? `${t("trn.planDone", { count: p.done })}${p.lastAt ? ` · ${t("trn.planLast", { date: date(p.lastAt, { month: "short", day: "numeric" }) })}` : ""}`
                    : t("trn.planNotYet")}
                </span>
                {p.plan.perWeek !== undefined && (
                  <span className="block text-xs text-muted">
                    {p.adherence
                      ? t("trn.adherence", { pct: p.adherence.pct, done: p.adherence.done, want: p.adherence.want })
                      : t("trn.perWeekShort", { count: p.plan.perWeek })}
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={() => void takeBack(p)}
                aria-label={t("trn.unassign", { name: p.plan.name })}
                className="press grid h-11 w-11 shrink-0 place-items-center rounded-xl text-muted hover:text-ink"
              >
                <Icon name="trash" size={20} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <Button kind="ghost" icon="plus" className="w-full" onClick={() => setPicking(true)}>
        {t("trn.assign")}
      </Button>
      {note && (
        <p className="mt-2 text-sm text-muted" role="status">
          {note}
        </p>
      )}
      <Sheet open={picking} onClose={() => setPicking(false)} title={t("trn.assignTitle")}>
        <PerWeekPicker value={perWeek} onChange={setPerWeek} />
        {/* A physio sees the rehab programs first; a trainer sees their own routines first. */}
        {physio && <RehabPrograms onPick={(p) => void give({ name: rehabName(p), items: p.items, rehab: true })} />}
        {(physio || routines.length > 0) && <p className="mb-2 text-sm font-semibold">{t("trn.assignOwn")}</p>}
        {routines.length ? (
          <ul className="space-y-2">
            {routines.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => void give(r)}
                  className="press card flex w-full items-center gap-3 px-4 py-3 text-left"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{r.name}</span>
                    <span className="block text-sm text-muted">
                      {t("rt.summary", {
                        exercises: t("rt.exercises", { count: r.items.length }),
                        sets: t("rt.sets", { count: r.items.reduce((n, i) => n + i.sets, 0) }),
                      })}
                    </span>
                  </span>
                  <span aria-hidden className="text-faint">
                    ›
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">{t("trn.assignNone")}</p>
        )}
        {!physio && (
          <div className="mt-4">
            <RehabPrograms onPick={(p) => void give({ name: rehabName(p), items: p.items, rehab: true })} />
          </div>
        )}
      </Sheet>
    </Section>
  );
}

const TONE = { warn: "var(--color-warn)", good: "var(--color-good)", info: "var(--color-accent)" } as const;

/** One client's report: what to act on first, their weeks, recent workouts and new bests. */
/** Each kind of sharing in a sentence ("Sam also shares heart rate and workout notes."). */
const KIND_WORD = {
  hr: "trn.kind.hr",
  notes: "trn.kind.notes",
  health: "trn.kind.health",
  body: "trn.kind.body",
  pain: "trn.kind.pain",
  cycle: "trn.kind.cycle",
} as const satisfies Record<ShareKind, string>;

/** How a client feels and recovers, when they share it: the newest check-in, a week of sleep, HRV and resting heart rate, their cycle day. */
function ClientReadiness({ name, r, shares }: { name: string; r: Readiness; shares: readonly ShareKind[] }) {
  const who = name || t("trn.noName");
  const lines: string[] = [];
  if (r.feel)
    lines.push(
      t(r.feel.unwell ? "trn.feltUnwell" : r.feel.energy > 0 ? "trn.feltGreat" : r.feel.energy < 0 ? "trn.feltLow" : "trn.feltOkay", {
        day: date(r.feel.at, { weekday: "long" }),
      }) + (r.feel.sore ? ` ${t("trn.feltSore")}` : ""),
    );
  if (r.sleep != null) lines.push(t("trn.readySleep", { hours: fmtNum(r.sleep) }));
  if (r.hrv != null) lines.push(t("trn.readyHrv", { ms: r.hrv }));
  if (r.restingHr != null) lines.push(t("trn.readyRhr", { bpm: r.restingHr }));
  if (r.cycleDay != null && shares.includes("cycle")) lines.push(t("trn.cycleDay", { day: r.cycleDay }));
  return (
    <Section title={t("trn.readyTitle")} icon="heart">
      {lines.length ? (
        <ul className="card divide-y divide-line">
          {lines.map((l) => (
            <li key={l} className="num px-4 py-3 text-sm">
              {l}
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-1 text-sm text-muted">{t("trn.readyNone", { name: who })}</p>
      )}
      {(r.sleep != null || r.hrv != null || r.restingHr != null) && <p className="mt-2 px-1 text-xs text-muted">{t("trn.readyLead")}</p>}
    </Section>
  );
}

function ClientScreen({ id }: { id: string }) {
  const unit = useApp((s) => s.profile.unit);
  const lab = can("coaching");
  const [report, setReport] = useState<Report | null>(null);
  const [saved, setSaved] = useState<Note | null>(null);
  const [body, setBody] = useState<BodyShare | null>(null);
  const [physio, setPhysio] = useState(false);
  const [targets, setTargets] = useState<Targets | null>(null);
  const [checkins, setCheckins] = useState<Pick<ClientView, "checkins" | "repeat" | "forms" | "slots" | "pay" | "role">>({});
  const [error, setError] = useState<string | null>(null);
  // Bumped after assigning or taking back a routine, to load the client again.
  const [version, setVersion] = useState(0);
  useEffect(() => {
    if (!lab) return;
    let live = true;
    loadClient(id)
      .then((v) => {
        if (!live) return;
        setReport(clientReport(v, Date.now()));
        setSaved(v.note ?? null);
        setBody(v.body ?? null);
        // A coach who works as a physio sees pain first, and rehab programs lead the assign sheet.
        setPhysio(v.role === "physio");
        setTargets(v.targets ?? null);
        setCheckins({ checkins: v.checkins, repeat: v.repeat, forms: v.forms, slots: v.slots, pay: v.pay, role: v.role });
      })
      .catch((e: unknown) => live && setError(trainerError(e)));
    return () => {
      live = false;
    };
  }, [id, lab, version]);
  const back = { label: t("trn.back"), onClick: backToCoaching };
  if (!lab)
    return (
      <div className="pb-2">
        <ScreenHeader back={back} title={t("trn.title")} />
        <EmptyState
          icon="lock"
          title={t("trn.coachRow")}
          body={t("trn.coachRowPro")}
          action={<Button onClick={() => go("pro", "coaching")}>{t("pro.settings.see")}</Button>}
        />
      </div>
    );
  if (error)
    return (
      <div className="pb-2">
        <ScreenHeader back={back} title={t("trn.title")} />
        <EmptyState icon="info" title={error} action={<Button onClick={() => go("trainer")}>{t("trn.back")}</Button>} />
      </div>
    );
  if (!report) return <ScreenHeader back={back} title={t("trn.loading")} />;
  const remove = async () => {
    try {
      await unlinkPerson(id);
      haptic("toggle");
      track("feature", { name: "trainer", detail: "remove" });
      go("trainer");
    } catch (e) {
      oops();
      setError(trainerError(e));
    }
  };
  const names = report.names;
  return (
    // Desktop layout: the report flows into two columns (.desk-cols), what to do first.
    <div className="desk-cols pb-2">
      <ScreenHeader className="desk-span" back={back} kicker={t("trn.client")} title={report.name || t("trn.noName")} />
      <div className="desk-span mt-3">
        <Button className="w-full" icon="chat" onClick={() => go("trainer", `${CHAT}${id}`)}>
          {t("trn.messageNamed", { name: report.name || t("trn.noName") })}
        </Button>
      </div>
      <Section title={t("trn.todo")} icon="flag">
        <ul className="space-y-2">
          {report.flags.map((f, i) => {
            const x = flagText(f, names);
            return (
              <li key={i} className="card card-tint p-4" style={{ ["--tint" as string]: TONE[x.tone] }}>
                <p className="font-semibold">{x.title}</p>
                <p className="mt-1 text-sm text-muted">{x.advice}</p>
              </li>
            );
          })}
        </ul>
      </Section>
      {physio && <ClientPain name={report.name} rehab={report.rehab} names={names} />}
      <ClientSessions client={{ id, name: report.name, since: 0 }} slots={checkins.slots ?? []} onChange={() => setVersion((n) => n + 1)} />
      {checkins.pay && (
        <ClientPayments
          key={checkins.pay.price?.at ?? 0}
          clientId={id}
          pay={checkins.pay}
          role={checkins.role ?? null}
          onChange={() => setVersion((n) => n + 1)}
        />
      )}
      <NoteToClient clientId={id} saved={saved} onChange={() => setVersion((n) => n + 1)} />
      <Section title={t("trn.weeks")} icon="calendar">
        <div className="grid grid-cols-4 gap-2">
          {report.weeks.map((w, i) => (
            <div key={w.start} className="card px-2 py-3 text-center">
              <div className="display num text-2xl">
                {w.count}
                {report.goal ? <span className="text-sm text-muted">/{report.goal}</span> : null}
              </div>
              <div className="mt-1 text-xs text-muted">
                {i === 3 ? t("trn.thisWeek") : date(w.start, { month: "short", day: "numeric" })}
              </div>
            </div>
          ))}
        </div>
      </Section>
      <Section title={t("trn.recent")} icon="clock">
        {report.sessions.length ? (
          <ul className="card divide-y divide-line">
            {report.sessions.map((s) => (
              <li key={s.sessionId} className="px-4 py-3">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-medium">{date(s.start, { weekday: "short", month: "short", day: "numeric" })}</span>
                  <span className="num text-sm text-muted">
                    {t("trn.workoutLine", { minutes: Math.round(s.seconds / 60), sets: s.sets })}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-muted">{s.exercises.map((e) => liftName(e, names)).join(", ")}</p>
                {s.prs > 0 && (
                  <p className="mt-0.5 flex items-center gap-1 text-sm text-good">
                    <Icon name="trophy" size={14} /> {t("trn.prCount", { count: s.prs })}
                  </p>
                )}
                {/* Heart rate, when the client shares it. */}
                {s.avgHr != null && (
                  <p className="num mt-0.5 flex items-center gap-1 text-sm text-muted">
                    <Icon name="heart" size={14} /> {t("trn.hrLine", { avg: Math.round(s.avgHr), max: Math.round(s.maxHr ?? s.avgHr) })}
                  </p>
                )}
                {/* Their own notes, when they share them. */}
                {(report.notes.get(s.sessionId) ?? []).map((n, i) => (
                  <p key={i} className="mt-1 border-l-2 border-line pl-2 text-sm whitespace-pre-line">
                    {n}
                  </p>
                ))}
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-1 text-sm text-muted">{t("trn.noWorkouts")}</p>
        )}
      </Section>
      <ClientPlans key={String(physio)} clientId={id} plans={report.plans} physio={physio} onChange={() => setVersion((n) => n + 1)} />
      {!physio && report.rehab && <ClientPain name={report.name} rehab={report.rehab} names={names} />}
      <ClientCheckins
        clientId={id}
        forms={checkins.forms ?? []}
        checkins={checkins.checkins ?? []}
        repeat={checkins.repeat ?? null}
        onChange={() => setVersion((n) => n + 1)}
      />
      <ClientTargets
        key={targets?.at ?? 0}
        clientId={id}
        saved={targets}
        body={body}
        now={report.now}
        onChange={() => setVersion((n) => n + 1)}
      />
      {report.readiness && <ClientReadiness name={report.name} r={report.readiness} shares={report.shares} />}
      {body && <ClientBody name={report.name} body={body} />}
      {report.prs.length > 0 && (
        <Section title={t("trn.bests")} icon="trophy">
          <ul className="card divide-y divide-line">
            {report.prs.slice(0, 8).map((p) => (
              <li key={`${p.exerciseId}-${p.at}`} className="flex items-baseline justify-between gap-2 px-4 py-3">
                <span className="min-w-0 truncate font-medium">{liftName(p.exerciseId, names)}</span>
                <span className="num shrink-0 text-sm text-muted">
                  {fmtWeight(p.weight, unit)} × {p.reps}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}
      <p className="mt-6 px-1 text-xs text-muted">
        {report.shares.length
          ? t("trn.sharedList", { name: report.name || t("trn.noName"), list: list(report.shares.map((k) => t(KIND_WORD[k]))) })
          : t("trn.sharedNone", { name: report.name || t("trn.noName") })}
      </p>
      <p className="mt-2 px-1 text-xs text-muted">{t("trn.whatYouSee")}</p>
      <Button kind="danger" className="mt-4 w-full" onClick={() => void remove()}>
        {t("trn.remove")}
      </Button>
    </div>
  );
}
