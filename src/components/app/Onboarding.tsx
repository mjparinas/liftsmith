"use client";
import { BRAND } from "@/lib/brand";
import { PRESETS, type GymPreset } from "@/lib/defaults";
import { haptic } from "@/lib/juice";
import { useApp } from "@/lib/store";
import type { Experience, Goal, Unit } from "@/lib/types";
import { fromKg, toKg } from "@/lib/units";
import { useEffect, useState } from "react";
import { connectHeartRate, hrSupported } from "@/lib/heartRate";
import { connectHealth, healthAvailable, readHints } from "@/lib/health";
import { notifyPermission } from "@/lib/sessionNotify";
import { go } from "./router";
import { Button } from "./ui";

function Tile({ title, blurb, active, onClick }: { title: string; blurb?: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" aria-pressed={active} onClick={() => { haptic("tick"); onClick(); }} className={`press w-full rounded-2xl border p-4 text-left ${active ? "border-accent bg-accent/10" : "border-line bg-surface"}`}>
      <div className="font-semibold">{title}</div>
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

const STEPS = 4;

/** The setup wizard: first run, and again from Settings ("Run setup again"). */
export function Onboarding({ rerun = false }: { rerun?: boolean }) {
  const { profile, setProfile, addGym, gyms } = useApp();
  const [step, setStep] = useState(0);
  const [keepGyms, setKeepGyms] = useState(rerun && gyms.length > 0);
  const [hr, setHr] = useState<string | null>(null);
  const [notify, setNotify] = useState<boolean | null>(null);
  const [goal, setGoal] = useState<Goal>(profile.goal);
  const [exp, setExp] = useState<Experience>(profile.experience);
  const [preset, setPreset] = useState<GymPreset>("commercial");
  const [unit, setUnit] = useState<Unit>(profile.unit);
  const [days, setDays] = useState(profile.daysPerWeek);
  const [bw, setBw] = useState(Math.round(fromKg(profile.bodyweight, profile.unit)));
  const [canHealth, setCanHealth] = useState(false);
  const [healthNote, setHealthNote] = useState<string | null>(null);
  useEffect(() => void healthAvailable().then(setCanHealth), []);

  const fillFromHealth = async () => {
    if (!(await connectHealth())) return setHealthNote("No access yet. You can allow it later in Settings.");
    const h = await readHints();
    if (h.bodyweight) setBw(Math.round(fromKg(h.bodyweight, unit)));
    setHealthNote(h.bodyweight ? "Filled in from your health data." : "Connected. No recent weight found, so enter it below.");
  };

  const finish = () => {
    setProfile({ unit });
    const id = keepGyms ? profile.activeGymId : addGym(preset);
    setProfile({ goal, experience: exp, unit, daysPerWeek: days, bodyweight: toKg(bw, unit), activeGymId: id, onboarded: true });
    haptic("success");
    if (rerun) go("today");
  };

  return (
    <main className="safe-top safe-bottom mx-auto flex min-h-dvh max-w-lg flex-col px-5">
      <div className="mt-6 flex gap-1.5" aria-hidden>
        {Array.from({ length: STEPS }, (_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-accent" : "bg-line"}`} />
        ))}
      </div>
      <div key={step} className="animate-rise flex-1 py-8">
        {step === 0 && (
          <>
            <p className="text-sm font-semibold uppercase tracking-wider text-accent">{BRAND.name}</p>
            <h1 className="mt-1 text-3xl font-bold">What are you training for?</h1>
            <div className="mt-6 space-y-3">{GOALS.map((g) => <Tile key={g.id} title={g.title} blurb={g.blurb} active={goal === g.id} onClick={() => setGoal(g.id)} />)}</div>
            <h2 className="mt-8 text-lg font-semibold">How long have you been lifting?</h2>
            <div className="mt-3 space-y-3">{LEVELS.map((g) => <Tile key={g.id} title={g.title} blurb={g.blurb} active={exp === g.id} onClick={() => setExp(g.id)} />)}</div>
          </>
        )}
        {step === 1 && (
          <>
            <h1 className="text-3xl font-bold">Where do you train?</h1>
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
            <h1 className="text-3xl font-bold">How often can you train?</h1>
            <div className="mt-6 grid grid-cols-6 gap-2">
              {[1, 2, 3, 4, 5, 6].map((d) => (
                <button key={d} type="button" aria-pressed={days === d} onClick={() => { haptic("tick"); setDays(d); }} className={`press num aspect-square rounded-2xl border text-xl font-semibold ${days === d ? "border-accent bg-accent/10" : "border-line bg-surface"}`}>{d}</button>
              ))}
            </div>
            <p className="mt-2 text-sm text-muted">days a week. Your streak counts weeks you hit this, so rest days never break it.</p>
            <h2 className="mt-8 text-lg font-semibold">Your body weight</h2>
            <p className="text-sm text-muted">Only used to suggest a safe first weight for each lift.</p>
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
          </>
        )}
        {step === 3 && (
          <>
            <h1 className="text-3xl font-bold">Stay in the zone</h1>
            <p className="mt-2 text-muted">Both are optional, and you can change them later in Settings.</p>
            <div className="mt-6 space-y-3">
              <Tile
                title={notify ? "Workout notifications on" : "Turn on workout notifications"}
                blurb="Rest timer and next set on your lock screen, and an alert when rest is over"
                active={!!notify}
                onClick={async () => setNotify(await notifyPermission())}
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
                      c.disconnect();
                    } catch {}
                  }}
                />
              )}
            </div>
            {notify === false && <p className="mt-3 text-sm text-warn">Notifications are blocked. You can allow them in your phone&apos;s settings.</p>}
          </>
        )}
      </div>
      <div className="flex gap-3 pb-2">
        {(step > 0 || rerun) && <Button kind="ghost" onClick={() => (step > 0 ? setStep(step - 1) : go("settings"))}>Back</Button>}
        <Button className="flex-1 py-4 text-lg" onClick={() => (step < STEPS - 1 ? setStep(step + 1) : finish())} disabled={step === 2 && bw < 25}>
          {step < STEPS - 1 ? "Continue" : rerun ? "Save" : "Build my first workout"}
        </Button>
      </div>
    </main>
  );
}
