"use client";
import { exercise, EXERCISE_BY_ID } from "@/lib/exercises";
import { forecast, testDay, type LiftGoal } from "@/lib/goals";
import { activeFixes, findPlateaus, FIX_TEXT, fixResult, type FixKind, type Plateau } from "@/lib/plateau";
import { can } from "@/lib/entitlements";
import { useApp } from "@/lib/store";
import { fmtNum, fromKg, toKg } from "@/lib/units";
import { useNow } from "@/lib/useNow";
import { useState } from "react";
import { Button, Section, Sheet } from "./ui";

// Coaching cards on the Progress screen: lift goals with an honest forecast, and the plateau detective.

const uid = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2));

const STATUS: Record<string, { label: string; cls: string }> = {
  done: { label: "Reached", cls: "text-good" },
  likely: { label: "Very likely", cls: "text-good" },
  onTrack: { label: "On track", cls: "text-good" },
  stretch: { label: "A stretch", cls: "text-warn" },
  unlikely: { label: "Not realistic yet", cls: "text-bad" },
  noData: { label: "Needs data", cls: "text-muted" },
};

export function GoalsCard() {
  const { profile, events, gyms, setProfile } = useApp();
  const [adding, setAdding] = useState(false);
  const now = useNow();
  const unit = profile.unit;
  const gym = gyms.find((g) => g.id === profile.activeGymId) ?? gyms[0];
  const goals = (profile.goals ?? []).filter((g) => !g.doneAt);
  if (!can("goalPlanner")) return null;
  const w = (kg: number) => `${fmtNum(Math.round(fromKg(kg, unit) * 2) / 2)} ${unit}`;
  const remove = (id: string) => setProfile({ goals: (profile.goals ?? []).filter((g) => g.id !== id) });
  return (
    <Section title="Goals" right={<button type="button" className="press min-h-11 px-1 text-sm text-accent" onClick={() => setAdding(true)}>+ Add goal</button>}>
      {!goals.length && <p className="card p-4 text-sm text-muted">Set a lift and a date, like a 100 kg bench by March. You’ll get an honest forecast, and a test-day plan when it’s close.</p>}
      <ul className="space-y-3">
        {goals.map((g) => {
          const f = forecast(g, events, profile, now);
          const st = STATUS[f.status];
          const td = gym ? testDay(g, f, gym, now) : null;
          const pct = f.now && g.kg ? Math.min(100, (f.now / g.kg) * 100) : 0;
          return (
            <li key={g.id} className="card p-4">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-semibold">{exercise(g.exerciseId).name}: {w(g.kg)}</span>
                <span className={`text-sm font-semibold ${st.cls}`}>{st.label}</span>
              </div>
              <p className="text-xs text-faint">By {new Date(g.by).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" })}{f.now ? ` · now about ${w(f.now)}` : ""}</p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-raised" role="img" aria-label={`${Math.round(pct)}% of the goal`}>
                <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-2 text-sm text-muted">{f.text}</p>
              {f.status !== "noData" && f.status !== "done" && <p className="num mt-1 text-xs text-faint">Forecast by then: {w(f.low)} to {w(f.high)}, likely {w(f.mid)}</p>}
              {td && (
                <div className="mt-3 rounded-xl bg-raised p-3 text-sm">
                  <p className="font-semibold">Test day in {td.days} {td.days === 1 ? "day" : "days"}</p>
                  <p className="mt-1 text-muted">{td.advice}</p>
                  <p className="num mt-1">Attempts: {td.attempts.map(w).join(" → ")}</p>
                </div>
              )}
              <div className="mt-2 flex gap-4">
                {f.status === "done" && <button type="button" className="press min-h-11 text-sm text-accent" onClick={() => setProfile({ goals: (profile.goals ?? []).map((x) => (x.id === g.id ? { ...x, doneAt: now } : x)) })}>I lifted it</button>}
                <button type="button" className="press min-h-11 text-sm text-faint" onClick={() => remove(g.id)}>Remove</button>
              </div>
            </li>
          );
        })}
      </ul>
      <AddGoal open={adding} onClose={() => setAdding(false)} onAdd={(g) => setProfile({ goals: [...(profile.goals ?? []), g] })} />
    </Section>
  );
}

function AddGoal({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (g: LiftGoal) => void }) {
  const { stats, profile, events } = useApp();
  const now = useNow();
  const unit = profile.unit;
  const lifts = [...stats.e1rmSeries.keys()].filter((id) => EXERCISE_BY_ID.get(id)?.load !== "bodyweight");
  const [id, setId] = useState("");
  const [value, setValue] = useState("");
  const [date, setDate] = useState(() => new Date(now + 90 * 86400_000).toISOString().slice(0, 10));
  const pick = id || lifts[0] || "";
  const kg = toKg(Number(value), unit);
  const by = new Date(`${date}T12:00:00`).getTime();
  const preview = pick && kg > 0 && by > now ? forecast({ exerciseId: pick, kg, by }, events, profile, now) : null;
  return (
    <Sheet open={open} onClose={onClose} title="New lift goal">
      {!lifts.length ? (
        <p className="text-muted">Log a few weighted lifts first, then set a goal for one of them.</p>
      ) : (
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm text-muted">Lift</span>
            <select value={pick} onChange={(e) => setId(e.target.value)} className="mt-1 w-full rounded-xl border border-line bg-raised px-3 py-3">
              {lifts.map((l) => <option key={l} value={l}>{exercise(l).name}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-sm text-muted">One-rep max to reach ({unit})</span>
            <input type="number" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} className="mt-1 w-full rounded-xl border border-line bg-raised px-3 py-3" />
          </label>
          <label className="block">
            <span className="text-sm text-muted">By</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 w-full rounded-xl border border-line bg-raised px-3 py-3" />
          </label>
          {preview && <p className={`text-sm ${STATUS[preview.status].cls}`}>{STATUS[preview.status].label}. <span className="text-muted">{preview.text}</span></p>}
          <Button className="w-full" disabled={!preview} onClick={() => { onAdd({ id: uid(), exerciseId: pick, kg, by, createdAt: now }); setValue(""); onClose(); }}>Set goal</Button>
        </div>
      )}
    </Sheet>
  );
}

export function PlateausCard() {
  const { profile, events, fixPlateau } = useApp();
  const [open, setOpen] = useState<Plateau | null>(null);
  const now = useNow();
  const unit = profile.unit;
  const fixes = profile.plateauFixes ?? [];
  const live = activeFixes(fixes, now);
  const finished = fixes.filter((f) => f.until <= now && now - f.until < 21 * 86400_000);
  const stalls = findPlateaus(events, profile, now, fixes);
  if (!can("plateauDetective")) return null;
  if (!stalls.length && !live.length && !finished.length) return null;
  const w = (kg: number) => `${fmtNum(Math.round(fromKg(kg, unit) * 2) / 2)} ${unit}`;
  return (
    <Section title="Plateau detective">
      <ul className="space-y-3">
        {stalls.map((p) => (
          <li key={p.exerciseId} className="card p-4">
            <p className="font-semibold">{exercise(p.exerciseId).name} has stalled for {p.weeks} weeks</p>
            <p className="text-sm text-muted">Best estimated max {w(p.best)}. {p.causes[0].text}</p>
            <Button kind="ghost" className="mt-3 w-full" onClick={() => setOpen(p)}>See the fix</Button>
          </li>
        ))}
        {live.map((f) => (
          <li key={f.exerciseId} className="card p-4">
            <p className="font-semibold">{exercise(f.exerciseId).name}: {FIX_TEXT[f.kind].title.toLowerCase()}</p>
            <p className="text-sm text-muted">Running until {new Date(f.until).toLocaleDateString("en", { day: "numeric", month: "short" })}. Your plan already includes it.</p>
          </li>
        ))}
        {finished.map((f) => {
          const r = fixResult(f, events);
          return (
            <li key={f.exerciseId + f.startedAt} className="card p-4">
              <p className="font-semibold">{exercise(f.exerciseId).name}: fix finished</p>
              <p className="text-sm text-muted">{!r ? "No sessions during the fix, so there's nothing to compare yet." : r.worked ? `It worked: your estimated max is up ${Math.round(r.gain * 1000) / 10}%.` : "No new best yet. If it's still stuck in a week or two, the detective will suggest a different fix."}</p>
            </li>
          );
        })}
      </ul>
      <Sheet open={!!open} onClose={() => setOpen(null)} title={open ? `Why ${exercise(open.exerciseId).name} is stuck` : ""}>
        {open && (
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">What we found</h3>
            <ul className="mt-2 space-y-2 text-sm">{open.causes.map((c) => <li key={c.kind}>{c.text}</li>)}</ul>
            <h3 className="mt-5 text-sm font-semibold uppercase tracking-wider text-muted">Three-week fix</h3>
            <div className="mt-2 space-y-2">
              {[...new Set<FixKind>([open.fix, ...open.causes.map((c) => c.fix), "variation"])].slice(0, 3).map((k, i) => (
                <button key={k} type="button" onClick={() => { fixPlateau(open, k); setOpen(null); }} className={`press w-full rounded-2xl border p-3 text-left ${i === 0 ? "border-accent bg-accent/10" : "border-line bg-raised"}`}>
                  <span className="block font-semibold">{FIX_TEXT[k].title}{i === 0 ? " (suggested)" : ""}</span>
                  <span className="text-sm text-muted">{FIX_TEXT[k].what}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </Sheet>
    </Section>
  );
}
