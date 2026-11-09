"use client";
import { useNow } from "@/lib/useNow";
import { exercise } from "@/lib/exercises";
import { TIER_LABEL, unlocked } from "@/lib/achievements";
import { derive } from "@/lib/derive";
import { COSMETICS, RARITY_LABEL, crates, game, type Cosmetic } from "@/lib/game";
import { applyAccent, confetti, haptic, juice, sound, type TimerSound } from "@/lib/juice";
import { shareCard } from "@/lib/shareImage";
import { track } from "@/lib/analytics";
import { useApp } from "@/lib/store";
import { fmtNum, fromKg } from "@/lib/units";
import { useEffect, useMemo, useState } from "react";
import { Badge, LeagueCard, StreakCard, TIER_COLOUR, useGame } from "./Achievements";
import { clock } from "./format";
import { go } from "./router";
import { Button } from "./ui";

function useCountUp(to: number, ms = 900) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const dur = juice.lean ? 1 : ms;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      setV(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, ms]);
  return v;
}

const RARITY_COLOUR = { common: "#8a97a8", rare: "#4c8dff", epic: "#a78bfa", legendary: "#f2c14e" } as const;

/** The post-workout crate: shakes until tapped (never during a set), then shows its prize. */
function Crate({ item, duplicate }: { item: Cosmetic; duplicate: boolean }) {
  const { profile, setProfile } = useApp();
  const [open, setOpen] = useState(juice.lean);
  const rare = item.rarity === "epic" || item.rarity === "legendary";
  const equipped = profile.cosmetics?.[item.kind] === item.id;
  const reveal = () => {
    setOpen(true);
    haptic(rare ? "celebrate" : "tap");
    sound.crate(rare);
    if (rare) void confetti(true);
    track("feature", { name: "crate_open", detail: item.rarity });
  };
  if (!open) {
    return (
      <button type="button" onClick={reveal} className="press card mt-4 flex w-full items-center gap-4 p-4 text-left">
        <span aria-hidden className="animate-shake text-5xl">🎁</span>
        <span>
          <span className="block font-semibold">You earned a crate</span>
          <span className="text-sm text-muted">Tap to open it</span>
        </span>
      </button>
    );
  }
  return (
    <div className="card animate-pop mt-4 p-4 text-left" style={{ boxShadow: `inset 0 0 0 2px ${RARITY_COLOUR[item.rarity]}` }}>
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: RARITY_COLOUR[item.rarity] }}>{RARITY_LABEL[item.rarity]} {item.kind === "accent" ? "accent colour" : item.kind === "sound" ? "timer sound" : "plate finish"}</p>
      <div className="mt-1 flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-lg font-semibold">
          {item.kind === "accent" && <span aria-hidden className="h-5 w-5 rounded-full" style={{ background: item.value }} />}
          {item.name}
        </span>
        {duplicate ? (
          <span className="text-sm text-muted">Already yours · +25 XP</span>
        ) : (
          <Button kind={equipped ? "quiet" : "ghost"} className="py-2" disabled={equipped} onClick={() => {
            setProfile({ cosmetics: { ...profile.cosmetics, [item.kind]: item.id } });
            if (item.kind === "accent") applyAccent(item.value);
            if (item.kind === "sound") sound.preview(item.value as TimerSound);
          }}>{equipped ? "Equipped" : "Use it"}</Button>
        )}
      </div>
    </div>
  );
}

export function Done() {
  const { stats, profile, events } = useApp();
  const now = useNow();
  const after = useGame();
  const s = stats.sessions[0];
  const prs = s ? stats.prs.filter((p) => p.at >= s.start) : [];
  // The same numbers without this workout, to show what it changed.
  const before = useMemo(() => {
    if (!s) return after;
    const ev = events.filter((e) => !("sessionId" in e) || e.sessionId !== s.sessionId);
    return game(ev, derive(ev, now), profile, now);
  }, [s?.sessionId]); // eslint-disable-line react-hooks/exhaustive-deps
  const gained = Math.max(0, after.xp - before.xp);
  const levelUp = after.level.level > before.level.level;
  const badges = unlocked(before.achievements, after.achievements);
  const questsDone = after.quests.filter((q) => q.done && !before.quests.find((b) => b.id === q.id)?.done);
  const crate = s ? crates(stats).find((c) => c.sessionId === s.sessionId) : undefined;
  const xp = useCountUp(gained);
  const vol = useCountUp(s ? Math.round(fromKg(s.volume, profile.unit)) : 0);
  const [shared, setShared] = useState<string | null>(null);

  useEffect(() => {
    void confetti(prs.length > 0 || levelUp);
    haptic(prs.length || levelUp || badges.length ? "celebrate" : "success");
    if (levelUp) sound.levelUp();
    else sound.fanfare();
    if (badges.length) setTimeout(() => sound.badge(), 1100);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!s) return <div className="pt-10 text-center"><Button onClick={() => go("today")}>Back to today</Button></div>;

  const share = async () => {
    const accent = COSMETICS.find((c) => c.id === profile.cosmetics?.accent)?.value;
    const how = await shareCard({
      kicker: new Date(s.start).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }),
      headline: prs.length ? `${prs.length} new PR${prs.length > 1 ? "s" : ""}` : "Workout done",
      tiles: [["Time", clock(s.seconds)], ["Sets", String(s.sets)], ["Volume", `${fmtNum(Math.round(fromKg(s.volume, profile.unit)))} ${profile.unit}`]],
      lines: [
        ...prs.slice(0, 3).map((p) => `🏆 ${exercise(p.exerciseId).name} · ${fmtNum(fromKg(p.weight, profile.unit))} ${profile.unit} × ${p.reps}`),
        ...badges.slice(0, 4).map((b) => `${b.a.icon} ${b.a.name} · ${TIER_LABEL[b.tier]}`),
      ].slice(0, 4),
      footer: `Level ${after.level.level} · ${after.level.title} · ${after.streak.weeks}-week streak`,
      accent,
    }, `liftsmith-${new Date(s.start).toISOString().slice(0, 10)}`);
    track("feature", { name: "share_card", detail: how });
    setShared(how === "download" ? "Saved the image." : how === "failed" ? "Couldn't share that. Try again." : null);
  };

  return (
    <div className="pb-24 pt-6 text-center">
      <div className="animate-pop text-6xl" aria-hidden>{prs.length ? "🏆" : "💪"}</div>
      <h1 className="mt-3 text-3xl font-bold">{prs.length ? `${prs.length} new PR${prs.length > 1 ? "s" : ""}!` : "Workout done"}</h1>
      <p className="num mt-2 text-4xl font-bold text-accent" aria-label={`${gained} XP earned`}>+{xp} XP</p>
      <p className="mt-1 text-sm text-muted">Level {after.level.level} · {after.level.title}</p>

      {levelUp && (
        <div className="card animate-bump mt-4 border-accent p-4" role="status" style={{ boxShadow: "0 0 0 2px var(--color-accent)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">Level up</p>
          <p className="mt-1 text-2xl font-bold">Level {after.level.level}{after.level.title !== before.level.title ? ` · ${after.level.title}` : ""}</p>
          {after.level.title !== before.level.title && <p className="text-sm text-muted">New title unlocked</p>}
        </div>
      )}

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

      {badges.length > 0 && (
        <section className="mt-4 text-left" aria-label="Badges unlocked">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-faint">Badges unlocked</h2>
          <ul className="card divide-y divide-line">
            {badges.map(({ a, tier }, i) => (
              <li key={a.id} className="animate-rise flex items-center gap-3 px-4 py-3" style={{ animationDelay: `${600 + i * 150}ms`, animationFillMode: "both" }}>
                <Badge a={a} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{a.name}</div>
                  <div className="truncate text-sm text-muted">{a.detail}</div>
                </div>
                <span className="text-sm font-semibold" style={{ color: TIER_COLOUR[tier] }}>{TIER_LABEL[tier]}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {questsDone.length > 0 && (
        <ul className="card mt-4 divide-y divide-line text-left" aria-label="Quests completed">
          {questsDone.map((q) => (
            <li key={q.id} className="flex justify-between px-4 py-3">
              <span>✅ {q.title}</span>
              <span className="num text-accent">+{q.xp} XP</span>
            </li>
          ))}
        </ul>
      )}

      {crate && <Crate item={crate.item} duplicate={crate.duplicate} />}

      <div className="mt-4 space-y-3 text-left">
        <StreakCard g={after} />
        <LeagueCard g={after} />
      </div>

      <Button kind="ghost" className="mt-6 w-full" onClick={() => void share()}>Share this workout</Button>
      {shared && <p className="mt-2 text-sm text-muted" role="status">{shared}</p>}
      <Button className="mt-3 w-full py-4 text-lg" onClick={() => go("today")}>Done</Button>
      <button type="button" onClick={() => go("achievements")} className="press mt-3 text-sm text-muted underline">See all achievements</button>
    </div>
  );
}
