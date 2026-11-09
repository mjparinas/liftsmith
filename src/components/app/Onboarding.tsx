"use client";
import { Info } from "@/components/Info";
import { BRAND } from "@/lib/brand";
import { PRESETS, type GymPreset } from "@/lib/defaults";
import { haptic } from "@/lib/juice";
import { useApp } from "@/lib/store";
import { flag } from "@/lib/flags";
import { declineTrial, PRICES, startTrial, type Plan } from "@/lib/trial";
import type { Experience, Goal, Profile, Unit } from "@/lib/types";
import { fromKg, toKg } from "@/lib/units";
import { epley, KNOWN_LIFTS } from "@/lib/progression";
import { useEffect, useState } from "react";
import { connectHeartRate, hrSupported } from "@/lib/heartRate";
import { connectHealth, healthAvailable, readHints } from "@/lib/health";
import { analyticsOn, platformStore, setAnalytics, track } from "@/lib/analytics";
import { notifyPermission } from "@/lib/sessionNotify";
import { go } from "./router";
import { Button } from "./ui";

function Tile({ title, blurb, active, onClick }: { title: string; blurb?: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" aria-pressed={active} onClick={() => { haptic("tick"); onClick(); }} className={`press relative w-full rounded-2xl border p-4 text-left ${active ? "border-accent/70 bg-accent/12 shadow-[0_0_0_3px_rgb(76_141_255/0.14),0_10px_30px_-14px_rgb(76_141_255/0.7)]" : "border-line bg-surface hover:border-accent/30"}`}>
      {active && <span className="btn-primary absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full" aria-hidden><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></span>}
      <div className="pr-6 font-semibold">{title}</div>
      {blurb && <div className="mt-0.5 text-sm text-muted">{blurb}</div>}
    </button>
  );
}

const GOALS: { id: Goal; title: string; blurb: string }[] = [
  { id: "muscle", title: "Build muscle", blurb: "6–12 reps, more volume" },
  { id: "strength", title: "Get stronger", blurb: "Heavier, 4–6 reps on the big lifts" },
  { id: "general", title: "Stay fit", blurb: "A bit of everything" },
];
const LEVELS: { id: Experience; title: string; blurb: string }[] = [
  { id: "new", title: "New to lifting", blurb: "Under a year" },
  { id: "intermediate", title: "Some experience", blurb: "1 to 3 years" },
  { id: "advanced", title: "Experienced", blurb: "3 years or more" },
];

const STEP_NAMES = ["Goal and experience", "Gym and units", "Days and body weight", "Notifications and heart rate", "Pro trial offer"];

const KNOWN = [
  { id: KNOWN_LIFTS.squat, name: "Back squat" },
  { id: KNOWN_LIFTS.hpush, name: "Bench press" },
  { id: KNOWN_LIFTS.hinge, name: "Deadlift" },
  { id: KNOWN_LIFTS.vpush, name: "Overhead press" },
];

/** Turns "weight × reps" entries into estimated one-rep maxes in kg. Blank entries keep what was saved. */
export function knownMaxes(entries: Record<string, { w: string; r: string }>, unit: Unit, prev?: Profile["knownMaxes"]): Profile["knownMaxes"] {
  const out = { ...(prev ?? {}) };
  for (const [id, { w, r }] of Object.entries(entries)) {
    const weight = Number(w);
    const reps = Math.min(15, Math.max(1, Number(r) || 1));
    if (weight > 0) out[id] = Math.round((reps === 1 ? toKg(weight, unit) : epley(toKg(weight, unit), reps)) * 10) / 10;
  }
  return Object.keys(out).length ? out : undefined;
}

/** The setup wizard: first run, and again from Settings ("Run setup again"). */
export function Onboarding({ rerun = false }: { rerun?: boolean }) {
  const { profile, setProfile, addGym, gyms } = useApp();
  const [step, setStep] = useState(0);
  // First run ends with the Pro trial offer; a rerun from Settings doesn't show it again.
  const STEPS = rerun ? 4 : 5;
  const trialDays = flag("trialDays");
  const [keepGyms, setKeepGyms] = useState(rerun && gyms.length > 0);
  const [hr, setHr] = useState<string | null>(null);
  const [notify, setNotify] = useState<boolean | null>(null);
  const [name, setName] = useState(profile.name);
  const [goal, setGoal] = useState<Goal>(profile.goal);
  const [exp, setExp] = useState<Experience>(profile.experience);
  const [preset, setPreset] = useState<GymPreset>("commercial");
  const [unit, setUnit] = useState<Unit>(profile.unit);
  const [days, setDays] = useState(profile.daysPerWeek);
  const [bw, setBw] = useState(Math.round(fromKg(profile.bodyweight, profile.unit)));
  const [age, setAge] = useState(profile.birthYear ? String(new Date().getFullYear() - profile.birthYear) : "");
  const [sex, setSex] = useState<Profile["sex"]>(profile.sex);
  const [maxesOpen, setMaxesOpen] = useState(false);
  // Known lifts as weight × reps, in the lifter's unit.
  const [maxes, setMaxes] = useState<Record<string, { w: string; r: string }>>(() =>
    Object.fromEntries(KNOWN.map((k) => [k.id, { w: profile.knownMaxes?.[k.id] ? String(Math.round(fromKg(profile.knownMaxes[k.id]!, profile.unit))) : "", r: "1" }])),
  );
  const [canHealth, setCanHealth] = useState(false);
  const [healthNote, setHealthNote] = useState<string | null>(null);
  const [stats, setStats] = useState(analyticsOn());
  const [prefilled, setPrefilled] = useState(false);
  useEffect(() => void healthAvailable().then(setCanHealth), []);
  // The setup funnel: which step each install reached.
  useEffect(() => {
    track("onboarding_step", { step, name: STEP_NAMES[step] });
    if (step === 4) track("paywall_view", { from: "setup" });
  }, [step]);

  const fillFromHealth = async () => {
    const ok = await connectHealth();
    track("permission", { name: "health", granted: ok });
    if (!ok) return setHealthNote("No access yet. You can allow it later in Settings.");
    setPrefilled(true);
    const h = await readHints();
    if (h.bodyweight) setBw(Math.round(fromKg(h.bodyweight, unit)));
    setHealthNote(h.bodyweight ? "Filled in from your health data." : "Connected. No recent weight found, so enter it below.");
  };

  const finish = (pro?: Profile["pro"]) => {
    setProfile({ unit });
    const id = keepGyms ? profile.activeGymId : addGym(preset);
    const years = Number(age);
    setProfile({
      name: name.trim(),
      goal,
      experience: exp,
      unit,
      daysPerWeek: days,
      bodyweight: toKg(bw, unit),
      birthYear: years >= 10 && years <= 100 ? new Date().getFullYear() - years : profile.birthYear,
      sex,
      knownMaxes: knownMaxes(maxes, unit, profile.knownMaxes),
      activeGymId: id,
      onboarded: true,
      ...(pro ? { pro } : {}),
    });
    setAnalytics(stats);
    track("onboarding_complete", { rerun, goal, experience: exp, days, preset: keepGyms ? "kept" : preset, unit, healthPrefill: prefilled });
    haptic("success");
    if (rerun) go("today");
  };

  return (
    <main className="aurora safe-top safe-bottom mx-auto flex min-h-dvh max-w-lg flex-col px-5">
      <div className="mt-6 flex gap-1.5" aria-hidden>
        {Array.from({ length: STEPS }, (_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i <= step ? "bg-gradient-to-r from-accent to-accent-2" : "bg-line"}`} />
        ))}
      </div>
      <div key={step} className="animate-rise flex-1 py-8">
        {step === 0 && (
          <>
            <p className="text-gradient text-sm font-bold uppercase tracking-[0.16em]">{BRAND.name}</p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight">What are you training for?</h1>
            <div className="mt-6 space-y-3">{GOALS.map((g) => <Tile key={g.id} title={g.title} blurb={g.blurb} active={goal === g.id} onClick={() => setGoal(g.id)} />)}</div>
            <h2 className="mt-8 text-lg font-semibold">How long have you been lifting?</h2>
            <div className="mt-3 space-y-3">{LEVELS.map((g) => <Tile key={g.id} title={g.title} blurb={g.blurb} active={exp === g.id} onClick={() => setExp(g.id)} />)}</div>
            <label htmlFor="setup-name" className="mt-8 block text-lg font-semibold">What should we call you?</label>
            <p className="text-sm text-muted">Optional. Used to greet you on Today.</p>
            <input id="setup-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" placeholder="Your first name" maxLength={40} className="mt-3 w-full rounded-2xl border border-line bg-surface px-4 py-3 text-lg focus:border-accent/70 focus:outline-none" />
          </>
        )}
        {step === 1 && (
          <>
            <h1 className="text-3xl font-extrabold tracking-tight">Where do you train?</h1>
            <p className="mt-2 text-muted">You can fine-tune equipment, plates and add more gyms later.</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {rerun && gyms.length > 0 && <Tile title="Keep my gyms" blurb={gyms.map((g) => g.name).join(", ")} active={keepGyms} onClick={() => setKeepGyms(true)} />}
              {PRESETS.map((p) => <Tile key={p.id} title={rerun ? `Add: ${p.name}` : p.name} blurb={p.blurb} active={!keepGyms && preset === p.id} onClick={() => { setKeepGyms(false); setPreset(p.id); }} />)}
            </div>
            <h2 className="mt-8 text-lg font-semibold">Your plates are in</h2>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {(["kg", "lb"] as Unit[]).map((u) => <Tile key={u} title={u === "kg" ? "Kilograms" : "Pounds"} active={unit === u} onClick={() => { setUnit(u); setBw(Math.round(fromKg(toKg(bw, unit), u))); }} />)}
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <h1 className="text-3xl font-extrabold tracking-tight">How often can you train?</h1>
            <div className="mt-6 grid grid-cols-6 gap-2">
              {[1, 2, 3, 4, 5, 6].map((d) => (
                <button key={d} type="button" aria-pressed={days === d} onClick={() => { haptic("tick"); setDays(d); }} className={`press num aspect-square rounded-2xl border text-xl font-bold ${days === d ? "btn-primary border-transparent" : "border-line bg-surface"}`}>{d}</button>
              ))}
            </div>
            <p className="mt-2 text-sm text-muted">days a week. Your streak counts weeks you hit this, so rest days never break it.</p>
            <h2 className="mt-8 text-lg font-semibold">Your body weight</h2>
            <p className="text-sm text-muted">Only used to suggest a safe first weight for each lift.<Info term="firstWeights" /></p>
            {canHealth && (
              <button type="button" onClick={fillFromHealth} className="press mt-3 min-h-11 rounded-2xl border border-line bg-surface px-4 text-sm font-semibold">
                Fill in from {/iPhone|iPad/.test(navigator.userAgent) ? "Apple Health" : "Health Connect"}
              </button>
            )}
            {healthNote && <p className="mt-2 text-sm text-muted">{healthNote}</p>}
            <div className="mt-3 flex items-center gap-3">
              <input inputMode="numeric" value={bw} onChange={(e) => setBw(Number(e.target.value.replace(/\D/g, "")) || 0)} className="num w-32 rounded-2xl border border-line bg-surface px-4 py-3 text-2xl font-semibold" aria-label="Body weight" />
              <span className="text-muted">{unit}</span>
            </div>
            <div className="mt-5 grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-3">
              <label htmlFor="setup-age" className="font-semibold">Age</label>
              <input id="setup-age" inputMode="numeric" placeholder="Optional" value={age} onChange={(e) => setAge(e.target.value.replace(/\D/g, "").slice(0, 3))} className="num w-32 rounded-2xl border border-line bg-surface px-4 py-3 text-lg" />
              <span className="font-semibold" id="setup-sex">Sex</span>
              <div className="flex gap-2" role="group" aria-labelledby="setup-sex">
                {(["female", "male"] as const).map((x) => (
                  <button key={x} type="button" aria-pressed={sex === x} onClick={() => { haptic("tick"); setSex(sex === x ? undefined : x); }} className={`press min-h-11 rounded-2xl border px-4 text-sm font-semibold ${sex === x ? "border-accent bg-accent/10" : "border-line bg-surface"}`}>
                    {x === "female" ? "Female" : "Male"}
                  </button>
                ))}
              </div>
            </div>
            <p className="mt-2 text-sm text-muted">Both optional. Starting weights are lighter when we don&apos;t know.</p>
            <button type="button" aria-expanded={maxesOpen} onClick={() => setMaxesOpen(!maxesOpen)} className="press mt-5 min-h-11 text-sm font-semibold text-accent">
              {maxesOpen ? "Hide my numbers" : "I know my numbers (optional)"}
            </button>
            {maxesOpen && (
              <div className="mt-2 space-y-2">
                <p className="text-sm text-muted">Your best recent set of each, and we&apos;ll start from there.</p>
                {KNOWN.map((k) => (
                  <div key={k.id} className="flex items-center gap-2">
                    <span className="w-32 text-sm">{k.name}</span>
                    <input inputMode="decimal" placeholder={unit} aria-label={`${k.name} weight`} value={maxes[k.id].w} onChange={(e) => setMaxes({ ...maxes, [k.id]: { ...maxes[k.id], w: e.target.value.replace(/[^\d.]/g, "") } })} className="num w-24 rounded-xl border border-line bg-surface px-3 py-2" />
                    <span className="text-muted">×</span>
                    <input inputMode="numeric" aria-label={`${k.name} reps`} value={maxes[k.id].r} onChange={(e) => setMaxes({ ...maxes, [k.id]: { ...maxes[k.id], r: e.target.value.replace(/\D/g, "").slice(0, 2) } })} className="num w-16 rounded-xl border border-line bg-surface px-3 py-2" />
                    <span className="text-sm text-muted">reps</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        {step === 3 && (
          <>
            <h1 className="text-3xl font-extrabold tracking-tight">Stay in the zone</h1>
            <p className="mt-2 text-muted">Both are optional, and you can change them later in Settings.</p>
            <div className="mt-6 space-y-3">
              <Tile
                title={notify ? "Workout notifications on" : "Turn on workout notifications"}
                blurb="Rest timer and next set on your lock screen, and a reminder on your training days. Change them in Settings."
                active={!!notify}
                onClick={async () => {
                  const ok = await notifyPermission();
                  track("permission", { name: "notifications", granted: ok });
                  setNotify(ok);
                }}
              />
              {hrSupported() && (
                <Tile
                  title={hr ? `Heart rate: ${hr}` : "Connect a heart rate monitor"}
                  blurb="Fitbit Charge 6 or Pixel Watch (turn on heart rate sharing), Polar, Garmin or any Bluetooth strap"
                  active={!!hr}
                  onClick={async () => {
                    try {
                      const c = await connectHeartRate(() => {}, () => {});
                      setHr(c.name);
                      track("feature", { name: "heart_rate", detail: "setup" });
                      c.disconnect();
                    } catch {}
                  }}
                />
              )}
            </div>
            {notify === false && <p className="mt-3 text-sm text-warn">Notifications are blocked. You can allow them in your phone&apos;s settings.</p>}
            <label className="card mt-3 flex items-start gap-3 p-4">
              <input type="checkbox" className="mt-1 h-5 w-5 accent-[var(--color-accent)]" checked={stats} onChange={(e) => setStats(e.target.checked)} />
              <span>
                <span className="block font-semibold">Share anonymous usage stats</span>
                <span className="block text-sm text-muted">Which screens and features get used, your device model and app version. Never your weights, workouts in detail or health data. Change it any time in Settings.</span>
              </span>
            </label>
          </>
        )}
        {step === 4 && (
          <>
            <h1 className="text-3xl font-extrabold tracking-tight">Try Pro free for {trialDays} days</h1>
            <p className="mt-2 text-muted">Workouts that adapt to your recovery, your gym and how every set felt.</p>
            <ul className="mt-4 space-y-1.5 text-sm">
              {["Adaptive workouts with blocks, deloads and progression", "Push or easy-day calls from your own data", "Recovery map and advanced stats"].map((t) => (
                <li key={t} className="flex gap-2"><span className="text-accent" aria-hidden>✓</span>{t}</li>
              ))}
            </ul>
            <div className="mt-6 space-y-3">
              {(["annual", "monthly"] as Plan[]).map((plan) => (
                <button
                  key={plan}
                  type="button"
                  onClick={() => {
                    haptic("tick");
                    track("trial_start", { plan, store: platformStore() });
                    finish(startTrial(plan, trialDays, Date.now()));
                  }}
                  className={`press w-full rounded-2xl border p-4 text-left ${plan === "annual" ? "border-accent bg-accent/10" : "border-line bg-surface"}`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-semibold">Start free trial · {plan === "annual" ? "Yearly" : "Monthly"}</span>
                    {PRICES[plan].note && <span className="text-xs font-semibold text-accent">{PRICES[plan].note}</span>}
                  </div>
                  <div className="mt-0.5 text-sm text-muted">Free for {trialDays} days, then {PRICES[plan].price} {PRICES[plan].per}. Cancel any time.</div>
                </button>
              ))}
            </div>
            <Button kind="quiet" className="mt-4 w-full" onClick={() => {
              track("paywall_close", { from: "setup" });
              finish(declineTrial(trialDays, Date.now()));
            }}>Not now, keep the free plan</Button>
            <p className="mt-2 text-center text-xs text-muted">The free plan keeps the workout logger, plate math, rest timer and classic 5x5.</p>
          </>
        )}
      </div>
      <div className="flex gap-3 pb-2">
        {(step > 0 || rerun) && <Button kind="ghost" onClick={() => (step > 0 ? setStep(step - 1) : go("settings"))}>Back</Button>}
        {step < 4 && (
          <Button className="flex-1 py-4 text-lg" onClick={() => (step < STEPS - 1 ? setStep(step + 1) : finish())} disabled={step === 2 && bw < 25}>
            {step < STEPS - 1 ? "Continue" : "Save"}
          </Button>
        )}
      </div>
    </main>
  );
}
