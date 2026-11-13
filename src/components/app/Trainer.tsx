"use client";

// Trainer mode (#/trainer, docs/decisions/trainer-mode.md). One screen for both sides: "Your coach", where
// a lifter enters a coach's code, sees exactly what the coach will see and agrees (free for everyone), and
// "Your clients", where a coach shares an invite, picks what new clients start setup with, and opens each
// client's report (Pro: out of Labs on 2026-11-12). The client's report also holds the coach's note to them.
// A client's report is #/trainer/c.<id>; an invite link is #/trainer/<code>, which fills in the code.
// Physio support (2026-11-13) lives in CoachRehab.tsx: trainer or physio, pain and injuries, rehab programs.
// School teams (SchoolTeams.tsx) sit at the bottom; a team link is #/trainer/team.<code>.
import { useCallback, useEffect, useState, type FormEvent } from "react";

import { track } from "@/lib/analytics";
import { useAccount } from "@/lib/auth";
import { can } from "@/lib/entitlements";
import { date, t } from "@/lib/i18n";
import { haptic, oops, sound } from "@/lib/juice";
import { startPush } from "@/lib/push";
import { rehabName } from "@/lib/rehab";
import { encodeRoutine } from "@/lib/routineShare";
import { copyText, shareUrl } from "@/lib/shareLinks";
import { useApp } from "@/lib/store";
import { teamCodeFrom } from "@/lib/teams";
import { bodyCompOn } from "@/lib/teen";
import {
  assignPlan,
  cancelInvite,
  clientReport,
  codeFrom,
  dismissNote,
  flagText,
  inviteUrl,
  joinCode,
  keepNotes,
  liftName,
  loadClient,
  loadOverview,
  newInvite,
  NOTE_MAX,
  noteId,
  previewCode,
  removePlan,
  saveNote,
  saveSetup,
  setBodyShare,
  setCoachAlerts,
  showCode,
  trainerError,
  unlinkPerson,
  useCoachNotes,
  type BodyShare,
  type ClientView,
  type CoachKind,
  type Note,
  type Overview,
  type Person,
  type Plan,
  type PlanProgress,
  type Report,
  type Setup,
  type ShownNote,
  type Targets,
} from "@/lib/trainer";
import type { Experience, Goal, Routine } from "@/lib/types";
import { fmtWeight } from "@/lib/units";

import { ClientBody } from "./CoachBody";
import { ChatScreen } from "./CoachChat";
import { CheckinScreen, CheckinToday, ClientCheckins, FormsScreen, PendingCheckins } from "./CoachCheckins";
import { ClientPain, CoachKindPicker, PainShareSwitch, PerWeekPicker, RehabPrograms } from "./CoachRehab";
import { ClientTargets, TargetsCard } from "./CoachTargets";
import { Icon } from "./icons";
import { go } from "./router";
import { SchoolTeams } from "./SchoolTeams";
import { Button, Chip, EmptyState, ProTag, ScreenHeader, Section, Sheet, SwitchRow } from "./ui";

const CLIENT = "c.";
const CHAT = "m.";
const TEAM = "team.";
const CHECKIN = "f.";

export function Trainer({ arg }: { arg?: string }) {
  const account = useAccount((s) => s.account);
  if (!account)
    return (
      <div className="pb-2">
        <ScreenHeader back={{ label: t("settings.back"), onClick: () => go("settings") }} title={t("trn.title")} />
        <EmptyState
          icon="lock"
          title={t("trn.signIn")}
          body={t("trn.signInBody")}
          action={<Button onClick={() => go("account")}>{t("account.signIn")}</Button>}
        />
      </div>
    );
  if (arg?.startsWith(CLIENT)) return <ClientScreen id={arg.slice(CLIENT.length)} />;
  if (arg?.startsWith(CHAT)) return <ChatScreen id={arg.slice(CHAT.length)} />;
  // A school team's link (#/trainer/team.<code>, SchoolTeams.tsx) fills in the team code instead.
  if (arg?.startsWith(TEAM)) return <Home code="" team={teamCodeFrom(arg.slice(TEAM.length))} />;
  if (arg?.startsWith(CHECKIN)) return <CheckinScreen id={arg.slice(CHECKIN.length)} />;
  if (arg === "forms") return <FormsScreen />;
  return <Home code={arg ? codeFrom(arg) : ""} />;
}

function Home({ code, team = "" }: { code: string; team?: string }) {
  const [data, setData] = useState<Overview | null>(null);
  const [note, setNote] = useState<string | null>(null);
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
  return (
    <div className="pb-2">
      <ScreenHeader back={{ label: t("settings.back"), onClick: () => go("settings") }} title={t("trn.title")} />
      <p className="mt-2 text-muted">{t("trn.lead")}</p>
      {note && (
        <p className="mt-3 text-sm text-warn" role="status">
          {note}
        </p>
      )}
      <Section title={t("trn.yourCoach")} icon="flag">
        <PendingCheckins
          checkins={(data?.checkins ?? []).map((c) => ({ ...c, coach: data?.coaches.find((p) => p.id === c.coachId)?.name ?? "" }))}
        />
        <YourCoach
          coaches={data?.coaches ?? []}
          plans={data?.plans ?? []}
          notes={data?.notes ?? []}
          unread={data?.unread ?? {}}
          shared={data?.bodyShared ?? []}
          painShared={data?.painShared ?? []}
          kinds={data?.kinds ?? {}}
          targets={data?.targets ?? []}
          code={code}
          onChange={reload}
        />
      </Section>
      <Section title={t("trn.yourClients")} icon="target">
        <YourClients data={data} onChange={reload} />
      </Section>
      <Section title={t("team.title")} icon="trophy" info="schoolTeams">
        <SchoolTeams code={team} />
      </Section>
    </div>
  );
}

// --- The client's side: free for everyone ---

function YourCoach({
  coaches,
  plans,
  notes,
  unread,
  shared,
  painShared,
  kinds,
  targets,
  code,
  onChange,
}: {
  coaches: Person[];
  plans: Plan[];
  notes: Note[];
  unread: Record<string, number>;
  shared: string[];
  painShared: string[];
  kinds: Record<string, CoachKind>;
  targets: Targets[];
  code: string;
  onChange: () => void;
}) {
  const comp = bodyCompOn(useApp((s) => s.profile));
  const [text, setText] = useState(code ? showCode(code) : "");
  const [found, setFound] = useState<Person | null>(null);
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
      .catch((e: unknown) => live && setNote(trainerError(e)));
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
      await joinCode(codeFrom(text));
      haptic("success");
      sound.done();
      track("feature", { name: "trainer", detail: "join" });
      setFound(null);
      setText("");
      setNote(t("trn.joined"));
      onChange();
    } catch (e) {
      oops();
      setNote(trainerError(e));
    } finally {
      setBusy(false);
    }
  };
  const share = async (p: Person, on: boolean) => {
    try {
      await setBodyShare(p.id, on);
      haptic("toggle");
      track("feature", { name: "trainer", detail: on ? "shareBody" : "unshareBody" });
      onChange();
    } catch (e) {
      oops();
      setNote(trainerError(e));
    }
  };
  const leave = async (p: Person) => {
    try {
      await unlinkPerson(p.id);
      haptic("toggle");
      track("feature", { name: "trainer", detail: "leave" });
      setNote(t("trn.left", { name: p.name || t("trn.noName") }));
      onChange();
    } catch (e) {
      oops();
      setNote(trainerError(e));
    }
  };
  return (
    <div>
      {(plans.length > 0 || notes.length > 0 || targets.length > 0) && (
        <div className="mb-3">
          <p className="mb-2 px-1 text-sm font-semibold">{t("trn.fromCoach")}</p>
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
        </div>
      )}
      {coaches.length > 0 && (
        <ul className="card mb-3 divide-y divide-line">
          {coaches.map((c) => (
            <li key={c.id} className="flex items-center gap-2 py-2 pl-4 pr-2">
              <span className="min-w-0 flex-1 py-1">
                <span className="block truncate font-medium">{c.name || t("trn.noName")}</span>
                <span className="block text-xs text-muted">
                  {kinds[c.id] === "physio" ? `${t("trn.kind.physio")} · ` : ""}
                  {t("trn.since", { date: date(c.since, { month: "short", day: "numeric", year: "numeric" }) })}
                </span>
              </span>
              <MessageButton id={c.id} name={c.name} unread={unread[c.id] ?? 0} />
              <Button kind="ghost" className="shrink-0 !px-3 !py-2 text-sm" onClick={() => void leave(c)}>
                {t("trn.stopSharing")}
              </Button>
            </li>
          ))}
        </ul>
      )}
      {/* Body data is the client's choice, per coach, and off until they turn it on. Under 18, it waits until body
          composition is on in Body › Health (teen.ts). */}
      {comp &&
        coaches.map((c) => (
          <SwitchRow
            key={c.id}
            label={t("trn.shareBody", { name: c.name || t("trn.noName") })}
            hint={t("trn.shareBodyHint")}
            on={shared.includes(c.id)}
            onChange={(v) => void share(c, v)}
          />
        ))}
      {/* Pain and injuries too, per coach and off until turned on: a physio needs them, a trainer may not. */}
      {coaches.map((c) => (
        <PainShareSwitch key={c.id} coach={c} on={painShared.includes(c.id)} onChange={onChange} />
      ))}
      {found ? (
        <section className="card card-tint p-4" style={{ ["--tint" as string]: "var(--color-accent)" }} aria-live="polite">
          <p className="font-semibold">{t("trn.consentTitle", { name: found.name || t("trn.noName") })}</p>
          <p className="mt-2 text-sm">{t("trn.consentSees")}</p>
          <p className="mt-2 text-sm text-muted">{t("trn.consentNot")}</p>
          <p className="mt-2 text-sm text-muted">{t("trn.consentBodyLater")}</p>
          <p className="mt-2 text-sm text-muted">{t("trn.consentPainLater")}</p>
          <p className="mt-2 text-sm text-muted">{t("trn.consentStop")}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button className="flex-1" disabled={busy} onClick={() => void agree()}>
              {t("trn.agree")}
            </Button>
            <Button kind="ghost" onClick={() => setFound(null)}>
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

/** Opens the chat with one person, with how many of their messages are unread. */
function MessageButton({ id, name, unread }: { id: string; name: string; unread: number }) {
  return (
    <Button
      kind="ghost"
      className="shrink-0 !px-3 !py-2 text-sm"
      aria-label={
        unread
          ? `${t("trn.messageNamed", { name: name || t("trn.noName") })}, ${t("trn.unread", { count: unread })}`
          : t("trn.messageNamed", { name: name || t("trn.noName") })
      }
      onClick={() => go("trainer", `${CHAT}${id}`)}
    >
      {t("trn.message")}
      {unread > 0 && <span className="ml-1.5 rounded-full bg-accent px-1.5 text-xs font-bold text-accent-ink">{unread}</span>}
    </Button>
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
  const waiting = useCoachNotes((s) => s.checkins.length > 0);
  if (!n && !u && !waiting) return null;
  return (
    <>
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
    <Section title={t("trn.fromCoach")} icon="chat">
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

function YourClients({ data, onChange }: { data: Overview | null; onChange: () => void }) {
  const [note, setNote] = useState<string | null>(null);
  if (!can("coaching")) {
    // Never hidden: the row says what it is, with the Pro tag, and opens the paywall (AGENTS.md "Free vs Pro").
    return (
      <button type="button" onClick={() => go("pro", "coaching")} className="press card flex w-full items-center gap-3 px-4 py-3 text-left">
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
  if (!data) return null;
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
  const send = async () => {
    if (!invite) return;
    const url = inviteUrl(invite.code);
    if (!(await shareUrl(url, t("trn.inviteShare", { code: showCode(invite.code) })))) {
      setNote((await copyText(url)) ? t("trn.copied") : url);
    }
  };
  return (
    <div>
      <section className="card p-4">
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
      </section>
      {note && (
        <p className="mt-2 text-sm text-muted" role="status">
          {note}
        </p>
      )}
      {/* Keyed by what was loaded, so a reload starts from the saved answers. */}
      <CoachKindPicker key={data.kind ?? "trainer"} kind={data.kind ?? "trainer"} onChange={onChange} />
      <StartSetup key={JSON.stringify(data.setup ?? {})} setup={data.setup ?? {}} />
      <SwitchRow label={t("trn.alerts")} hint={t("trn.alertsHint")} on={data.alerts ?? true} onChange={(v) => void alerts(v)} />
      {data.clients.length ? (
        // Desktop layout: the client list is a grid of cards, so a coach sees more clients at once.
        <ul className="mt-3 space-y-2 desk:grid desk:grid-cols-2 desk:gap-3 desk:space-y-0 xl:desk:grid-cols-3">
          {data.clients.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => go("trainer", `${CLIENT}${c.id}`)}
                className="press card flex w-full items-center gap-3 px-4 py-3 text-left"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{c.name || t("trn.noName")}</span>
                  <span className="block text-sm text-muted">
                    {t("trn.since", { date: date(c.since, { month: "short", day: "numeric", year: "numeric" }) })}
                  </span>
                  {(data.unread?.[c.id] ?? 0) > 0 && (
                    <span className="mt-0.5 block text-sm font-semibold text-accent">
                      {t("trn.unread", { count: data.unread![c.id]! })}
                    </span>
                  )}
                </span>
                <span aria-hidden className="text-faint">
                  ›
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 px-1 text-sm text-muted">{t("trn.noClients")}</p>
      )}
    </div>
  );
}

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
function ClientScreen({ id }: { id: string }) {
  const unit = useApp((s) => s.profile.unit);
  const lab = can("coaching");
  const [report, setReport] = useState<Report | null>(null);
  const [saved, setSaved] = useState<Note | null>(null);
  const [body, setBody] = useState<BodyShare | null>(null);
  const [physio, setPhysio] = useState(false);
  const [targets, setTargets] = useState<Targets | null>(null);
  const [checkins, setCheckins] = useState<Pick<ClientView, "checkins" | "repeat" | "forms">>({});
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
        setPhysio(v.kind === "physio");
        setTargets(v.targets ?? null);
        setCheckins({ checkins: v.checkins, repeat: v.repeat, forms: v.forms });
      })
      .catch((e: unknown) => live && setError(trainerError(e)));
    return () => {
      live = false;
    };
  }, [id, lab, version]);
  const back = { label: t("trn.back"), onClick: () => go("trainer") };
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
      <p className="mt-6 px-1 text-xs text-muted">{t("trn.whatYouSee")}</p>
      {body && <p className="mt-2 px-1 text-xs text-muted">{t("trn.whatYouSeeBody")}</p>}
      <Button kind="danger" className="mt-4 w-full" onClick={() => void remove()}>
        {t("trn.remove")}
      </Button>
    </div>
  );
}
