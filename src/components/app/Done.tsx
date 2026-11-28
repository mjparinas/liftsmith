"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";

import { Info } from "@/components/Info";
import { SECTION_LABEL } from "@/components/titles";
import { TIER_LABEL, unlocked } from "@/lib/achievements";
import { track } from "@/lib/analytics";
import { derive } from "@/lib/derive";
import { exercise } from "@/lib/exercises";
import { COSMETICS, crates, game, RARITY_LABEL, titleOf, type Cosmetic } from "@/lib/game";
import { date, inSentence, num, t } from "@/lib/i18n";
import { activeInjuries, PART_LABEL } from "@/lib/injury";
import { applyAccent, calm, confetti, haptic, juice, sound, type TimerSound } from "@/lib/juice";
import { mastered, starsGained } from "@/lib/mastery";
import { maybeAskRating } from "@/lib/rateApp";
import { doneItems } from "@/lib/routines";
import { currentSeason, rewardLabel, seasonGain, seasonsOn, seasonState, TIERS, type SeasonGain, type SeasonState } from "@/lib/seasons";
import { badgeShare, levelShare, previousBest, prShare, workoutShare } from "@/lib/shareCards";
import { socialOn, useSocial } from "@/lib/social";
import { useApp } from "@/lib/store";
import { LIFT_TITLES, type TitleId } from "@/lib/titles";
import { titleLine } from "@/lib/titleText";
import { fmtNum, fmtVolume, fromKg } from "@/lib/units";
import { isUnlocked, justUnlocked, unlockCount, type UnlockId } from "@/lib/unlocks";
import { useNow } from "@/lib/useNow";
import { doneCue, say, voice } from "@/lib/voice";
import type { MessageKey } from "@/locales/en";

import { Badge, RARITY_COLOUR, StreakCard, TIER_COLOUR, useGame } from "./Achievements";
import { burst } from "./burst";
import { WorkoutNoteCard } from "./EditWorkout";
import { DoneMoments, lean } from "./Extras";
import { clock } from "./format";
import { PostToFriends } from "./Friends";
import { Icon, type IconName } from "./icons";
import { PainSelect } from "./Injuries";
import { DoneInvite } from "./Invites";
import { Mascot } from "./Mascot";
import { MasteryDone } from "./Mastery";
import { NextUpCard } from "./NextUp";
import { PrReplayButton } from "./PrReplay";
import { ShareWorkout } from "./Remix";
import { go } from "./router";
import { SaveDoneAsRoutine } from "./Routines";
import { SeasonMedal } from "./Season";
import { SendToFriend } from "./SendToFriend";
import { ShareSheet } from "./ShareSheet";
import { CoolDownCard } from "./Stretch";
import { HUE } from "./theme";
import { TrialDone } from "./TrialMoments";
import { Button } from "./ui";

function useCountUp(to: number, ms = 900) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const dur = calm() ? 1 : ms; // Lean mode or the phone's reduce motion: show the total at once.
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
/** Locker kinds lift mastery brought (2026-11-27), shown on Done when a workout unlocks one. */
const NEW_KINDS: readonly Cosmetic["kind"][] = ["figure", "frame", "title"];

/** What the crate's opened card says the item is. */
const KIND_LINE: Record<Cosmetic["kind"], MessageKey> = {
  accent: "done.crate.accent",
  sound: "done.crate.sound",
  plates: "done.crate.plate",
  avatar: "done.crate.plate",
  figure: "mst.crate.figure",
  frame: "mst.crate.frame",
  title: "mst.crate.title",
};

function Crate({
  item,
  duplicate,
  label,
  tap,
  value = item.id,
}: {
  item: Cosmetic;
  duplicate: boolean;
  label?: string;
  /** The closed card's second line (default: tap to open the crate). */
  tap?: string;
  /** What equipping saves: the item's id, or a title with its lift ("title-master:squat"). */
  value?: string;
}) {
  const { profile, setProfile } = useApp();
  const [open, setOpen] = useState(juice.lean);
  const rare = item.rarity === "epic" || item.rarity === "legendary";
  const equipped = profile.cosmetics?.[item.kind] === value;
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
          <span className="block font-semibold">{label ?? t("done.crate")}</span>
          <span className="text-sm text-muted">{tap ?? t("done.crateTap")}</span>
        </span>
      </button>
    );
  }
  return (
    <div className="card animate-pop mt-4 p-4 text-left" style={{ boxShadow: `inset 0 0 0 2px ${RARITY_COLOUR[item.rarity]}` }}>
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: RARITY_COLOUR[item.rarity] }}>
        {t(KIND_LINE[item.kind], { rarity: RARITY_LABEL[item.rarity] })}
      </p>
      <div className="mt-1 flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-lg font-semibold">
          {(item.kind === "accent" || item.kind === "figure") && (
            <span aria-hidden className="h-5 w-5 rounded-full" style={{ background: item.value }} />
          )}
          {value === item.id ? item.name : titleLine(value)}
        </span>
        {duplicate ? (
          <span className="text-sm text-muted">{t("done.crateDup")}</span>
        ) : (
          <Button
            kind={equipped ? "quiet" : "ghost"}
            className="py-2"
            disabled={equipped}
            onClick={() => {
              setProfile({ cosmetics: { ...profile.cosmetics, [item.kind]: value } });
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

/** The season after this workout: its points, a new tier with what it brought, and the rare drop if a best found it. */
export function SeasonDone({ s, gain }: { s: SeasonState; gain: SeasonGain }) {
  const up = gain.to > gain.from;
  const drop = gain.drop ? COSMETICS.find((c) => c.id === s.kit.drop) : undefined;
  const next = s.tier < TIERS ? t("ssn.toTier", { points: num(s.span - s.into), tier: s.tier + 1 }) : null;
  return (
    <section
      className={`card card-tint mt-4 p-4 text-left ${up ? "animate-bump" : "animate-rise"}`}
      style={{ "--tint": s.kit.hue } as CSSProperties}
      aria-label={s.title}
      data-testid="done-season"
    >
      <div className="flex items-center gap-3">
        <SeasonMedal size={44} hue={s.kit.hue} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: s.kit.hue }}>
            {s.title}
          </p>
          <p className="text-lg font-bold" role={up ? "status" : undefined}>
            {up ? t("ssn.done.tier", { tier: gain.to }) : t("ssn.tierN", { tier: s.tier })}
          </p>
          <p className="num text-sm text-muted">
            {t("ssn.done.points", { points: num(gain.points) })}
            {next && ` · ${next}`}
          </p>
        </div>
      </div>
      {(gain.rewards.length > 0 || drop) && (
        <ul className="mt-3 space-y-1 text-sm">
          {gain.rewards.map((r) => (
            <li key={`${r.tier}-${r.id}`} className="flex items-center gap-2">
              <Icon name="check" size={16} strokeWidth={2.6} className="shrink-0 text-good" />
              <span>{rewardLabel(r, s.kit)}</span>
            </li>
          ))}
          {drop && (
            <li className="flex items-center gap-2">
              <span className="shrink-0" style={{ color: s.kit.hue }}>
                <Icon name="sparkle" size={16} />
              </span>
              <span>{t("ssn.done.drop", { name: t(`cos.${drop.id}` as MessageKey) })}</span>
            </li>
          )}
        </ul>
      )}
      <Button kind="ghost" className="mt-3 w-full" onClick={() => go("season")}>
        {t("ssn.done.open")}
      </Button>
    </section>
  );
}

export function Done() {
  const { stats, profile, events } = useApp();
  const now = useNow();
  const after = useGame();
  const s = stats.sessions[0];
  const prs = s ? stats.prs.filter((p) => p.at >= s.start) : [];
  // The same numbers without this workout, to show what it changed.
  const without = useMemo(() => {
    if (!s) return null;
    const ev = events.filter((e) => !("sessionId" in e) || e.sessionId !== s.sessionId);
    return { ev, stats: derive(ev, now) };
  }, [s?.sessionId]); // eslint-disable-line react-hooks/exhaustive-deps
  const before = useMemo(() => (without ? game(without.ev, without.stats, profile, now) : after), [without]); // eslint-disable-line react-hooks/exhaustive-deps
  const gained = Math.max(0, after.xp - before.xp);
  const levelUp = after.level.level > before.level.level;
  const badges = unlocked(before.achievements, after.achievements);
  const questsDone = after.quests.filter((q) => q.done && !before.quests.find((b) => b.id === q.id)?.done);
  // This workout's crate, then any level rewards it reached; each is a repeat if it was already owned or came earlier.
  const prizes = useMemo(() => {
    const crate = s ? crates(stats).find((c) => c.sessionId === s.sessionId) : undefined;
    const fresh = after.rewards.filter((r) => !before.rewards.some((b) => b.key === r.key));
    const seen = new Set(before.owned);
    const list: { key: string; item: Cosmetic; label?: string }[] = [
      ...(crate ? [{ key: "crate", item: crate.item }] : []),
      ...fresh.map((r) => ({
        key: r.key,
        item: r.item,
        label: r.source === "item" ? t("done.reward.item", { level: r.level }) : t("done.reward.crate", { title: titleOf(r.level) }),
      })),
    ];
    return list.map((p) => {
      const duplicate = seen.has(p.item.id);
      seen.add(p.item.id);
      return { ...p, duplicate };
    });
  }, [s?.sessionId, after, before]); // eslint-disable-line react-hooks/exhaustive-deps
  // Lift mastery (mastery.ts): stars this workout added, and figure colours, frames and titles it unlocked.
  const starsUp = useMemo(() => starsGained(before.mastery, after.mastery), [before, after]);
  const unlockedItems = useMemo(
    () =>
      COSMETICS.filter((c) => NEW_KINDS.includes(c.kind) && after.owned.has(c.id) && !before.owned.has(c.id)).map((c) => {
        const stars = LIFT_TITLES[c.id as TitleId];
        const lift = stars === undefined ? undefined : mastered(after.mastery).find((m) => m.stars >= stars)?.exerciseId;
        return { item: c, value: lift ? `${c.id}:${lift}` : c.id };
      }),
    [before, after],
  );
  const xp = useCountUp(gained);
  // Counts up in kg and reads like the volume everywhere else (fmtVolume: "2.9k kg").
  const vol = useCountUp(s ? Math.round(s.volume) : 0);
  const [sharing, setSharing] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const inFriends = useSocial((st) => !!st.me?.profile) && socialOn();
  // What this workout unlocked (unlocks.ts), worked out once from the profile as it was before the workout, then
  // the highest count is kept so nothing hides again if a workout is deleted.
  const setProfile = useApp((st) => st.setProfile);
  const opened = useMemo(() => (s ? justUnlocked(profile, stats.sessions.length) : []), [s?.sessionId]); // eslint-disable-line react-hooks/exhaustive-deps
  const count = stats.sessions.length;
  const quests = isUnlocked("quests", profile, count);
  const seasons = isUnlocked("seasons", profile, count);
  // What this workout did for the running season: points, a new tier, its rewards and the rare drop.
  const season = useMemo(() => {
    if (!without || !seasons || !seasonsOn(profile)) return null;
    const nowS = currentSeason(events, stats, profile, now);
    if (!nowS || nowS.status !== "live") return null;
    const gain = seasonGain(seasonState(nowS.def, without.ev, without.stats, profile, now), nowS);
    return gain ? { s: nowS, gain } : null;
  }, [without, seasons]); // eslint-disable-line react-hooks/exhaustive-deps
  const friends = isUnlocked("friends", profile, count);
  useEffect(() => {
    const r = profile.reveal;
    if (r && !r.all && unlockCount(r, count) > (r.peak ?? 0)) setProfile({ reveal: { ...r, peak: unlockCount(r, count) } });
  }, [count]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void confetti(prs.length > 0 || levelUp);
    haptic(prs.length || levelUp || badges.length ? "celebrate" : "success");
    if (levelUp) sound.levelUp();
    else sound.fanfare();
    if (badges.length) setTimeout(() => sound.badge(), 1100);
    else if (questsDone.length) setTimeout(() => sound.done(), 1100);
    if (voice.enabled && s) say(doneCue(s.sets, s.volume, profile.unit));
    // A store rating prompt at a happy moment, once the celebration has played (src/lib/rateApp.ts).
    const first = stats.sessions[stats.sessions.length - 1];
    const ask = first
      ? setTimeout(() => {
          void maybeAskRating({
            workouts: stats.sessions.length,
            firstAt: first.start,
            prs: prs.length,
            levelUp,
            badges: badges.length,
            now: Date.now(),
          });
        }, 3500)
      : undefined;
    return () => clearTimeout(ask);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!s)
    return (
      <div className="pt-10 text-center">
        <Button onClick={() => go("today")}>{t("done.back")}</Button>
      </div>
    );

  const ctx = { unit: profile.unit, game: after, accent: COSMETICS.find((c) => c.id === profile.cosmetics?.accent)?.value };
  const shareItems = [
    workoutShare(s, prs, badges, ctx),
    ...prs.map((p) => prShare(p, previousBest(stats.prs, p), ctx)),
    ...(levelUp ? [levelShare(after, stats.sessions.length, ctx)] : []),
    ...badges.map((b) => badgeShare(b.a, b.tier, ctx)),
  ];

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
      <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight">
        {prs.length ? t("done.prs", { count: prs.length }) : t("done.title")}
      </h1>
      <p className="num mt-2 text-4xl font-bold text-accent" aria-label={t("done.xp", { xp: gained })}>
        +{num(xp)} XP
      </p>
      {/* A level-up says the level in its own card below, so it isn't said twice. */}
      {!levelUp && <p className="mt-1 text-sm text-muted">{t("done.level", { level: after.level.level, title: after.level.title })}</p>}

      {levelUp && (
        <div className="card animate-bump mt-4 border-accent p-4" role="status" style={{ boxShadow: "0 0 0 2px var(--color-accent)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">{t("done.levelUp")}</p>
          <p className="mt-1 text-2xl font-bold">{t("done.level", { level: after.level.level, title: after.level.title })}</p>
          {after.level.title !== before.level.title && <p className="text-sm text-muted">{t("done.newTitle")}</p>}
        </div>
      )}

      <div className="mt-6 grid grid-cols-3 gap-3">
        {[
          [t("done.time"), clock(s.seconds), ""],
          [t("done.sets"), fmtNum(s.sets), ""],
          [t("done.volume"), fmtVolume(vol, profile.unit), "volume"],
        ].map(([k, v, term]) => (
          <div key={k} className="card animate-rise p-3">
            <div className="flex items-center justify-center text-xs uppercase tracking-wider text-faint">
              {k}
              {term === "volume" && <Info term="volume" className="-mx-2.5" />}
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
              <span className="inline-flex min-w-0 items-center gap-2">
                <Icon name="trophy" size={16} className="shrink-0 text-gold" />
                <span className="truncate">{exercise(p.exerciseId).name}</span>
              </span>
              <span className="num text-muted">
                {fmtNum(fromKg(p.weight, profile.unit))} {profile.unit} × {p.reps}
              </span>
            </li>
          ))}
        </ul>
      )}
      <PrReplayButton prs={prs} />
      <NewForYou ids={opened} />
      <TrialDone sessionId={s.sessionId} />
      <NextUpCard sessionId={s.sessionId} />
      <CoolDownCard />
      {!lean(profile) && <DoneMoments />}

      {badges.length > 0 && (
        <section className="mt-4 text-left" aria-label={t("done.badges")}>
          <h2 className={`mb-2 ${SECTION_LABEL}`}>{t("done.badges")}</h2>
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

      {quests && questsDone.length > 0 && (
        <ul className="card mt-4 divide-y divide-line text-left" aria-label={t("done.quests")}>
          {questsDone.map((q) => (
            <li key={q.id} className="flex justify-between px-4 py-3">
              <span className="inline-flex min-w-0 items-center gap-2">
                <Icon name="check" size={16} strokeWidth={2.6} className="shrink-0 text-good" />
                <span className="truncate">{q.title}</span>
              </span>
              <span className="num text-accent">+{q.xp} XP</span>
            </li>
          ))}
        </ul>
      )}

      <PainAfter sessionId={s.sessionId} />
      <WorkoutNoteCard sessionId={s.sessionId} />

      {season && <SeasonDone s={season.s} gain={season.gain} />}
      {seasons && prizes.map((p) => <Crate key={p.key} item={p.item} duplicate={p.duplicate} label={p.label} />)}
      <MasteryDone gained={starsUp} />
      {seasons &&
        unlockedItems.map((p) => (
          <Crate key={`new:${p.item.id}`} item={p.item} value={p.value} duplicate={false} label={t("mst.prize")} tap={t("mst.prizeTap")} />
        ))}

      {/* The streak only once there is one; the weekly league lives on Today and Awards. */}
      {after.streak.weeks > 0 && (
        <div className="mt-4 text-left">
          <StreakCard g={after} />
        </div>
      )}

      {friends && <PostToFriends summary={s} />}
      {/* One button for every way to share or keep this workout, so the end screen stays short. */}
      <button
        type="button"
        aria-expanded={shareOpen}
        onClick={() => setShareOpen((o) => !o)}
        className="press mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-line bg-raised px-4 py-3 font-semibold text-ink hover:border-accent/40"
      >
        <Icon name="share" size={18} />
        {t("done.shareSave")}
        <Icon name={shareOpen ? "chevronUp" : "chevronDown"} size={16} />
      </button>
      {shareOpen && (
        <div className="card animate-rise mt-2 space-y-2 p-3 text-left" data-testid="done-share">
          <Button kind="ghost" icon="image" className="w-full" onClick={() => setSharing(true)}>
            {t("done.share")}
          </Button>
          <SendToFriend
            name={t("friends.send.doneName", { date: date(s.start, { month: "short", day: "numeric" }) })}
            items={doneItems(events, s.sessionId)}
          />
          <SaveDoneAsRoutine items={doneItems(events, s.sessionId)} />
          <ShareWorkout sessionId={s.sessionId} />
          {inFriends && friends && <DoneInvite />}
        </div>
      )}
      <ShareSheet open={sharing} onClose={() => setSharing(false)} items={shareItems} />
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
          start={i.pain.at(-1)?.score ?? 0}
          onRate={(n) => ratePain(i.id, n, { sessionId })}
        />
      ))}
      <p className="text-xs text-muted">{t("done.painNote")}</p>
    </section>
  );
}

const UNLOCK_ICON: Record<UnlockId, IconName> = {
  awards: "trophy",
  quests: "target",
  friends: "people",
  seasons: "medal",
  more: "sparkle",
};

/** Where each unlock's button goes: the place the new thing lives. */
const UNLOCK_GO: Record<UnlockId, () => void> = {
  awards: () => go("achievements"),
  quests: () => go("achievements"),
  friends: () => go("friends"),
  seasons: () => go("season"),
  more: () => go("achievements"),
};

/** "New for you": what this workout unlocked, each with one line on why it helps and a button to it (unlocks.ts). */
function NewForYou({ ids }: { ids: readonly UnlockId[] }) {
  if (!ids.length) return null;
  return (
    <section className="mt-4 text-left" aria-label={t("unl.new")}>
      <h2 className={`mb-2 ${SECTION_LABEL}`}>{t("unl.new")}</h2>
      <ul className="space-y-3">
        {ids.map((id, i) => (
          <li
            key={id}
            className="card card-tint animate-rise flex items-start gap-3 p-4"
            style={{ "--tint": HUE.violet, animationDelay: `${400 + i * 150}ms`, animationFillMode: "both" } as CSSProperties}
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet/15 text-violet" aria-hidden>
              <Icon name={UNLOCK_ICON[id]} size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{t(`unl.${id}.title`)}</p>
              <p className="mt-0.5 text-sm text-muted">{t(`unl.${id}.body`)}</p>
              <Button kind="ghost" className="mt-2" onClick={UNLOCK_GO[id]}>
                {t(`unl.${id}.go`)}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
