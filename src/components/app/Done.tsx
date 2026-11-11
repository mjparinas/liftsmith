"use client";

import { useEffect, useMemo, useState } from "react";

import { Info } from "@/components/Info";
import { TIER_LABEL, unlocked } from "@/lib/achievements";
import { track } from "@/lib/analytics";
import { derive } from "@/lib/derive";
import { exercise } from "@/lib/exercises";
import { COSMETICS, crates, game, RARITY_LABEL, type Cosmetic } from "@/lib/game";
import { date, inSentence, t } from "@/lib/i18n";
import { activeInjuries, PART_LABEL } from "@/lib/injury";
import { applyAccent, confetti, haptic, juice, oops, sound, type TimerSound } from "@/lib/juice";
import { doneItems } from "@/lib/routines";
import { shareCard } from "@/lib/shareImage";
import { useApp } from "@/lib/store";
import { fmtNum, fromKg } from "@/lib/units";
import { useNow } from "@/lib/useNow";
import { doneCue, say, voice } from "@/lib/voice";

import { Badge, LeagueCard, RARITY_COLOUR, StreakCard, TIER_COLOUR, useGame } from "./Achievements";
import { burst } from "./burst";
import { DoneMoments, lean } from "./Extras";
import { clock } from "./format";
import { Icon } from "./icons";
import { PainSelect } from "./Injuries";
import { Mascot } from "./Mascot";
import { NextUpCard } from "./NextUp";
import { PrReplayButton } from "./PrReplay";
import { ShareWorkout } from "./Remix";
import { go } from "./router";
import { SaveDoneAsRoutine } from "./Routines";
import { CoolDownCard } from "./Stretch";
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

/** The post-workout crate: shakes until tapped (never during a set), then shows its prize. */
function Crate({ item, duplicate }: { item: Cosmetic; duplicate: boolean }) {
  const { profile, setProfile } = useApp();
  const [open, setOpen] = useState(juice.lean);
  const rare = item.rarity === "epic" || item.rarity === "legendary";
  const equipped = profile.cosmetics?.[item.kind] === item.id;
  const reveal = (e: { currentTarget: Element }) => {
    burst(e.currentTarget, { count: rare ? 22 : 14, reach: rare ? 120 : 90 });
    setOpen(true);
    haptic(rare ? "celebrate" : "tap");
    sound.crate(rare);
    if (rare) void confetti(true);
    track("feature", { name: "crate_open", detail: item.rarity });
  };
  if (!open) {
    return (
      <button type="button" onClick={reveal} className="press card mt-4 flex w-full items-center gap-4 p-4 text-left">
        <span
          aria-hidden
          className="animate-shake grid h-14 w-14 shrink-0 place-items-center rounded-2xl"
          style={{ background: "color-mix(in srgb, var(--color-violet) 18%, transparent)", color: "var(--color-violet)" }}
        >
          <Icon name="gift" size={30} />
        </span>
        <span>
          <span className="block font-semibold">{t("done.crate")}</span>
          <span className="text-sm text-muted">{t("done.crateTap")}</span>
        </span>
      </button>
    );
  }
  return (
    <div className="card animate-pop mt-4 p-4 text-left" style={{ boxShadow: `inset 0 0 0 2px ${RARITY_COLOUR[item.rarity]}` }}>
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: RARITY_COLOUR[item.rarity] }}>
        {t(item.kind === "accent" ? "done.crate.accent" : item.kind === "sound" ? "done.crate.sound" : "done.crate.plate", {
          rarity: RARITY_LABEL[item.rarity],
        })}
      </p>
      <div className="mt-1 flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-lg font-semibold">
          {item.kind === "accent" && <span aria-hidden className="h-5 w-5 rounded-full" style={{ background: item.value }} />}
          {item.name}
        </span>
        {duplicate ? (
          <span className="text-sm text-muted">{t("done.crateDup")}</span>
        ) : (
          <Button
            kind={equipped ? "quiet" : "ghost"}
            className="py-2"
            disabled={equipped}
            onClick={() => {
              setProfile({ cosmetics: { ...profile.cosmetics, [item.kind]: item.id } });
              if (item.kind === "accent") applyAccent(item.value);
              if (item.kind === "sound") sound.preview(item.value as TimerSound);
            }}
          >
            {equipped ? t("done.equipped") : t("done.useIt")}
          </Button>
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
    else if (questsDone.length) setTimeout(() => sound.done(), 1100);
    if (voice.enabled && s) say(doneCue(s.sets, s.volume, profile.unit));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!s)
    return (
      <div className="pt-10 text-center">
        <Button onClick={() => go("today")}>{t("done.back")}</Button>
      </div>
    );

  const share = async () => {
    const accent = COSMETICS.find((c) => c.id === profile.cosmetics?.accent)?.value;
    const how = await shareCard(
      {
        kicker: date(s.start, { weekday: "long", month: "long", day: "numeric" }),
        headline: prs.length ? t("done.prsShare", { count: prs.length }) : t("done.title"),
        tiles: [
          [t("done.time"), clock(s.seconds)],
          [t("done.sets"), fmtNum(s.sets)],
          [t("done.volume"), `${fmtNum(Math.round(fromKg(s.volume, profile.unit)))} ${profile.unit}`],
        ],
        lines: [
          ...prs
            .slice(0, 3)
            .map((p) => `🏆 ${exercise(p.exerciseId).name} · ${fmtNum(fromKg(p.weight, profile.unit))} ${profile.unit} × ${p.reps}`),
          ...badges.slice(0, 4).map((b) => `${b.a.icon} ${b.a.name} · ${TIER_LABEL[b.tier]}`),
        ].slice(0, 4),
        footer: t("done.footer", { level: after.level.level, title: after.level.title, count: after.streak.weeks }),
        accent,
      },
      `liftsmith-${new Date(s.start).toISOString().slice(0, 10)}`,
    );
    track("feature", { name: "share_card", detail: how });
    if (how === "failed") oops();
    setShared(how === "download" ? t("done.saved") : how === "failed" ? t("done.shareFailed") : null);
  };

  return (
    <div className="pb-24 pt-6 text-center">
      <div className="relative mx-auto w-fit">
        <Mascot mood="cheer" size={112} className="animate-spring-in" />
        {prs.length > 0 && (
          <span
            className="animate-pop absolute -right-2 bottom-2 grid h-10 w-10 place-items-center rounded-full border-2 border-bg"
            style={{ background: "var(--color-gold)", color: "var(--color-bg)", animationDelay: "350ms", animationFillMode: "both" }}
            aria-hidden
          >
            <Icon name="trophy" size={20} strokeWidth={2.4} />
          </span>
        )}
      </div>
      <h1 className="mt-3 text-3xl font-bold">{prs.length ? t("done.prs", { count: prs.length }) : t("done.title")}</h1>
      <p className="num mt-2 text-4xl font-bold text-accent" aria-label={t("done.xp", { xp: gained })}>
        +{xp} XP
      </p>
      <p className="mt-1 text-sm text-muted">{t("done.level", { level: after.level.level, title: after.level.title })}</p>

      {levelUp && (
        <div className="card animate-bump mt-4 border-accent p-4" role="status" style={{ boxShadow: "0 0 0 2px var(--color-accent)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">{t("done.levelUp")}</p>
          <p className="mt-1 text-2xl font-bold">
            {after.level.title !== before.level.title
              ? t("done.level", { level: after.level.level, title: after.level.title })
              : t("done.levelOnly", { level: after.level.level })}
          </p>
          {after.level.title !== before.level.title && <p className="text-sm text-muted">{t("done.newTitle")}</p>}
        </div>
      )}

      <div className="mt-6 grid grid-cols-3 gap-3">
        {[
          [t("done.time"), clock(s.seconds), ""],
          [t("done.sets"), fmtNum(s.sets), ""],
          [t("done.volume"), `${fmtNum(vol)} ${profile.unit}`, "volume"],
        ].map(([k, v, term]) => (
          <div key={k} className="card animate-rise p-3">
            <div className="text-xs uppercase tracking-wider text-faint">
              {k}
              {term === "volume" && <Info term="volume" />}
            </div>
            <div className="num mt-1 text-xl font-bold">{v}</div>
          </div>
        ))}
      </div>
      {s.avgHr && <p className="num mt-3 text-sm text-muted">{t("done.hr", { avg: s.avgHr, max: s.maxHr ?? 0 })}</p>}
      {prs.length > 0 && (
        <ul className="card mt-4 divide-y divide-line text-left">
          {prs.map((p) => (
            <li key={p.exerciseId} className="flex justify-between px-4 py-3">
              <span>🏆 {exercise(p.exerciseId).name}</span>
              <span className="num text-muted">
                {fmtNum(fromKg(p.weight, profile.unit))} {profile.unit} × {p.reps}
              </span>
            </li>
          ))}
        </ul>
      )}
      <PrReplayButton prs={prs} />
      <NextUpCard sessionId={s.sessionId} />
      <CoolDownCard />
      {!lean(profile) && <DoneMoments />}

      {badges.length > 0 && (
        <section className="mt-4 text-left" aria-label={t("done.badges")}>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-faint">{t("done.badges")}</h2>
          <ul className="card divide-y divide-line">
            {badges.map(({ a, tier }, i) => (
              <li
                key={a.id}
                className="animate-rise flex items-center gap-3 px-4 py-3"
                style={{ animationDelay: `${600 + i * 150}ms`, animationFillMode: "both" }}
              >
                <Badge a={a} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{a.name}</div>
                  <div className="truncate text-sm text-muted">{a.detail}</div>
                </div>
                <span className="text-sm font-semibold" style={{ color: TIER_COLOUR[tier] }}>
                  {TIER_LABEL[tier]}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {questsDone.length > 0 && (
        <ul className="card mt-4 divide-y divide-line text-left" aria-label={t("done.quests")}>
          {questsDone.map((q) => (
            <li key={q.id} className="flex justify-between px-4 py-3">
              <span>✅ {q.title}</span>
              <span className="num text-accent">+{q.xp} XP</span>
            </li>
          ))}
        </ul>
      )}

      <PainAfter sessionId={s.sessionId} />

      {crate && <Crate item={crate.item} duplicate={crate.duplicate} />}

      <div className="mt-4 space-y-3 text-left">
        <StreakCard g={after} />
        <LeagueCard g={after} />
      </div>

      <Button kind="ghost" className="mt-6 w-full" onClick={() => void share()}>
        {t("done.share")}
      </Button>
      {shared && (
        <p className="mt-2 text-sm text-muted" role="status">
          {shared}
        </p>
      )}
      <SaveDoneAsRoutine items={doneItems(events, s.sessionId)} />
      <ShareWorkout sessionId={s.sessionId} />
      <Button className="mt-3 w-full py-4 text-lg" onClick={() => go("today")}>
        {t("done.done")}
      </Button>
      <button type="button" onClick={() => go("achievements")} className="press mt-3 text-sm text-muted underline">
        {t("done.allAchievements")}
      </button>
    </div>
  );
}

/** After a workout, one optional pain rating per active injury, tied to this session. */
function PainAfter({ sessionId }: { sessionId: string }) {
  const { events, ratePain } = useApp();
  const hurt = activeInjuries(events);
  if (!hurt.length) return null;
  return (
    <section className="card mt-4 space-y-2 p-4 text-left" aria-label={t("done.pain")}>
      {hurt.map((i) => (
        <PainSelect
          key={i.id}
          label={t("done.painAsk", { part: inSentence(PART_LABEL[i.part], true) })}
          onRate={(n) => ratePain(i.id, n, { sessionId })}
        />
      ))}
      <p className="text-xs text-muted">{t("done.painNote")}</p>
    </section>
  );
}
