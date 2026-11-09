"use client";
import { available } from "@/lib/exercises";
import { alternatives } from "@/lib/generator";
import { haptic } from "@/lib/juice";
import { affects, DEFAULT_PCT, effectFor, injuries, LIGHT_PCTS, LOW_PAIN, PART_LABEL, painTrend, RETURN_PCTS, returnReady, STOP_PAIN, type Injury, type InjuryAction } from "@/lib/injury";
import { useApp } from "@/lib/store";
import { useNow } from "@/lib/useNow";
import { BODY_PARTS, type Gym } from "@/lib/types";
import { useState } from "react";
import { go } from "./router";
import { Button, Chip, Section, Sheet } from "./ui";

// Injury mode (Melvin, 2026-11-09). Wording is neutral and never diagnoses: we say what the app does,
// that it isn't medical advice, and that a professional can say what's safe.

export const NOT_ADVICE = "Liftsmith isn't a medical app and this isn't medical advice. If something hurts, a doctor or physiotherapist can tell you what's safe.";

type Warn = { injuryId: string; exerciseId?: string; name: string; action: "light" | "ok" | "return"; pct: number };

const day = (ms: number) => new Date(ms).toLocaleDateString([], { month: "short", day: "numeric" });

export function Injuries() {
  const { events, gyms, profile, logInjury, setInjuryRule, healInjury, ratePain, startReturn, active: workout } = useApp();
  const [rating, setRating] = useState<string | null>(null);
  const gym = gyms.find((g) => g.id === profile.activeGymId) ?? gyms[0];
  const all = injuries(events);
  const active = all.filter((i) => i.healedAt === undefined);
  const past = all.filter((i) => i.healedAt !== undefined);
  const [adding, setAdding] = useState(false);
  const [warn, setWarn] = useState<Warn | null>(null);
  const [healing, setHealing] = useState<Injury | null>(null);

  const choose = (inj: Injury, action: InjuryAction, exerciseId: string | undefined, name: string, pct: number) => {
    const current = exerciseId ? (inj.rules.get(exerciseId) ?? inj.all) : inj.all;
    // Going from skipping to training it always shows the risks first. Changing the share while
    // already training lighter doesn't.
    if (action !== "skip" && current.action === "skip") return setWarn({ injuryId: inj.id, exerciseId, name, action, pct });
    setInjuryRule(inj.id, { exerciseId, action, pct: action === "light" ? pct : undefined });
  };

  return (
    <div className="pb-24">
      <button type="button" onClick={() => go(workout ? "workout" : "today")} className="press -ml-2 pt-2 text-muted">{workout ? "‹ Back to workout" : "‹ Today"}</button>
      <h1 className="text-2xl font-bold">Injuries</h1>
      <p className="mt-2 text-sm text-muted">Tell Liftsmith what hurts and it plans around it. Exercises that load that area are left out until you say it&apos;s healed, or you can choose to keep some of them lighter.</p>
      <p className="mt-2 rounded-xl border border-warn/30 bg-warn/10 p-3 text-sm">{NOT_ADVICE}</p>

      <Button className="mt-4 w-full" onClick={() => setAdding(true)}>Log an injury</Button>

      {active.map((inj) => gym && <InjuryCard key={inj.id} inj={inj} gym={gym} hurt={active} onChoose={choose} onHeal={() => setHealing(inj)} onReturn={() => setWarn({ injuryId: inj.id, name: `the ${PART_LABEL[inj.part].toLowerCase()} exercises you skipped`, action: "return", pct: RETURN_PCTS[0] })} />)}
      {!active.length && <p className="card mt-6 p-5 text-muted">Nothing logged. Your plans use every exercise your gym allows.</p>}

      {past.length > 0 && (
        <Section title="Healed">
          <ul className="card divide-y divide-line">
            {past.slice(0, 10).map((i) => (
              <li key={i.id} className="flex justify-between px-4 py-3 text-sm">
                <span>{PART_LABEL[i.part]}</span>
                <span className="num text-muted">{day(i.since)} to {day(i.healedAt!)}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Sheet open={adding} onClose={() => setAdding(false)} title="What hurts?">
        <div className="grid grid-cols-2 gap-2">
          {BODY_PARTS.filter((p) => !active.some((i) => i.part === p)).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                haptic("tap");
                setRating(logInjury(p));
                setAdding(false);
              }}
              className="press min-h-12 rounded-xl border border-line bg-raised px-3 py-3 text-left font-medium"
            >
              {PART_LABEL[p]}
            </button>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted">Exercises that load it are skipped until you mark it healed. Stop any exercise that causes sharp pain. Swelling, numbness, tingling or pain that doesn&apos;t settle are reasons to see a doctor or physiotherapist.</p>
      </Sheet>

      <Sheet open={!!rating} onClose={() => setRating(null)} title="How bad is it right now?">
        <p className="mb-3 text-sm text-muted">0 is no pain, 10 the worst you can imagine. Rating it now and then lets Liftsmith show the trend and suggest a graded return once it settles.</p>
        <div className="grid grid-cols-4 gap-2" role="group" aria-label="Pain from 0 to 10">
          {Array.from({ length: 11 }, (_, n) => (
            <button key={n} type="button" onClick={() => { haptic("tick"); if (rating) ratePain(rating, n); setRating(null); }} className="press num min-h-12 rounded-xl border border-line bg-raised text-lg font-semibold">{n}</button>
          ))}
        </div>
        <Button kind="quiet" className="mt-3 w-full" onClick={() => setRating(null)}>Skip for now</Button>
      </Sheet>

      <RiskSheet
        warn={warn}
        onClose={() => setWarn(null)}
        onConfirm={(w) => {
          if (w.action === "return") {
            startReturn(w.injuryId);
            return setWarn(null);
          }
          setInjuryRule(w.injuryId, { exerciseId: w.exerciseId, action: w.action, pct: w.action === "light" ? w.pct : undefined, ack: true });
          setWarn(null);
        }}
      />

      <Sheet open={!!healing} onClose={() => setHealing(null)} title={`Mark ${healing ? PART_LABEL[healing.part].toLowerCase() : ""} as healed?`}>
        <div className="space-y-3 text-sm">
          <p>Every exercise it was skipping or lightening comes back into your plans, at the weights you used before the injury.</p>
          <p className="text-muted">Ease back in. If the first sessions feel heavy, tap &quot;Too hard&quot; after the exercise and the next plan comes down a step. If the pain comes back, log it again.</p>
          <Button className="w-full" onClick={() => { if (healing) healInjury(healing.id); setHealing(null); haptic("success"); }}>Yes, it&apos;s fully healed</Button>
          <Button kind="quiet" className="w-full" onClick={() => setHealing(null)}>Not yet</Button>
        </div>
      </Sheet>
    </div>
  );
}

function InjuryCard({ inj, gym, hurt, onChoose, onHeal, onReturn }: { inj: Injury; gym: Gym; hurt: Injury[]; onChoose: (inj: Injury, a: InjuryAction, exerciseId: string | undefined, name: string, pct: number) => void; onHeal: () => void; onReturn: () => void }) {
  const [showAll, setShowAll] = useState(false);
  const affected = available(gym.equipment).filter((e) => affects(inj.part, e));
  const shown = showAll ? affected : affected.slice(0, 6);
  const label = PART_LABEL[inj.part];
  const skipped = affected.filter((e) => (inj.rules.get(e.id) ?? inj.all).action === "skip").length;
  const lighter = affected.filter((e) => (inj.rules.get(e.id) ?? inj.all).action === "light").length;

  return (
    <section className="card mt-6 p-4" aria-label={`${label} injury`}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold">{label}</h2>
        <span className="num text-sm text-muted">Since {day(inj.since)}</span>
      </div>
      <p className="mt-1 text-sm text-muted">
        At {gym.name}: {skipped} skipped{lighter ? `, ${lighter} lighter` : ""}{affected.length - skipped - lighter ? `, ${affected.length - skipped - lighter} marked fine` : ""}.
      </p>

      <PainBlock inj={inj} label={label} />
      <ReturnBlock inj={inj} label={label} onStart={onReturn} onHeal={onHeal} />

      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={`All ${label.toLowerCase()} exercises`}>
        <Chip active={inj.all.action === "skip" && inj.rules.size === 0} onClick={() => onChoose(inj, "skip", undefined, `every ${label.toLowerCase()} exercise`, inj.all.pct)}>Skip them all</Chip>
        <Chip active={inj.all.action === "light" && inj.rules.size === 0} onClick={() => onChoose(inj, "light", undefined, `every ${label.toLowerCase()} exercise`, inj.all.action === "light" ? inj.all.pct : DEFAULT_PCT)}>Train them all lighter</Chip>
      </div>
      {inj.all.action === "light" && (
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Share of your usual load">
          {LIGHT_PCTS.map((p) => <Chip key={p} active={inj.all.pct === p} onClick={() => onChoose(inj, "light", undefined, "", p)}>{p}%</Chip>)}
        </div>
      )}

      <ul className="mt-4 divide-y divide-line">
        {shown.map((e) => {
          const r = inj.rules.get(e.id) ?? inj.all;
          const swaps = r.action === "skip" ? alternatives(e.id, gym, [], hurt).filter((a) => !effectFor(a, hurt)).slice(0, 2) : [];
          return (
            <li key={e.id} className="py-3">
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0 font-medium">{e.name}</span>
                <span className="shrink-0 text-xs text-muted">{r.action === "skip" ? (inj.returning && !inj.returning.stopped ? `Return: ${inj.returning.pct}%` : "Skipped") : r.action === "light" ? `${r.pct}% load` : "Fine"}</span>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2" role="group" aria-label={`${e.name} with a ${label.toLowerCase()} injury`}>
                {([["skip", "Skip"], ["light", "Lighter"], ["ok", "Doesn't hurt"]] as const).map(([a, l]) => (
                  <button
                    key={a}
                    type="button"
                    aria-pressed={r.action === a}
                    onClick={() => { haptic("tick"); onChoose(inj, a, e.id, e.name, r.action === "light" ? r.pct : inj.all.pct || DEFAULT_PCT); }}
                    className={`press min-h-11 rounded-xl border text-sm ${r.action === a ? "border-accent bg-accent/10 font-semibold" : "border-line bg-surface text-muted"}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
              {swaps.length > 0 && <p className="mt-2 text-sm text-muted">Avoids it: {swaps.map((s) => s.name).join(" · ")}</p>}
            </li>
          );
        })}
      </ul>
      {affected.length > shown.length && <Button kind="quiet" className="w-full" onClick={() => setShowAll(true)}>Show all {affected.length}</Button>}
      {!affected.length && <p className="mt-3 text-sm text-muted">Nothing at this gym loads it.</p>}

      <Button kind="ghost" className="mt-3 w-full" onClick={onHeal}>I&apos;m fully healed</Button>
    </section>
  );
}

/** The risks, every time the lifter chooses to train something they said hurts. Needs a tick to go on. */
function RiskSheet({ warn, onClose, onConfirm }: { warn: Warn | null; onClose: () => void; onConfirm: (w: Warn) => void }) {
  const [ok, setOk] = useState(false);
  const [pct, setPct] = useState<number>(DEFAULT_PCT);
  const [key, setKey] = useState<Warn | null>(null);
  if (warn !== key) {
    setKey(warn);
    setOk(false);
    setPct(warn?.pct ?? DEFAULT_PCT);
  }
  if (!warn) return null;
  return (
    <Sheet open onClose={onClose} title="Before you train it">
      <div className="space-y-3 text-sm">
        {warn.action === "return" ? (
          <p>A graded return brings back {warn.name} at {RETURN_PCTS[0]}% of your usual load, then {RETURN_PCTS[1]}% and {RETURN_PCTS[2]}%, a week at a time while your pain stays at {LOW_PAIN} or below. Pain of {STOP_PAIN} or more stops it. Please read this first.</p>
        ) : (
          <p>You&apos;re choosing to keep training {warn.name}{warn.action === "light" ? " at a lighter load" : " at your usual load"}. Please read this first.</p>
        )}
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Training an injured area can make the injury worse, slow down healing, or turn a short problem into a long one.</li>
          <li>Pain can change how you move, which can overload other joints and muscles.</li>
          <li>Stop straight away if you feel sharp or stabbing pain, pain that builds during the set, swelling, numbness, tingling, or a joint giving way.</li>
          <li>A lighter load lowers the strain, but it doesn&apos;t make training an injury safe.</li>
        </ul>
        <p className="text-muted">{NOT_ADVICE}</p>
        {warn.action === "light" && (
          <div>
            <p className="mb-2 font-medium">Share of your usual load</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Share of your usual load">
              {LIGHT_PCTS.map((p) => <Chip key={p} active={pct === p} onClick={() => setPct(p)}>{p}%</Chip>)}
            </div>
          </div>
        )}
        <label className="flex items-center gap-3 rounded-xl bg-raised p-3">
          <input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} className="h-5 w-5 accent-[var(--color-accent)]" />
          I understand the risks
        </label>
        <Button className="w-full" disabled={!ok} onClick={() => onConfirm({ ...warn, pct })}>{warn.action === "return" ? "Start the graded return" : `Train ${warn.exerciseId ? "it" : "them"} ${warn.action === "light" ? `at ${pct}%` : "as usual"}`}</Button>
        <Button kind="quiet" className="w-full" onClick={onClose}>{warn.exerciseId ? "Keep skipping it" : warn.action === "return" ? "Not yet" : "Keep skipping them"}</Button>
      </div>
    </Sheet>
  );
}

/** A 0–10 pain rating as one native picker (one control, big enough to tap, works with screen readers). */
export function PainSelect({ label, onRate, className = "" }: { label: string; onRate: (n: number) => void; className?: string }) {
  const [saved, setSaved] = useState<number | null>(null);
  return (
    <label className={`flex items-center justify-between gap-3 rounded-xl bg-raised px-3 py-2 text-sm ${className}`}>
      <span>{saved === null ? label : `Saved: ${saved} of 10`}</span>
      <select
        aria-label={label}
        value={saved ?? ""}
        onChange={(e) => {
          const n = Number(e.target.value);
          haptic("tick");
          setSaved(n);
          onRate(n);
        }}
        className="num min-h-11 rounded-lg border border-line bg-surface px-2 text-ink"
      >
        <option value="" disabled>0–10</option>
        {Array.from({ length: 11 }, (_, n) => <option key={n} value={n}>{n}{n === 0 ? " no pain" : n === 10 ? " worst" : ""}</option>)}
      </select>
    </label>
  );
}

function PainBlock({ inj, label }: { inj: Injury; label: string }) {
  const { ratePain } = useApp();
  const t = painTrend(inj);
  return (
    <div className="mt-3 space-y-2">
      {t.points.length > 0 && (
        <div className="flex items-center gap-3">
          <Sparkline points={t.points} label={`${label} pain, oldest to newest: ${t.points.join(", ")} out of 10`} />
          <div className="shrink-0 text-right text-sm">
            <div className="num font-semibold">Pain {t.latest}/10</div>
            {t.change !== undefined && <div className={`text-xs ${t.change < 0 ? "text-good" : t.change > 0 ? "text-warn" : "text-muted"}`}>{t.change < 0 ? `Down ${-t.change}` : t.change > 0 ? `Up ${t.change}` : "No change"} over the last {t.points.length} ratings</div>}
          </div>
        </div>
      )}
      <PainSelect key={inj.pain.length} label="How does it feel today?" onRate={(n) => ratePain(inj.id, n)} />
    </div>
  );
}

function Sparkline({ points, label }: { points: number[]; label: string }) {
  const w = 160;
  const h = 40;
  const x = (i: number) => (points.length === 1 ? w / 2 : (i / (points.length - 1)) * (w - 8) + 4);
  const y = (v: number) => h - 4 - (v / 10) * (h - 8);
  return (
    <svg role="img" aria-label={label} viewBox={`0 0 ${w} ${h}`} className="h-10 min-w-0 flex-1">
      <line x1="0" x2={w} y1={y(LOW_PAIN)} y2={y(LOW_PAIN)} stroke="var(--color-line)" strokeDasharray="3 3" />
      <polyline fill="none" stroke="var(--color-warn)" strokeWidth="2" strokeLinejoin="round" points={points.map((v, i) => `${x(i)},${y(v)}`).join(" ")} />
      {points.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r="2.5" fill="var(--color-warn)" />)}
    </svg>
  );
}

function ReturnBlock({ inj, label, onStart, onHeal }: { inj: Injury; label: string; onStart: () => void; onHeal: () => void }) {
  const now = useNow();
  const r = inj.returning;
  if (r && !r.stopped) {
    return (
      <div className="mt-3 rounded-xl border border-accent/30 bg-accent/10 p-3 text-sm">
        <p className="font-semibold">Graded return: step {r.stage + 1} of 3, at {r.pct}%</p>
        <p className="mt-1 text-muted">
          {r.readyToHeal
            ? `A week at ${RETURN_PCTS[2]}% with low pain. If your ${label.toLowerCase()} feels right, you can mark it healed.`
            : `Each step lasts at least a week and needs a rating of ${LOW_PAIN} or less to move on. A ${LOW_PAIN + 1} or ${STOP_PAIN - 1} restarts the week; ${STOP_PAIN} or more stops the return.`}
        </p>
        {r.readyToHeal && <Button kind="ghost" className="mt-2 w-full" onClick={onHeal}>Mark it healed</Button>}
      </div>
    );
  }
  if (returnReady(inj, now)) {
    return (
      <div className="mt-3 rounded-xl border border-good/30 bg-good/10 p-3 text-sm">
        <p>Your pain has been {LOW_PAIN} or lower for about a week{r?.stopped ? " since the last return stopped" : ""}.</p>
        <Button kind="ghost" className="mt-2 w-full" onClick={onStart}>Start a graded return</Button>
      </div>
    );
  }
  if (r?.stopped) return <p className="mt-3 rounded-xl border border-warn/30 bg-warn/10 p-3 text-sm">The graded return stopped when pain reached {r.stopped.score}. Skipped exercises stay out until it settles again.</p>;
  return null;
}
