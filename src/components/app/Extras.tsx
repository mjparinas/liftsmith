"use client";
// Delightful extras on Today, Done and Progress: moments (anniversaries, comebacks, tonnage), seasonal
// challenges, newly earned themes, "same as last time", the general warm-up, gym buddy check-ins, the
// lifetime tonnage card, the strength score and the recap entry. Kept here so the screens they sit on only
// gain one line each.
import { checkinText, shareText } from "@/lib/buddy";
import { exercise } from "@/lib/exercises";
import { goalStreak } from "@/lib/game";
import { lastWorkout, repeatPlan } from "@/lib/ghost";
import { haptic } from "@/lib/juice";
import { doneMoments, fmtTonnage, todayMoments, tonnage, type Moment } from "@/lib/moments";
import { suggestedPeriod } from "@/lib/recap";
import { nextSeasonal, seasonalChallenges } from "@/lib/seasonal";
import { useApp } from "@/lib/store";
import { scoreBand, strength, twins } from "@/lib/strength";
import { newlyUnlocked } from "@/lib/themes";
import { MUSCLE_LABEL, type Muscle } from "@/lib/types";
import { fmtNum, fromKg } from "@/lib/units";
import { useNow } from "@/lib/useNow";
import { drillSeconds, warmupRoutine, type Drill } from "@/lib/warmupRoutine";
import { useMemo, useState } from "react";
import { go } from "./router";
import { Button, Section, Sheet } from "./ui";

/** Lean mode (Settings › Celebrations): no extra pop-ups. */
export function lean(p: { lean?: boolean }): boolean {
  return !!p.lean;
}

function MomentCard({ m, onClose }: { m: Moment; onClose?: () => void }) {
  return (
    <div className="card animate-rise flex items-start gap-3 p-4" role="status">
      <span className="text-3xl" aria-hidden>{m.emoji}</span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{m.title}</p>
        <p className="mt-0.5 text-sm text-muted">{m.detail}</p>
      </div>
      {onClose && (
        <button type="button" onClick={onClose} aria-label="Dismiss" className="press -mr-1 -mt-1 grid h-11 w-11 shrink-0 place-items-center rounded-full text-faint">✕</button>
      )}
    </div>
  );
}

// --- Today ------------------------------------------------------------------------------------

/** Anniversary, welcome back, new theme and seasonal challenge cards. */
export function TodayMoments() {
  const { stats, events, profile, setProfile, active } = useApp();
  const now = useNow(60_000);
  const seen = profile.delight?.seenMoments ?? [];
  const day = new Date(now).toDateString();
  const moments = todayMoments(stats, now).filter((m) => !seen.includes(`${m.id}:${day}`));
  const goalWeeks = goalStreak(stats, profile, now).weeks;
  const fresh = newlyUnlocked(profile.delight?.seenThemes ?? [], { stats, goalWeeks, now });
  const seasonal = seasonalChallenges(events, now);
  const teaser = seasonal.length ? null : nextSeasonal(now);
  if (active) return null;
  const dismiss = (id: string) => setProfile({ delight: { ...profile.delight, seenMoments: [...seen.slice(-40), `${id}:${day}`] } });
  return (
    <div className="mt-4 space-y-3 empty:hidden">
      {moments.map((m) => <MomentCard key={m.id} m={m} onClose={() => dismiss(m.id)} />)}
      {fresh.length > 0 && (
        <button type="button" onClick={() => { haptic("tick"); setProfile({ delight: { ...profile.delight, seenThemes: [...(profile.delight?.seenThemes ?? []), ...fresh.map((t) => t.id)] } }); go("settings", "themes"); }} className="press card flex w-full items-center gap-3 p-4 text-left">
          <span className="h-10 w-10 shrink-0 rounded-full border-4" style={{ background: fresh[0].palette.bg, borderColor: fresh[0].palette.accent }} aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">New theme unlocked: {fresh[0].name}</span>
            <span className="block text-sm text-muted">{fresh[0].how}. Tap to try it.</span>
          </span>
        </button>
      )}
      {seasonal.map((c) => (
        <div key={c.id} className="card p-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl" aria-hidden>{c.emoji}</span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{c.name}{c.done ? " · done!" : ""}</p>
              <p className="text-sm text-muted">{c.detail}</p>
            </div>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-raised" role="progressbar" aria-label={`${c.name} progress`} aria-valuemin={0} aria-valuemax={c.goal} aria-valuenow={c.progress}>
            <div className="h-full rounded-full bg-gradient-to-r from-accent to-good" style={{ width: `${(c.progress / c.goal) * 100}%` }} />
          </div>
          <p className="num mt-1.5 text-xs text-faint">
            {c.measure === "kg" ? `${fmtNum(Math.round(fromKg(c.progress, profile.unit)))} of ${fmtNum(Math.round(fromKg(c.goal, profile.unit)))} ${profile.unit}` : `${c.progress} of ${c.goal} ${c.measure === "days" ? "days" : c.measure}`}
            {!c.done && c.daysLeft > 0 ? ` · ${c.daysLeft} day${c.daysLeft > 1 ? "s" : ""} left` : ""}
          </p>
        </div>
      ))}
      {teaser && teaser.start - now < 7 * 86400_000 && (
        <p className="px-1 text-sm text-faint">{teaser.def.emoji} {teaser.def.name} starts {new Date(teaser.start).toLocaleDateString([], { weekday: "long" })}.</p>
      )}
    </div>
  );
}

/** "Same as last time", the general warm-up and gym buddy check-in, above the plan. */
export function PlanExtras() {
  const { events, preview, profile, gyms, setPlan, replan, active } = useApp();
  const now = useNow(60_000);
  const gym = gyms.find((g) => g.id === profile.activeGymId) ?? gyms[0];
  const last = useMemo(() => lastWorkout(events), [events]);
  const [repeating, setRepeating] = useState(false);
  const [warmOpen, setWarmOpen] = useState(false);
  const [buddyOpen, setBuddyOpen] = useState(false);
  if (active || !preview || !gym) return null;
  const toggleRepeat = () => {
    haptic("tick");
    if (repeating) {
      setRepeating(false);
      replan();
      return;
    }
    const p = repeatPlan(preview, events, profile, gym, now);
    if (p) {
      setPlan(p);
      setRepeating(true);
    }
  };
  const muscles = [...new Set(preview.items.flatMap((i) => exercise(i.exerciseId).primary))];
  return (
    <div className="mt-3 flex flex-wrap gap-2 text-sm">
      {last && (
        <button type="button" aria-pressed={repeating} onClick={toggleRepeat} className={`press min-h-11 rounded-full border px-3.5 ${repeating ? "border-accent bg-accent/15" : "border-line bg-surface text-muted"}`}>
          {repeating ? "✓ Same as last time" : "↻ Same as last time"}
        </button>
      )}
      {preview.items.length > 0 && (
        <button type="button" onClick={() => setWarmOpen(true)} className="press min-h-11 rounded-full border border-line bg-surface px-3.5 text-muted">🔥 Warm up first</button>
      )}
      <button type="button" onClick={() => setBuddyOpen(true)} className="press min-h-11 rounded-full border border-line bg-surface px-3.5 text-muted">👋 Check in</button>
      <Sheet open={warmOpen} onClose={() => setWarmOpen(false)} title="Five-minute warm-up">
        <WarmupList drills={warmupRoutine(muscles, gym.equipment, now, 5)} />
      </Sheet>
      <Sheet open={buddyOpen} onClose={() => setBuddyOpen(false)} title="Tell your gym buddies">
        <BuddyCheckin focus={[...new Set(preview.items.map((i) => i.focus))] as Muscle[]} gymName={gym.name} onDone={() => setBuddyOpen(false)} />
      </Sheet>
    </div>
  );
}

function WarmupList({ drills }: { drills: Drill[] }) {
  const [done, setDone] = useState<string[]>([]);
  const total = Math.round(drills.reduce((s, d) => s + drillSeconds(d), 0) / 60);
  return (
    <div>
      <p className="text-sm text-muted">About {total} minutes for the muscles in today&apos;s plan. Your first lift still ramps up with warm-up sets.</p>
      <ol className="mt-3 space-y-2">
        {drills.map((d) => {
          const on = done.includes(d.id);
          return (
            <li key={d.id}>
              <button type="button" aria-pressed={on} onClick={() => { haptic("tick"); setDone(on ? done.filter((x) => x !== d.id) : [...done, d.id]); }} className={`press flex w-full items-start gap-3 rounded-2xl border p-3 text-left ${on ? "border-good/40 bg-good/10" : "border-line bg-raised"}`}>
                <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border text-sm ${on ? "border-good bg-good text-bg" : "border-line"}`} aria-hidden>{on ? "✓" : ""}</span>
                <span>
                  <span className="block font-medium">{d.name} <span className="num text-sm font-normal text-muted">· {d.reps ? `${d.reps} reps` : `${d.seconds} s`}</span></span>
                  <span className="block text-sm text-muted">{d.how}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function BuddyCheckin({ focus, gymName, onDone }: { focus: Muscle[]; gymName: string; onDone: () => void }) {
  const { profile, setProfile, checkin } = useApp();
  const buddies = profile.delight?.buddies ?? [];
  const [picked, setPicked] = useState<string[]>(buddies.map((b) => b.id));
  const [name, setName] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const add = () => {
    const n = name.trim().slice(0, 30);
    if (!n) return;
    const b = { id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now()), name: n };
    setProfile({ delight: { ...profile.delight, buddies: [...buddies, b] } });
    setPicked([...picked, b.id]);
    setName("");
  };
  const remove = (id: string) => setProfile({ delight: { ...profile.delight, buddies: buddies.filter((b) => b.id !== id) } });
  const names = buddies.filter((b) => picked.includes(b.id)).map((b) => b.name);
  const text = checkinText({ gym: gymName, focus: focus.slice(0, 3).map((m) => MUSCLE_LABEL[m]), buddies: names });
  const send = async () => {
    const r = await shareText(text);
    if (r === "cancelled" || r === "failed") {
      setNote(r === "failed" ? "Couldn't open the share sheet." : null);
      return;
    }
    checkin(names);
    haptic("success");
    if (r === "copied") setNote("Copied. Paste it into your group chat.");
    else onDone();
  };
  return (
    <div>
      <p className="text-sm text-muted">Sends a quick &quot;I&apos;m at the gym&quot; through your usual messaging app. Once accounts arrive, buddies who use the app get a nudge straight to their phone.</p>
      {buddies.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {buddies.map((b) => {
            const on = picked.includes(b.id);
            return (
              <li key={b.id} className="flex items-center">
                <button type="button" aria-pressed={on} onClick={() => setPicked(on ? picked.filter((x) => x !== b.id) : [...picked, b.id])} className={`press min-h-11 rounded-l-full border px-3.5 text-sm ${on ? "border-accent bg-accent/15" : "border-line bg-surface text-muted"}`}>{b.name}</button>
                <button type="button" aria-label={`Remove ${b.name}`} onClick={() => remove(b.id)} className="press min-h-11 rounded-r-full border border-l-0 border-line bg-surface px-2.5 text-faint">✕</button>
              </li>
            );
          })}
        </ul>
      )}
      <div className="mt-3 flex gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="Add a buddy's name" aria-label="Buddy's name" className="card min-w-0 flex-1 px-4 py-3" />
        <Button kind="ghost" onClick={add} disabled={!name.trim()}>Add</Button>
      </div>
      <p className="mt-4 rounded-2xl bg-raised p-3 text-sm">{text}</p>
      {note && <p className="mt-2 text-sm text-accent" role="status">{note}</p>}
      <Button className="mt-4 w-full" onClick={() => void send()}>Check in</Button>
    </div>
  );
}

// --- Done -------------------------------------------------------------------------------------

/** Count, tonnage, comeback and anniversary moments after a workout. */
export function DoneMoments() {
  const { stats } = useApp();
  const ms = doneMoments(stats);
  if (!ms.length) return null;
  return <div className="mt-4 space-y-3 text-left">{ms.map((m) => <MomentCard key={m.id} m={m} />)}</div>;
}

// --- Progress ---------------------------------------------------------------------------------

/** Lifetime tonnage with the next "you've lifted a ..." milestone, and the recap and photos entries. */
export function TonnageCard() {
  const { stats, profile } = useApp();
  const t = tonnage(stats.totalVolume);
  const now = useNow(3600_000);
  const p = suggestedPeriod(now);
  return (
    <>
      <div className="card mt-3 p-4">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-xs uppercase tracking-wider text-faint">Lifted in total</span>
          <span className="num text-2xl font-bold">{fmtTonnage(stats.totalVolume, profile.unit)}</span>
        </div>
        <p className="mt-1 text-sm text-muted">{t.last ? `${t.last.emoji} More than ${t.last.name}.` : "Your first big milestone is a grand piano."}</p>
        {t.next && (
          <>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-raised">
              <div className="h-full rounded-full bg-gradient-to-r from-accent to-good" style={{ width: `${t.progress * 100}%` }} />
            </div>
            <p className="num mt-1.5 text-xs text-faint">{fmtTonnage(t.next.kg - stats.totalVolume, profile.unit)} to go until {t.next.name} {t.next.emoji}</p>
          </>
        )}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <button type="button" onClick={() => go("recap", p.kind === "year" ? `y${new Date(p.start).getFullYear()}` : `m${p.start}`)} className="press card p-4 text-left">
          <span className="block text-2xl" aria-hidden>{p.kind === "year" ? "🏆" : "📅"}</span>
          <span className="mt-1 block font-semibold">{p.kind === "year" ? "Your year in lifting" : "Monthly recap"}</span>
          <span className="block text-xs text-muted">Highlights to share</span>
        </button>
        <button type="button" onClick={() => go("photos")} className="press card p-4 text-left">
          <span className="block text-2xl" aria-hidden>📸</span>
          <span className="mt-1 block font-semibold">Body and photos</span>
          <span className="block text-xs text-muted">Private, on this phone</span>
        </button>
      </div>
    </>
  );
}

/** Strength score by muscle, adjustable for age, plus strength twins on the big lifts. */
export function StrengthCard() {
  const { events, profile, setProfile } = useApp();
  const now = useNow(3600_000);
  const p = profile;
  const adjustAge = profile.delight?.ageAdjust !== false;
  const r = useMemo(() => strength(events, p, now, { adjustAge }), [events, p, now, adjustAge]);
  if (r.overall === null) return null;
  const ms = (Object.entries(r.muscles) as [Muscle, number][]).sort((a, b) => b[1] - a[1]);
  const tw = twins(r);
  return (
    <Section title="Strength score">
      <div className="card p-4">
        <div className="flex items-center gap-4">
          <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full border-4 border-accent">
            <span className="num text-3xl font-bold">{r.overall}</span>
          </div>
          <div>
            <p className="font-semibold">{scoreBand(r.overall)}</p>
            <p className="text-sm text-muted">Your best lifts of the last 6 months against a typical intermediate lifter of your body weight{r.adjusted.age ? ", adjusted for your age" : ""}. 50 is typical.</p>
          </div>
        </div>
        <ul className="mt-4 space-y-2">
          {ms.slice(0, 8).map(([m, v]) => (
            <li key={m} className="flex items-center gap-3 text-sm">
              <span className="w-24 shrink-0 text-muted">{MUSCLE_LABEL[m]}</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-raised"><span className="block h-full rounded-full bg-accent" style={{ width: `${v}%` }} /></span>
              <span className="num w-8 text-right">{v}</span>
            </li>
          ))}
        </ul>
        {p.birthYear ? (
          <label className="mt-4 flex items-center gap-3 text-sm">
            <input type="checkbox" checked={adjustAge} onChange={(e) => setProfile({ delight: { ...profile.delight, ageAdjust: e.target.checked } })} className="h-5 w-5 accent-[var(--color-accent)]" />
            Adjust for age
          </label>
        ) : (
          <p className="mt-4 text-xs text-faint">Add your birth year in setup to adjust the score for age.</p>
        )}
      </div>
      {tw.length > 0 && (
        <div className="card mt-3 p-4">
          <p className="font-semibold">Strength twins</p>
          <p className="text-sm text-muted">How you compare with trained lifters of your {p.birthYear ? "age, " : ""}{p.sex ? "sex and " : ""}body weight.</p>
          <ul className="mt-3 divide-y divide-line">
            {tw.map((l) => (
              <li key={l.exerciseId} className="flex items-center justify-between py-2.5">
                <span>
                  <span className="block font-medium">{l.name}</span>
                  <span className="num text-xs text-muted">Best estimated max {fmtNum(Math.round(fromKg(l.e1rm, profile.unit)))} {profile.unit}</span>
                </span>
                <span className="num text-right text-sm">Stronger than<br /><span className="text-lg font-bold text-accent">{l.percentile}%</span></span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-faint">An estimate from typical strength standards, not from other users. Real rankings against lifters like you come with accounts.</p>
        </div>
      )}
    </Section>
  );
}
