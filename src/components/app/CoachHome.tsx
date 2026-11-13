"use client";

// Coaching's pages (#/trainer; docs/decisions/trainer-mode.md "Pages for each side", Melvin 2026-11-13: "things should be
// hidden if you're a client. you should be able to see more as a coach ... break things up and spread them onto different
// pages"). Which side a lifter is on comes from coachMode.ts:
// - A client sees only their coach: a card per coach with Message first, what the coach sent them (notes, targets,
//   routines), check-ins waiting, sessions, payments and, per coach, what they share and Stop sharing.
// - A coach gets one page per job, as tabs at the top (on a phone they wrap onto a second row): Clients, Messages, Schedule,
//   Check-ins, Payments (once the server takes them), Teams (a school coach), Setup, and My coach when they train with
//   one too. Each tab is its own route (#/trainer/<tab>) that replaces the page rather than adding a step for back.
// - Someone who is none of these picks first: train with a coach, coach clients, or coach a high school team.
import { useCallback, useEffect, useState, type FormEvent } from "react";

import { track } from "@/lib/analytics";
import { savePendingCoach } from "@/lib/coachInvite";
import { coachingMode, coachingView, readPicked, savePicked, type CoachTab, type Picked } from "@/lib/coachMode";
import { can } from "@/lib/entitlements";
import { date, t } from "@/lib/i18n";
import { haptic, oops, sound } from "@/lib/juice";
import { useDesktop } from "@/lib/layout";
import { startPush } from "@/lib/push";
import { copyText, shareUrl } from "@/lib/shareLinks";
import { useApp } from "@/lib/store";
import type { TeamsOverview } from "@/lib/teams";
import { bodyCompOn } from "@/lib/teen";
import {
  cancelInvite,
  coachBadge,
  codeFrom,
  inviteUrl,
  JOIN_SHARES,
  joinCode,
  keepNotes,
  loadOverview,
  newInvite,
  previewCode,
  saveRole,
  saveSetup,
  setCoachAlerts,
  sharedWith,
  shareKinds,
  showCode,
  trainerError,
  trainersOnly,
  unlinkPerson,
  useCoachNotes,
  type Note,
  type Overview,
  type Person,
  type Plan,
  type Role,
  type Setup,
  type ShareKind,
  type Targets,
} from "@/lib/trainer";
import type { Experience, Goal } from "@/lib/types";

import { ChatThread } from "./CoachChat";
import { FormsScreen, PendingCheckins } from "./CoachCheckins";
import { CoachGyms } from "./CoachGyms";
import { PaySetup, YourPayments } from "./CoachPay";
import { CoachPlanCard } from "./CoachPlan";
import { CoachSessions, YourSessions } from "./CoachSessions";
import { ConsentShares, ShareSwitches } from "./CoachShare";
import { TargetsCard } from "./CoachTargets";
import { Icon, type IconName } from "./icons";
import { go, replaceRoute } from "./router";
import { AthleteTeams, CoachTeams, useTeams } from "./SchoolTeams";
import { Button, Chip, ProTag, ScreenHeader, Section, Skeleton, SwitchRow } from "./ui";

const CLIENT = "c.";
const CHAT = "m.";

const TAB_ICON: Record<CoachTab, IconName> = {
  clients: "people",
  messages: "chat",
  schedule: "calendar",
  checkins: "edit",
  pay: "gift",
  teams: "trophy",
  setup: "settings",
  mine: "flag",
};

export function CoachHome({
  tab,
  code = "",
  team = "",
  paid = false,
  planPaid = false,
}: {
  tab?: string;
  code?: string;
  team?: string;
  paid?: boolean;
  planPaid?: boolean;
}) {
  const [data, setData] = useState<Overview | null>(null);
  const [note, setNote] = useState<string | null>(paid ? t("pay.thanks") : null);
  const [picked, setPicked] = useState<Picked>(() => readPicked());
  // Just joined a coach: said once at the top, since joining swaps the first page for the client's.
  const [joined, setJoined] = useState(false);
  const teams = useTeams();
  const reload = useCallback(() => {
    loadOverview()
      .then((o) => {
        setData(o);
        // Today shows the newest note from a coach; keep it in step with what this screen loaded.
        keepNotes(o);
        // With a coach or a client, this phone takes coaching pushes (permission is asked on the first message).
        if (o.coaches.length || o.clients.length) void startPush(false);
      })
      .catch((e: unknown) => {
        setData({ invite: null, clients: [], coaches: [], plans: [] });
        setNote(trainerError(e));
      });
  }, []);
  useEffect(reload, [reload]);
  const reloadAll = useCallback(() => {
    reload();
    teams.reload();
  }, [reload, teams]);
  const back = { label: t("settings.back"), onClick: () => go("settings") };

  if (!data || !teams.data)
    return (
      <div className="pb-2">
        <ScreenHeader back={back} title={t("trn.title")} />
        <Skeleton className="mt-4 h-28" />
        <Skeleton className="mt-3 h-20" />
      </div>
    );

  const mode = coachingMode(data, teams.data, picked);
  // A coach's or a team's code to look at goes to the client's side, whatever else the lifter does.
  const joining = !!code || !!team;
  const view = joining ? { kind: "client" as const } : coachingView(mode, !!data.pay, tab);
  const status = (note || joined) && (
    <p className={`mt-3 text-sm ${note ? "text-warn" : "text-good"}`} role="status">
      {note ?? t("trn.joined")}
    </p>
  );
  const onJoined = () => {
    setJoined(true);
    reloadAll();
  };

  if (view.kind === "start")
    return (
      <div className="pb-2">
        <ScreenHeader back={back} title={t("trn.title")} />
        {status}
        <StartPage
          data={data}
          teams={teams.data}
          onChange={onJoined}
          onPick={(p) => {
            savePicked(p);
            setPicked(p);
            replaceRoute("trainer", p === "school" ? "teams" : "clients");
          }}
        />
      </div>
    );

  if (view.kind === "client")
    return (
      <div className="pb-2">
        <ScreenHeader
          back={back}
          kicker={<Badge who={data} />}
          title={
            trainersOnly(data.coaches)
              ? t("trn.yourTrainer")
              : !data.coaches.length && teams.data.joined.length
                ? t("team.title")
                : t("trn.yourCoach")
          }
        />
        {status}
        <ClientPage
          data={data}
          teams={teams.data}
          code={code}
          team={team}
          coachSide={mode.coach || mode.school}
          onChange={reloadAll}
          onJoined={onJoined}
        />
      </div>
    );

  return (
    <div className="pb-2">
      <ScreenHeader back={back} kicker={data.role ? t(`trn.role.${data.role}`) : undefined} title={t("trn.title")} />
      <Tabs tabs={view.tabs} tab={view.tab} data={data} />
      {status}
      <div key={view.tab} className="animate-fade">
        {view.tab === "clients" && <ClientsPage data={data} onChange={reload} planPaid={planPaid} />}
        {view.tab === "messages" && <MessagesPage data={data} />}
        {view.tab === "schedule" && (
          <CoachSessions slots={data.slots ?? []} clients={data.clients} role={data.role ?? null} onChange={reload} />
        )}
        {view.tab === "checkins" && <FormsScreen embedded />}
        {view.tab === "pay" && data.pay && <PaySetup account={data.pay.account} onChange={reload} />}
        {view.tab === "teams" && (
          <Section title={t("team.title")} icon="trophy" info="schoolTeams">
            <CoachTeams data={teams.data} onChange={teams.reload} />
          </Section>
        )}
        {view.tab === "setup" && <SetupPage data={data} onChange={reload} />}
        {view.tab === "mine" && (
          <ClientPage data={data} teams={teams.data} code="" team="" coachSide onChange={reloadAll} onJoined={onJoined} />
        )}
      </div>
    </div>
  );
}

/** The coach's pages as tabs: a row at the top that scrolls sideways on a phone. Each one replaces the page. */
function Tabs({ tabs, tab, data }: { tabs: CoachTab[]; tab: CoachTab; data: Overview }) {
  const unread = Object.entries(data.unread ?? {}).reduce((n, [, c]) => n + c, 0);
  return (
    // Every page in view at once: on a phone the tabs wrap onto a second row rather than hide off the edge.
    <nav aria-label={t("trn.pages")} className="mt-4">
      <ul className="flex flex-wrap gap-2">
        {tabs.map((x) => {
          const on = x === tab;
          const count = x === "messages" ? unread : 0;
          return (
            <li key={x}>
              <button
                type="button"
                aria-current={on ? "page" : undefined}
                onClick={() => {
                  if (on) return;
                  haptic("select");
                  sound.tick();
                  replaceRoute("trainer", x);
                }}
                className={`press inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3 text-sm ${
                  on ? "border-accent/70 bg-accent/15 font-semibold text-ink" : "border-line bg-surface text-muted"
                }`}
              >
                <Icon name={TAB_ICON[x]} size={16} className={on ? "text-accent" : ""} />
                {t(`trn.tab.${x}`)}
                {count > 0 && (
                  <span className="num rounded-full bg-accent px-1.5 text-xs font-bold text-accent-ink">
                    <span aria-hidden>{count}</span>
                    <span className="sr-only">{t("trn.unread", { count })}</span>
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** "Coached by Sam" (or "Coach · 4 clients") by the lifter's name: Today, Account and the top of Coaching. */
export function CoachBadge({ className = "" }: { className?: string }) {
  const who = useCoachNotes((s) => s.who);
  const text = coachBadge(who);
  if (!text) return null;
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1 truncate rounded-full border border-violet/40 bg-violet/12 px-2.5 py-0.5 text-xs font-semibold text-violet ${className}`}
    >
      <Icon name={who.coaches.length ? "flag" : "people"} size={12} />
      <span className="truncate">{text}</span>
    </span>
  );
}

/** The badge from what this screen just loaded (before the cached copy catches up). */
function Badge({ who }: { who: Overview }) {
  const text = coachBadge({ coaches: who.coaches, clients: who.clients.length });
  return text ? <span className="normal-case tracking-normal">{text}</span> : null;
}

// --- The first page: which side are you on? ---

function StartPage({
  data,
  teams,
  onChange,
  onPick,
}: {
  data: Overview;
  teams: TeamsOverview;
  onChange: () => void;
  onPick: (p: Exclude<Picked, null>) => void;
}) {
  const [team, setTeam] = useState(false);
  const pro = can("coaching");
  return (
    <div>
      <p className="mt-2 text-muted">{t("trn.start.lead")}</p>
      <section className="card card-tint mt-4 p-4" style={{ ["--tint" as string]: "var(--color-accent)" }}>
        <p className="flex items-center gap-2 font-semibold">
          <Icon name="flag" size={18} className="text-accent" />
          {t("trn.start.client")}
        </p>
        <p className="mt-1 text-sm text-muted">{t("trn.start.clientHint")}</p>
        <div className="mt-3">
          <JoinCoach code="" coaches={data.coaches} onChange={onChange} />
        </div>
        {team ? (
          <div className="mt-3">
            <AthleteTeams data={teams} onChange={onChange} />
          </div>
        ) : (
          <Button kind="quiet" className="mt-2 w-full" onClick={() => setTeam(true)}>
            {t("trn.start.team")}
          </Button>
        )}
      </section>
      <button
        type="button"
        onClick={() => (pro ? onPick("coach") : go("pro", "coaching"))}
        className="press card mt-3 flex w-full items-center gap-3 px-4 py-4 text-left"
      >
        <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-raised text-accent">
          <Icon name="people" size={20} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 font-semibold">
            {t("trn.start.coach")}
            {!pro && <ProTag />}
          </span>
          <span className="block text-sm text-muted">{t("trn.start.coachHint")}</span>
        </span>
        <span aria-hidden className="text-faint">
          ›
        </span>
      </button>
      <button type="button" onClick={() => onPick("school")} className="press card mt-3 flex w-full items-center gap-3 px-4 py-4 text-left">
        <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-raised text-ember">
          <Icon name="trophy" size={20} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{t("trn.start.school")}</span>
          <span className="block text-sm text-muted">{t("trn.start.schoolHint")}</span>
        </span>
        <span aria-hidden className="text-faint">
          ›
        </span>
      </button>
    </div>
  );
}

// --- The client's side: free for everyone ---

function ClientPage({
  data,
  teams,
  code,
  team,
  coachSide,
  onChange,
  onJoined,
}: {
  data: Overview;
  teams: TeamsOverview;
  code: string;
  team: string;
  /** Also a coach: the coach's pages are a tab away, so no "Coach others too". */
  coachSide: boolean;
  onChange: () => void;
  onJoined: () => void;
}) {
  const coaches = data.coaches;
  const [adding, setAdding] = useState(!!code || !!team || (coaches.length === 0 && teams.joined.length === 0));
  return (
    <div>
      {coaches.map((c) => (
        <CoachCard key={c.id} coach={c} unread={data.unread?.[c.id] ?? 0} />
      ))}
      <PendingCheckins
        checkins={(data.checkins ?? []).map((c) => ({ ...c, coach: coaches.find((p) => p.id === c.coachId)?.name ?? "" }))}
      />
      <FromCoach coaches={coaches} plans={data.plans} notes={data.notes ?? []} targets={data.targets ?? []} />
      {data.sessions && <YourSessions sessions={data.sessions} coaches={coaches} onChange={onChange} />}
      {data.pay && <YourPayments pay={data.pay} coaches={coaches} onChange={onChange} />}
      {teams.joined.length > 0 && (
        <Section title={t("team.title")} icon="trophy">
          <AthleteTeams data={teams} code={team} onChange={onChange} />
        </Section>
      )}
      {coaches.map((c) => (
        <Sharing key={c.id} coach={c} on={sharedWith(data, c.id)} onChange={onChange} />
      ))}
      <Section title={coaches.length || teams.joined.length ? t("trn.addAnother") : t("trn.joinTitle")} icon="plus">
        {adding ? (
          <div className="space-y-3">
            <JoinCoach code={code} coaches={coaches} onChange={onJoined} />
            {/* On a team already, joining another is under the team above. */}
            {teams.joined.length === 0 && <AthleteTeams data={teams} code={team} onChange={onChange} />}
          </div>
        ) : (
          <Button kind="ghost" icon="plus" className="w-full" onClick={() => setAdding(true)}>
            {t("trn.addAnotherButton")}
          </Button>
        )}
      </Section>
      {/* A client never sees the coach's tools; one quiet way in for someone who starts coaching later. */}
      {!coachSide && (
        <Button kind="quiet" className="mt-6 w-full" onClick={() => go("trainer", "start")}>
          {t("trn.alsoCoach")}
        </Button>
      )}
    </div>
  );
}

/** One coach, with Message first: the way to reach them (Melvin, 2026-11-13: "as a client, how do i interact with my coach"). */
function CoachCard({ coach, unread }: { coach: Person; unread: number }) {
  const name = coach.name || t("trn.noName");
  return (
    <section className="card card-tint mt-4 p-4" style={{ ["--tint" as string]: "var(--color-violet)" }}>
      <div className="flex items-center gap-3">
        <span aria-hidden className="display grid h-12 w-12 shrink-0 place-items-center rounded-full bg-raised text-xl text-violet">
          {name.slice(0, 1).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-lg font-semibold">{name}</span>
          <span className="block text-sm text-muted">
            {coach.role && `${t(`trn.role.${coach.role}`)} · `}
            {t("trn.since", { date: date(coach.since, { month: "short", day: "numeric", year: "numeric" }) })}
          </span>
        </span>
      </div>
      <Button className="mt-3 w-full" icon="chat" onClick={() => go("trainer", `${CHAT}${coach.id}`)}>
        {t("trn.messageNamed", { name })}
        {unread > 0 && (
          <span className="num ml-1.5 rounded-full bg-surface px-1.5 text-xs font-bold text-ink">
            <span aria-hidden>{unread}</span>
            <span className="sr-only">{t("trn.unread", { count: unread })}</span>
          </span>
        )}
      </Button>
      <p className="mt-2 text-sm text-muted">{t("trn.reachHint", { name })}</p>
    </section>
  );
}

/** A note from a coach: their words, who and when. Plain text, line breaks kept. */
export function NoteCard({ note, coach }: { note: Note; coach: string }) {
  return (
    <div className="card card-tint mb-2 p-4" style={{ ["--tint" as string]: "var(--color-violet)" }}>
      <p className="whitespace-pre-line break-words">{note.text}</p>
      <p className="mt-2 text-sm text-muted">
        {t("trn.planBy", { name: coach || t("trn.noName"), date: date(note.at, { month: "short", day: "numeric" }) })}
      </p>
    </div>
  );
}

/** Notes, targets and routines the lifter's coaches sent them. */
function FromCoach({ coaches, plans, notes, targets }: { coaches: Person[]; plans: Plan[]; notes: Note[]; targets: Targets[] }) {
  if (!plans.length && !notes.length && !targets.length) return null;
  return (
    <Section title={trainersOnly(coaches) ? t("trn.fromTrainer") : t("trn.fromCoach")} icon="chat">
      {notes.map((n) => (
        <NoteCard key={n.coachId} note={n} coach={coaches.find((c) => c.id === n.coachId)?.name ?? ""} />
      ))}
      {targets.map((x) => (
        <TargetsCard key={x.coachId} targets={x} coach={coaches.find((c) => c.id === x.coachId)?.name ?? ""} />
      ))}
      <ul className="space-y-2">
        {plans.map((p) => {
          const who = coaches.find((c) => c.id === p.coachId)?.name || t("trn.noName");
          return (
            <li key={p.id}>
              {/* Opens the shared routine preview, where one tap saves it to this lifter's routines. */}
              <button
                type="button"
                onClick={() => go("routine", p.code)}
                aria-label={t("trn.planOpenNamed", { name: p.name })}
                className="press card card-tint flex w-full items-center gap-3 px-4 py-3 text-left"
                style={{ ["--tint" as string]: "var(--color-accent)" }}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{p.name}</span>
                  <span className="block text-sm text-muted">
                    {t("trn.planBy", { name: who, date: date(p.at, { month: "short", day: "numeric" }) })}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-semibold text-accent">{t("trn.planOpen")} ›</span>
              </button>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

/** What the lifter shares with one coach, item by item, which they choose, and Stop sharing. */
function Sharing({ coach, on, onChange }: { coach: Person; on: ShareKind[]; onChange: () => void }) {
  const [note, setNote] = useState<string | null>(null);
  const name = coach.name || t("trn.noName");
  const leave = async () => {
    try {
      await unlinkPerson(coach.id);
      haptic("toggle");
      track("feature", { name: "trainer", detail: "leave" });
      setNote(t("trn.left", { name }));
      onChange();
    } catch (e) {
      oops();
      setNote(trainerError(e));
    }
  };
  return (
    <Section title={t("trn.shareTitle", { name })} icon="lock">
      <p className="mb-2 px-1 text-sm text-muted">{t("trn.shareLead")}</p>
      <ShareSwitches coachId={coach.id} name={name} on={on} onChange={onChange} />
      <p className="mt-2 px-1 text-xs text-muted">{t("trn.shareNever")}</p>
      <Button kind="ghost" className="mt-3 w-full" onClick={() => void leave()}>
        {t("trn.stopSharingNamed", { name })}
      </Button>
      {note && (
        <p className="mt-2 text-sm text-muted" role="status">
          {note}
        </p>
      )}
    </Section>
  );
}

/** A coach's code: look it up, see what they'll see, agree. Looking links nothing. */
function JoinCoach({ code, coaches, onChange }: { code: string; coaches: Person[]; onChange: () => void }) {
  const [text, setText] = useState(code ? showCode(code) : "");
  const [found, setFound] = useState<Person | null>(null);
  const [picked, setPicked] = useState<ShareKind[]>([...JOIN_SHARES]);
  const kinds = shareKinds(bodyCompOn(useApp((s) => s.profile)));
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const check = useCallback(async (raw: string) => {
    const c = codeFrom(raw);
    if (!c) return setNote(t("trn.err.unknown"));
    setBusy(true);
    try {
      setFound(await previewCode(c));
      setNote(null);
    } catch (e) {
      oops();
      setNote(trainerError(e));
    } finally {
      setBusy(false);
    }
  }, []);
  // Opened from an invite link: look the code up straight away (looking links nothing).
  useEffect(() => {
    if (!code) return;
    let live = true;
    previewCode(code)
      .then((p) => live && setFound(p))
      .catch((e: unknown) => {
        if (!live) return;
        // A code that no longer works stops waiting on the device.
        savePendingCoach("");
        setNote(trainerError(e));
      });
    return () => {
      live = false;
    };
  }, [code]);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    void check(text);
  };
  const agree = async () => {
    setBusy(true);
    try {
      await joinCode(
        codeFrom(text),
        picked.filter((k) => kinds.includes(k)),
      );
      savePendingCoach("");
      haptic("success");
      sound.done();
      track("feature", { name: "trainer", detail: "join" });
      setFound(null);
      setText("");
      onChange();
    } catch (e) {
      oops();
      setNote(trainerError(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div>
      {found ? (
        <section className="card card-tint p-4" style={{ ["--tint" as string]: "var(--color-accent)" }} aria-live="polite">
          {found.role && <p className="text-xs font-semibold tracking-wider text-muted uppercase">{t(`trn.role.${found.role}`)}</p>}
          <p className="font-semibold">{t("trn.consentTitle", { name: found.name || t("trn.noName") })}</p>
          <p className="mt-2 text-sm">{t("trn.consentSees")}</p>
          <ConsentShares name={found.name || t("trn.noName")} picked={picked} onPick={setPicked} />
          <p className="mt-2 text-sm text-muted">{t("trn.consentNot")}</p>
          <p className="mt-2 text-sm text-muted">{t("trn.consentStop")}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button className="flex-1" disabled={busy} onClick={() => void agree()}>
              {t("trn.agree")}
            </Button>
            <Button
              kind="ghost"
              onClick={() => {
                savePendingCoach("");
                setFound(null);
              }}
            >
              {t("trn.notNow")}
            </Button>
          </div>
        </section>
      ) : (
        <form onSubmit={submit} className="card p-4">
          <label htmlFor="trn-code" className="block text-sm text-muted">
            {coaches.length ? t("trn.codeAnother") : t("trn.codeAsk")}
          </label>
          <div className="mt-2 flex gap-2">
            <input
              id="trn-code"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="num min-w-0 flex-1 rounded-xl border border-line bg-raised px-3 py-2 uppercase tracking-widest"
              placeholder="ABCD-EFGH"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
            />
            <Button submit disabled={busy || !text.trim()}>
              {t("trn.check")}
            </Button>
          </div>
        </form>
      )}
      {note && (
        <p className="mt-2 text-sm text-muted" role="status">
          {note}
        </p>
      )}
    </div>
  );
}

// --- The coach's pages: Pro ---

/** Without Pro, coaching clients is one row with the Pro tag that opens the paywall (never hidden, AGENTS.md "Free vs Pro"). */
function ProRow() {
  return (
    <button
      type="button"
      onClick={() => go("pro", "coaching")}
      className="press card mt-4 flex w-full items-center gap-3 px-4 py-3 text-left"
    >
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 font-semibold">
          {t("trn.coachRow")}
          <ProTag />
        </span>
        <span className="block text-sm text-muted">{t("trn.coachRowPro")}</span>
      </span>
      <span aria-hidden className="text-faint">
        ›
      </span>
    </button>
  );
}

/** Clients: the invite, the plan's limit, and every client with their unread messages. */
function ClientsPage({ data, onChange, planPaid }: { data: Overview; onChange: () => void; planPaid: boolean }) {
  const [note, setNote] = useState<string | null>(null);
  if (!can("coaching")) return <ProRow />;
  const invite = data.invite;
  const make = async () => {
    try {
      await newInvite();
      haptic("success");
      track("feature", { name: "trainer", detail: "invite" });
      setNote(null);
      onChange();
    } catch (e) {
      oops();
      setNote(trainerError(e));
    }
  };
  const stop = async () => {
    try {
      await cancelInvite();
      haptic("toggle");
      onChange();
    } catch (e) {
      oops();
      setNote(trainerError(e));
    }
  };
  const send = async () => {
    if (!invite) return;
    const url = inviteUrl(invite.code);
    if (!(await shareUrl(url, t("trn.inviteShare", { code: showCode(invite.code) })))) {
      setNote((await copyText(url)) ? t("trn.copied") : url);
    }
  };
  return (
    <div className="desk:grid desk:grid-cols-[minmax(0,1fr)_22rem] desk:items-start desk:gap-6">
      <Section title={t("trn.yourClients")} icon="people">
        {data.clients.length ? (
          // Desktop layout: the client list is a grid of cards, so a coach sees more clients at once.
          <ul className="space-y-2 desk:grid desk:grid-cols-2 desk:gap-3 desk:space-y-0">
            {data.clients.map((c) => {
              const unread = data.unread?.[c.id] ?? 0;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => go("trainer", `${CLIENT}${c.id}`)}
                    className="press card flex w-full items-center gap-3 px-4 py-3 text-left"
                  >
                    <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-raised font-bold text-accent">
                      {(c.name || t("trn.noName")).slice(0, 1).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{c.name || t("trn.noName")}</span>
                      <span className="block text-sm text-muted">
                        {t("trn.since", { date: date(c.since, { month: "short", day: "numeric", year: "numeric" }) })}
                      </span>
                      {unread > 0 && (
                        <span className="mt-0.5 block text-sm font-semibold text-accent">{t("trn.unread", { count: unread })}</span>
                      )}
                    </span>
                    <span aria-hidden className="text-faint">
                      ›
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="card px-4 py-3 text-sm text-muted">{t("trn.noClients")}</p>
        )}
      </Section>
      <div>
        <Section title={t("trn.invite")} icon="share">
          <div className="card p-4">
            {invite ? (
              <>
                <p className="text-sm text-muted">{t("trn.inviteHint")}</p>
                <p
                  className="display num mt-2 text-3xl tracking-widest"
                  aria-label={t("trn.codeIs", { code: invite.code.split("").join(" ") })}
                >
                  {showCode(invite.code)}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {t("trn.expires", { date: date(invite.expiresAt, { month: "short", day: "numeric" }) })}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button className="flex-1" icon="share" onClick={() => void send()}>
                    {t("trn.sendInvite")}
                  </Button>
                  <Button kind="ghost" onClick={() => void make()}>
                    {t("trn.newCode")}
                  </Button>
                  <Button kind="quiet" onClick={() => void stop()}>
                    {t("trn.cancelCode")}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-muted">{t("trn.inviteNone")}</p>
                <Button className="mt-3 w-full" icon="plus" onClick={() => void make()}>
                  {t("trn.makeInvite")}
                </Button>
              </>
            )}
            <p className="mt-3 text-xs text-muted">{t("trn.proFree")}</p>
            {note && (
              <p className="mt-2 text-sm text-muted" role="status">
                {note}
              </p>
            )}
          </div>
        </Section>
        {/* How many clients the coach's plan allows, and the way up when it's full (coach plans). */}
        {data.plan && <CoachPlanCard plan={data.plan} onChange={onChange} paid={planPaid} />}
      </div>
    </div>
  );
}

/**
 * Messages: everyone the lifter can message, unread first. On a phone a tap opens the thread; on a desktop the thread
 * opens beside the list.
 */
function MessagesPage({ data }: { data: Overview }) {
  const desktop = useDesktop();
  const unread = data.unread ?? {};
  const people = [
    ...data.clients.map((p) => ({ ...p, side: "client" as const })),
    ...data.coaches.map((p) => ({ ...p, side: "coach" as const })),
  ].sort((a, b) => (unread[b.id] ?? 0) - (unread[a.id] ?? 0) || (a.name || "").localeCompare(b.name || ""));
  const [open, setOpen] = useState<string | null>(people[0]?.id ?? null);
  if (!can("coaching") && !data.coaches.length) return <ProRow />;
  if (!people.length)
    return (
      <div className="card mt-4 px-4 py-6 text-center">
        <p className="font-semibold">{t("trn.msg.noneTitle")}</p>
        <p className="mt-1 text-sm text-muted">{t("trn.msg.noneBody")}</p>
      </div>
    );
  return (
    <div className="mt-4 desk:grid desk:grid-cols-[18rem_minmax(0,1fr)] desk:items-start desk:gap-4">
      <ul className="card divide-y divide-line">
        {people.map((p) => {
          const n = unread[p.id] ?? 0;
          const name = p.name || t("trn.noName");
          return (
            <li key={`${p.side}-${p.id}`}>
              <button
                type="button"
                aria-current={desktop && open === p.id ? "true" : undefined}
                onClick={() => (desktop ? setOpen(p.id) : go("trainer", `${CHAT}${p.id}`))}
                className={`press flex w-full items-center gap-3 px-4 py-3 text-left ${desktop && open === p.id ? "bg-accent/10" : ""}`}
              >
                <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-raised font-bold text-accent">
                  {name.slice(0, 1).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{name}</span>
                  <span className="block text-xs text-muted">{p.side === "coach" ? t("trn.msg.yourCoach") : t("trn.client")}</span>
                </span>
                {n > 0 && (
                  <span className="num rounded-full bg-accent px-2 text-xs font-bold text-accent-ink">
                    <span aria-hidden>{n}</span>
                    <span className="sr-only">{t("trn.unread", { count: n })}</span>
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      {desktop && open && <ChatThread key={open} id={open} embedded />}
    </div>
  );
}

/** Setup: how the coach works, what new clients start with, and alerts. */
function SetupPage({ data, onChange }: { data: Overview; onChange: () => void }) {
  const [note, setNote] = useState<string | null>(null);
  if (!can("coaching")) return <ProRow />;
  const alerts = async (on: boolean) => {
    try {
      await setCoachAlerts(on);
      track("feature", { name: "trainer", detail: on ? "alerts" : "noAlerts" });
      haptic("toggle");
      if (on) void startPush(true);
      onChange();
    } catch (e) {
      oops();
      setNote(trainerError(e));
    }
  };
  return (
    <div className="desk-cols">
      <RolePick key={data.role ?? ""} saved={data.role ?? null} onChange={onChange} />
      {/* Keyed by what was loaded, so a reload starts from the saved answers. */}
      <StartSetup key={JSON.stringify(data.setup ?? {})} setup={data.setup ?? {}} />
      <CoachGyms />
      <div className="mt-3">
        <SwitchRow label={t("trn.alerts")} hint={t("trn.alertsHint")} on={data.alerts ?? true} onChange={(v) => void alerts(v)} />
      </div>
      {note && (
        <p className="mt-2 text-sm text-muted" role="status">
          {note}
        </p>
      )}
    </div>
  );
}

/** Personal trainer, coach or physio: changes the words clients see and what comes first, never which tools there are. */
function RolePick({ saved, onChange }: { saved: Role | null; onChange: () => void }) {
  const [role, setRole] = useState<Role | null>(saved);
  const pick = async (r: Role) => {
    setRole(r);
    haptic("select");
    try {
      await saveRole(r);
      track("feature", { name: "trainer", detail: `role-${r}` });
      onChange();
    } catch {
      oops();
      setRole(saved);
    }
  };
  return (
    <section className="card mt-4 p-4">
      <p id="trn-role" className="font-semibold">
        {t("trn.role.title")}
      </p>
      <div className="mt-2 flex flex-wrap gap-2" role="group" aria-labelledby="trn-role">
        {ROLE_CHOICES.map((r) => (
          <Chip key={r} active={role === r} onClick={() => void pick(r)}>
            {t(`trn.role.${r}`)}
          </Chip>
        ))}
      </div>
      <p className="mt-2 text-sm text-muted">{role ? t(`trn.role.${role}Hint`) : t("trn.role.pick")}</p>
    </section>
  );
}
const ROLE_CHOICES: Role[] = ["trainer", "coach", "physio"];

const GOAL_CHOICES: Goal[] = ["muscle", "strength", "general"];
const LEVEL_CHOICES: { id: Experience; key: "setup.exp.new" | "setup.exp.intermediate" | "exp.advanced" }[] = [
  { id: "new", key: "setup.exp.new" },
  { id: "intermediate", key: "setup.exp.intermediate" },
  { id: "advanced", key: "exp.advanced" },
];

/**
 * What the coach's new clients start setup with: goal, experience and days a week. An invited client skips those
 * questions in setup (Onboarding's coach path) and can change them later in Settings. Tapping the picked chip again
 * leaves that question to the client. Saved on each tap.
 */
function StartSetup({ setup: saved }: { setup: Setup }) {
  const [setup, setSetup] = useState<Setup>(saved);
  const [note, setNote] = useState<string | null>(null);
  const pick = async (next: Setup) => {
    const before = setup;
    setSetup(next);
    try {
      setSetup(await saveSetup(next));
      setNote(t("trn.setupSaved"));
    } catch (e) {
      oops();
      setSetup(before);
      setNote(trainerError(e));
    }
  };
  const toggle = <K extends keyof Setup>(key: K, value: Setup[K]) => {
    const next = { ...setup };
    if (next[key] === value) delete next[key];
    else next[key] = value;
    void pick(next);
  };
  return (
    <section className="card mt-3 p-4" aria-labelledby="trn-setup">
      <p id="trn-setup" className="font-semibold">
        {t("trn.setupTitle")}
      </p>
      <p className="mt-1 text-sm text-muted">{t("trn.setupHint")}</p>
      <p className="mt-3 text-sm font-medium" id="trn-setup-goal">
        {t("trn.setupGoal")}
      </p>
      <div className="mt-1.5 flex flex-wrap gap-2" role="group" aria-labelledby="trn-setup-goal">
        {GOAL_CHOICES.map((g) => (
          <Chip key={g} active={setup.goal === g} onClick={() => toggle("goal", g)}>
            {t(`goal.${g}`)}
          </Chip>
        ))}
      </div>
      <p className="mt-3 text-sm font-medium" id="trn-setup-level">
        {t("trn.setupLevel")}
      </p>
      <div className="mt-1.5 flex flex-wrap gap-2" role="group" aria-labelledby="trn-setup-level">
        {LEVEL_CHOICES.map((l) => (
          <Chip key={l.id} active={setup.experience === l.id} onClick={() => toggle("experience", l.id)}>
            {t(l.key)}
          </Chip>
        ))}
      </div>
      <p className="mt-3 text-sm font-medium" id="trn-setup-days">
        {t("trn.setupDays")}
      </p>
      <div className="mt-1.5 flex flex-wrap gap-2" role="group" aria-labelledby="trn-setup-days">
        {[1, 2, 3, 4, 5, 6].map((d) => (
          <Chip key={d} active={setup.days === d} onClick={() => toggle("days", d)}>
            <span className="num">{d}</span>
          </Chip>
        ))}
      </div>
      {note && (
        <p className="mt-2 text-sm text-muted" role="status">
          {note}
        </p>
      )}
    </section>
  );
}
