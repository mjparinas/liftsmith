"use client";

// My team (Melvin, 2026-11-25: "an athlete should not see the athletes tab, or even set up, or programs. they should have
// a new view that's like 'my team', which shows which team they are on, their coach, what programs they were assigned,
// team chat, coach chat, really it's a dashboard. also make this work well on web and mobile"; docs/decisions/
// school-teams.md "My team"). What an athlete on a school team sees in Coaching, in place of the coach's tabs:
// - a team a coach added them to, waiting for their age and yes (no code needed);
// - each team: its name, school, coach and athletes, with Team chat (and its red count) first;
// - their coach, with Message;
// - the programs the coach assigned, each with Follow or how far along it is;
// - the team's week, action first, weights never shown.
// On a phone it's one column; on the desktop layout the team and its week sit on the left, the coach and programs on
// the right. Pure web code, so Android, iOS and the web get it together.
import { useEffect, useState, type ReactNode } from "react";

import { track } from "@/lib/analytics";
import { acceptProgramAssign, coachProgramWeek, followAssign, type ProgramAssign } from "@/lib/coachProgramAssign";
import { t } from "@/lib/i18n";
import { haptic, oops, sound } from "@/lib/juice";
import { MAX_ROUTINES, upsertRoutine } from "@/lib/routines";
import { useApp } from "@/lib/store";
import {
  acceptTeamInvite,
  declineTeamInvite,
  leaveTeam,
  loadBoard,
  teamError,
  type BoardRow,
  type Team,
  type TeamsOverview,
} from "@/lib/teams";
import type { Overview, Person } from "@/lib/trainer";

import { Icon } from "./icons";
import { go } from "./router";
import { JoinTeam } from "./SchoolTeams";
import { Button, CountDot, Section } from "./ui";

/** How many teammates the week shows before Show everyone. */
const WEEK_ROWS = 5;

export function MyTeam({
  data,
  teams,
  onChange,
  onJoined,
  more,
}: {
  data: Overview;
  teams: TeamsOverview;
  onChange: () => void;
  onJoined: () => void;
  /** What else the coach sent (notes, check-ins, sharing), under the programs. */
  more?: ReactNode;
}) {
  const [note, setNote] = useState<string | null>(null);
  const coachOf = (team: Team) => data.coaches.find((c) => c.id === team.coachId);
  // One card per coach, even when they run two of the lifter's teams.
  const coaches = [...new Map(teams.joined.map((tm) => [tm.coachId, coachOf(tm)])).values()].filter((c): c is Person => !!c);
  const ids = new Set(teams.joined.map((tm) => tm.coachId));
  const assigns = (data.programAssigns ?? []).filter((a) => ids.has(a.coachId) && a.status !== "ended");
  return (
    // On a phone one column, in the order that matters (team, coach, programs, week, then the rest); on the desktop layout
    // two columns, the team, its week and the rest on the left and the coach and programs on the right, so neither column
    // runs long beside an empty one. The columns are `contents` on phones, so `order` places every card.
    <div className="mt-4 flex flex-col gap-4 desk:grid desk:grid-cols-[minmax(0,1fr)_24rem] desk:items-start desk:gap-6">
      <div className="contents min-w-0 desk:flex desk:flex-col desk:gap-4">
        {teams.invites.map((tm) => (
          <div key={tm.id} className="order-1">
            <Invite team={tm} onJoined={onJoined} onChange={onChange} />
          </div>
        ))}
        {teams.joined.map((tm) => (
          <div key={tm.id} className="order-2">
            <TeamCard team={tm} unread={teams.chatUnread[tm.id] ?? 0} />
          </div>
        ))}
        {teams.joined.map((tm) => (
          <div key={tm.id} className="order-5">
            <Week team={tm} />
          </div>
        ))}
        {more && <div className="order-6 min-w-0 space-y-4">{more}</div>}
      </div>
      <div className="contents min-w-0 desk:flex desk:flex-col desk:gap-4">
        {coaches.map((c) => (
          <div key={c.id} className="order-3">
            <CoachCard coach={c} unread={data.unread?.[c.id] ?? 0} assistants={assistantsOf(teams.joined, c.id)} />
          </div>
        ))}
        {teams.joined.length > 0 && (
          <div className="order-4">
            <Programs assigns={assigns} coach={coaches[0]?.name ?? ""} />
          </div>
        )}
        {teams.joined.map((tm) => (
          <div key={tm.id} className="order-7">
            <Leave team={tm} onChange={onChange} onNote={setNote} />
          </div>
        ))}
        {note && (
          <p className="order-8 text-sm text-muted" role="status">
            {note}
          </p>
        )}
      </div>
    </div>
  );
}

/** A coach added this athlete to a team: their age and yes, then they're on it. */
function Invite({ team, onJoined, onChange }: { team: Team; onJoined: () => void; onChange: () => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <div>
      <p className="mb-2 flex items-center gap-2 px-1 text-sm font-semibold text-ember">
        <Icon name="trophy" size={16} />
        {t("mt.invited", { coach: team.coachName || t("trn.noName"), team: team.name })}
      </p>
      <JoinTeam
        code=""
        found={team}
        join={(age) => acceptTeamInvite(team.id, age)}
        onChange={onJoined}
        cancelLabel={t("mt.decline")}
        onCancel={() => {
          if (busy) return;
          setBusy(true);
          void declineTeamInvite(team.id)
            .then(() => {
              haptic("toggle");
              onChange();
            })
            .catch(() => oops())
            .finally(() => setBusy(false));
        }}
      />
    </div>
  );
}

/** The team itself: school, name, coach and size, with Team chat first. */
function TeamCard({ team, unread }: { team: Team; unread: number }) {
  return (
    <section className="card card-tint p-5" style={{ ["--tint" as string]: "var(--color-ember)" }} aria-labelledby={`team-${team.id}`}>
      <div className="flex items-start gap-3">
        <span aria-hidden className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-raised text-ember">
          <Icon name="trophy" size={24} />
        </span>
        <div className="min-w-0 flex-1">
          {team.school && <p className="truncate text-xs font-semibold tracking-wider text-muted uppercase">{team.school}</p>}
          <h2 id={`team-${team.id}`} className="text-xl font-extrabold leading-tight tracking-tight break-words">
            {team.name}
          </h2>
          <p className="mt-0.5 text-sm text-muted">
            {t("mt.coachLine", { coach: team.coachName || t("trn.noName") })} · {t("team.athletes", { count: team.members })}
          </p>
        </div>
      </div>
      <p className="mt-3 text-sm text-good">{t("team.proFree")}</p>
      <Button className="mt-4 w-full" icon="chat" onClick={() => go("trainer", `tc.${team.id}`)}>
        <span className="inline-flex items-center gap-2">
          {t("mt.chat")}
          <CountDot n={unread} />
        </span>
      </Button>
      {unread > 0 && <p className="sr-only">{t("trn.unread", { count: unread })}</p>}
    </section>
  );
}

/** The assistant coaches on any of this coach's teams the athlete is on, each once. */
export function assistantsOf(teams: Team[], coachId: string): { id: string; name: string }[] {
  const all = teams.filter((tm) => tm.coachId === coachId).flatMap((tm) => tm.assistants ?? []);
  return [...new Map(all.map((a) => [a.id, a])).values()];
}

/**
 * The athlete's coach, with Message first (the same chat Coaching always had), and the assistant coaches who help with
 * the team (Melvin, 2026-11-25: "It should also show assistant/junior coaches here").
 */
function CoachCard({ coach, unread, assistants }: { coach: Person; unread: number; assistants: { id: string; name: string }[] }) {
  const name = coach.name || t("trn.noName");
  return (
    <section className="card card-tint p-4" style={{ ["--tint" as string]: "var(--color-violet)" }}>
      <p className="text-xs font-semibold tracking-wider text-muted uppercase">{t("mt.yourCoach")}</p>
      <div className="mt-2 flex items-center gap-3">
        <span aria-hidden className="display grid h-12 w-12 shrink-0 place-items-center rounded-full bg-raised text-xl text-violet">
          {name.slice(0, 1).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-lg font-semibold">{name}</span>
          <span className="block text-sm text-muted">{t("mt.coachHint")}</span>
        </span>
      </div>
      {assistants.length > 0 && (
        <div className="mt-3 border-t border-line pt-3">
          <p className="text-xs font-semibold tracking-wider text-muted uppercase">{t("mt.assistants", { count: assistants.length })}</p>
          <ul className="mt-2 space-y-2">
            {assistants.map((a) => {
              const n = a.name || t("trn.noName");
              return (
                <li key={a.id} className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-raised text-sm font-bold text-violet"
                  >
                    {n.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{n}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <Button kind="ghost" className="mt-3 w-full" icon="chat" onClick={() => go("trainer", `m.${coach.id}`)}>
        <span className="inline-flex items-center gap-2">
          {t("trn.messageNamed", { name })}
          <CountDot n={unread} />
        </span>
      </Button>
      {unread > 0 && <p className="sr-only">{t("trn.unread", { count: unread })}</p>}
    </section>
  );
}

/** Programs the coach assigned: Follow on a new one, how far along on the one being followed. */
function Programs({ assigns, coach }: { assigns: ProgramAssign[]; coach: string }) {
  return (
    <Section title={t("mt.programs")} icon="layers">
      {assigns.length ? (
        <ul className="space-y-2">
          {assigns.map((a) => (
            <ProgramRow key={a.id} assign={a} />
          ))}
        </ul>
      ) : (
        <p className="card px-4 py-3 text-sm text-muted">{t("mt.programsNone", { coach: coach || t("trn.noName") })}</p>
      )}
    </Section>
  );
}

function ProgramRow({ assign }: { assign: ProgramAssign }) {
  const { profile, setProfile, replan } = useApp();
  const [busy, setBusy] = useState(false);
  const src = profile.planSource;
  const following = src?.kind === "coachProgram" && src.assignId === assign.id ? src : null;
  const routines = profile.routines ?? [];
  const room = routines.length + assign.days.length <= MAX_ROUTINES;
  const follow = async () => {
    setBusy(true);
    try {
      const a = await acceptProgramAssign(assign.id);
      const { routines: days, planSource } = followAssign(a);
      let list = routines;
      for (const r of days) list = upsertRoutine(list, r, Date.now());
      setProfile({ routines: list, planSource });
      replan();
      haptic("success");
      sound.done();
      track("feature", { name: "trainer", detail: "followProgram" });
    } catch {
      oops();
    } finally {
      setBusy(false);
    }
  };
  const days = assign.days.length;
  return (
    <li className="card p-4">
      <p className="font-semibold break-words">{assign.title}</p>
      <p className="mt-0.5 text-sm text-muted">{t("mt.programLine", { count: days, days, weeks: assign.weeks })}</p>
      {following ? (
        <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-good">
          <Icon name="check" size={16} />
          {t("mt.following", { week: coachProgramWeek(following), weeks: following.weeks })}
        </p>
      ) : (
        <>
          <Button className="mt-3 w-full" disabled={busy || !room} onClick={() => void follow()}>
            {t("cpg.assignToday.follow")}
          </Button>
          <p className="mt-2 text-xs text-muted">{room ? t("mt.followHint") : t("mt.noRoom")}</p>
        </>
      )}
    </li>
  );
}

/** The team's week: who hasn't trained yet first, then everyone by workouts. Weights never show. */
function Week({ team }: { team: Team }) {
  const [rows, setRows] = useState<BoardRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [all, setAll] = useState(false);
  useEffect(() => {
    let live = true;
    loadBoard(team.id)
      .then((b) => live && setRows(b.board))
      .catch((e: unknown) => live && setError(teamError(e)));
    return () => {
      live = false;
    };
  }, [team.id]);
  const shown = rows && !all ? rows.slice(0, WEEK_ROWS) : rows;
  const top = rows?.[0];
  return (
    <Section title={t("mt.week")} icon="calendar">
      <div className="card p-4">
        {error && <p className="text-sm text-warn">{error}</p>}
        {rows === null && !error && <p className="text-sm text-muted">{t("team.loading")}</p>}
        {rows && rows.length > 0 && (
          <>
            <p className="font-semibold">
              {rows.every((r) => r.workouts === 0)
                ? t("team.boardNudgeNone")
                : rows.every((r) => r.workouts > 0)
                  ? t("team.boardNudgeAll", { name: top?.name || t("trn.noName") })
                  : t("team.boardNudge", { count: rows.filter((r) => r.workouts === 0).length, name: top?.name || t("trn.noName") })}
            </p>
            <p className="mt-1 text-xs text-muted">{t("team.boardLead")}</p>
            <p className="mt-3 flex gap-3 text-xs text-muted" aria-hidden>
              <span className="w-6" />
              <span className="flex-1" />
              <span className="w-16 text-right">{t("team.colWorkouts")}</span>
              <span className="w-12 text-right">{t("team.colSets")}</span>
            </p>
            <ol className="divide-y divide-line">
              {shown?.map((r, i) => (
                <li key={r.id} className="flex items-center gap-3 py-2">
                  <span className="num w-6 text-right text-sm text-muted">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate font-medium">{r.name || t("trn.noName")}</span>
                  <span className="num w-16 text-right font-semibold">{r.workouts}</span>
                  <span className="num w-12 text-right text-sm text-muted">{r.sets}</span>
                  <span className="sr-only">{t("team.boardRow", { w: r.workouts, s: r.sets })}</span>
                </li>
              ))}
            </ol>
            {rows.length > WEEK_ROWS && (
              <Button kind="quiet" className="mt-1 w-full" onClick={() => setAll(!all)}>
                {all ? t("mt.showFewer") : t("mt.showAll", { count: rows.length })}
              </Button>
            )}
          </>
        )}
      </div>
    </Section>
  );
}

function Leave({ team, onChange, onNote }: { team: Team; onChange: () => void; onNote: (n: string) => void }) {
  const leave = async () => {
    try {
      await leaveTeam(team.id);
      haptic("toggle");
      track("feature", { name: "team", detail: "leave" });
      onNote(t("team.left", { team: team.name }));
      onChange();
    } catch (e) {
      oops();
      onNote(teamError(e));
    }
  };
  return (
    <Button kind="quiet" className="w-full" onClick={() => void leave()}>
      {t("mt.leaveNamed", { team: team.name })}
    </Button>
  );
}
