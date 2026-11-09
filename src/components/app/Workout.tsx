"use client";
import { track } from "@/lib/analytics";
import { useNow } from "@/lib/useNow";
import { PlateBar, type PlateFinish } from "@/components/PlateBar";
import { COSMETICS } from "@/lib/game";
import { exercise } from "@/lib/exercises";
import { alternatives } from "@/lib/generator";
import { connectHeartRate, hrSupported, hrZone, type HrConnection } from "@/lib/heartRate";
import { saveWorkout } from "@/lib/health";
import { haptic, keepAwake, sound } from "@/lib/juice";
import { barFor, stepLoad } from "@/lib/loads";
import { loadBar } from "@/lib/plates";
import { TIMED } from "@/lib/progression";
import { notifyPermission, restOverAlert, stopSession, updateSession } from "@/lib/sessionNotify";
import { useApp, warmingUp } from "@/lib/store";
import { MUSCLE_LABEL } from "@/lib/types";
import { fmtNum, fromKg } from "@/lib/units";
import { useEffect, useRef, useState } from "react";
import { clock, loadText, plateText, repsText } from "./format";
import { go } from "./router";
import { Button, Ring, Sheet, Stepper } from "./ui";
import { AlmostThere, PrMoment } from "./WorkoutJuice";

let hrConn: HrConnection | null = null;

export function Workout() {
  const s = useApp();
  const { active, gyms, profile, events } = s;
  const gym = gyms.find((g) => g.id === active?.plan.gymId) ?? gyms[0];
  const now = useNow(250);
  const [swapOpen, setSwapOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const [bpm, setBpm] = useState<number | null>(null);
  const [popKey, setPopKey] = useState(0);
  const restRef = useRef<number | null>(null);
  const lastBeep = useRef(0);

  useEffect(() => {
    void keepAwake(true);
    void notifyPermission();
    sound.enabled = profile.restSounds;
    return () => void keepAwake(false);
  }, [profile.restSounds]);

  const item = active?.plan.items[active.index];
  const ex = item ? exercise(item.exerciseId) : null;
  const doneSets = active && item ? events.filter((e) => e.type === "set" && e.sessionId === active.sessionId && e.exerciseId === item.exerciseId).length : 0;
  const resting = !!active?.restUntil && active.restUntil > now;
  const left = active?.restUntil ? (active.restUntil - now) / 1000 : 0;
  const finished = !!active && active.index >= active.plan.items.length;
  const warming = !!active && warmingUp(active);
  const warmTotal = item?.warmup?.length ?? 0;
  const warmDone = Math.min(active?.warm ?? 0, warmTotal);
  const setLabel = warming ? `Warm-up ${warmDone + 1} of ${warmTotal}` : `Set ${Math.min(doneSets + 1, item?.sets ?? 1)} of ${item?.sets ?? 1}`;

  // Rest countdown: beeps in the last 3 seconds, then the alert.
  useEffect(() => {
    if (!active?.restUntil) {
      restRef.current = null;
      return;
    }
    restRef.current = active.restUntil;
    const secs = Math.ceil(left);
    if (secs <= 3 && secs > 0 && lastBeep.current !== secs) {
      lastBeep.current = secs;
      sound.countdown();
    }
    if (left <= 0) {
      lastBeep.current = 0;
      sound.restEnd();
      haptic("thud");
      void restOverAlert(ex ? `${ex.name}, ${loadText(ex, active.weight, profile.unit)} × ${active.reps}` : "Next set");
      s.skipRest();
    }
  }, [now]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the live notification in step.
  useEffect(() => {
    if (!active || !ex || !gym) return;
    void updateSession({
      title: resting ? `Rest · ${ex.name}` : ex.name,
      setLabel,
      next: `${loadText(ex, active.weight, profile.unit)} × ${repsText(ex, active.reps)}`,
      plates: plateText(ex, active.weight, gym),
      restUntil: resting ? active.restUntil : null,
      hr: bpm ?? undefined,
      sound: profile.restSounds,
    });
  }, [active?.index, active?.restUntil, active?.weight, active?.reps, doneSets, warmDone, bpm]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!active || !gym) {
    return (
      <div className="pt-10 text-center">
        <p className="text-muted">No workout running.</p>
        <Button className="mt-4" onClick={() => go("today")}>Back to today</Button>
      </div>
    );
  }

  const elapsed = Math.floor((now - active.startedAt) / 1000);
  const totalSets = active.plan.items.reduce((n, i) => n + i.sets, 0);
  const setsLogged = events.filter((e) => e.type === "set" && e.sessionId === active.sessionId).length;

  const log = () => {
    haptic("tap");
    sound.log();
    setPopKey((k) => k + 1);
    s.logSet();
  };

  const end = () => {
    const startedAt = active.startedAt;
    const ev = s.finish();
    if (ev?.type === "sessionEnd") void saveWorkout({ start: startedAt, end: ev.at, bodyweightKg: profile.bodyweight, avgHr: ev.avgHr });
    void stopSession();
    hrConn?.disconnect();
    hrConn = null;
    go("done");
  };

  const connectHr = async () => {
    try {
      hrConn = await connectHeartRate(
        (b) => {
          setBpm(b);
          s.pushHr(b);
        },
        () => setBpm(null),
      );
      track("feature", { name: "heart_rate", detail: "workout" });
    } catch {}
  };

  const unit = gym.unit;
  const barbell = ex?.load === "barbell";
  const bar = ex && barbell ? barFor(ex, gym) : null;
  const loading = ex && bar ? loadBar(fromKg(active.weight, unit), bar.weight, gym.plates) : null;
  const zone = bpm ? hrZone(bpm) : null;
  const finish = (COSMETICS.find((c) => c.id === profile.cosmetics?.plates)?.value ?? "classic") as PlateFinish;

  return (
    <div className="pb-44">
      <PrMoment />
      <header className="flex items-center justify-between pt-1">
        <button type="button" onClick={() => go("today")} className="press -ml-2 min-h-11 rounded-full px-2 text-muted">‹ Today</button>
        <div className="num text-sm text-muted">{clock(elapsed)} · {setsLogged}/{totalSets} sets</div>
        <div className="flex items-center gap-2">
          {bpm ? (
            <span className="num flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-sm font-semibold" style={{ color: zone!.colour }}>
              <span className="animate-pulse">♥</span> {bpm}
            </span>
          ) : hrSupported() ? (
            <button type="button" onClick={connectHr} className="press min-h-11 rounded-full border border-line px-3 text-sm text-muted">♥ Connect</button>
          ) : null}
          <button type="button" onClick={() => setEndOpen(true)} className="press min-h-11 min-w-11 rounded-full border border-line px-4 text-sm">End</button>
        </div>
      </header>

      <div className="mt-3 flex gap-1" aria-label="Progress">
        {active.plan.items.map((it, i) => (
          <button key={i} type="button" aria-label={exercise(it.exerciseId).name} onClick={() => s.goTo(i)} className={`h-1.5 flex-1 rounded-full ${i < active.index ? "bg-good" : i === active.index ? "bg-accent" : "bg-line"}`} />
        ))}
      </div>

      {finished ? (
        <div className="card animate-pop mt-6 p-6 text-center">
          <div className="text-4xl">🏁</div>
          <h2 className="mt-2 text-2xl font-bold">All sets done</h2>
          <p className="mt-1 text-muted">Great work. Finish to see your summary.</p>
          {active.askFeedback && <Feedback name={exercise(active.askFeedback).name} onPick={s.feedback} />}
        </div>
      ) : ex && item ? (
        <>
          <section className="mt-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-accent">{item.focus && MUSCLE_LABEL[item.focus]} · {setLabel}</p>
                <h1 className="mt-0.5 text-[26px] font-bold leading-tight">{ex.name}</h1>
              </div>
              <div className="flex shrink-0 gap-2">
                <button type="button" onClick={() => setInfoOpen(true)} className="press grid h-10 w-10 place-items-center rounded-full border border-line bg-surface text-muted" aria-label="How to do it">i</button>
                <button type="button" onClick={() => setSwapOpen(true)} className="press grid h-10 w-10 place-items-center rounded-full border border-line bg-surface text-muted" aria-label="Swap exercise">⇄</button>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              {Array.from({ length: warmTotal }, (_, i) => (
                <span key={`w${i}`} className={`h-1.5 w-4 rounded-full ${i < warmDone ? "bg-good/60" : warming && i === warmDone ? "bg-accent/70" : "bg-line"}`} />
              ))}
              {Array.from({ length: item.sets }, (_, i) => (
                <span key={i} className={`h-2 w-8 rounded-full ${i < doneSets ? "bg-good" : !warming && i === doneSets ? "bg-accent" : "bg-line"}`} />
              ))}
            </div>
          </section>

          {resting ? (
            <section className="card animate-pop mt-5 flex flex-col items-center p-5">
              <Ring value={left / Math.max(1, active.restTotal)}>
                <div className="text-center">
                  <div className="text-xs uppercase tracking-wider text-muted">Rest</div>
                  <div className="num text-6xl font-bold">{clock(left)}</div>
                </div>
              </Ring>
              <div className="mt-4 flex gap-3">
                <Button kind="ghost" onClick={() => s.addRest(30)}>+30 s</Button>
                <Button kind="ghost" onClick={() => s.skipRest()}>Skip rest</Button>
              </div>
              {active.askFeedback && <Feedback name={exercise(active.askFeedback).name} onPick={s.feedback} />}
              <div className="mt-5 w-full border-t border-line pt-4">
                <p className="text-center text-sm text-muted">Next up: <span className="text-ink">{loadText(ex, active.weight, profile.unit)} × {repsText(ex, active.reps)}</span></p>
                {loading && bar && <div className="mt-2"><PlateBar loading={loading} bar={bar.weight} unit={unit} compact finish={finish} /></div>}
                <AlmostThere exerciseId={ex.id} weight={active.weight} reps={active.reps} />
              </div>
            </section>
          ) : (
            <section key={popKey} className="card animate-rise mt-5 p-5">
              <div className="flex flex-col items-center gap-5">
                {ex.load !== "bodyweight" && (
                  <Stepper
                    label="weight"
                    suffix={ex.load === "dumbbell" ? `${unit} each` : unit}
                    value={fmtNum(fromKg(active.weight, unit))}
                    onDown={() => s.adjust(stepLoad(active.weight, -1, ex, gym), active.reps)}
                    onUp={() => s.adjust(stepLoad(active.weight, 1, ex, gym), active.reps)}
                  />
                )}
                <Stepper label="reps" suffix={TIMED.has(ex.id) ? "seconds" : "reps"} value={String(active.reps)} onDown={() => s.adjust(active.weight, active.reps - (TIMED.has(ex.id) ? 5 : 1))} onUp={() => s.adjust(active.weight, active.reps + (TIMED.has(ex.id) ? 5 : 1))} />
              </div>
              {warming ? (
                <div className="mt-3 text-center text-sm text-muted">
                  <p>Warm-up: easy, smooth reps. Working weight {loadText(ex, item.target.weight, profile.unit)}.</p>
                  <button type="button" onClick={() => { haptic("tick"); s.skipWarmup(); }} className="press mt-1 min-h-11 px-3 font-semibold text-accent">Skip warm-up</button>
                </div>
              ) : item.setTargets?.[doneSets]?.amrap ? (
                <p className="mt-3 rounded-xl bg-accent/10 px-3 py-2 text-center text-sm font-semibold text-accent">Last set: as many good reps as you can, at least {item.setTargets[doneSets].reps}. Log what you got</p>
              ) : item.slot ? (
                <p className="mt-3 text-center text-sm text-muted">{item.label ? `${item.label} · ` : ""}{item.target.note}</p>
              ) : item.challenge && doneSets + 1 === item.sets ? (
                <p className="mt-3 rounded-xl bg-accent/10 px-3 py-2 text-center text-sm font-semibold text-accent">Challenge set: as many good reps as you can, then log what you got</p>
              ) : (
                <p className="mt-3 text-center text-sm text-muted">Leave {item.target.rir} {item.target.rir === 1 ? "rep" : "reps"} in the tank · {item.target.note}</p>
              )}
              {loading && bar && (
                <div className="mt-4 border-t border-line pt-4">
                  <PlateBar loading={loading} bar={bar.weight} unit={unit} finish={finish} />
                </div>
              )}
            </section>
          )}
        </>
      ) : null}

      {!finished && active.plan.items.length > active.index + 1 && (
        <section className="mt-6">
          <h2 className="mb-2 px-1 text-sm font-semibold uppercase tracking-wider text-muted">Coming up</h2>
          <ol className="card divide-y divide-line">
            {active.plan.items.slice(active.index + 1).map((it, i) => {
              const e = exercise(it.exerciseId);
              return (
                <li key={it.exerciseId}>
                  <button type="button" onClick={() => s.goTo(active.index + 1 + i)} className="press flex w-full items-center justify-between px-4 py-3 text-left">
                    <span className="font-medium">{e.name}</span>
                    <span className="num text-sm text-muted">{it.scheme ?? `${it.sets} × ${repsText(e, it.target.reps)}`} · {loadText(e, it.target.weight, profile.unit)}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      <div className="safe-bottom fixed inset-x-0 bottom-0 z-40 bg-gradient-to-t from-bg via-bg to-transparent px-5 pt-8">
        <div className="mx-auto max-w-lg">
          {finished ? (
            <Button className="w-full py-5 text-xl" onClick={end}>Finish workout</Button>
          ) : resting ? (
            <Button kind="ghost" className="w-full py-5 text-xl" onClick={() => { s.skipRest(); log(); }}>Log set now</Button>
          ) : (
            <Button className="w-full py-5 text-xl shadow-lg shadow-accent/25" onClick={log}>
              {warming ? "Log warm-up ✓" : "Log set ✓"}
            </Button>
          )}
        </div>
      </div>

      <Sheet open={swapOpen} onClose={() => setSwapOpen(false)} title={`Swap ${ex?.name ?? ""}`}>
        {ex && <SwapList fromId={ex.id} gymEquipment={gym} skip={active.plan.items.map((i) => i.exerciseId)} onPick={(id, avoid) => { s.swap(id, avoid); setSwapOpen(false); haptic("tap"); }} />}
      </Sheet>
      <Sheet open={infoOpen} onClose={() => setInfoOpen(false)} title={ex?.name ?? ""}>
        {ex && (
          <div className="space-y-4">
            <p className="text-muted">{ex.setup}</p>
            <ol className="space-y-2">
              {ex.cues.map((c, i) => (
                <li key={c} className="flex gap-3"><span className="num grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent/15 text-sm text-accent">{i + 1}</span>{c}</li>
              ))}
            </ol>
            <p className="text-sm text-faint">Works: {[...ex.primary, ...ex.secondary].map((m) => MUSCLE_LABEL[m]).join(", ")}</p>
          </div>
        )}
      </Sheet>
      <Sheet open={endOpen} onClose={() => setEndOpen(false)} title="End workout?">
        <div className="space-y-3">
          <Button className="w-full" onClick={end}>Finish and save</Button>
          <Button kind="danger" className="w-full" onClick={() => { s.discard(); void stopSession(); go("today"); }}>Discard workout</Button>
          <Button kind="quiet" className="w-full" onClick={() => setEndOpen(false)}>Keep going</Button>
        </div>
      </Sheet>
    </div>
  );
}

function Feedback({ name, onPick }: { name: string; onPick: (r: -1 | 0 | 1) => void }) {
  return (
    <div className="animate-rise mt-4 w-full rounded-2xl bg-raised p-3 text-center">
      <p className="text-sm text-muted">How was {name}?</p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {([[1, "Too easy"], [0, "About right"], [-1, "Too hard"]] as const).map(([r, l]) => (
          <button key={r} type="button" onClick={() => { haptic("tick"); onPick(r); }} className="press rounded-xl border border-line bg-surface py-2 text-sm">{l}</button>
        ))}
      </div>
    </div>
  );
}

function SwapList({ fromId, gymEquipment, skip, onPick }: { fromId: string; gymEquipment: Parameters<typeof alternatives>[1]; skip: string[]; onPick: (id: string, avoid: boolean) => void }) {
  const [avoid, setAvoid] = useState(false);
  const list = alternatives(fromId, gymEquipment, skip).slice(0, 12);
  return (
    <div>
      <label className="mb-3 flex items-center gap-3 rounded-xl bg-raised p-3 text-sm">
        <input type="checkbox" checked={avoid} onChange={(e) => setAvoid(e.target.checked)} className="h-5 w-5 accent-[var(--color-accent)]" />
        Not available here (skip it at this gym for 2 weeks)
      </label>
      <ul className="divide-y divide-line">
        {list.map((e) => (
          <li key={e.id}>
            <button type="button" onClick={() => onPick(e.id, avoid)} className="press flex w-full items-center justify-between py-3 text-left">
              <span>
                <span className="block font-medium">{e.name}</span>
                <span className="text-sm text-muted">{e.primary.map((m) => MUSCLE_LABEL[m]).join(", ")}</span>
              </span>
              <span className="text-accent">Swap</span>
            </button>
          </li>
        ))}
        {!list.length && <li className="py-3 text-muted">No other exercise for these muscles at this gym.</li>}
      </ul>
    </div>
  );
}
