"use client";

// School teams, under Coaching (#/trainer; docs/decisions/school-teams.md). Two halves, each on its own side's page
// (coachMode.ts, 2026-11-13): athletes see theirs with their coach, school coaches on the Teams page.
// - "Your teams" for athletes: enter the code from a school coach, say how old you are (13 to 18) and agree, then the
//   team's weekly board and Leave team. Pro is free while they're on it.
// - "Coach a school team" for coaches: prove a school address with an emailed code (staff check schools they don't
//   know yet), then make teams, send each team's link, see who joined and open the board. Pro is free for them too.
import { useCallback, useEffect, useState, type FormEvent } from "react";

import { track } from "@/lib/analytics";
import { assignProgram, endProgramAssigns, isNoTargets, noAthletes } from "@/lib/coachProgramAssign";
import { loadMine, type CoachProgram } from "@/lib/coachPrograms";
import { date, t, tFor } from "@/lib/i18n";
import { haptic, oops, sound } from "@/lib/juice";
import { liveRead } from "@/lib/liveRead";
import { copyText, shareUrl } from "@/lib/shareLinks";
import { useApp } from "@/lib/store";
import {
  cancelTeamInvite,
  confirmSchoolCode,
  deleteTeam,
  fullOverview,
  inviteToTeam,
  joinTeam,
  leaveTeam,
  loadBoard,
  loadTeams,
  makeTeam,
  newTeamCode,
  removeAthlete,
  sendSchoolCode,
  TEAM_AGES,
  teamError,
  teamUrl,
  type BoardRow,
  type Team,
  type TeamsOverview,
} from "@/lib/teams";
import { loadLiveBoard, useTeamSession, type LiveBoard } from "@/lib/teamSession";
import { ageOf } from "@/lib/teen";
import { showCode, trainerError } from "@/lib/trainer";
import { useVisible } from "@/lib/visibility";

import { MessageButton } from "./MessageButton";
import { ProgramCalendar } from "./ProgramCalendar";
import { go } from "./router";
import { BoardList } from "./TeamBoardList";
import { Button, Chip, CountDot, Sheet } from "./ui";

const INPUT = "min-w-0 flex-1 rounded-xl border border-line bg-raised px-3 py-2";

/** The lifter's teams, school and team members, loaded once for Coaching's pages (CoachHome.tsx). */
export function useTeams(): { data: TeamsOverview | null; error: string | null; reload: () => void } {
  const [data, setData] = useState<TeamsOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reload = useCallback(() => {
    // The last copy shows at once; the server's answer replaces it (liveRead.ts).
    liveRead("teams", loadTeams, (o) =>
      // Whatever came back, every list is there (an older server, or a reply that isn't ours).
      setData(fullOverview(o)),
    ).catch((e: unknown) => {
      setData(fullOverview({}));
      setError(teamError(e));
    });
  }, []);
  useEffect(reload, [reload]);
  return { data, error, reload };
}

/** An athlete's existing teams and their weekly boards. Joining lives in the shared invite field. */
export function AthleteTeams({ data, onChange }: { data: TeamsOverview | null; onChange: () => void }) {
  const [note, setNote] = useState<string | null>(null);
  const [board, setBoard] = useState<string | null>(null);
  return (
    <div className="space-y-3">
      {data?.joined.map((tm) => (
        <JoinedTeam key={tm.id} team={tm} onBoard={() => setBoard(tm.id)} onChange={onChange} onNote={setNote} />
      ))}
      {note && (
        <p className="text-sm text-muted" role="status">
          {note}
        </p>
      )}
      {/* Keyed by team, so each board opens fresh. */}
      {board && <Board key={board} team={board} onClose={() => setBoard(null)} />}
    </div>
  );
}

/** A school coach's side: prove the school address, then their teams, links, athletes and boards. */
export function CoachTeams({
  data,
  athletes = [],
  onChange,
}: {
  data: TeamsOverview | null;
  /** Everyone linked to this coach (Athletes): the ones not on a team yet can be added to one. */
  athletes?: { id: string; name: string }[];
  onChange: () => void;
}) {
  const [board, setBoard] = useState<string | null>(null);
  return (
    <div className="space-y-3">
      <p className="px-1 text-sm text-muted">{t("team.lead")}</p>
      {data && <CoachSide data={data} athletes={athletes} onBoard={setBoard} onChange={onChange} />}
      {board && <Board key={board} team={board} onClose={() => setBoard(null)} />}
    </div>
  );
}

// --- Athletes ---

function JoinedTeam({
  team,
  onBoard,
  onChange,
  onNote,
}: {
  team: Team;
  onBoard: () => void;
  onChange: () => void;
  onNote: (n: string) => void;
}) {
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
    <section className="card card-tint p-4" style={{ ["--tint" as string]: "var(--color-ember)" }}>
      <p className="font-semibold">{team.name}</p>
      <p className="text-sm text-muted">{t("team.byCoach", { school: team.school, coach: team.coachName || t("trn.noName") })}</p>
      <p className="mt-2 text-sm">{t("team.proFree")}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button className="flex-1" onClick={onBoard}>
          {t("team.board")}
        </Button>
        <Button kind="ghost" onClick={() => void leave()}>
          {t("team.leave")}
        </Button>
      </div>
    </section>
  );
}

export function JoinTeam({
  code,
  found,
  onChange,
  onCancel,
  join: joinWith,
  cancelLabel,
}: {
  code: string;
  found: Team;
  onChange: () => void;
  onCancel: () => void;
  /** How to join: with the team's code (the default), or a coach's invite on My team (MyTeam.tsx). */
  join?: (age: number) => Promise<unknown>;
  cancelLabel?: string;
}) {
  const profile = useApp((s) => s.profile);
  const known = profile.birthYear ? ageOf(profile.birthYear) : 0;
  const [age, setAge] = useState<number | null>(known >= 13 && known <= 18 ? known : null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const join = async () => {
    if (age === null) return;
    setBusy(true);
    try {
      await (joinWith ? joinWith(age) : joinTeam(code, age));
      haptic("success");
      sound.done();
      track("feature", { name: "team", detail: "join" });
      onChange();
    } catch (e) {
      oops();
      setNote(teamError(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div>
      <section className="card card-tint p-4" style={{ ["--tint" as string]: "var(--color-ember)" }} aria-live="polite">
        <p className="font-semibold">{t("team.consentTitle", { team: found.name })}</p>
        <p className="text-sm text-muted">{t("team.byCoach", { school: found.school, coach: found.coachName || t("trn.noName") })}</p>
        <p className="mt-3 text-sm font-semibold" id="team-age">
          {t("team.ageAsk")}
        </p>
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-labelledby="team-age">
          {TEAM_AGES.map((a) => (
            <Chip key={a} active={age === a} onClick={() => setAge(a)}>
              {String(a)}
            </Chip>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">{t("team.ageWhy")}</p>
        <p className="mt-3 text-sm">{t("team.consentSees", { coach: found.coachName || t("trn.noName") })}</p>
        <p className="mt-2 text-sm text-muted">{t("team.consentNot")}</p>
        <p className="mt-2 text-sm text-muted">{t("team.consentBoard")}</p>
        <p className="mt-2 text-sm">{t("team.proFree")}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button className="flex-1" disabled={busy || age === null} onClick={() => void join()}>
            {t("team.agree")}
          </Button>
          <Button kind="ghost" onClick={onCancel}>
            {cancelLabel ?? t("trn.notNow")}
          </Button>
        </div>
      </section>
      {note && (
        <p className="mt-2 text-sm text-muted" role="status">
          {note}
        </p>
      )}
    </div>
  );
}

// --- Coaches ---

function CoachSide({
  data,
  athletes,
  onBoard,
  onChange,
}: {
  data: TeamsOverview;
  athletes: { id: string; name: string }[];
  onBoard: (id: string) => void;
  onChange: () => void;
}) {
  const s = data.school;
  if (s?.active)
    return (
      <div className="space-y-3">
        <p className="px-1 text-sm text-good">
          {t("team.verified", { school: s.school, date: date(s.until ?? 0, { month: "short", day: "numeric", year: "numeric" }) })}
        </p>
        {data.teams.map((tm) => (
          <CoachTeam
            key={tm.id}
            team={tm}
            members={data.members[tm.id] ?? []}
            invited={data.invited[tm.id] ?? []}
            left={data.left[tm.id] ?? []}
            athletes={athletes}
            unread={data.chatUnread[tm.id] ?? 0}
            live={data.live[tm.id]}
            onBoard={() => onBoard(tm.id)}
            onChange={onChange}
          />
        ))}
        {data.teams.length < 5 && <NewTeam onChange={onChange} />}
      </div>
    );
  return <Verify data={data} onChange={onChange} />;
}

function Verify({ data, onChange }: { data: TeamsOverview; onChange: () => void }) {
  const s = data.school;
  const [open, setOpen] = useState(false);
  const [school, setSchool] = useState(s?.school ?? "");
  const [email, setEmail] = useState(s?.email ?? "");
  const [sent, setSent] = useState(data.codeSent);
  const [code, setCode] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const send = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await sendSchoolCode(email.trim(), school.trim());
      setSent(true);
      // Local development has no email: the server hands the code back.
      if (r.devCode) setCode(r.devCode);
      setNote(t("team.codeSent", { email: email.trim() }));
      track("feature", { name: "team", detail: "schoolCode" });
    } catch (err) {
      oops();
      setNote(teamError(err));
    } finally {
      setBusy(false);
    }
  };
  const confirm = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const c = await confirmSchoolCode(code.trim());
      haptic("success");
      sound.done();
      track("feature", { name: "team", detail: c.active ? "verified" : "pending" });
      setNote(null);
      setCode("");
      onChange();
    } catch (err) {
      oops();
      setNote(teamError(err));
    } finally {
      setBusy(false);
    }
  };
  // Waiting for staff, or turned down: say so, and let them try another address.
  const status = s?.status === "pending" ? t("team.pending", { school: s.school }) : s?.status === "rejected" ? t("team.rejected") : null;
  const lapsed = s?.status === "approved" && !s.active;
  if (!open && !sent)
    return (
      <section className="card p-4">
        <p className="font-semibold">{t("team.coachTitle")}</p>
        <p className="mt-1 text-sm text-muted">{lapsed ? t("team.lapsed") : (status ?? t("team.coachBody"))}</p>
        {s?.status !== "pending" && (
          <Button kind="ghost" className="mt-3" onClick={() => setOpen(true)}>
            {lapsed ? t("team.reconfirm") : t("team.coachStart")}
          </Button>
        )}
        {note && (
          <p className="mt-2 text-sm text-muted" role="status">
            {note}
          </p>
        )}
      </section>
    );
  return (
    <section className="card p-4">
      <p className="font-semibold">{t("team.coachTitle")}</p>
      {!sent ? (
        <form onSubmit={(e) => void send(e)} className="mt-2 space-y-2">
          <label htmlFor="team-school" className="block text-sm text-muted">
            {t("team.schoolName")}
          </label>
          <input id="team-school" value={school} onChange={(e) => setSchool(e.target.value)} className={`${INPUT} w-full`} maxLength={80} />
          <label htmlFor="team-email" className="block text-sm text-muted">
            {t("team.schoolEmail")}
          </label>
          <input
            id="team-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`${INPUT} w-full`}
          />
          <p className="text-xs text-muted">{t("team.schoolEmailHint")}</p>
          <Button submit disabled={busy || school.trim().length < 3 || !email.includes("@")}>
            {t("team.sendCode")}
          </Button>
        </form>
      ) : (
        <form onSubmit={(e) => void confirm(e)} className="mt-2 space-y-2">
          <label htmlFor="team-confirm" className="block text-sm text-muted">
            {t("team.codeLabel")}
          </label>
          <div className="flex gap-2">
            <input
              id="team-confirm"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              className={`num ${INPUT} tracking-widest`}
            />
            <Button submit disabled={busy || code.length !== 6}>
              {t("team.confirm")}
            </Button>
          </div>
          <Button kind="quiet" onClick={() => setSent(false)}>
            {t("team.otherAddress")}
          </Button>
        </form>
      )}
      {note && (
        <p className="mt-2 text-sm text-muted" role="status">
          {note}
        </p>
      )}
    </section>
  );
}

function CoachTeam({
  team,
  members,
  invited,
  left,
  athletes,
  unread,
  live,
  onBoard,
  onChange,
}: {
  team: Team;
  members: { id: string; name: string; since: number }[];
  /** Athletes added from the coach's list, waiting to say yes on My team. */
  invited: { id: string; name: string; since: number }[];
  /** Athletes who left this team, so one who left by mistake can be added back. */
  left: { id: string; name: string }[];
  athletes: { id: string; name: string }[];
  /** Unread team chat messages. */
  unread: number;
  /** A team session for this team running on another device. */
  live?: string;
  onBoard: () => void;
  onChange: () => void;
}) {
  const [note, setNote] = useState<string | null>(null);
  const [watch, setWatch] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [calOpen, setCalOpen] = useState(false);
  const [programs, setPrograms] = useState<CoachProgram[] | null>(null);
  // A session on this device opens it again; one on another device (the tablet) offers its live board here.
  const here = useTeamSession((s) => s.session);
  const runningHere = !!here && here.endedAt === undefined;
  const act = async (f: () => Promise<unknown>, detail: string) => {
    try {
      await f();
      haptic("toggle");
      track("feature", { name: "team", detail });
      onChange();
    } catch (e) {
      oops();
      setNote(teamError(e));
    }
  };
  const send = async () => {
    const url = teamUrl(team.code);
    if (!(await shareUrl(url, t("team.inviteShare", { team: team.name, code: showCode(team.code) })))) {
      setNote((await copyText(url)) ? t("trn.copied") : url);
    }
    track("feature", { name: "team", detail: "invite" });
  };
  const openAssign = () => {
    setAssignOpen(true);
    void loadMine()
      .then((m) => setPrograms(m.mine))
      .catch(() => setPrograms([]));
  };
  const assignToTeam = async (p: CoachProgram) => {
    try {
      const weekdays = p.days.map((d, i) => d.weekdays ?? [[1], [2], [4], [5], [3], [6]][i] ?? [1 + (i % 5)]);
      const r = await assignProgram(p.id, { type: "team", teamId: team.id }, weekdays);
      setAssignOpen(false);
      if (!r.assigned.length) {
        oops();
        setNote(noAthletes(team));
        return;
      }
      haptic("success");
      track("feature", { name: "trainer", detail: "assignProgram" });
      setNote(tFor(true, "cpg.assignDone", { count: r.assigned.length, skip: r.skipped.length }));
    } catch (e) {
      oops();
      setAssignOpen(false);
      setNote(isNoTargets(e) ? noAthletes(team) : trainerError(e));
    }
  };
  return (
    <section className="card p-4">
      <div className="flex items-baseline justify-between gap-2">
        <p className="min-w-0 truncate font-semibold">{team.name}</p>
        <p className="shrink-0 text-sm text-muted">{t("team.athletes", { count: team.members })}</p>
      </div>
      <p className="mt-2 text-sm text-muted">{t("team.codeIs")}</p>
      <p className="display num text-2xl tracking-widest">{showCode(team.code)}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button className="flex-1" onClick={() => void send()}>
          {t("trn.sendInvite")}
        </Button>
        <Button kind="ghost" onClick={onBoard}>
          {t("team.board")}
        </Button>
      </div>
      {/* The team's chat (TeamChat.tsx): the coach and every athlete on the team. */}
      {members.length > 0 && (
        <MessageButton team id={team.id} name={team.name} kind="ghost" className="mt-2 w-full">
          <span className="inline-flex items-center gap-2">
            {t("mt.chat")}
            <CountDot n={unread} />
          </span>
        </MessageButton>
      )}
      {/* Team session (TeamSession.tsx): one workout for the whole team on one tablet. */}
      {members.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {runningHere ? (
            <Button kind="ghost" icon="people" className="flex-1" onClick={() => go("teamsession", here.team)}>
              {t("team.ses.resume")}
            </Button>
          ) : (
            <Button kind="ghost" icon="people" className="flex-1" onClick={() => go("teamsession", team.id)}>
              {t("team.ses.start")}
            </Button>
          )}
          {live && live !== here?.id && (
            <Button kind="ghost" icon="eye" onClick={() => setWatch(true)}>
              {t("team.ses.live")}
            </Button>
          )}
        </div>
      )}
      {members.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          <Button kind="ghost" icon="layers" className="flex-1" onClick={openAssign}>
            {t("cpg.clientAssign")}
          </Button>
          <Button kind="ghost" icon="calendar" onClick={() => setCalOpen(true)}>
            {t("cpg.assignCalendar")}
          </Button>
        </div>
      )}
      {watch && live && <LiveBoardSheet id={live} onClose={() => setWatch(false)} />}
      <Sheet open={assignOpen} onClose={() => setAssignOpen(false)} title={t("cpg.clientAssign")}>
        <p className="text-sm text-muted">{tFor(true, "cpg.assignHint")}</p>
        {!programs ? (
          <p className="mt-3 text-sm text-muted">…</p>
        ) : programs.length === 0 ? (
          <p className="mt-3 text-sm text-muted">{t("cpg.noneMineBody")}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {programs.map((p) => (
              <li key={p.id}>
                <Button kind="ghost" className="w-full" onClick={() => void assignToTeam(p)}>
                  {p.title}
                </Button>
              </li>
            ))}
          </ul>
        )}
        <Button
          kind="danger"
          className="mt-3 w-full"
          onClick={() =>
            void endProgramAssigns({ teamId: team.id })
              .then(() => {
                haptic("toggle");
                setNote(t("cpg.assignTaken"));
                setAssignOpen(false);
              })
              .catch((e: unknown) => setNote(trainerError(e)))
          }
        >
          {t("cpg.assignTakeBack")}
        </Button>
      </Sheet>
      <Sheet open={calOpen} onClose={() => setCalOpen(false)} title={t("cpg.cal.title")} wide>
        <ProgramCalendar teamId={team.id} athlete />
      </Sheet>
      {members.length > 0 && (
        <details className="mt-3">
          <summary className="press min-h-11 cursor-pointer py-2 text-sm font-semibold text-accent">{t("team.roster")}</summary>
          <ul className="divide-y divide-line">
            {members.map((m) => (
              <li key={m.id} className="flex items-center gap-2 py-2">
                <span className="min-w-0 flex-1 truncate">{m.name || t("trn.noName")}</span>
                <Button
                  kind="quiet"
                  className="shrink-0 !px-3 !py-2 text-sm"
                  label={t("team.removeNamed", { name: m.name || t("trn.noName") })}
                  onClick={() => void act(() => removeAthlete(team.id, m.id), "remove")}
                >
                  {t("team.remove")}
                </Button>
              </li>
            ))}
          </ul>
        </details>
      )}
      <AddAthletes team={team} members={members} invited={invited} left={left} athletes={athletes} onChange={onChange} onNote={setNote} />
      <div className="mt-2 flex flex-wrap gap-2">
        <Button kind="quiet" onClick={() => void act(() => newTeamCode(team.id), "newCode")}>
          {t("trn.newCode")}
        </Button>
        <Button kind="danger" onClick={() => void act(() => deleteTeam(team.id), "delete")}>
          {t("team.delete")}
        </Button>
      </div>
      {note && (
        <p className="mt-2 text-sm text-muted" role="status">
          {note}
        </p>
      )}
    </section>
  );
}

/**
 * The coach's athletes who aren't on this team (they joined with the coach's own invite, so a team never counted them;
 * Melvin, 2026-11-25), each with Add, and the ones added who haven't said yes yet, with Take back. Adding asks them on
 * My team for their age and agreement, as a team code would. Athletes who left the team are listed too, marked "Left
 * the team", so one who left by mistake can be added back even without a coach link (Melvin, 2026-11-25).
 */
function AddAthletes({
  team,
  members,
  invited,
  left,
  athletes,
  onChange,
  onNote,
}: {
  team: Team;
  members: { id: string }[];
  invited: { id: string; name: string }[];
  left: { id: string; name: string }[];
  athletes: { id: string; name: string }[];
  onChange: () => void;
  onNote: (n: string) => void;
}) {
  const on = new Set([...members, ...invited].map((m) => m.id));
  const gone = new Set(left.map((m) => m.id));
  const rest = [...left.filter((m) => !on.has(m.id)), ...athletes.filter((a) => !on.has(a.id) && !gone.has(a.id))];
  if (!rest.length && !invited.length) return null;
  const run = async (f: () => Promise<void>, note: string, detail: string) => {
    try {
      await f();
      haptic("success");
      track("feature", { name: "team", detail });
      onNote(note);
      onChange();
    } catch (e) {
      oops();
      onNote(teamError(e));
    }
  };
  return (
    <div className="mt-3 border-t border-line pt-3">
      <p className="text-sm font-semibold">{t("mt.addTitle")}</p>
      <p className="text-xs text-muted">{t("mt.addHint")}</p>
      <ul className="mt-1 divide-y divide-line">
        {invited.map((m) => (
          <li key={m.id} className="flex items-center gap-2 py-2">
            <span className="min-w-0 flex-1">
              <span className="block truncate">{m.name || t("trn.noName")}</span>
              <span className="block text-xs text-muted">{t("mt.waiting")}</span>
            </span>
            <Button
              kind="quiet"
              className="shrink-0 !px-3 !py-2 text-sm"
              label={t("mt.takeBackNamed", { name: m.name || t("trn.noName") })}
              onClick={() =>
                void run(() => cancelTeamInvite(team.id, m.id), t("mt.takenBack", { name: m.name || t("trn.noName") }), "uninvite")
              }
            >
              {t("mt.takeBack")}
            </Button>
          </li>
        ))}
        {rest.map((a) => (
          <li key={a.id} className="flex items-center gap-2 py-2">
            <span className="min-w-0 flex-1">
              <span className="block truncate">{a.name || t("trn.noName")}</span>
              {gone.has(a.id) && <span className="block text-xs text-muted">{t("mt.leftTeam")}</span>}
            </span>
            <Button
              kind="ghost"
              icon="plus"
              className="shrink-0 !px-3 !py-2 text-sm"
              label={t("mt.addNamed", { name: a.name || t("trn.noName") })}
              onClick={() => void run(() => inviteToTeam(team.id, a.id), t("mt.added", { name: a.name || t("trn.noName") }), "addAthlete")}
            >
              {t("mt.add")}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function NewTeam({ onChange }: { onChange: () => void }) {
  const [name, setName] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await makeTeam(name.trim());
      haptic("success");
      track("feature", { name: "team", detail: "make" });
      setName("");
      onChange();
    } catch (err) {
      oops();
      setNote(teamError(err));
    }
  };
  return (
    <form onSubmit={(e) => void submit(e)} className="card p-4">
      <label htmlFor="team-name" className="block text-sm text-muted">
        {t("team.newName")}
      </label>
      <div className="mt-2 flex gap-2">
        <input
          id="team-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={INPUT}
          maxLength={60}
          placeholder={t("team.newNameHint")}
        />
        <Button submit disabled={name.trim().length < 2}>
          {t("team.make")}
        </Button>
      </div>
      {note && (
        <p className="mt-2 text-sm text-muted" role="status">
          {note}
        </p>
      )}
    </form>
  );
}

// --- The weekly board ---

function Board({ team, onClose }: { team: string | null; onClose: () => void }) {
  const [rows, setRows] = useState<BoardRow[] | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!team) return;
    let live = true;
    loadBoard(team)
      .then((b) => {
        if (!live) return;
        setRows(b.board);
        setName(b.team.name);
      })
      .catch((e: unknown) => live && setError(teamError(e)));
    return () => {
      live = false;
    };
  }, [team]);
  const top = rows?.[0];
  return (
    <Sheet open={!!team} onClose={onClose} title={name ? t("team.boardTitle", { team: name }) : t("team.board")}>
      <p className="text-sm text-muted">{t("team.boardLead")}</p>
      {error && <p className="mt-3 text-sm text-warn">{error}</p>}
      {rows === null && !error && <p className="mt-3 text-sm text-muted">{t("team.loading")}</p>}
      {rows && rows.length === 0 && <p className="mt-3 text-sm text-muted">{t("team.boardEmpty")}</p>}
      {/* Action first: what would move the team this week, before the list. */}
      {rows && rows.length > 0 && (
        <p className="mt-3 text-sm font-semibold">
          {rows.every((r) => r.workouts === 0)
            ? t("team.boardNudgeNone")
            : rows.every((r) => r.workouts > 0)
              ? t("team.boardNudgeAll", { name: top?.name || t("trn.noName") })
              : t("team.boardNudge", { count: rows.filter((r) => r.workouts === 0).length, name: top?.name || t("trn.noName") })}
        </p>
      )}
      {rows && rows.length > 0 && (
        <>
          <p className="mt-3 flex gap-3 text-xs text-muted" aria-hidden>
            <span className="w-6" />
            <span className="flex-1" />
            <span className="w-16 text-right">{t("team.colWorkouts")}</span>
            <span className="w-12 text-right">{t("team.colSets")}</span>
          </p>
          <ol className="divide-y divide-line">
            {rows.map((r, i) => (
              <li key={r.id} className="flex items-center gap-3 py-2">
                <span className="num w-6 text-right text-sm text-muted">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate font-medium">{r.name || t("trn.noName")}</span>
                <span className="num w-16 text-right font-semibold">{r.workouts}</span>
                <span className="num w-12 text-right text-sm text-muted">{r.sets}</span>
                <span className="sr-only">{t("team.boardRow", { w: r.workouts, s: r.sets })}</span>
              </li>
            ))}
          </ol>
        </>
      )}
    </Sheet>
  );
}

// --- A team session's live board, on the coach's other devices ---

/** The board of a session running on the tablet: refreshed every 15 seconds while it's on screen, never in the background. */
function LiveBoardSheet({ id, onClose }: { id: string; onClose: () => void }) {
  const [board, setBoard] = useState<LiveBoard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const visible = useVisible();
  useEffect(() => {
    if (!visible) return;
    let live = true;
    const load = () =>
      loadLiveBoard(id)
        .then((b) => {
          if (!live) return;
          setBoard(b);
          setError(null);
        })
        .catch((e: unknown) => {
          if (live) setError(teamError(e));
        });
    void load();
    const timer = setInterval(() => void load(), 15_000);
    return () => {
      live = false;
      clearInterval(timer);
    };
  }, [id, visible]);
  const rows = board?.rows ?? [];
  const notStarted = rows.filter((r) => r.done === 0).length;
  const nudge = !board
    ? ""
    : board.endedAt !== null
      ? t("team.ses.liveEnded")
      : rows.every((r) => r.done === 0)
        ? t("team.ses.boardNone")
        : notStarted > 0
          ? t("team.ses.boardNudge", { count: notStarted })
          : rows.every((r) => r.done >= r.total)
            ? t("team.ses.boardAllDone")
            : t("team.ses.boardStarted");
  return (
    <Sheet open onClose={onClose} title={board ? `${board.teamName} · ${board.name}` : t("team.ses.live")}>
      <p className="text-sm text-muted">{t("team.ses.liveLead")}</p>
      {error && <p className="mt-3 text-sm text-warn">{error}</p>}
      {!board && !error && <p className="mt-3 text-sm text-muted">{t("team.loading")}</p>}
      {board && (
        <div className="mt-3">
          <BoardList rows={rows} nudge={nudge} />
        </div>
      )}
    </Sheet>
  );
}
