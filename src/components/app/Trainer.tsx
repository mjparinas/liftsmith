"use client";

// Trainer mode (#/trainer, docs/decisions/trainer-mode.md). Coaching's pages for each side live in CoachHome.tsx (a client
// sees only their coach; a coach gets a page per job; coachMode.ts decides). This file routes #/trainer/<arg> and holds a
// client's report (#/trainer/c.<id>), with the coach's note to them, and Today's cards from a coach. An invite link is
// #/trainer/<code>, which fills in the code.
// Physio support (2026-11-13) lives in CoachRehab.tsx: the Physio role, pain and injuries, rehab programs.
// School teams (SchoolTeams.tsx) sit at the bottom; a team link is #/trainer/team.<code>.
import { useEffect, useState } from "react";

import { SECTION_LABEL } from "@/components/titles";
import { track } from "@/lib/analytics";
import { useAccount } from "@/lib/auth";
import { savePendingCoach } from "@/lib/coachInvite";
import { COACH_TABS, coachTools } from "@/lib/coachMode";
import { assignProgram, endProgramAssign, type ProgramAssign } from "@/lib/coachProgramAssign";
import { loadMine, type CoachProgram } from "@/lib/coachPrograms";
import { can } from "@/lib/entitlements";
import { date, list, t, tFor } from "@/lib/i18n";
import { haptic, oops, sound } from "@/lib/juice";
import { liveRead } from "@/lib/liveRead";
import { phaseRoutineName, rehabProgram, type RehabProgram } from "@/lib/rehab";
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
import { useNow } from "@/lib/useNow";

import { Avatar } from "./AvatarFace";
import { ClientProgramDays } from "./ClientProgramDays";
import { ClientBody } from "./CoachBody";
import { CalendarAccessScreen, TrainingActivityScreen } from "./CoachCalendar";
import { backToCoaching, ChatScreen } from "./CoachChat";
import { CheckinScreen, CheckinToday, ClientCheckins, FormsScreen } from "./CoachCheckins";
import { CoachHome } from "./CoachHome";
import { ClientPayments } from "./CoachPay";
import { ClientPain, PerWeekPicker, PlanPhase, protocolRoutine, RehabPrograms } from "./CoachRehab";
import { ClientSessions, SessionToday } from "./CoachSessions";
import { ClientTargets } from "./CoachTargets";
import { CoachVideos, VideoScreen } from "./FormVideos";
import { Icon } from "./icons";
import { MessageButton } from "./MessageButton";
import { ProgramCalendar } from "./ProgramCalendar";
import { go } from "./router";
import { partLabel } from "./Stretch";
import { TeamChat } from "./TeamChat";
import { Button, EmptyState, ScreenHeader, Section, Sheet } from "./ui";

const CLIENT = "c.";
const CHAT = "m.";
const TEAM = "team.";
const CHECKIN = "f.";
// A form video (FormVideos.tsx), for the coach or the client.
const VIDEO = "v.";
// A school team's chat (TeamChat.tsx), for its athletes and coach.
const TEAM_CHAT = "tc.";

export function Trainer({ arg }: { arg?: string }) {
  const account = useAccount((s) => s.account);
  const code = arg && !arg.includes(".") && !(COACH_TABS as readonly string[]).includes(arg) ? codeFrom(arg) : "";
  // Signed out with a team's link: the code waits with its "team." mark, so signing in opens the team (coachInvite.ts).
  if (!account) return <SignedOut code={arg?.startsWith(TEAM) ? `${TEAM}${teamCodeFrom(arg.slice(TEAM.length))}` : code} />;
  if (arg?.startsWith(CLIENT)) return <ClientScreen id={arg.slice(CLIENT.length)} />;
  if (arg?.startsWith(CHAT)) return <ChatScreen id={arg.slice(CHAT.length)} />;
  if (arg?.startsWith(TEAM_CHAT)) return <TeamChat id={arg.slice(TEAM_CHAT.length)} />;
  // A school team's link (#/trainer/team.<code>, SchoolTeams.tsx) fills in the team code instead.
  if (arg?.startsWith(TEAM)) return <CoachHome team={teamCodeFrom(arg.slice(TEAM.length))} />;
  if (arg?.startsWith(CHECKIN)) return <CheckinScreen id={arg.slice(CHECKIN.length)} />;
  if (arg?.startsWith(VIDEO)) return <VideoScreen id={arg.slice(VIDEO.length)} />;
  if (arg === "training-activity") return <TrainingActivityScreen />;
  if (arg === "calendar-access") return <CalendarAccessScreen />;
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
        body={code ? t("trn.signInCodeBody", { code: showCode(code.replace(TEAM, "")) }) : t("trn.signInBody")}
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

/**
 * The coach's note as one card, the note and what to do with it together (Melvin, 2026-11-26: the buttons sat under
 * the card and didn't read as part of it): who it's from with their initial, the words, then Open coaching and Got it
 * on a footer inside the same card.
 */
function NoteToday({ n }: { n: ShownNote }) {
  const name = n.coach || t("trn.noName");
  return (
    <section
      className="card card-tint mt-4 p-4"
      style={{ ["--tint" as string]: "var(--color-violet)" }}
      aria-labelledby="coach-note-title"
      data-testid="coach-note-today"
    >
      <div className="flex items-center gap-3">
        <Avatar name={name} size={40} />
        <div className="min-w-0 flex-1">
          <h2 id="coach-note-title" className={SECTION_LABEL}>
            {n.role === "trainer" ? t("trn.fromTrainer") : t("trn.fromCoach")}
          </h2>
          <p className="mt-0.5 truncate text-sm">
            <span className="font-semibold">{name}</span>
            <span className="text-muted"> · {date(n.at, { month: "short", day: "numeric" })}</span>
          </p>
        </div>
      </div>
      <p className="mt-3 text-[1.0625rem] leading-relaxed whitespace-pre-line break-words">{n.text}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-3">
        <Button kind="ghost" icon="chat" className="flex-1" onClick={() => go("trainer")}>
          {t("trn.noteOpen")}
        </Button>
        <Button
          kind="quiet"
          icon="check"
          onClick={() => {
            haptic("tick");
            dismissNote(n);
          }}
        >
          {t("coach.gotIt")}
        </Button>
      </div>
    </section>
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

/** Season program assign + this client's month calendar (docs/decisions/coach-programs.md). */
function ClientProgramAssign({
  clientId,
  assigns,
  onChange,
  athlete,
}: {
  clientId: string;
  assigns: ProgramAssign[];
  onChange: () => void;
  athlete: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [cal, setCal] = useState(false);
  const [programs, setPrograms] = useState<CoachProgram[] | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const now = useNow(60_000);
  const openOnes = assigns.filter((a) => a.status === "pending" || a.status === "active");
  const active = openOnes.find((a) => a.status === "active") ?? openOnes[0];
  const openAssign = () => {
    setOpen(true);
    void loadMine()
      .then((m) => setPrograms(m.mine))
      .catch(() => setPrograms([]));
  };
  const assignOne = async (p: CoachProgram) => {
    try {
      const weekdays = p.days.map((d, i) => d.weekdays ?? [[1], [2], [4], [5], [3], [6]][i] ?? [1 + (i % 5)]);
      const r = await assignProgram(p.id, { type: "clients", ids: [clientId] }, weekdays);
      haptic("success");
      track("feature", { name: "trainer", detail: "assignProgram" });
      setNote(tFor(athlete, "cpg.assignDone", { count: r.assigned.length, skip: r.skipped.length }));
      setOpen(false);
      onChange();
    } catch (e) {
      oops();
      setNote(trainerError(e));
    }
  };
  return (
    <Section title={t("cpg.clientAssign")} icon="calendar">
      {active && (
        <div className="card mb-3 p-4">
          <p className="font-semibold">{active.title}</p>
          <p className="mt-1 text-sm text-muted">
            {active.status === "active" && active.startedAt
              ? t("cpg.clientFollowing", {
                  week: Math.min(active.weeks, Math.floor((now - active.startedAt) / (7 * 86_400_000)) + 1),
                  weeks: active.weeks,
                })
              : t("cpg.clientPending")}
          </p>
          {active.status === "active" && (
            <Button kind="ghost" className="mt-2" onClick={() => setCal(true)}>
              {t("cpg.assignCalendar")}
            </Button>
          )}
          <ClientProgramDays assign={active} athlete={athlete} onChange={onChange} />
        </div>
      )}
      {note && (
        <p className="mb-2 text-sm text-muted" role="status">
          {note}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button kind="ghost" icon="layers" onClick={openAssign}>
          {t("cpg.clientAssign")}
        </Button>
        {active && (
          <Button
            kind="danger"
            onClick={() =>
              void endProgramAssign(active.id)
                .then(() => {
                  haptic("toggle");
                  setNote(t("cpg.assignTaken"));
                  onChange();
                })
                .catch((e: unknown) => setNote(trainerError(e)))
            }
          >
            {t("cpg.assignTakeBack")}
          </Button>
        )}
      </div>
      <Sheet open={open} onClose={() => setOpen(false)} title={t("cpg.clientAssign")}>
        <p className="text-sm text-muted">{tFor(athlete, "cpg.assignHint")}</p>
        {!programs ? (
          <p className="mt-3 text-sm text-muted">…</p>
        ) : programs.length === 0 ? (
          <p className="mt-3 text-sm text-muted">{t("cpg.noneMineBody")}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {programs.map((p) => (
              <li key={p.id}>
                <Button kind="ghost" className="w-full" onClick={() => void assignOne(p)}>
                  {p.title}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Sheet>
      {active && (
        <Sheet open={cal} onClose={() => setCal(false)} title={t("cpg.cal.title")} wide>
          <ProgramCalendar programId={active.programId} clientId={clientId} athlete={athlete} />
        </Sheet>
      )}
    </Section>
  );
}

/** The coach's routines for one client (stage 2): how each is going, take one back, or assign another. */
function ClientPlans({
  clientId,
  plans,
  physio,
  rehab,
  athlete,
  onChange,
}: {
  clientId: string;
  plans: PlanProgress[];
  physio: boolean;
  /** Show rehab programs in the assign sheet (physio first; personal trainer after own routines; sports coach never). */
  rehab: boolean;
  athlete: boolean;
  onChange: () => void;
}) {
  const saved = useApp((s) => s.profile.routines);
  const routines = saved ?? [];
  const [picking, setPicking] = useState(false);
  const [perWeek, setPerWeek] = useState<number | undefined>(physio ? 3 : undefined);
  const [note, setNote] = useState<string | null>(null);
  const give = async (r: Pick<Routine, "name" | "items" | "rehab" | "parts" | "rehabPart" | "rehabPlan">, times = perWeek) => {
    try {
      // A rehab program carries its area and the times a week, so the client's app can follow them (2026-11-15).
      await assignPlan(clientId, r.name, encodeRoutine(r.rehab ? { ...r, perWeek: times } : r), times);
      haptic("success");
      sound.done();
      track("feature", { name: "trainer", detail: r.rehabPlan ? `rehabPhase${r.rehabPlan.phase}` : r.rehab ? "rehab" : "assign" });
      setPicking(false);
      setNote(t("trn.assigned"));
      onChange();
    } catch (e) {
      oops();
      setNote(trainerError(e, athlete));
    }
  };
  // Rehab protocols (2026-11-17): moving a phase sends the client that phase and takes the old one back.
  const move = async (p: PlanProgress, phase: number) => {
    const proto = rehabProgram(p.rehab?.plan.id);
    if (!proto || !p.rehab) return;
    try {
      await assignPlan(
        clientId,
        phaseRoutineName(proto, phase),
        encodeRoutine({ ...protocolRoutine(proto, phase, !!p.rehab.plan.self), perWeek: p.rehab.perWeek }),
        p.plan.perWeek,
      );
      await removePlan(p.plan.id);
      haptic("success");
      sound.done();
      track("feature", { name: "trainer", detail: "rehabPhaseMove" });
      setNote(t("rhp.coach.sent", { phase }));
      onChange();
    } catch (e) {
      oops();
      setNote(trainerError(e, athlete));
    }
  };
  const pickProtocol = (p: RehabProgram, phase: number, self: boolean) => void give(protocolRoutine(p, phase, self));
  const takeBack = async (p: PlanProgress) => {
    try {
      await removePlan(p.plan.id);
      haptic("toggle");
      track("feature", { name: "trainer", detail: "unassign" });
      onChange();
    } catch (e) {
      oops();
      setNote(trainerError(e, athlete));
    }
  };
  return (
    <Section title={tFor(athlete, "trn.plans")} icon="layers">
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
                {p.parts && (
                  <span className="block text-xs text-muted" data-testid="plan-parts">
                    {p.parts.map((x) => t("trn.partDone", { part: partLabel(x.kind), done: x.done, of: x.of })).join(" · ")}
                  </span>
                )}
                {p.plan.perWeek !== undefined && (
                  <span className="block text-xs text-muted">
                    {p.adherence
                      ? t("trn.adherence", { pct: p.adherence.pct, done: p.adherence.done, want: p.adherence.want })
                      : t("trn.perWeekShort", { count: p.plan.perWeek })}
                  </span>
                )}
                {p.rehab && <PlanPhase rehab={p.rehab} onMove={(phase) => void move(p, phase)} />}
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
        {/* A physio sees the rehab programs first; a trainer sees their own routines first; sports coaches never. */}
        {rehab && physio && <RehabPrograms onPick={pickProtocol} />}
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
        {rehab && !physio && (
          <div className="mt-4">
            <RehabPrograms onPick={pickProtocol} />
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
  const [tools, setTools] = useState(() => coachTools(null));
  const [targets, setTargets] = useState<Targets | null>(null);
  const [teen, setTeen] = useState(false);
  const [checkins, setCheckins] = useState<Pick<ClientView, "checkins" | "repeat" | "forms" | "slots" | "pay" | "role">>({});
  const [programAssigns, setProgramAssigns] = useState<ProgramAssign[]>([]);
  const [error, setError] = useState<string | null>(null);
  // Bumped after assigning or taking back a routine, to load the client again.
  const [version, setVersion] = useState(0);
  useEffect(() => {
    if (!lab) return;
    let live = true;
    liveRead(
      `coach.client.${id}`,
      () => loadClient(id),
      (v) => {
        if (!live) return;
        const report = clientReport(v, Date.now());
        // Sports coaches do not take payments, so a failed charge never leads their report.
        setReport(v.role === "coach" ? { ...report, flags: report.flags.filter((f) => f.kind !== "payFailed") } : report);
        setSaved(v.note ?? null);
        setBody(v.body ?? null);
        // Role gates tools on the report (2026-11-24); physio still leads with pain and rehab.
        setPhysio(v.role === "physio");
        setTools(coachTools(v.role ?? null));
        setTargets(v.targets ?? null);
        setTeen(v.teen === true);
        setCheckins({ checkins: v.checkins, repeat: v.repeat, forms: v.forms, slots: v.slots, pay: v.pay, role: v.role });
        setProgramAssigns(v.programAssigns ?? []);
      },
    ).catch((e: unknown) => live && setError(trainerError(e, useCoachNotes.getState().who.role === "coach")));
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
  const athlete = checkins.role === "coach";
  const remove = async () => {
    try {
      await unlinkPerson(id);
      haptic("toggle");
      track("feature", { name: "trainer", detail: "remove" });
      go("trainer");
    } catch (e) {
      oops();
      setError(trainerError(e, athlete));
    }
  };
  const names = report.names;
  return (
    // Desktop layout: the report flows into two columns (.desk-cols), what to do first.
    <div className="desk-cols pb-2">
      <ScreenHeader className="desk-span" back={back} kicker={tFor(athlete, "trn.client")} title={report.name || t("trn.noName")} />
      <div className="desk-span mt-3">
        <MessageButton id={id} name={report.name || t("trn.noName")} className="w-full">
          {t("trn.messageNamed", { name: report.name || t("trn.noName") })}
        </MessageButton>
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
      {physio && tools.rehab && <ClientPain name={report.name} rehab={report.rehab} names={names} />}
      {tools.sessions && (
        <ClientSessions
          client={{ id, name: report.name, since: 0 }}
          slots={checkins.slots ?? []}
          onChange={() => setVersion((n) => n + 1)}
        />
      )}
      {tools.pay && checkins.pay && (
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
      {report.schedule && (
        <Section title={t("trn.calendar.adherence")} icon="calendar">
          <p className="card p-4 text-sm">{t("trn.calendar.adherenceLine", report.schedule)}</p>
        </Section>
      )}
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
      <ClientPlans
        key={`${physio}-${tools.rehab}`}
        clientId={id}
        plans={report.plans}
        physio={physio}
        rehab={tools.rehab || checkins.role === "trainer"}
        athlete={athlete}
        onChange={() => setVersion((n) => n + 1)}
      />
      <ClientProgramAssign clientId={id} assigns={programAssigns} athlete={athlete} onChange={() => setVersion((n) => n + 1)} />
      {/* Pain shared with a personal trainer: secondary, below plans (not for sports coaches). */}
      {!physio && checkins.role === "trainer" && report.rehab && <ClientPain name={report.name} rehab={report.rehab} names={names} />}
      {tools.checkins && (
        <ClientCheckins
          clientId={id}
          forms={checkins.forms ?? []}
          checkins={checkins.checkins ?? []}
          repeat={checkins.repeat ?? null}
          teen={teen}
          onChange={() => setVersion((n) => n + 1)}
        />
      )}
      {tools.videos && <CoachVideos clientId={id} name={report.name} teen={teen} />}
      {tools.nutrition && (
        <ClientTargets
          key={targets?.at ?? 0}
          clientId={id}
          saved={targets}
          body={body}
          teen={teen}
          name={report.name}
          now={report.now}
          onChange={() => setVersion((n) => n + 1)}
        />
      )}
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
      <p className="mt-2 px-1 text-xs text-muted">{tFor(athlete, "trn.whatYouSee")}</p>
      <Button kind="danger" className="mt-4 w-full" onClick={() => void remove()}>
        {tFor(athlete, "trn.remove")}
      </Button>
    </div>
  );
}
