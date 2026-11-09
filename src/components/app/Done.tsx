"use client";
import { useNow } from "@/lib/useNow";
import { exercise } from "@/lib/exercises";
import { goalStreak, levelOf, xpTotal, XP } from "@/lib/game";
import { confetti, haptic, sound } from "@/lib/juice";
import { useApp } from "@/lib/store";
import { fmtNum, fromKg } from "@/lib/units";
import { useEffect, useState } from "react";
import { clock } from "./format";
import { go } from "./router";
import { Button } from "./ui";
import { ShareWorkout } from "./Remix";

function useCountUp(to: number, ms = 900) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / ms);
      setV(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, ms]);
  return v;
}

export function Done() {
  const { stats, profile } = useApp();
  const now = useNow();
  const s = stats.sessions[0];
  const prs = s ? stats.prs.filter((p) => p.at >= s.start) : [];
  const gained = s ? s.sets * XP.set + XP.session + prs.length * XP.pr + (s.sets >= 12 ? XP.fullSession : 0) : 0;
  const lvl = levelOf(xpTotal(stats));
  const streak = goalStreak(stats, profile, now);
  const xp = useCountUp(gained);
  const vol = useCountUp(s ? Math.round(fromKg(s.volume, profile.unit)) : 0);

  useEffect(() => {
    void confetti(prs.length > 0);
    haptic("success");
    sound.fanfare();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!s) return <div className="pt-10 text-center"><Button onClick={() => go("today")}>Back to today</Button></div>;

  return (
    <div className="pb-24 pt-6 text-center">
      <div className="animate-pop text-6xl">{prs.length ? "🏆" : "💪"}</div>
      <h1 className="mt-3 text-3xl font-bold">{prs.length ? `${prs.length} new PR${prs.length > 1 ? "s" : ""}!` : "Workout done"}</h1>
      <p className="num mt-2 text-4xl font-bold text-accent">+{xp} XP</p>
      <p className="mt-1 text-sm text-muted">Level {lvl.level} · {lvl.title}</p>
      <div className="mt-6 grid grid-cols-3 gap-3">
        {[["Time", clock(s.seconds)], ["Sets", String(s.sets)], ["Volume", `${fmtNum(vol)} ${profile.unit}`]].map(([k, v]) => (
          <div key={k} className="card animate-rise p-3">
            <div className="text-xs uppercase tracking-wider text-faint">{k}</div>
            <div className="num mt-1 text-xl font-bold">{v}</div>
          </div>
        ))}
      </div>
      {s.avgHr && <p className="num mt-3 text-sm text-muted">♥ average {s.avgHr} bpm, max {s.maxHr}</p>}
      {prs.length > 0 && (
        <ul className="card mt-4 divide-y divide-line text-left">
          {prs.map((p) => (
            <li key={p.exerciseId} className="flex justify-between px-4 py-3">
              <span>🏆 {exercise(p.exerciseId).name}</span>
              <span className="num text-muted">{fmtNum(fromKg(p.weight, profile.unit))} {profile.unit} × {p.reps}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="card mt-4 p-4">
        <p className="font-semibold">🔥 {streak.weeks > 0 ? `${streak.weeks}-week streak` : "Streak starts this week"}</p>
        <p className="text-sm text-muted">{streak.needed > 0 ? `${streak.needed} more workout${streak.needed > 1 ? "s" : ""} this week to ${streak.weeks > 0 ? "keep it going" : "start your streak"}.` : "This week's goal is done. Rest well."}</p>
      </div>
      <ShareWorkout sessionId={s.sessionId} />
      <Button className="mt-6 w-full py-4 text-lg" onClick={() => go("today")}>Done</Button>
    </div>
  );
}
