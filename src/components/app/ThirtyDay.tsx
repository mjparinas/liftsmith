"use client";

// 30-day challenges in the app (Melvin, 2026-11-27, traffic idea 2; docs/decisions/thirty-day-challenges.md):
// #/challenge lists them, #/challenge/<id> is one challenge (the website's Join in the app opens
// #/challenge/<id>~<level>), and Today shows the day that's due with a one-tap Done. Engine: src/lib/thirtyDay.ts.
import { useMemo, useState } from "react";

import { exercise } from "@/lib/exercises";
import { date, inSentence, t } from "@/lib/i18n";
import { haptic, sound } from "@/lib/juice";
import { bodyMode, modeAvoids } from "@/lib/pregnancy";
import { useApp } from "@/lib/store";
import {
  activeThirty,
  isThirtyLevel,
  THIRTY_BY_ID,
  THIRTY_CHALLENGES,
  THIRTY_LEVELS,
  THIRTY_MAX_ACTIVE,
  thirtyAmount,
  thirtyPlan,
  thirtyRuns,
  thirtyToday,
  thirtyTotal,
  type ThirtyChallenge,
  type ThirtyLevel,
  type ThirtyRun,
} from "@/lib/thirtyDay";
import { toast } from "@/lib/toast";
import { fmtNum } from "@/lib/units";
import { useNow } from "@/lib/useNow";
import type { MessageKey } from "@/locales/en";

import { burst } from "./burst";
import { Icon } from "./icons";
import { go } from "./router";
import { HUE } from "./theme";
import { BumpField, Button, Chip, ScreenHeader, Section } from "./ui";

const key = (c: ThirtyChallenge, part: "name" | "why") => `c30.${c.id}.${part}` as MessageKey;
export const thirtyName = (c: ThirtyChallenge) => t(key(c, "name"));
const levelName = (l: ThirtyLevel) => t(`c30.level.${l}` as MessageKey);

/** "40 reps", "90 seconds", "12 reps each leg". */
export function thirtyAmountText(c: ThirtyChallenge, n: number): string {
  const base = t(c.unit === "seconds" ? "c30.secs" : "c30.reps", { count: n });
  return c.perSide ? t("c30.perSide", { amount: base }) : base;
}

/** Why today's number is what it is, in a line (AGENTS.md: every recommendation says why). */
function dueWhy(run: ThirtyRun, day: number, now: number): string {
  const c = run.challenge;
  if (day === 1) return t("c30.whyFirst", { level: inSentence(levelName(run.level)) });
  const last = run.done[run.done.length - 1];
  // Back after a missed day: say the challenge waited, rather than how much it went up.
  if (last && now - last.at > 3 * 86_400_000) return t("c30.whyBack", { n: day });
  let prevDay = day - 1;
  while (prevDay > 1 && thirtyAmount(c, run.level, prevDay) === 0) prevDay--;
  return t("c30.whyUp", { prev: fmtNum(thirtyAmount(c, run.level, prevDay)), day: prevDay });
}

/** The arg of #/challenge/<id>~<level>. */
function parseArg(arg?: string): { id?: string; level?: ThirtyLevel } {
  const [id, level] = (arg ?? "").split("~");
  return { id: id || undefined, level: isThirtyLevel(level) ? level : undefined };
}

export function ThirtyDayScreen({ arg }: { arg?: string }) {
  const { id, level } = parseArg(arg);
  const c = id ? THIRTY_BY_ID.get(id) : undefined;
  return c ? <ChallengeDetail c={c} pick={level} /> : <ChallengeList />;
}

function ChallengeList() {
  const events = useApp((s) => s.events);
  const now = useNow();
  const active = useMemo(() => activeThirty(events), [events]);
  const finished = useMemo(
    () =>
      new Set(
        thirtyRuns(events)
          .filter((r) => r.finishedAt)
          .map((r) => r.challenge.id),
      ),
    [events],
  );
  return (
    <div className="pb-6">
      <ScreenHeader back={{ label: t("tools.title"), onClick: () => go("tools") }} title={t("c30.title")} />
      <p className="mt-2 text-sm text-muted">{t("c30.intro")}</p>
      {active.length > 0 && (
        <Section title={t("c30.yours")} icon="flame">
          <div className="space-y-3">
            {active.map((r) => (
              <RunCard key={r.id} run={r} now={now} />
            ))}
          </div>
        </Section>
      )}
      <Section title={t("c30.all")} icon="calendar">
        <ul className="space-y-3">
          {THIRTY_CHALLENGES.map((x) => {
            const b = x.levels.beginner;
            const a = x.levels.advanced;
            return (
              <li key={x.id}>
                <button
                  type="button"
                  onClick={() => go("challenge", x.id)}
                  className="press card flex w-full items-center gap-4 p-4 text-left"
                  data-testid="thirty-pick"
                >
                  <span
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl"
                    style={{ background: `color-mix(in srgb, ${HUE.ember} 15%, transparent)`, color: HUE.ember }}
                    aria-hidden
                  >
                    <Icon name={finished.has(x.id) ? "medal" : "calendar"} size={22} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{thirtyName(x)}</span>
                    <span className="block text-sm text-muted">{t(key(x, "why"))}</span>
                    <span className="num mt-0.5 block text-xs text-muted">
                      {thirtyAmountText(x, b.start)} → {thirtyAmountText(x, a.end)}
                    </span>
                  </span>
                  <span className="text-accent" aria-hidden>
                    ›
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </Section>
      <p className="mt-6 text-xs text-muted">{t("c30.notWorkout")}</p>
    </div>
  );
}

/** One running challenge: where it stands today, and Done when a day is due. Today and the list use it. */
export function RunCard({ run, now }: { run: ThirtyRun; now: number }) {
  const logThirtyDay = useApp((s) => s.logThirtyDay);
  const undoThirtyDay = useApp((s) => s.undoThirtyDay);
  const c = run.challenge;
  const today = thirtyToday(run, now);
  const line =
    today.state === "due"
      ? t("c30.due", { n: today.day, amount: thirtyAmountText(c, today.amount) })
      : today.state === "rest"
        ? t("c30.restToday", { n: today.nextDay, amount: thirtyAmountText(c, today.nextAmount) })
        : today.state === "doneToday"
          ? t(today.restFirst ? "c30.doneRest" : "c30.doneToday", {
              n: today.day,
              next: today.nextDay,
              amount: thirtyAmountText(c, today.nextAmount),
            })
          : "";
  const done = (el: HTMLElement) => {
    if (today.state !== "due") return;
    const day = logThirtyDay(run.id, today.amount, now);
    if (day) celebrate(el, run, day);
  };
  return (
    <div className="card p-4" data-testid="thirty-run">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => go("challenge", c.id)} className="press min-w-0 flex-1 text-left">
          <span className="block font-semibold">{thirtyName(c)}</span>
          <span className="block text-sm">{line}</span>
          {today.state === "due" && <span className="mt-0.5 block text-xs text-muted">{dueWhy(run, today.day, now)}</span>}
        </button>
        {today.state === "due" && (
          <Button className="shrink-0" icon="check" onClick={() => done(document.activeElement as HTMLElement)}>
            {t("c30.logDone")}
          </Button>
        )}
        {today.state === "doneToday" && (
          <Button kind="quiet" className="shrink-0" icon="undo" onClick={() => undoThirtyDay(run.id, now)}>
            {t("c30.undo")}
          </Button>
        )}
      </div>
      <DayBar run={run} />
    </div>
  );
}

/** A thin bar of the 30 days: done, rest and to come. */
function DayBar({ run }: { run: ThirtyRun }) {
  const doneDays = new Set(run.done.map((d) => d.day));
  const last = run.done[run.done.length - 1]?.day ?? 0;
  return (
    <div className="mt-3 flex gap-0.5" aria-hidden>
      {thirtyPlan(run.challenge, run.level).map((d) => (
        <span
          key={d.day}
          className="h-1.5 flex-1 rounded-full"
          style={{
            background: doneDays.has(d.day) || (d.rest && d.day < last) ? HUE.mint : d.rest ? "var(--color-line)" : "var(--color-raised)",
          }}
        />
      ))}
    </div>
  );
}

function celebrate(el: HTMLElement | null, run: ThirtyRun, day: number) {
  if (day === 30) {
    haptic("celebrate");
    sound.fanfare();
    burst(el, { count: 22, reach: 120 });
    toast(t("c30.finishedToast"));
  } else {
    haptic("tap");
    sound.log();
    burst(el, { count: 10, reach: 60 });
    toast(t("c30.doneToast", { n: day }), { action: { label: t("c30.undo"), run: () => useApp.getState().undoThirtyDay(run.id) } });
  }
}

function ChallengeDetail({ c, pick }: { c: ThirtyChallenge; pick?: ThirtyLevel }) {
  const { events, profile, joinThirty, logThirtyDay, leaveThirty, undoThirtyDay } = useApp();
  const now = useNow();
  const runs = useMemo(() => thirtyRuns(events), [events]);
  const active = useMemo(() => activeThirty(events), [events]);
  const run = active.find((r) => r.challenge.id === c.id);
  const lastFinished = [...runs].reverse().find((r) => r.challenge.id === c.id && r.finishedAt);
  const [level, setLevel] = useState<ThirtyLevel>(pick ?? run?.level ?? lastFinished?.level ?? "beginner");
  const [did, setDid] = useState("");
  const [leaving, setLeaving] = useState(false);
  const plan = thirtyPlan(c, level);
  const today = run ? thirtyToday(run, now) : null;
  const avoid = modeAvoids({ id: c.levels[level].exercise }, bodyMode(profile, now));
  const full = !run && active.length >= THIRTY_MAX_ACTIVE;
  const ex = exercise(c.levels[level].exercise);
  const doneDays = new Map((run?.done ?? []).map((d) => [d.day, d.amount]));
  const lastDay = run?.done[run.done.length - 1]?.day ?? 0;
  const nextDay = today?.state === "due" ? today.day : today?.state === "rest" || today?.state === "doneToday" ? today.nextDay : 0;

  const logDue = (el: HTMLElement | null) => {
    if (!run || today?.state !== "due") return;
    const n = Number(did) > 0 ? Number(did) : today.amount;
    const day = logThirtyDay(run.id, n, now);
    if (day) {
      setDid("");
      celebrate(el, run, day);
    }
  };

  return (
    <div className="pb-6">
      <ScreenHeader back={{ label: t("c30.title"), onClick: () => go("challenge") }} title={thirtyName(c)} />
      <p className="mt-2 text-sm text-muted">{t(key(c, "why"))}</p>
      {run && (
        <p className="mt-1 text-xs text-muted">{t("c30.started", { date: date(run.joinedAt, { month: "long", day: "numeric" }) })}</p>
      )}

      <div className="mt-4" role="group" aria-label={t("c30.level")}>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">{t("c30.level")}</p>
        <div className="flex flex-wrap gap-2">
          {THIRTY_LEVELS.map((l) => (
            <Chip key={l} active={level === l} onClick={() => setLevel(l)}>
              {levelName(l)}
            </Chip>
          ))}
        </div>
      </div>

      {avoid && (
        <p className="card mt-4 p-3 text-sm" role="note">
          {t("c30.pregnancy")}
        </p>
      )}

      {run && today?.state === "due" && run.level === level && (
        <div className="card-tint mt-4 p-4" style={{ ["--tint" as string]: HUE.ember }} data-testid="thirty-due">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">{t("c30.dayOf", { n: today.day })}</p>
          <p className="display mt-1 text-4xl">{thirtyAmountText(c, today.amount)}</p>
          <p className="mt-1 text-sm text-muted">{dueWhy(run, today.day, now)}</p>
          <p className="mt-1 text-sm text-muted">{t(c.unit === "seconds" ? "c30.splitHold" : "c30.split")}</p>
          <div className="mt-3">
            <BumpField
              value={did}
              onChange={setDid}
              step={1}
              start={today.amount}
              min={1}
              max={9999}
              placeholder={String(today.amount)}
              label={t("c30.did")}
            />
          </div>
          <Button className="mt-3 w-full" icon="check" onClick={() => logDue(document.activeElement as HTMLElement)}>
            {t("c30.logDone")}
          </Button>
        </div>
      )}
      {run && today && today.state !== "due" && run.level === level && (
        <div className="card mt-4 flex items-center gap-3 p-4">
          <p className="min-w-0 flex-1 text-sm">
            {today.state === "rest"
              ? `${t("c30.restToday", { n: today.nextDay, amount: thirtyAmountText(c, today.nextAmount) })} ${t("c30.whyRest")}`
              : today.state === "doneToday"
                ? t(today.restFirst ? "c30.doneRest" : "c30.doneToday", {
                    n: today.day,
                    next: today.nextDay,
                    amount: thirtyAmountText(c, today.nextAmount),
                  })
                : ""}
          </p>
          {today.state === "doneToday" && (
            <Button kind="quiet" className="shrink-0" icon="undo" onClick={() => undoThirtyDay(run.id, now)}>
              {t("c30.undo")}
            </Button>
          )}
        </div>
      )}
      {!run && lastFinished && (
        <p className="card mt-4 p-4 text-sm" data-testid="thirty-finished">
          {t("c30.finished", {
            total: thirtyAmountText(
              c,
              lastFinished.done.reduce((s, d) => s + d.amount, 0),
            ),
          })}
        </p>
      )}

      {!run && (
        <div className="mt-4">
          <Button className="w-full" icon="flag" disabled={full} onClick={() => joinThirty(c.id, level)}>
            {lastFinished ? t("c30.again") : t("c30.join")}
          </Button>
          <p className="mt-2 text-sm text-muted">{full ? t("c30.max") : t("c30.joinNote")}</p>
        </div>
      )}
      {run && run.level !== level && (
        <div className="mt-4">
          <Button className="w-full" icon="repeat" onClick={() => joinThirty(c.id, level)}>
            {t("c30.change")}
          </Button>
          <p className="mt-2 text-sm text-muted">{t("c30.changeNote")}</p>
        </div>
      )}

      <Section title={t("c30.calendar")} icon="calendar">
        <ol className="grid grid-cols-5 gap-2 sm:grid-cols-6" data-testid="thirty-calendar">
          {plan.map((d) => {
            const logged = doneDays.get(d.day);
            const isDone = logged !== undefined || (d.rest && d.day < lastDay);
            const isNext = !!run && d.day === nextDay;
            const amount = thirtyAmountText(c, logged ?? d.amount);
            const label = d.rest
              ? t("c30.calRest", { n: d.day })
              : logged !== undefined
                ? t("c30.calDone", { n: d.day, amount })
                : isNext
                  ? t("c30.calNext", { n: d.day, amount })
                  : t("c30.calPlan", { n: d.day, amount });
            return (
              <li
                key={d.day}
                aria-label={label}
                className={`rounded-xl border p-2 text-center ${isNext ? "border-accent" : "border-line"} ${isDone ? "bg-mint/15" : ""}`}
              >
                <span className="block text-xs text-muted" aria-hidden>
                  {d.day}
                </span>
                <span className="num block text-sm font-semibold" aria-hidden>
                  {isDone && !d.rest ? <Icon name="check" size={14} className="inline text-mint" /> : null}
                  {d.rest ? t("c30.rest") : fmtNum(logged ?? d.amount)}
                </span>
              </li>
            );
          })}
        </ol>
        <p className="mt-2 text-xs text-muted">{t("c30.total", { amount: thirtyAmountText(c, thirtyTotal(c, level)) })}</p>
      </Section>

      {ex && (
        <Button kind="ghost" className="mt-4 w-full" icon="play" onClick={() => go("exercise", ex.id)}>
          {`${t("c30.howTo")}: ${ex.name}`}
        </Button>
      )}

      {run && (
        <div className="mt-6">
          {leaving ? (
            <div className="card p-4">
              <p className="text-sm">{t("c30.leaveSure")}</p>
              <div className="mt-3 flex gap-2">
                <Button kind="danger" className="flex-1" onClick={() => (leaveThirty(run.id), setLeaving(false))}>
                  {t("c30.leaveYes")}
                </Button>
                <Button kind="ghost" className="flex-1" onClick={() => setLeaving(false)}>
                  {t("c30.keep")}
                </Button>
              </div>
            </div>
          ) : (
            <Button kind="quiet" className="w-full" onClick={() => setLeaving(true)}>
              {t("c30.leave")}
            </Button>
          )}
        </div>
      )}
      <p className="mt-6 text-xs text-muted">{t("c30.notWorkout")}</p>
    </div>
  );
}

/** Today: each running challenge's day, with Done when one is due. Nothing when none is running. */
export function ThirtyTodayCards() {
  const events = useApp((s) => s.events);
  const now = useNow();
  const active = useMemo(() => activeThirty(events), [events]);
  if (!active.length) return null;
  return (
    <div className="mt-4 space-y-3" data-testid="today-thirty">
      {active.map((r) => (
        <RunCard key={r.id} run={r} now={now} />
      ))}
    </div>
  );
}
