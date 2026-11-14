"use client";

// Stretching (Melvin, 2026-11-11): the stretch library and the routines built from it. #/stretch is the
// library (filter by kind and muscle, tap one to see it on the 3D figure, pick any and run them on any day);
// #/stretch/warmup is the warm-up for today's plan, #/stretch/cooldown the cool-down for the workout just
// done, #/stretch/rest holds for what trained in the last two days, and #/stretch/picked the lifter's own
// pick. A routine shows its list with a reason for each stretch, then plays one at a time: the figure doing
// it, a countdown (with a "switch sides" halfway for one-sided stretches), Pause and Next. Everything is
// optional and skippable; the warm-up ends on Start workout. Pure web code, so Android, iOS and the web
// app get it together. Text: str.* (src/locales/text/str.ts).
import { useEffect, useEffectEvent, useMemo, useState, type CSSProperties } from "react";

import { bodyFor, LiftDemo } from "@/components/demo/LiftDemo";
import { SCREEN_TITLE } from "@/components/titles";
import { stretchView } from "@/lib/demo/stretchMotions";
import { endWorkout } from "@/lib/endWorkout";
import { exercise } from "@/lib/exercises";
import { planSeconds } from "@/lib/generator";
import { inSentence, list as listOf, t } from "@/lib/i18n";
import { haptic, keepAwake, sound } from "@/lib/juice";
import { CARDIO_MINUTES, cardioChoices, cardioDefault, extraOffer, rehabItems } from "@/lib/partExtras";
import { MAX_PART_STRETCHES, partDefaults, routinePart } from "@/lib/routines";
import { updateSession } from "@/lib/sessionNotify";
import { hadCoolDown, type LivePart, type LivePartKind } from "@/lib/sessions";
import { LIFT_FLOOR, splitParts, type SessionSplit, type SplitPart } from "@/lib/sessionSplit";
import { partNow, useApp } from "@/lib/store";
import {
  demoId,
  routineSeconds,
  searchStretches,
  stretch,
  STRETCHES,
  stretchSeconds,
  stretchWhy,
  suggest,
  type Stretch,
  type StretchKind,
  type StretchMoment,
} from "@/lib/stretches";
import { MUSCLE_LABEL, MUSCLES, type Muscle, type Routine, type RoutinePart, type StretchEvent } from "@/lib/types";
import { useNow } from "@/lib/useNow";

import { Icon } from "./icons";
import { useMyShape } from "./myShape";
import { go, goBack } from "./router";
import { muscleHue } from "./theme";
import { Button, Chip, EmptyState, InlineSwitch, ScreenHeader, Sheet, SwitchRow } from "./ui";

type Mode = "warmup" | "cooldown" | "rest" | "picked";
const MOMENT: Record<Mode, StretchMoment | "pick"> = { warmup: "warm", cooldown: "cool", rest: "rest", picked: "pick" };
const TITLE: Record<Mode, string> = {
  get warmup() {
    return t("str.for.warm");
  },
  get cooldown() {
    return t("str.for.cool");
  },
  get rest() {
    return t("str.for.rest");
  },
  get picked() {
    return t("str.for.pick");
  },
};
const isMode = (a?: string): a is Mode => a === "warmup" || a === "cooldown" || a === "rest" || a === "picked";

// The library's picks, kept for the session so going to the routine and back keeps them.
const PICK_KEY = "ls.stretchPick";
function readPick(): string[] {
  try {
    const v: unknown = JSON.parse(sessionStorage.getItem(PICK_KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && !!stretch(x)) : [];
  } catch {
    return [];
  }
}
function writePick(ids: string[]) {
  try {
    sessionStorage.setItem(PICK_KEY, JSON.stringify(ids));
  } catch {
    // private mode: picks last until the screen closes
  }
}

const highlight = (s: Stretch): Partial<Record<Muscle, number>> => Object.fromEntries(s.for.map((m, i) => [m, i === 0 ? 1 : 0.6]));
const mins = (sec: number) => Math.max(1, Math.round(sec / 60));

/** "10 reps", "30 s each side". */
export function dose(s: Stretch): string {
  if (s.reps) return t(s.eachSide ? "str.repsEach" : "str.reps", { n: s.reps });
  return t(s.eachSide ? "str.secsEach" : "str.secs", { n: s.seconds });
}

/** The muscles a routine is for: today's plan, the workout just done, or what trained in the last two days. */
export function useStretchMuscles(mode: Mode): Muscle[] {
  const { preview, stats, active } = useApp();
  const now = useNow(60_000);
  // During a workout with parts, its own plan says what's being trained.
  const plan = active?.plan ?? preview;
  return useMemo(() => {
    const of = (ids: readonly string[]) => [...new Set(ids.flatMap((id) => exercise(id).primary))];
    if (mode === "warmup") return of(plan?.items.map((i) => i.exerciseId) ?? []);
    if (mode === "cooldown") {
      if (active) return of(active.plan.items.map((i) => i.exerciseId));
      const last = stats.sessions[0];
      return last ? of(last.exercises) : of(preview?.items.map((i) => i.exerciseId) ?? []);
    }
    if (mode === "rest") return of(stats.sessions.filter((s) => now - s.start < 2 * 86400_000).flatMap((s) => s.exercises));
    return [];
  }, [mode, plan, active, preview, stats.sessions, now]);
}

export function StretchScreen({ arg }: { arg?: string }) {
  if (isMode(arg)) return <Routine key={arg} mode={arg} />;
  return <Library />;
}

// ---------- the library ----------
function Library() {
  const { preview, active } = useApp();
  const [kind, setKind] = useState<StretchKind | "all">("all");
  const [muscle, setMuscle] = useState<Muscle | "all">("all");
  const [picked, setPicked] = useState<string[]>(() => readPick());
  const [open, setOpen] = useState<Stretch | null>(null);
  const [text, setText] = useState("");
  const shown = searchStretches({ text, kind, muscle });
  const toggle = (id: string) => {
    haptic("select");
    sound.tick();
    const next = picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id];
    setPicked(next);
    writePick(next);
  };
  const run = (ids: string[]) => {
    writePick(ids);
    go("stretch", "picked");
  };
  const planned = !active && !!preview?.items.length;
  return (
    <div className={picked.length ? "pb-28" : "pb-2"}>
      <ScreenHeader back={{ label: t("str.back"), onClick: goBack }} title={t("str.title")} info="stretching" />
      <p className="mt-1 text-sm text-muted">{t("str.intro")}</p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {planned && <QuickStart icon="flame" title={t("str.for.warm")} onClick={() => go("stretch", "warmup")} />}
        <QuickStart icon="leaf" title={t("str.for.rest")} onClick={() => go("stretch", "rest")} />
      </div>

      <label className="sr-only" htmlFor="stretch-search">
        {t("str.search")}
      </label>
      <input
        id="stretch-search"
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t("str.search")}
        autoComplete="off"
        className="mt-5 w-full rounded-xl border border-line bg-raised px-3 py-3 text-base outline-none focus:border-accent"
      />
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={t("str.kinds")}>
        {(["all", "warm", "cool"] as const).map((k) => (
          <Chip key={k} active={kind === k} onClick={() => setKind(k)}>
            {t(`str.kind.${k}`)}
          </Chip>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label={t("str.muscles")}>
        <Chip active={muscle === "all"} onClick={() => setMuscle("all")}>
          {t("str.anyMuscle")}
        </Chip>
        {MUSCLES.map((m) => (
          <Chip key={m} active={muscle === m} onClick={() => setMuscle(m)}>
            {MUSCLE_LABEL[m]}
          </Chip>
        ))}
      </div>

      <ul hidden={!shown.length} className="card mt-4 divide-y divide-line/70 overflow-hidden" data-testid="stretch-list">
        {shown.map((s) => {
          const on = picked.includes(s.id);
          return (
            <li key={s.id} className="flex items-center gap-1 pr-2">
              <button type="button" onClick={() => setOpen(s)} className="press flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left">
                <span className="h-9 w-1 shrink-0 rounded-full" style={{ background: muscleHue(s.for[0] ?? "abs") }} aria-hidden />
                <span className="min-w-0">
                  <span className="block font-medium">{s.name}</span>
                  <span className="block text-sm text-muted">
                    <span className="num">{dose(s)}</span> · {t(`str.kind.${s.kind}`)}
                  </span>
                </span>
              </button>
              <button
                type="button"
                aria-pressed={on}
                aria-label={t("str.pickOne", { name: s.name })}
                onClick={() => toggle(s.id)}
                className="press grid h-11 w-11 shrink-0 place-items-center"
              >
                <span
                  className={`grid h-7 w-7 place-items-center rounded-full border text-sm ${on ? "border-accent bg-accent text-bg" : "border-line"}`}
                  aria-hidden
                >
                  {on ? "✓" : ""}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {!shown.length && <p className="mt-3 text-sm text-muted">{t("str.none")}</p>}

      <Sheet open={!!open} onClose={() => setOpen(null)} title={open?.name ?? ""}>
        {open && (
          <div>
            <StretchDemo s={open} className="h-64" />
            <p className="mt-3 text-sm font-medium">
              <span className="num">{dose(open)}</span> · {t(`str.kind.${open.kind}`)}
            </p>
            <p className="mt-1 text-sm text-muted">{stretchWhy(open, "pick", [])}</p>
            <p className="mt-3">{open.how}</p>
            <Button className="mt-4 w-full" icon="play" onClick={() => run([open.id])}>
              {t("str.doOne")}
            </Button>
          </div>
        )}
      </Sheet>

      {picked.length > 0 && (
        <div className="after-side pointer-events-none fixed inset-x-0 bottom-[var(--nav-h,4rem)] z-30 bg-gradient-to-t from-bg via-bg/90 to-transparent px-5 pb-3 pt-8">
          <div className="pointer-events-auto mx-auto flex max-w-lg items-center gap-2">
            <Button
              kind="quiet"
              onClick={() => {
                setPicked([]);
                writePick([]);
              }}
            >
              {t("str.clear")}
            </Button>
            <Button icon="play" className="flex-1 py-4" onClick={() => run(picked)}>
              {t("str.startPicked", { count: picked.length })}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function QuickStart({ icon, title, onClick }: { icon: "flame" | "leaf"; title: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="press card flex min-h-16 items-center gap-3 p-3 text-left">
      <span
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${icon === "flame" ? "bg-ember/15 text-ember" : "bg-cyan/15 text-cyan"}`}
        aria-hidden
      >
        <Icon name={icon} size={20} />
      </span>
      <span className="text-sm font-semibold">{title}</span>
    </button>
  );
}

function StretchDemo({ s, className = "", paused }: { s: Stretch; className?: string; paused?: boolean }) {
  const { profile } = useApp();
  const shape = useMyShape();
  return (
    <LiftDemo
      exerciseId={demoId(s.id)}
      name={s.name}
      highlight={highlight(s)}
      view={stretchView(s.id)}
      body={bodyFor(profile.sex)}
      shape={shape}
      fps={30}
      paused={paused}
      className={className}
    />
  );
}

// ---------- a routine ----------
function Routine({ mode }: { mode: Mode }) {
  const { gyms, profile, start, logStretch, active, nextPart, pickPart } = useApp();
  const muscles = useStretchMuscles(mode);
  // Workouts with parts: this warm-up or cool-down is a part of the workout in progress.
  const kind = partNow(active);
  const live = !!active?.parts && ((mode === "warmup" && kind === "warm") || (mode === "cooldown" && kind === "cool"));
  const gym = gyms.find((g) => g.id === profile.activeGymId) ?? gyms[0];
  const moment = MOMENT[mode];
  // A routine with its own warm-up or cool-down stretches runs those; otherwise they're picked for the day's muscles.
  const own = live
    ? routinePart(
        profile.routines?.find((r) => r.id === active.plan.routineId),
        kind === "warm" ? "warm" : "cool",
      )
    : undefined;
  const [list, setList] = useState<Stretch[]>(() =>
    mode === "picked"
      ? readPick().map((id) => stretch(id)!)
      : own?.stretches?.length
        ? own.stretches.flatMap((id) => stretch(id) ?? [])
        : suggest(moment as StretchMoment, muscles, gym?.equipment ?? [], Date.now(), mode === "rest" ? 8 : 5),
  );
  const [stage, setStage] = useState<"list" | "play" | "done">("list");
  const [info, setInfo] = useState<Stretch | null>(null);
  const total = routineSeconds(list);
  const startLifting = (skip = false) => {
    haptic("tap");
    sound.start();
    if (live) nextPart(skip);
    else {
      // A warm-up done from the library already happened: the workout starts at the lifting.
      pickPart("warm", false);
      start();
    }
    go("workout");
  };
  const finishWorkout = (skip = false) => {
    endWorkout({ skip });
    go("done");
  };

  if (stage === "play")
    return (
      <Player
        list={list}
        moment={moment}
        muscles={muscles}
        live={live ? { parts: active!.parts!, index: active!.part ?? 0, sessionId: active!.sessionId } : undefined}
        onStop={() => setStage("list")}
        onDone={(secs) => {
          logStretch(
            moment as StretchEvent["moment"],
            list.map((s) => s.id),
            secs,
          );
          // A part of the workout goes straight on: to the lifting, or to the end of the workout.
          if (live && mode === "warmup") return startLifting();
          if (live && mode === "cooldown") return finishWorkout();
          setStage("done");
        }}
      />
    );

  if (stage === "done")
    return (
      <div className="pb-4">
        <div className="card mt-6">
          <EmptyState icon="check" mascot="cheer" title={t("str.doneTitle")} body={t("str.doneBody", { count: list.length })} />
        </div>
        {mode === "warmup" ? (
          <Button icon="play" className="mt-4 w-full py-4 text-lg" onClick={() => startLifting()}>
            {t("str.startLift")}
          </Button>
        ) : (
          <Button className="mt-4 w-full py-4 text-lg" onClick={() => (mode === "picked" ? goBack() : go("today"))}>
            {t("str.done")}
          </Button>
        )}
      </div>
    );

  return (
    <div className="pb-2">
      <ScreenHeader
        back={{ label: t("str.back"), onClick: goBack }}
        kicker={live ? <PartStep parts={active!.parts!} index={active!.part ?? 0} /> : undefined}
        title={TITLE[mode]}
      />
      <p className="num mt-1 text-sm text-muted">{t("str.length", { count: list.length, min: mins(total) })}</p>
      <ol className="card mt-4 divide-y divide-line/70 overflow-hidden" data-testid="stretch-routine">
        {list.map((s, i) => (
          <li key={s.id} className="flex items-center gap-1 pr-2">
            <button type="button" onClick={() => setInfo(s)} className="press flex min-w-0 flex-1 items-start gap-3 px-4 py-3 text-left">
              <span className="num mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-accent/15 text-sm font-bold text-accent">
                {i + 1}
              </span>
              <span className="min-w-0">
                <span className="block font-medium">
                  {s.name} <span className="num text-sm font-normal text-muted">· {dose(s)}</span>
                </span>
                <span className="block text-sm text-muted">{stretchWhy(s, moment, muscles)}</span>
              </span>
            </button>
            <button
              type="button"
              aria-label={t("str.remove", { name: s.name })}
              onClick={() => {
                haptic("tick");
                setList(list.filter((x) => x.id !== s.id));
              }}
              className="press grid h-11 w-11 shrink-0 place-items-center rounded-full text-faint"
            >
              ✕
            </button>
          </li>
        ))}
      </ol>
      <Button
        icon="play"
        className="mt-4 w-full py-4 text-lg"
        disabled={!list.length}
        onClick={() => {
          haptic("tap");
          sound.start();
          setStage("play");
        }}
      >
        {t("str.start")}
      </Button>
      {mode === "warmup" && (
        <Button kind="ghost" className="mt-3 w-full" onClick={() => startLifting(true)}>
          {t("str.skipLift")}
        </Button>
      )}
      {live && mode === "cooldown" && (
        <Button kind="ghost" className="mt-3 w-full" onClick={() => finishWorkout(true)}>
          {t("str.part.skipFinish")}
        </Button>
      )}
      <Sheet open={!!info} onClose={() => setInfo(null)} title={info?.name ?? ""}>
        {info && (
          <div>
            <StretchDemo s={info} className="h-64" />
            <p className="mt-3 text-sm font-medium num">{dose(info)}</p>
            <p className="mt-3">{info.how}</p>
          </div>
        )}
      </Sheet>
    </div>
  );
}

/** One stretch at a time, timed. Reps-based moves get about 3 seconds a rep. */
function Player({
  list,
  moment,
  muscles,
  live,
  onStop,
  onDone,
}: {
  list: Stretch[];
  moment: StretchMoment | "pick";
  muscles: Muscle[];
  /** A part of the workout in progress: the lock screen and watches follow the stretches. */
  live?: { parts: readonly LivePart[]; index: number; sessionId: string };
  onStop: () => void;
  onDone: (seconds: number) => void;
}) {
  const [i, setI] = useState(0);
  const [side, setSide] = useState<0 | 1>(0);
  const [paused, setPaused] = useState(false);
  const segment = (s: Stretch) => (s.eachSide ? stretchSeconds(s) / 2 : stretchSeconds(s)) * 1000;
  const [endsAt, setEndsAt] = useState(() => Date.now() + segment(list[0]!));
  const [left, setLeft] = useState(segment(list[0]!));
  const [say, setSay] = useState("");
  const [startedAt] = useState(() => Date.now());
  const s = list[i]!;
  const nextUp = list[i + 1];

  useEffect(() => {
    void keepAwake(true);
    return () => void keepAwake(false);
  }, []);

  const advance = () => {
    if (s.eachSide && side === 0) {
      haptic("toggle");
      sound.toggle(true);
      setSide(1);
      setEndsAt(Date.now() + segment(s));
      setLeft(segment(s));
      setSay(t("str.switch"));
      return;
    }
    const n = i + 1;
    if (n >= list.length) {
      haptic("success");
      sound.done();
      onDone((Date.now() - startedAt) / 1000);
      return;
    }
    haptic("tick");
    sound.log();
    setI(n);
    setSide(0);
    setEndsAt(Date.now() + segment(list[n]!));
    setLeft(segment(list[n]!));
    setSay(list[n]!.name);
  };
  const tick = useEffectEvent(() => {
    const ms = endsAt - Date.now();
    setLeft(Math.max(0, ms));
    if (ms <= 0) advance();
  });

  useEffect(() => {
    if (paused) return;
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [paused, endsAt]);

  // The live notification (Android), Live Activity (iOS) and the watches: the part, the stretch and its countdown,
  // through the same fields the lifting uses, so every platform shows it with no code of its own.
  useEffect(() => {
    if (!live) return;
    const part = live.parts[live.index]!.kind;
    const after = live.parts[live.index + 1];
    void updateSession({
      title: t("str.part.notify", { part: partLabel(part), name: s.name }),
      setLabel: t("str.part.step", { part: partLabel(part), n: live.index + 1, total: live.parts.length }),
      next: nextUp ? nextUp.name : after ? partLabel(after.kind) : t("str.part.finish"),
      restUntil: null,
      chip: `${i + 1}/${list.length}`,
      done: i,
      total: list.length,
      sessionId: live.sessionId,
      ahead: [],
      timer: paused
        ? undefined
        : [{ from: endsAt - segment(s), to: endsAt, label: s.eachSide ? (side === 0 ? t("str.left") : t("str.right")) : s.name }],
      timerOver: paused ? undefined : t("timer.over"),
    });
  }, [i, side, paused, endsAt]); // eslint-disable-line react-hooks/exhaustive-deps

  const segMs = segment(s);
  const secs = Math.ceil(left / 1000);
  return (
    <div className="pb-4">
      <div className="flex items-center justify-between pt-2">
        <button type="button" onClick={onStop} className="press -ml-2 min-h-11 px-2 text-muted">
          ‹ {t("str.stop")}
        </button>
        <span className="num text-sm text-muted">{t("str.step", { n: i + 1, total: list.length })}</span>
      </div>
      <div className="card mt-2 overflow-hidden">
        <StretchDemo s={s} className="h-72" paused={paused} />
      </div>
      <h1 className={`mt-4 ${SCREEN_TITLE}`}>{s.name}</h1>
      <p className="mt-1 text-sm text-muted">{stretchWhy(s, moment === "pick" ? "pick" : moment, muscles)}</p>
      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          {s.eachSide && <p className="text-sm font-semibold text-accent">{side === 0 ? t("str.left") : t("str.right")}</p>}
          <p className="num text-sm text-muted">{dose(s)}</p>
        </div>
        <div role="timer" aria-label={t("str.timeLeft")} className="display text-[3rem] leading-none">
          {secs}
          <span className="ml-1 text-base font-semibold tracking-normal text-muted">s</span>
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-line" aria-hidden>
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-200"
          style={{ width: `${100 - (left / segMs) * 100}%` }}
        />
      </div>
      <p className="mt-4">{s.how}</p>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Button
          kind="ghost"
          onClick={() => {
            haptic("tick");
            if (paused) setEndsAt(Date.now() + left);
            setPaused(!paused);
          }}
        >
          {paused ? t("str.resume") : t("str.pause")}
        </Button>
        <Button kind="ghost" onClick={advance}>
          {t("str.next")} ›
        </Button>
      </div>
      {nextUp && <p className="mt-3 text-center text-sm text-faint">{t("str.nextUp", { name: nextUp.name })}</p>}
      <p className="sr-only" aria-live="polite">
        {say}
      </p>
    </div>
  );
}

// ---------- on other screens ----------
/** Done: a cool-down for the muscles just trained (Settings › Workout can turn it off). */
export function CoolDownCard() {
  const { profile, events, stats } = useApp();
  const muscles = useStretchMuscles("cooldown");
  const last = stats.sessions[0]?.sessionId;
  // A workout that ran a cool-down part (or had one logged with it) doesn't need another offered.
  const cooled = useMemo(
    () =>
      !!last &&
      events.some(
        (e) =>
          (e.type === "stretch" && e.moment === "cool" && e.sessionId === last) ||
          ((e.type === "sessionEnd" || e.type === "sessionStart") &&
            e.sessionId === last &&
            hadCoolDown(e.type === "sessionEnd" ? e.parts : e.plan)),
      ),
    [events, last],
  );
  if (profile.training?.coolDown === false || cooled) return null;
  const names = muscles.slice(0, 3).map((m) => inSentence(MUSCLE_LABEL[m], true));
  return (
    <button
      type="button"
      onClick={() => go("stretch", "cooldown")}
      className="press card card-tint mt-4 flex w-full items-center gap-4 p-4 text-left"
      style={{ "--tint": "var(--color-cyan)" } as CSSProperties}
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cyan/15 text-cyan" aria-hidden>
        <Icon name="stretch" size={22} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{t("str.coolCard")}</span>
        <span className="block text-sm text-muted">{names.length ? t("str.coolBody", { muscles: listOf(names) }) : t("str.restAny")}</span>
      </span>
      <span className="text-accent" aria-hidden>
        ›
      </span>
    </button>
  );
}

/**
 * The stretch library from Today, any day (Melvin, 2026-11-14: "Can you add it on today"). Before this it was only
 * under Progress › All tools. It opens the library itself; the rest-day and cool-down cards open their own lists.
 */
export function StretchLibraryCard() {
  return (
    <button
      type="button"
      onClick={() => go("stretch")}
      className="press card mt-4 flex w-full items-center gap-4 p-4 text-left"
      data-testid="today-stretch-library"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cyan/15 text-cyan" aria-hidden>
        <Icon name="stretch" size={22} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{t("str.hub")}</span>
        <span className="block text-sm text-muted">{t("str.hubBody", { count: STRETCHES.length })}</span>
      </span>
      <span className="text-accent" aria-hidden>
        ›
      </span>
    </button>
  );
}

/** The stretch switches in Settings › Workout. */
export function StretchSettings() {
  const { profile, setProfile } = useApp();
  const tp = profile.training ?? {};
  return (
    <>
      <SwitchRow
        label={t("str.warmSetting")}
        hint={t("str.warmHint")}
        on={tp.warmFirst === true}
        onChange={(v) => setProfile({ training: { ...profile.training, warmFirst: v || undefined } })}
      />
      <SwitchRow
        label={t("str.coolSetting")}
        hint={t("str.coolHint")}
        on={tp.coolDown !== false}
        onChange={(v) => setProfile({ training: { ...profile.training, coolDown: v ? undefined : false } })}
      />
    </>
  );
}

// ---------- parts of a workout (workouts with parts) ----------
/** "Warm-up", "Lifting", "Rehab", "Cool-down". */
export function partLabel(kind: LivePartKind): string {
  return t(`str.part.${kind}`);
}

/** "Warm-up · 1 of 3" above a part's title, when the workout has more than one part. */
export function PartStep({ parts, index }: { parts: readonly LivePart[]; index: number }) {
  const p = parts[index];
  if (!p || parts.length < 2) return null;
  return <span data-testid="part-step">{t("str.part.step", { part: partLabel(p.kind), n: index + 1, total: parts.length })}</span>;
}

/**
 * Today: the parts the next workout will run through, in order. The warm-up and cool-down are switches for this
 * workout only (their defaults are Settings › Workout's), each with how long it takes and why; Start runs them.
 */
/** One hue per part, the same in the split bar and on each part's row on Today. */
const PART_HUE: Record<SplitPart, string> = {
  warm: "var(--color-ember)",
  lift: "var(--color-accent)",
  rehab: "var(--color-violet)",
  cardio: "var(--color-mint)",
  cool: "var(--color-cyan)",
};

/**
 * The thin bar under Today's length slider (Melvin, 2026-11-14): where the workout's minutes go, coloured by part,
 * with the minutes written under it (colour is never the only cue), and why when the cardio was cut or the workout
 * runs over so lifting keeps its floor.
 */
export function SplitBar({ split }: { split: SessionSplit }) {
  const parts = splitParts(split);
  const why = split.noLift
    ? split.over > 0 || split.cardio === 0
      ? t("str.part.noLiftTotal", { total: split.total })
      : t("str.part.noLift")
    : split.over > 0
      ? t("str.part.over", { floor: LIFT_FLOOR, total: split.total })
      : split.cardioCut > 0
        ? t("str.part.cardioCut", { n: split.cardio, floor: LIFT_FLOOR })
        : "";
  return (
    <div className="mt-3" data-testid="split-bar" role="group" aria-label={t("str.part.splitLabel")}>
      <div className="flex h-1.5 gap-0.5 overflow-hidden rounded-full" aria-hidden="true">
        {parts.map((p) => (
          <span
            key={p.kind}
            className="h-full rounded-full transition-[flex-grow] duration-300"
            style={{ flexGrow: p.minutes, flexBasis: 0, background: PART_HUE[p.kind] }}
          />
        ))}
      </div>
      <p className="num mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted">
        {parts.map((p) => (
          <span key={p.kind} className="inline-flex items-center gap-1.5" data-testid={`split-${p.kind}`}>
            <span className="size-1.5 shrink-0 rounded-full" style={{ background: PART_HUE[p.kind] }} aria-hidden="true" />
            {t("str.part.splitSeg", { n: p.minutes, part: partLabel(p.kind) })}
          </span>
        ))}
      </p>
      {why && (
        <p className="mt-1.5 flex items-start gap-1.5 text-xs text-muted" data-testid="split-why">
          <Icon name="target" size={13} className="mt-[2px] shrink-0 text-accent" />
          <span>{why}</span>
        </p>
      )}
    </div>
  );
}

export function TodayParts() {
  const { profile, gyms, preview, partPicks, pickPart, pickCardio, events, split } = useApp();
  const muscles = useStretchMuscles("warmup");
  const now = useNow(60_000);
  const gym = gyms.find((g) => g.id === profile.activeGymId) ?? gyms[0];
  // A routine with parts says what it runs; otherwise the warm-up follows Settings and the cool-down part starts off
  // (Settings › Workout's "Offer a cool-down" is the card on Done).
  const routine = profile.routines?.find((r) => r.id === preview?.routineId);
  const dflt = partDefaults(routine, profile.training?.warmFirst);
  const warmOn = partPicks.warm ?? dflt.warm;
  const coolOn = partPicks.cool ?? dflt.cool;
  const mins = useMemo(() => {
    const eq = gym?.equipment ?? [];
    const of = (m: StretchMoment) => Math.max(1, Math.round(routineSeconds(suggest(m, muscles, eq, now)) / 60));
    return { warm: of("warm"), cool: of("cool") };
  }, [muscles, gym, now]);
  // Rehab beside the lifting and cardio after it (stage 5): what's offered and whether each starts on.
  const offer = useMemo(
    () => (gym && preview ? extraOffer(profile, routine, preview, gym, events, now) : null),
    [gym, preview, profile, routine, events, now],
  );
  const rehabMin = useMemo(() => {
    if (!offer?.rehab || !gym) return 0;
    return Math.max(1, Math.round(planSeconds(rehabItems(offer.rehab.routine, gym, events, profile, now)) / 60));
  }, [offer, gym, events, profile, now]);
  if (!preview || !preview.items.length) return null;
  const names = listOf(muscles.slice(0, 3).map((m) => inSentence(MUSCLE_LABEL[m], true)));
  const main: LivePartKind = preview.rehab ? "rehab" : "lift";
  const rehabOn = !!offer?.rehab && (partPicks.rehab ?? offer.rehab.due.due);
  const cardio = offer?.cardio && {
    exerciseId: partPicks.cardioId ?? offer.cardio.exerciseId,
    minutes: partPicks.cardioMin ?? offer.cardio.minutes,
  };
  const cardioOn = !!cardio && (partPicks.cardio ?? offer?.cardioOn ?? false);
  // Lifting can be switched off when the plan follows the slider (Melvin, 2026-11-14: "some days i might want to
  // only do cardio and stretch"); it stays on while there's no cardio or rehab to do instead.
  const liftOn = !split || main !== "lift" || partPicks.lift !== false || (!rehabOn && !cardioOn);
  // When the plan follows the slider, each row shows what the split gave it (a cut cardio included).
  const minutesOf = (kind: SplitPart, own: number) => (split && split[kind] > 0 ? split[kind] : own);
  const label = (icon: Parameters<typeof Icon>[0]["name"], hue: string, text: string, minutes: number | null) => (
    <span className="flex items-center gap-2 font-semibold">
      <Icon name={icon} size={16} className={hue} />
      {text} {minutes !== null && <span className="num font-normal text-muted">· {t("str.part.minutes", { n: minutes })}</span>}
    </span>
  );
  const row = (kind: "warm" | "cool", on: boolean) => (
    <InlineSwitch
      label={label(
        kind === "warm" ? "flame" : "leaf",
        kind === "warm" ? "text-ember" : "text-cyan",
        partLabel(kind),
        on ? minutesOf(kind, mins[kind]) : mins[kind],
      )}
      hint={t(kind === "warm" ? "str.part.warmWhy" : "str.part.coolWhy", { muscles: names })}
      on={on}
      onChange={(v) => pickPart(kind, v)}
      className="px-4 py-3"
    />
  );
  const rehabWhy = () => {
    const r = offer!.rehab!;
    const name = r.routine.name;
    if (r.due.days === undefined) return t("str.part.rehabWhyNew", { name });
    if (r.due.days === 0) return t("str.part.rehabWhyToday", { name });
    return t("str.part.rehabWhyDays", { name, count: r.due.days });
  };
  const cardioWhy = () => {
    const name = exercise(cardio!.exerciseId).name;
    if (cardioOn && !liftOn) return t("str.part.cardioWhyAlone", { name });
    if (routinePart(routine, "cardio")) return t("str.part.cardioWhyRoutine", { name });
    const before = events.some((e) => e.type === "set" && e.partId === "cardio");
    return t(before ? "str.part.cardioWhyLast" : "str.part.cardioWhyNew", { name });
  };
  return (
    <section className="card mt-4 divide-y divide-line overflow-hidden" data-testid="today-parts" aria-label={t("str.part.title")}>
      {row("warm", warmOn)}
      {split && main === "lift" && (offer?.cardio || offer?.rehab) ? (
        <div data-testid="part-lift">
          <InlineSwitch
            label={label("dumbbell", "text-accent", partLabel("lift"), liftOn ? minutesOf("lift", preview.estMinutes) : null)}
            hint={liftOn ? undefined : t("str.part.liftOff")}
            on={liftOn}
            onChange={(v) => pickPart("lift", v)}
            className="px-4 py-3"
          />
        </div>
      ) : (
        <div className="flex min-h-11 items-center gap-2 px-4 py-3">
          <Icon name="dumbbell" size={16} className="text-accent" />
          <span className="font-semibold">{partLabel(main)}</span>
          <span className="num text-muted">· {t("str.part.minutes", { n: minutesOf("lift", preview.estMinutes) })}</span>
        </div>
      )}
      {offer?.rehab && (
        <div data-testid="part-rehab">
          <InlineSwitch
            label={label("bandage", "text-violet", partLabel("rehab"), rehabOn ? minutesOf("rehab", rehabMin) : rehabMin)}
            hint={rehabWhy()}
            on={rehabOn}
            onChange={(v) => pickPart("rehab", v)}
            className="px-4 py-3"
          />
        </div>
      )}
      {cardio && (
        <div data-testid="part-cardio">
          <InlineSwitch
            label={label("heart", "text-mint", partLabel("cardio"), cardioOn ? minutesOf("cardio", cardio.minutes) : cardio.minutes)}
            hint={cardioWhy()}
            on={cardioOn}
            onChange={(v) => pickPart("cardio", v)}
            className="px-4 py-3"
          />
          {cardioOn && gym && (
            <CardioPicker
              choices={cardioChoices(gym, events)}
              value={cardio}
              onPick={(c) => pickCardio(c)}
              minutes={liftOn}
              className="px-4 pb-3"
            />
          )}
        </div>
      )}
      {row("cool", coolOn)}
    </section>
  );
}

/** The cardio part's exercise and minutes as chips: one tap each, no typing (Today and the routine builder). */
export function CardioPicker({
  choices,
  value,
  onPick,
  minutes = true,
  className = "",
}: {
  choices: readonly string[];
  value: { exerciseId?: string; minutes?: number };
  onPick: (c: { exerciseId?: string; minutes?: number }) => void;
  /** False when the slider sets the cardio's length (lifting off on Today), so there are no minute chips. */
  minutes?: boolean;
  className?: string;
}) {
  const ids = value.exerciseId && !choices.includes(value.exerciseId) ? [value.exerciseId, ...choices] : choices;
  return (
    <div className={className} data-testid="cardio-picker">
      <div className="flex flex-wrap gap-2" role="group" aria-label={t("str.part.cardioWhat")}>
        {ids.map((id) => (
          <Chip key={id} active={id === value.exerciseId} onClick={() => onPick({ exerciseId: id })}>
            {exercise(id).name}
          </Chip>
        ))}
      </div>
      {minutes && (
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label={t("str.part.cardioHowLong")}>
          {CARDIO_MINUTES.map((m) => (
            <Chip key={m} active={m === value.minutes} onClick={() => onPick({ minutes: m })}>
              {t("str.part.cardioMin", { n: m })}
            </Chip>
          ))}
        </div>
      )}
    </div>
  );
}

/** "Warm-up (4 stretches) → Lifting → Cool-down": a routine's parts in order, for its card and its shared page. */
export function routinePartsLine(r: Pick<Routine, "parts" | "rehab">): string {
  const one = (kind: "warm" | "cool") => {
    const p = routinePart(r, kind);
    if (!p) return [];
    return [p.stretches?.length ? t("str.part.withStretches", { part: partLabel(kind), count: p.stretches.length }) : partLabel(kind)];
  };
  const cardio = routinePart(r, "cardio");
  const cardioText = cardio
    ? [
        cardio.exerciseId
          ? t("str.part.cardioWith", { part: partLabel("cardio"), name: exercise(cardio.exerciseId).name })
          : partLabel("cardio"),
      ]
    : [];
  return [...one("warm"), partLabel(r.rehab ? "rehab" : "lift"), ...cardioText, ...one("cool")].join(" → ");
}

/**
 * The routine builder's parts (sessions-with-parts.md, stage 3): a warm-up before and a cool-down after the
 * exercises, each a switch, with its own stretches picked from the library or none to let the app pick on the day.
 */
export function RoutinePartsEditor({
  parts,
  onChange,
}: {
  parts: RoutinePart[] | undefined;
  onChange: (p: RoutinePart[] | undefined) => void;
}) {
  const { gyms, profile, events } = useApp();
  const gym = gyms.find((g) => g.id === profile.activeGymId) ?? gyms[0];
  const [choosing, setChoosing] = useState<"warm" | "cool" | null>(null);
  const get = (kind: RoutinePart["kind"]) => parts?.find((p) => p.kind === kind);
  const put = (kind: RoutinePart["kind"], p: RoutinePart | null) => {
    const next = (["warm", "cardio", "cool"] as const).flatMap((k) => (k === kind ? (p ? [p] : []) : (get(k) ?? [])));
    onChange(next.length ? next : undefined);
  };
  // Cardio after the lifting (stage 5): a switch, then the exercise and minutes as chips. Starting it fills in what
  // Today would pick (last time's, or the first this gym can do), so the routine says what it runs.
  const cardioRow = () => {
    const p = get("cardio");
    const pick = gym ? cardioDefault(p, gym, events) : undefined;
    return (
      <div className="px-3 py-2">
        <InlineSwitch
          label={
            <span className="flex items-center gap-2 font-medium">
              <Icon name="heart" size={16} className="text-ember" />
              {t("str.part.routineCardio")}
            </span>
          }
          hint={
            p && (p.exerciseId ?? pick?.exerciseId)
              ? t("str.part.cardioPlan", { name: exercise((p.exerciseId ?? pick?.exerciseId)!).name, n: p.minutes ?? pick?.minutes ?? 15 })
              : undefined
          }
          on={!!p}
          onChange={(on) =>
            put("cardio", on ? { kind: "cardio", ...(pick ? { exerciseId: pick.exerciseId, minutes: pick.minutes } : {}) } : null)
          }
        />
        {p && gym && (
          <CardioPicker
            choices={cardioChoices(gym, events)}
            value={{ exerciseId: p.exerciseId ?? pick?.exerciseId, minutes: p.minutes ?? pick?.minutes }}
            onPick={(c) => put("cardio", { ...p, ...c })}
            className="mt-1"
          />
        )}
      </div>
    );
  };
  const row = (kind: "warm" | "cool") => {
    const p = get(kind);
    const ids = p?.stretches ?? [];
    const toggle = (id: string) => {
      const next = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id].slice(0, MAX_PART_STRETCHES);
      put(kind, next.length ? { kind, stretches: next } : { kind });
    };
    return (
      <div className="px-3 py-2">
        <InlineSwitch
          label={
            <span className="flex items-center gap-2 font-medium">
              <Icon name={kind === "warm" ? "flame" : "leaf"} size={16} className={kind === "warm" ? "text-ember" : "text-cyan"} />
              {t(kind === "warm" ? "str.part.routineWarm" : "str.part.routineCool")}
            </span>
          }
          hint={p ? (ids.length ? listOf(ids.flatMap((id) => stretch(id)?.name ?? [])) : t("str.part.auto")) : undefined}
          on={!!p}
          onChange={(on) => {
            put(kind, on ? { kind } : null);
            if (!on && choosing === kind) setChoosing(null);
          }}
        />
        {p &&
          (choosing === kind ? (
            <div className="mt-2" data-testid={`part-stretches-${kind}`}>
              <p className="text-sm text-muted">{t("str.part.pickHint")}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {searchStretches({ kind }).map((st) => (
                  <Chip key={st.id} active={ids.includes(st.id)} onClick={() => toggle(st.id)}>
                    {st.name}
                  </Chip>
                ))}
              </div>
              <Button kind="quiet" className="mt-2 w-full" onClick={() => setChoosing(null)}>
                {t("str.part.chosen")}
              </Button>
            </div>
          ) : (
            <Button kind="quiet" icon="stretch" className="mt-1 w-full" onClick={() => setChoosing(kind)}>
              {t("str.part.choose")}
            </Button>
          ))}
      </div>
    );
  };
  return (
    <section
      className="mt-4 divide-y divide-line/70 overflow-hidden rounded-2xl border border-line"
      data-testid="routine-parts"
      aria-label={t("str.part.routineTitle")}
    >
      {row("warm")}
      {cardioRow()}
      {row("cool")}
    </section>
  );
}
