"use client";

// Team session (#/team-session/<team id>; Melvin, 2026-11-19, gap item 5; docs/decisions/school-teams.md "Team
// sessions"). A school coach runs one workout for a whole team from one tablet: pick a routine, start, and hand the
// tablet round. Each athlete taps their first name, logs a set (the weight starts where they left off, with the reason
// under it) and the roster comes back for the next one. The Board says who hasn't started and where everyone is, never
// a weight. Everything is kept on the tablet and sent behind the screen (src/lib/teamSession.ts), so the gym's
// reception doesn't matter. Ending saves each athlete's sets into their own account as a workout.
//
// Full screen like the workout (no tab bar), so an athlete can't wander off into the coach's app, and the screen stays
// on while it runs.
import { useEffect, useMemo, useState } from "react";

import { track } from "@/lib/analytics";
import { exerciseName } from "@/lib/game";
import { t } from "@/lib/i18n";
import { haptic, keepAwake, oops, sound } from "@/lib/juice";
import { TIMED } from "@/lib/progression";
import { useApp } from "@/lib/store";
import {
  boardOf,
  clearTeamSession,
  endTeamSession,
  firstName,
  flushTeamSession,
  loadLastWeights,
  logTeamSet,
  nextFor,
  planFrom,
  progressOf,
  startTeamSession,
  startWeight,
  undoTeamSet,
  useTeamSession,
  type TeamPlanItem,
  type TeamSessionState,
} from "@/lib/teamSession";
import { fmtNum, fromKg, plainNum, toKg } from "@/lib/units";
import { useVisible } from "@/lib/visibility";

import { Icon } from "./icons";
import { go } from "./router";
import { useTeams } from "./SchoolTeams";
import { BoardList } from "./TeamBoardList";
import { Bump, BumpField, Button, Chip, EmptyState, ScreenHeader, Sheet } from "./ui";

export default function TeamSession({ arg }: { arg?: string }) {
  const session = useTeamSession((s) => s.session);
  // The screen stays on while a session runs; the phone drops the lock when hidden, so it's asked for again on return.
  const visible = useVisible();
  useEffect(() => {
    if (!session || session.endedAt !== undefined) return;
    void keepAwake(visible);
    return () => void keepAwake(false);
  }, [visible, session]);
  // Behind the screen: send what the server doesn't have, now and every 20 seconds while it's on screen.
  useEffect(() => {
    if (!session || session.done || !visible) return;
    void flushTeamSession();
    const id = setInterval(() => void flushTeamSession(), 20_000);
    const online = () => void flushTeamSession();
    window.addEventListener("online", online);
    return () => {
      clearInterval(id);
      window.removeEventListener("online", online);
    };
  }, [session?.id, session?.done, visible]); // eslint-disable-line react-hooks/exhaustive-deps

  if (session && session.endedAt !== undefined) return <Ended session={session} />;
  if (session) return <Running session={session} />;
  return <Setup team={arg ?? ""} />;
}

// --- Setup: pick the team's workout and start ---

function Setup({ team }: { team: string }) {
  const { data } = useTeams();
  const routines = useApp((s) => s.profile.routines ?? []);
  const goal = useApp((s) => s.profile.goal);
  const tm = data?.teams.find((x) => x.id === team);
  const members = data?.members[team] ?? [];
  const [pick, setPick] = useState<string | null>(null);
  const routine = routines.find((r) => r.id === (pick ?? routines[0]?.id));
  // The routine's plan, with any reps the coach changed here (kept per routine, so another pick starts fresh).
  const [edited, setEdited] = useState<{ id: string; plan: TeamPlanItem[] } | null>(null);
  const plan = useMemo(
    () => (routine && edited?.id === routine.id ? edited.plan : routine ? planFrom(routine.items, goal) : []),
    [routine, edited, goal],
  );
  const setPlan = (p: TeamPlanItem[]) => routine && setEdited({ id: routine.id, plan: p });
  const [busy, setBusy] = useState(false);
  const step = (i: number, d: 1 | -1) => {
    const next = stepReps(plan, i, d);
    if (next) setPlan(next);
    return !!next;
  };
  const back = { label: t("trn.title"), onClick: () => go("trainer", "teams") };

  const start = async () => {
    if (!tm || !routine || !plan.length || !members.length) return;
    setBusy(true);
    // Last weights come from the server when it can be reached; without them each athlete starts from their own first set.
    const last = await loadLastWeights(tm.id).catch(() => ({}));
    const roster = members.map((m) => ({ id: m.id, name: firstName(m.name) || t("trn.noName") }));
    startTeamSession(tm, routine.name, plan, roster, last);
    haptic("success");
    sound.start();
    track("feature", { name: "teamSession", detail: "start" });
    setBusy(false);
  };

  if (!data) return <ScreenHeader title={t("team.ses.title")} back={back} />;
  if (!tm)
    return (
      <div>
        <ScreenHeader title={t("team.ses.title")} back={back} />
        <EmptyState icon="people" title={t("team.ses.noTeam")} body={t("team.ses.noTeamBody")} />
      </div>
    );
  return (
    <div className="space-y-4 pb-8">
      <ScreenHeader title={t("team.ses.title")} kicker={tm.name} back={back} />
      <p className="text-muted">{t("team.ses.lead")}</p>
      {!members.length ? (
        <section className="card p-4">
          <EmptyState icon="people" title={t("team.ses.noAthletes")} body={t("team.ses.noAthletesBody")} />
        </section>
      ) : !routines.length ? (
        <section className="card p-4">
          <EmptyState
            icon="list"
            title={t("team.ses.noRoutines")}
            body={t("team.ses.noRoutinesBody")}
            action={
              <Button kind="ghost" onClick={() => go("programs")}>
                {t("team.ses.makeRoutine")}
              </Button>
            }
          />
        </section>
      ) : (
        <>
          <section className="card p-4">
            <p className="font-semibold">{t("team.ses.pick")}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {routines.map((r) => (
                <Chip key={r.id} active={r.id === routine?.id} onClick={() => setPick(r.id)}>
                  {r.name}
                </Chip>
              ))}
            </div>
          </section>
          <section className="card p-4">
            <p className="font-semibold">{t("team.ses.plan")}</p>
            <p className="mt-1 text-sm text-muted">{t("team.ses.planWhy")}</p>
            {!plan.length && <p className="mt-3 text-sm text-warn">{t("team.ses.planEmpty")}</p>}
            <ul className="mt-2 divide-y divide-line">
              {plan.map((it, i) => (
                <li key={it.exerciseId} className="flex flex-wrap items-center gap-2 py-2">
                  <span className="min-w-0 flex-1 font-medium">{exerciseName(it.exerciseId)}</span>
                  <span className="flex items-center gap-1">
                    <Bump
                      dir={-1}
                      size="sm"
                      aria={t("team.ses.repsFor", { exercise: exerciseName(it.exerciseId) })}
                      onStep={() => step(i, -1)}
                    />
                    <span className="num w-16 text-center text-sm">{t("team.ses.setsReps", { sets: it.sets, reps: it.reps })}</span>
                    <Bump
                      dir={1}
                      size="sm"
                      aria={t("team.ses.repsFor", { exercise: exerciseName(it.exerciseId) })}
                      onStep={() => step(i, 1)}
                    />
                  </span>
                </li>
              ))}
            </ul>
          </section>
          <Button className="w-full" disabled={busy || !plan.length} onClick={() => void start()}>
            {t("team.ses.go", { count: members.length })}
          </Button>
        </>
      )}
    </div>
  );
}

/** The plan with one exercise's reps moved up or down; null at the end of the range, so a hold stops. */
function stepReps(plan: readonly TeamPlanItem[], i: number, d: 1 | -1): TeamPlanItem[] | null {
  const it = plan[i];
  if (!it) return null;
  const reps = Math.min(100, Math.max(1, it.reps + d));
  return reps === it.reps ? null : plan.map((x, j) => (j === i ? { ...x, reps } : x));
}

// --- Running: the roster and the board ---

function Running({ session }: { session: TeamSessionState }) {
  const [tab, setTab] = useState<"athletes" | "board">("athletes");
  const [who, setWho] = useState<string | null>(null);
  const [ending, setEnding] = useState(false);
  const [undo, setUndo] = useState<{ id: string; name: string } | null>(null);
  const waiting = useTeamSession((s) => s.waiting);
  useEffect(() => {
    if (!undo) return;
    const id = setTimeout(() => setUndo(null), 8000);
    return () => clearTimeout(id);
  }, [undo]);
  const athlete = session.roster.find((a) => a.id === who);
  return (
    <div className="space-y-4 pb-8">
      <ScreenHeader title={session.teamName} kicker={`${t("team.ses.title")} · ${session.name}`} />
      <div className="flex gap-2" role="group" aria-label={t("team.ses.title")}>
        <Chip active={tab === "athletes"} onClick={() => setTab("athletes")}>
          {t("team.ses.tabAthletes")}
        </Chip>
        <Chip active={tab === "board"} onClick={() => setTab("board")}>
          {t("team.ses.tabBoard")}
        </Chip>
      </div>
      {waiting && (
        <p className="flex items-center gap-2 text-sm text-muted" role="status">
          <Icon name="offline" size={16} />
          {t(waiting === "refused" ? "team.ses.refused" : "team.ses.offline")}
        </p>
      )}
      {undo && (
        <div className="card flex items-center gap-3 p-3" role="status">
          <Icon name="check" size={18} />
          <span className="min-w-0 flex-1 truncate">{t("team.ses.logged", { name: undo.name })}</span>
          <Button
            kind="ghost"
            className="!px-4 !py-2"
            onClick={() => {
              undoTeamSet(undo.id);
              sound.back();
              setUndo(null);
            }}
          >
            {t("team.ses.undo")}
          </Button>
        </div>
      )}
      {tab === "athletes" ? (
        <Roster session={session} onPick={setWho} />
      ) : (
        <BoardList rows={boardOf(session).rows} nudge={boardNudge(session)} />
      )}
      <Button kind="danger" className="w-full" onClick={() => setEnding(true)}>
        {t("team.ses.end")}
      </Button>
      {athlete && (
        <LogSheet
          key={athlete.id}
          session={session}
          athlete={athlete}
          onClose={() => setWho(null)}
          onLogged={(id) => {
            setWho(null);
            setUndo({ id, name: athlete.name });
          }}
        />
      )}
      <Sheet open={ending} onClose={() => setEnding(false)} title={t("team.ses.endAsk")}>
        <p className="text-muted">{t("team.ses.endBody")}</p>
        <div className="mt-4 flex flex-col gap-2">
          <Button
            className="w-full"
            onClick={() => {
              endTeamSession();
              haptic("success");
              sound.done();
              track("feature", { name: "teamSession", detail: "end" });
              setEnding(false);
            }}
          >
            {t("team.ses.endYes")}
          </Button>
          <Button kind="ghost" className="w-full" onClick={() => setEnding(false)}>
            {t("team.ses.keep")}
          </Button>
        </div>
      </Sheet>
    </div>
  );
}

/** The board's action line: who hasn't started, before the list. */
function boardNudge(session: TeamSessionState): string {
  const b = boardOf(session);
  if (b.rows.every((r) => r.done === 0)) return t("team.ses.boardNone");
  if (b.notStarted > 0) return t("team.ses.boardNudge", { count: b.notStarted });
  if (b.finished === b.rows.length) return t("team.ses.boardAllDone");
  return t("team.ses.boardStarted");
}

function Roster({ session, onPick }: { session: TeamSessionState; onPick: (id: string) => void }) {
  return (
    <section>
      <p className="mb-2 text-sm text-muted">{t("team.ses.tapName")}</p>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {session.roster.map((a) => {
          const p = progressOf(session, a.id);
          const done = p.total > 0 && p.done >= p.total;
          return (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => {
                  haptic("select");
                  onPick(a.id);
                }}
                className="card press flex min-h-24 w-full flex-col items-start justify-between gap-2 p-4 text-left"
              >
                <span className="flex w-full items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-lg font-bold">{a.name}</span>
                  {done && (
                    <span className="text-good">
                      <Icon name="check" size={20} />
                    </span>
                  )}
                </span>
                <span className="text-sm text-muted">
                  {done ? t("team.ses.finished") : t("team.ses.progress", { done: p.done, total: p.total })}
                </span>
                <span className="h-1.5 w-full overflow-hidden rounded-full bg-raised" aria-hidden>
                  <span className="block h-full rounded-full bg-accent" style={{ width: `${p.total ? (100 * p.done) / p.total : 0}%` }} />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// --- One athlete logs a set ---

function LogSheet({
  session,
  athlete,
  onClose,
  onLogged,
}: {
  session: TeamSessionState;
  athlete: { id: string; name: string };
  onClose: () => void;
  onLogged: (id: string) => void;
}) {
  const unit = useApp((s) => s.profile.unit);
  const next = nextFor(session, athlete.id);
  const [exercise, setExercise] = useState(next?.item.exerciseId ?? session.plan[0]?.exerciseId ?? "");
  const item = session.plan.find((p) => p.exerciseId === exercise) ?? session.plan[0]!;
  const count = session.sets.filter((x) => x.athlete === athlete.id && x.exercise === item.exerciseId && x.reps > 0).length;
  const from = startWeight(session, athlete.id, item.exerciseId);
  const here = session.sets.some((x) => x.athlete === athlete.id && x.exercise === item.exerciseId);
  const [weight, setWeight] = useState(() => (from ? plainNum(fromKg(from.weight, unit)) : ""));
  const [reps, setReps] = useState(() => String(item.reps));
  const timed = TIMED.has(item.exerciseId);
  // Every pre-filled weight says where it came from (Action over stats: every recommendation says why).
  const why = useMemo(() => (here ? t("team.ses.fromHere") : from ? t("team.ses.fromLast") : t("team.ses.fromNone")), [here, from]);
  const log = () => {
    const w = Number(weight || "0");
    const r = Number(reps || "0");
    if (!Number.isFinite(w) || !Number.isFinite(r) || r < 0) return oops();
    const id = logTeamSet(athlete.id, item.exerciseId, toKg(w, unit), Math.round(r), item.reps);
    if (!id) return oops();
    haptic("tap");
    sound.log();
    onLogged(id);
  };
  return (
    <Sheet open onClose={onClose} title={athlete.name}>
      {!next && <p className="mb-3 font-semibold text-good">{t("team.ses.allDone", { name: athlete.name })}</p>}
      {session.plan.length > 1 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label={t("team.ses.exercise")}>
          {session.plan.map((p) => (
            <Chip key={p.exerciseId} active={p.exerciseId === item.exerciseId} onClick={() => setExercise(p.exerciseId)}>
              {exerciseName(p.exerciseId)}
            </Chip>
          ))}
        </div>
      )}
      <p className="mt-4 text-xl font-bold">{exerciseName(item.exerciseId)}</p>
      <p className="text-muted">
        {t("team.ses.setOf", { n: Math.min(count + 1, item.sets), of: item.sets })} ·{" "}
        {t(timed ? "team.ses.aimSec" : "team.ses.aim", { reps: item.reps })}
      </p>
      <label htmlFor="team-weight" className="mt-4 block text-sm text-muted">
        {t("team.ses.weight", { unit })}
      </label>
      <BumpField
        id="team-weight"
        value={weight}
        onChange={setWeight}
        step={unit === "kg" ? 2.5 : 5}
        start={0}
        max={unit === "kg" ? 500 : 1100}
        label={t("team.ses.weight", { unit })}
        placeholder="0"
        size="lg"
        className="mt-1"
      />
      <p className="mt-1 text-sm text-muted">
        {why}
        {from && !here ? ` · ${fmtNum(fromKg(from.weight, unit))} ${unit} × ${from.reps}` : ""}
      </p>
      <label htmlFor="team-reps" className="mt-4 block text-sm text-muted">
        {t(timed ? "team.ses.seconds" : "team.ses.reps")}
      </label>
      <BumpField
        id="team-reps"
        value={reps}
        onChange={setReps}
        step={1}
        start={item.reps}
        max={600}
        label={t(timed ? "team.ses.seconds" : "team.ses.reps")}
        size="lg"
        className="mt-1"
      />
      <Button className="mt-5 w-full !py-4 text-lg" onClick={log}>
        {t("team.ses.log")}
      </Button>
    </Sheet>
  );
}

// --- Ended: saving, then saved ---

function Ended({ session }: { session: TeamSessionState }) {
  const waiting = useTeamSession((s) => s.waiting);
  const athletes = new Set(session.sets.filter((x) => x.reps > 0).map((x) => x.athlete)).size;
  return (
    <div className="space-y-4 pb-8">
      <ScreenHeader title={session.teamName} kicker={`${t("team.ses.title")} · ${session.name}`} />
      <section className="card p-4" role="status">
        {session.done ? (
          <EmptyState
            icon="check"
            mascot="cheer"
            title={t("team.ses.saved")}
            body={t("team.ses.savedBody", { count: athletes })}
            action={
              <Button
                onClick={() => {
                  clearTeamSession();
                  go("trainer", "teams");
                }}
              >
                {t("team.ses.done")}
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={waiting ? "offline" : "hourglass"}
            title={t("team.ses.saving")}
            body={waiting ? t(waiting === "refused" ? "team.ses.refused" : "team.ses.offline") : t("team.ses.savingBody")}
          />
        )}
      </section>
      <BoardList rows={boardOf(session).rows} nudge={t("team.ses.summary", { count: athletes })} />
    </div>
  );
}
