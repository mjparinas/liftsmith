"use client";

// Trainer mode (#/trainer, docs/decisions/trainer-mode.md). One screen for both sides: "Your coach", where
// a lifter enters a coach's code, sees exactly what the coach will see and agrees (free for everyone), and
// "Your clients", where a coach shares an invite and opens each client's report (a Labs feature, so Pro).
// A client's report is #/trainer/c.<id>; an invite link is #/trainer/<code>, which fills in the code.
import { useCallback, useEffect, useState, type FormEvent } from "react";

import { track } from "@/lib/analytics";
import { useAccount } from "@/lib/auth";
import { can } from "@/lib/entitlements";
import { date, t } from "@/lib/i18n";
import { haptic, oops, sound } from "@/lib/juice";
import { labOn } from "@/lib/labs";
import { copyText, shareUrl } from "@/lib/shareLinks";
import { useApp } from "@/lib/store";
import {
  cancelInvite,
  clientReport,
  codeFrom,
  flagText,
  inviteUrl,
  joinCode,
  liftName,
  loadClient,
  loadOverview,
  newInvite,
  previewCode,
  showCode,
  trainerError,
  unlinkPerson,
  type Overview,
  type Person,
  type Report,
} from "@/lib/trainer";
import { fmtWeight } from "@/lib/units";

import { Icon } from "./icons";
import { go } from "./router";
import { Button, EmptyState, ProTag, ScreenHeader, Section } from "./ui";

const CLIENT = "c.";

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
  return <Home code={arg ? codeFrom(arg) : ""} />;
}

function Home({ code }: { code: string }) {
  const [data, setData] = useState<Overview | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const reload = useCallback(() => {
    loadOverview()
      .then(setData)
      .catch((e: unknown) => {
        setData({ invite: null, clients: [], coaches: [] });
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
        <YourCoach coaches={data?.coaches ?? []} code={code} onChange={reload} />
      </Section>
      <Section title={t("trn.yourClients")} icon="target">
        <YourClients data={data} onChange={reload} />
      </Section>
    </div>
  );
}

// --- The client's side: free for everyone ---

function YourCoach({ coaches, code, onChange }: { coaches: Person[]; code: string; onChange: () => void }) {
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
      {coaches.length > 0 && (
        <ul className="card mb-3 divide-y divide-line">
          {coaches.map((c) => (
            <li key={c.id} className="flex items-center gap-2 py-2 pl-4 pr-2">
              <span className="min-w-0 flex-1 py-1">
                <span className="block truncate font-medium">{c.name || t("trn.noName")}</span>
                <span className="block text-xs text-muted">
                  {t("trn.since", { date: date(c.since, { month: "short", day: "numeric", year: "numeric" }) })}
                </span>
              </span>
              <Button kind="ghost" className="shrink-0 !px-3 !py-2 text-sm" onClick={() => void leave(c)}>
                {t("trn.stopSharing")}
              </Button>
            </li>
          ))}
        </ul>
      )}
      {found ? (
        <section className="card card-tint p-4" style={{ ["--tint" as string]: "var(--color-accent)" }} aria-live="polite">
          <p className="font-semibold">{t("trn.consentTitle", { name: found.name || t("trn.noName") })}</p>
          <p className="mt-2 text-sm">{t("trn.consentSees")}</p>
          <p className="mt-2 text-sm text-muted">{t("trn.consentNot")}</p>
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

// --- The coach's side: a lab, so Pro ---

function YourClients({ data, onChange }: { data: Overview | null; onChange: () => void }) {
  const [note, setNote] = useState<string | null>(null);
  if (!labOn("labTrainer")) {
    const pro = can("labs");
    return (
      <button
        type="button"
        onClick={() => (pro ? go("settings", "labs") : go("pro", "labs"))}
        className="press card flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 font-semibold">
            {t("trn.coachRow")}
            {!pro && <ProTag />}
          </span>
          <span className="block text-sm text-muted">{pro ? t("trn.coachRowLab") : t("trn.coachRowPro")}</span>
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
      </section>
      {note && (
        <p className="mt-2 text-sm text-muted" role="status">
          {note}
        </p>
      )}
      {data.clients.length ? (
        <ul className="mt-3 space-y-2">
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

const TONE = { warn: "var(--color-warn)", good: "var(--color-good)", info: "var(--color-accent)" } as const;

/** One client's report: what to act on first, their weeks, recent workouts and new bests. */
function ClientScreen({ id }: { id: string }) {
  const unit = useApp((s) => s.profile.unit);
  const lab = labOn("labTrainer");
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!lab) return;
    let live = true;
    loadClient(id)
      .then((v) => live && setReport(clientReport(v, Date.now())))
      .catch((e: unknown) => live && setError(trainerError(e)));
    return () => {
      live = false;
    };
  }, [id, lab]);
  const back = { label: t("trn.back"), onClick: () => go("trainer") };
  if (!lab)
    return (
      <div className="pb-2">
        <ScreenHeader back={back} title={t("trn.title")} />
        <EmptyState
          icon="sparkle"
          title={t("trn.coachRowLab")}
          action={<Button onClick={() => go("settings", "labs")}>{t("lab.title")}</Button>}
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
    <div className="pb-2">
      <ScreenHeader back={back} kicker={t("trn.client")} title={report.name || t("trn.noName")} />
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
      <Button kind="danger" className="mt-4 w-full" onClick={() => void remove()}>
        {t("trn.remove")}
      </Button>
    </div>
  );
}
