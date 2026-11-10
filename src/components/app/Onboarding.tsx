"use client";

import { useEffect, useState } from "react";

import { Info } from "@/components/Info";
import { analyticsOn, setAnalytics, track } from "@/lib/analytics";
import { billingLive, useBilling } from "@/lib/billing";
import { BRAND } from "@/lib/brand";
import { PRESETS, type GymPreset } from "@/lib/defaults";
import { flag } from "@/lib/flags";
import { connectHealth, healthAvailable, readHints } from "@/lib/health";
import { connectHeartRate, HrError, hrMessage, hrSupported } from "@/lib/heartRate";
import { t } from "@/lib/i18n";
import { haptic } from "@/lib/juice";
import { epley, KNOWN_LIFTS } from "@/lib/progression";
import { keepStorage } from "@/lib/saving";
import { notifyPermission } from "@/lib/sessionNotify";
import { useApp } from "@/lib/store";
import { declineTrial, startTrial } from "@/lib/trial";
import type { Experience, Goal, Profile, Unit } from "@/lib/types";
import { fromKg, toKg } from "@/lib/units";

import { AccountPanel } from "./Account";
import { Mascot } from "./Mascot";
import { Plans, ProFeatures } from "./Pro";
import { go } from "./router";
import { SaveStep } from "./Saving";
import { BumpField, Button, Sheet } from "./ui";

function Tile({ title, blurb, active, onClick }: { title: string; blurb?: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => {
        haptic("tick");
        onClick();
      }}
      className={`press relative w-full rounded-2xl border p-4 text-left ${active ? "border-accent/70 bg-accent/12 shadow-[0_0_0_3px_rgb(76_141_255/0.14),0_10px_30px_-14px_rgb(76_141_255/0.7)]" : "border-line bg-surface hover:border-accent/30"}`}
    >
      {active && (
        <span className="btn-primary absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full" aria-hidden>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </span>
      )}
      <div className="pr-6 font-semibold">{title}</div>
      {blurb && <div className="mt-0.5 text-sm text-muted">{blurb}</div>}
    </button>
  );
}

const GOALS: { id: Goal; title: string; blurb: string }[] = [
  {
    id: "muscle",
    get title() {
      return t("goal.muscle");
    },
    get blurb() {
      return t("setup.goal.muscle.blurb");
    },
  },
  {
    id: "strength",
    get title() {
      return t("goal.strength");
    },
    get blurb() {
      return t("setup.goal.strength.blurb");
    },
  },
  {
    id: "general",
    get title() {
      return t("goal.general");
    },
    get blurb() {
      return t("setup.goal.general.blurb");
    },
  },
];
const LEVELS: { id: Experience; title: string; blurb: string }[] = [
  {
    id: "new",
    get title() {
      return t("setup.exp.new");
    },
    get blurb() {
      return t("setup.exp.new.blurb");
    },
  },
  {
    id: "intermediate",
    get title() {
      return t("setup.exp.intermediate");
    },
    get blurb() {
      return t("setup.exp.intermediate.blurb");
    },
  },
  {
    id: "advanced",
    get title() {
      return t("exp.advanced");
    },
    get blurb() {
      return t("setup.exp.advanced.blurb");
    },
  },
];

const STEP_NAMES = [
  "Goal and experience",
  "Gym and units",
  "Days and body weight",
  "Notifications and heart rate",
  "Save your progress",
  "Pro trial offer",
];

const KNOWN = [
  {
    id: KNOWN_LIFTS.squat,
    get name() {
      return t("setup.knownSquat");
    },
  },
  {
    id: KNOWN_LIFTS.hpush,
    get name() {
      return t("setup.knownBench");
    },
  },
  {
    id: KNOWN_LIFTS.hinge,
    get name() {
      return t("setup.knownDeadlift");
    },
  },
  {
    id: KNOWN_LIFTS.vpush,
    get name() {
      return t("setup.knownPress");
    },
  },
];

/** Turns "weight × reps" entries into estimated one-rep maxes in kg. Blank entries keep what was saved. */
export function knownMaxes(
  entries: Record<string, { w: string; r: string }>,
  unit: Unit,
  prev?: Profile["knownMaxes"],
): Profile["knownMaxes"] {
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
  // First run ends with the Pro trial offer once billing is live; a rerun from Settings doesn't show it again.
  // Until then there's nothing to buy, so no priced offer is shown (store review, AGENTS.md "Money").
  const STEPS = rerun || !billingLive() ? 5 : 6;
  const PRO_STEP = 5;
  const trialDays = flag("trialDays");
  // The store's own trial length for this person (null once they've used a trial), else the flag's.
  const offers = useBilling((b) => b.offers);
  const offerDays = offers ? (offers.find((o) => o.trialDays)?.trialDays ?? null) : trialDays;
  const [signIn, setSignIn] = useState(false);
  const [keepGyms, setKeepGyms] = useState(rerun && gyms.length > 0);
  const [hr, setHr] = useState<string | null>(null);
  const [hrBusy, setHrBusy] = useState(false);
  const [hrError, setHrError] = useState<string | null>(null);
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
    Object.fromEntries(
      KNOWN.map((k) => [
        k.id,
        { w: profile.knownMaxes?.[k.id] ? String(Math.round(fromKg(profile.knownMaxes[k.id]!, profile.unit))) : "", r: "1" },
      ]),
    ),
  );
  const [canHealth, setCanHealth] = useState(false);
  const [healthNote, setHealthNote] = useState<string | null>(null);
  const [stats, setStats] = useState(analyticsOn());
  const [prefilled, setPrefilled] = useState(false);
  useEffect(() => void healthAvailable().then(setCanHealth), []);
  // The setup funnel: which step each install reached.
  useEffect(() => {
    track("onboarding_step", { step, name: STEP_NAMES[step] });
    if (step === PRO_STEP) track("paywall_view", { from: "setup" });
  }, [step]);

  const fillFromHealth = async () => {
    const ok = await connectHealth();
    track("permission", { name: "health", granted: ok });
    if (!ok) return setHealthNote(t("setup.health.denied"));
    setPrefilled(true);
    const h = await readHints();
    if (h.bodyweight) setBw(Math.round(fromKg(h.bodyweight, unit)));
    // Height isn't asked in setup, but TDEE (Tools) uses it, so keep it when Health has it.
    if (h.height && h.height >= 100 && h.height <= 250) setProfile({ heightCm: Math.round(h.height) });
    setHealthNote(h.bodyweight ? t("setup.health.filled") : t("setup.health.noWeight"));
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
    // In a browser, ask it to keep this site's storage, so the workouts saved here aren't cleared (saving.ts).
    void keepStorage();
    track("onboarding_complete", {
      rerun,
      goal,
      experience: exp,
      days,
      preset: keepGyms ? "kept" : preset,
      unit,
      healthPrefill: prefilled,
    });
    haptic("success");
    if (rerun) go("today");
  };

  return (
    <main className="aurora safe-top safe-bottom mx-auto flex min-h-dvh max-w-lg flex-col px-5">
      <div className="mt-6 flex gap-1.5" aria-hidden>
        {Array.from({ length: STEPS }, (_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i <= step ? "bg-gradient-to-r from-accent to-accent-2" : "bg-line"}`}
          />
        ))}
      </div>
      <div key={step} className="animate-rise flex-1 py-8">
        {step === 0 && (
          <>
            <div className="flex items-center gap-3">
              <Mascot mood="happy" size={64} className="animate-spring-in shrink-0" />
              <div>
                <p className="text-gradient text-sm font-bold uppercase tracking-[0.16em]">{BRAND.name}</p>
                <h1 className="mt-1 text-3xl font-extrabold tracking-tight">{t("setup.goal.title")}</h1>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              {GOALS.map((g) => (
                <Tile key={g.id} title={g.title} blurb={g.blurb} active={goal === g.id} onClick={() => setGoal(g.id)} />
              ))}
            </div>
            <h2 className="mt-8 text-lg font-semibold">{t("setup.exp.title")}</h2>
            <div className="mt-3 space-y-3">
              {LEVELS.map((g) => (
                <Tile key={g.id} title={g.title} blurb={g.blurb} active={exp === g.id} onClick={() => setExp(g.id)} />
              ))}
            </div>
            <label htmlFor="setup-name" className="mt-8 block text-lg font-semibold">
              {t("setup.name.title")}
            </label>
            <p className="text-sm text-muted">{t("setup.name.note")}</p>
            <input
              id="setup-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="given-name"
              placeholder={t("setup.name.placeholder")}
              maxLength={40}
              className="mt-3 w-full rounded-2xl border border-line bg-surface px-4 py-3 text-lg focus:border-accent/70 focus:outline-none"
            />
            {/* A lifter with an account signs in instead: sync brings their profile back and setup ends. */}
            {!rerun && (
              <Button kind="quiet" className="mt-6 w-full" onClick={() => setSignIn(true)}>
                {t("account.setup")}
              </Button>
            )}
            <Sheet open={signIn} onClose={() => setSignIn(false)} title={t("account.signIn")}>
              <p className="mb-4 text-sm text-muted">{t("account.lead")}</p>
              <AccountPanel onSignedIn={() => setSignIn(false)} />
            </Sheet>
          </>
        )}
        {step === 1 && (
          <>
            <h1 className="text-3xl font-extrabold tracking-tight">{t("setup.gym.title")}</h1>
            <p className="mt-2 text-muted">{t("setup.gym.note")}</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {rerun && gyms.length > 0 && (
                <Tile
                  title={t("setup.gym.keep")}
                  blurb={gyms.map((g) => g.name).join(", ")}
                  active={keepGyms}
                  onClick={() => setKeepGyms(true)}
                />
              )}
              {PRESETS.map((p) => (
                <Tile
                  key={p.id}
                  title={rerun ? t("setup.gym.add", { name: p.name }) : p.name}
                  blurb={p.blurb}
                  active={!keepGyms && preset === p.id}
                  onClick={() => {
                    setKeepGyms(false);
                    setPreset(p.id);
                  }}
                />
              ))}
            </div>
            <h2 className="mt-8 text-lg font-semibold">{t("setup.plates")}</h2>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {(["kg", "lb"] as Unit[]).map((u) => (
                <Tile
                  key={u}
                  title={u === "kg" ? t("units.kg") : t("units.lb")}
                  active={unit === u}
                  onClick={() => {
                    setUnit(u);
                    setBw(Math.round(fromKg(toKg(bw, unit), u)));
                  }}
                />
              ))}
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <h1 className="text-3xl font-extrabold tracking-tight">{t("setup.days.title")}</h1>
            <div className="mt-6 grid grid-cols-6 gap-2">
              {[1, 2, 3, 4, 5, 6].map((d) => (
                <button
                  key={d}
                  type="button"
                  aria-pressed={days === d}
                  onClick={() => {
                    haptic("tick");
                    setDays(d);
                  }}
                  className={`press num aspect-square rounded-2xl border text-xl font-bold ${days === d ? "btn-primary border-transparent" : "border-line bg-surface"}`}
                >
                  {d}
                </button>
              ))}
            </div>
            <p className="mt-2 text-sm text-muted">{t("setup.days.note")}</p>
            <h2 className="mt-8 text-lg font-semibold">{t("setup.bw.title")}</h2>
            <p className="text-sm text-muted">
              {t("setup.bw.note")}
              <Info term="firstWeights" />
            </p>
            {canHealth && (
              <button
                type="button"
                onClick={fillFromHealth}
                className="press mt-3 min-h-11 rounded-2xl border border-line bg-surface px-4 text-sm font-semibold"
              >
                {t("setup.health.fill", { source: /iPhone|iPad/.test(navigator.userAgent) ? "Apple Health" : "Health Connect" })}
              </button>
            )}
            {healthNote && <p className="mt-2 text-sm text-muted">{healthNote}</p>}
            <div className="mt-3 flex items-center gap-3">
              <BumpField
                value={bw ? String(bw) : ""}
                onChange={(v) => setBw(Number(v) || 0)}
                step={1}
                start={unit === "lb" ? 170 : 75}
                max={unit === "lb" ? 700 : 320}
                label={t("settings.bodyweight.label")}
                size="lg"
                className="w-56"
              />
              <span className="text-muted">{unit}</span>
            </div>
            <div className="mt-5 grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-3">
              <label htmlFor="setup-age" className="font-semibold">
                {t("setup.age")}
              </label>
              <BumpField
                id="setup-age"
                label={t("setup.age")}
                placeholder={t("settings.optional")}
                value={age}
                onChange={(v) => setAge(v.slice(0, 3))}
                step={1}
                start={30}
                min={13}
                max={110}
                className="w-48"
              />
              <span className="font-semibold" id="setup-sex">
                {t("setup.sex")}
              </span>
              <div className="flex gap-2" role="group" aria-labelledby="setup-sex">
                {(["female", "male"] as const).map((x) => (
                  <button
                    key={x}
                    type="button"
                    aria-pressed={sex === x}
                    onClick={() => {
                      haptic("tick");
                      setSex(sex === x ? undefined : x);
                    }}
                    className={`press min-h-11 rounded-2xl border px-4 text-sm font-semibold ${sex === x ? "border-accent bg-accent/10" : "border-line bg-surface"}`}
                  >
                    {x === "female" ? t("setup.female") : t("setup.male")}
                  </button>
                ))}
              </div>
            </div>
            <p className="mt-2 text-sm text-muted">{t("setup.ageSex.note")}</p>
            <button
              type="button"
              aria-expanded={maxesOpen}
              onClick={() => setMaxesOpen(!maxesOpen)}
              className="press mt-5 min-h-11 text-sm font-semibold text-accent"
            >
              {maxesOpen ? t("setup.maxes.hide") : t("setup.maxes.show")}
            </button>
            {maxesOpen && (
              <div className="mt-2 space-y-2">
                <p className="text-sm text-muted">{t("setup.maxes.note")}</p>
                {KNOWN.map((k) => (
                  <div key={k.id}>
                    <span className="text-sm font-medium">{k.name}</span>
                    <div className="mt-1 grid grid-cols-[1fr_auto] items-center gap-x-2 gap-y-1.5">
                      <BumpField
                        label={t("setup.maxes.weight", { lift: k.name })}
                        placeholder={unit}
                        value={maxes[k.id].w}
                        onChange={(w) => setMaxes({ ...maxes, [k.id]: { ...maxes[k.id], w } })}
                        step={unit === "lb" ? 5 : 2.5}
                        start={unit === "lb" ? 135 : 60}
                        max={unit === "lb" ? 1500 : 700}
                        className="min-w-0"
                      />
                      <span className="text-sm text-muted">{unit}</span>
                      <BumpField
                        label={t("setup.maxes.reps", { lift: k.name })}
                        value={maxes[k.id].r}
                        onChange={(r) => setMaxes({ ...maxes, [k.id]: { ...maxes[k.id], r: r.slice(0, 2) } })}
                        step={1}
                        start={5}
                        min={1}
                        max={30}
                        className="min-w-0"
                      />
                      <span className="text-sm text-muted">{t("workout.reps")}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        {step === 3 && (
          <>
            <h1 className="text-3xl font-extrabold tracking-tight">{t("setup.zone.title")}</h1>
            <p className="mt-2 text-muted">{t("setup.zone.note")}</p>
            <div className="mt-6 space-y-3">
              <Tile
                title={notify ? t("setup.notify.on") : t("setup.notify.turnOn")}
                blurb={t("setup.notify.blurb")}
                active={!!notify}
                onClick={async () => {
                  const ok = await notifyPermission();
                  track("permission", { name: "notifications", granted: ok });
                  setNotify(ok);
                }}
              />
              {hrSupported() && (
                <Tile
                  title={hr ? t("setup.hr.on", { name: hr }) : hrBusy ? t("hr.connecting") : t("setup.hr.connect")}
                  blurb={t("setup.hr.blurb")}
                  active={!!hr}
                  onClick={async () => {
                    if (hrBusy) return;
                    setHrBusy(true);
                    setHrError(null);
                    try {
                      const c = await connectHeartRate(
                        () => {},
                        () => {},
                      );
                      setHr(c.name);
                      track("feature", { name: "heart_rate", detail: "setup" });
                      c.disconnect();
                    } catch (e) {
                      setHrError(e instanceof HrError ? hrMessage(e.problem, e.device) : hrMessage("failed"));
                    } finally {
                      setHrBusy(false);
                    }
                  }}
                />
              )}
            </div>
            {hrError && (
              <p className="mt-3 text-sm text-warn" role="alert">
                {hrError}
              </p>
            )}
            {notify === false && <p className="mt-3 text-sm text-warn">{t("setup.notify.blocked")}</p>}
            <label className="card mt-3 flex items-start gap-3 p-4">
              <input
                type="checkbox"
                className="mt-1 h-5 w-5 accent-[var(--color-accent)]"
                checked={stats}
                onChange={(e) => setStats(e.target.checked)}
              />
              <span>
                <span className="block font-semibold">{t("setup.stats.title")}</span>
                <span className="block text-sm text-muted">{t("setup.stats.note")}</span>
              </span>
            </label>
          </>
        )}
        {step === 4 && <SaveStep />}
        {step === PRO_STEP && (
          <>
            <h1 className="text-3xl font-extrabold tracking-tight">
              {offerDays ? t("setup.pro.title", { days: offerDays }) : t("pro.title")}
            </h1>
            <p className="mt-2 text-muted">{t("pro.lead")}</p>
            <ProFeatures />
            <Plans
              from="setup"
              onDone={(plan, trial) => {
                const now = Date.now();
                finish(trial && offerDays ? startTrial(plan, offerDays, now) : { offeredAt: now, plan, subscribed: true });
              }}
            />
            <Button
              kind="quiet"
              className="mt-2 w-full"
              onClick={() => {
                track("paywall_close", { from: "setup" });
                finish(declineTrial(offerDays ?? trialDays, Date.now()));
              }}
            >
              {t("setup.pro.decline")}
            </Button>
            <p className="mt-2 text-center text-xs text-muted">{t("setup.pro.free")}</p>
          </>
        )}
      </div>
      <div className="flex gap-3 pb-2">
        {(step > 0 || rerun) && (
          <Button kind="ghost" onClick={() => (step > 0 ? setStep(step - 1) : go("settings"))}>
            {t("setup.back")}
          </Button>
        )}
        {step < PRO_STEP && (
          <Button
            className="flex-1 py-4 text-lg"
            onClick={() => (step < STEPS - 1 ? setStep(step + 1) : finish())}
            disabled={step === 2 && bw < 25}
          >
            {step < STEPS - 1 ? t("setup.continue") : t("setup.save")}
          </Button>
        )}
      </div>
    </main>
  );
}
