"use client";

// Training now (Melvin, 2026-11-12, Friends gap list 2: item 4; docs/decisions/friends.md): mutual friends who are
// in a workout right now and share it, at the top of the Feed, each with the exercise they're on and five cheers.
// A cheer is one tap and floats up their workout screen (workout/CheerRain.tsx). Nothing shows when nobody is training.
// Each row says how long they've been at it. A sent cheer pops and bursts from its button with a success buzz, the row
// says it was sent, and the buttons wait out the 5-second gap with a countdown (Melvin, 2026-11-13: "there's no
// feedback for me when I click on an emoji").
import { useEffect, useState, type MouseEvent } from "react";

import { track } from "@/lib/analytics";
import { readAccount } from "@/lib/auth";
import { EXERCISE_BY_ID } from "@/lib/exercises";
import { t } from "@/lib/i18n";
import { haptic, oops } from "@/lib/juice";
import { social, socialError } from "@/lib/social";
import { cached, fetchPart, fresh } from "@/lib/socialCache";
import { CHEER_GAP, CHEERS, type Cheer, type TrainingNow as Live } from "@/lib/socialTypes";
import { useNow } from "@/lib/useNow";

import { Avatar } from "./AvatarFace";
import { burst } from "./burst";
import { Icon } from "./icons";
import { go } from "./router";
import { Section } from "./ui";

export function TrainingNow() {
  const tick = useNow(60_000);
  // Usually comes with the tab's one "home" request (socialCache.ts), then again each minute.
  const account = readAccount()?.id ?? "";
  const [rows, setRows] = useState<Live[]>(() => cached<Live[]>(account, "training") ?? []);
  /** The last cheer sent to each friend this visit, or why it didn't go: shown in their row. */
  const [sent, setSent] = useState<Record<string, { emoji: Cheer; at: number; error?: string }>>({});
  const [busy, setBusy] = useState<string | null>(null);
  // A one-second tick only while a countdown is showing, so nothing runs once every gap has passed.
  const [clock, setClock] = useState(() => Date.now());
  const waiting = Object.values(sent).some((x) => !x.error && x.at + CHEER_GAP > clock);
  useEffect(() => {
    if (!waiting) return;
    const id = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(id);
  }, [waiting]);
  useEffect(() => {
    if (fresh(account, "training")) return;
    let live = true;
    fetchPart(account, "training", () => social<{ people: Live[] }>("training").then((r) => r.people))
      .then((people) => live && setRows(people))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [account, tick]);
  const send = async (p: Live, emoji: Cheer, e: MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    if (busy) return;
    haptic("tick");
    setBusy(p.handle);
    try {
      await social("cheer", { handle: p.handle, emoji });
      track("feature", { name: "social_cheer", value: emoji });
      haptic("success");
      burst(button, { count: 10, reach: 48 });
      const at = Date.now();
      setClock(at);
      setSent((x) => ({ ...x, [p.handle]: { emoji, at } }));
    } catch (err) {
      oops();
      setSent((x) => ({ ...x, [p.handle]: { emoji, at: 0, error: socialError(err) } }));
    } finally {
      setBusy(null);
    }
  };
  if (!rows.length) return null;
  // The Section's own margin is above it only, so this keeps the feed's first card from butting up against it.
  return (
    <div className="mb-7">
      <Section title={t("social.live.title")} icon="flame">
        <ul className="card divide-y divide-line">
          {rows.map((p) => {
            const ex = EXERCISE_BY_ID.get(p.exercise)?.name;
            const mins = Math.max(0, Math.floor((Math.max(tick, clock) - p.startedAt) / 60_000));
            const last = sent[p.handle];
            const left = last && !last.error ? Math.ceil((last.at + CHEER_GAP - clock) / 1000) : 0;
            return (
              <li key={p.handle} className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => go("person", p.handle)}
                  className="press flex w-full min-w-0 items-center gap-3 text-left"
                >
                  <span className="relative shrink-0">
                    <Avatar name={p.name} avatar={p.avatar} size={36} />
                    <span aria-hidden className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-surface bg-mint" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{p.name}</span>
                    <span className="block truncate text-xs text-muted">
                      {t("social.live.progress", { exercise: ex ?? t("social.live.title"), count: p.done, total: p.total })}
                    </span>
                  </span>
                  {p.startedAt > 0 && (
                    <span className="flex shrink-0 items-center gap-1 text-xs tabular-nums text-muted">
                      <Icon name="clock" size={14} />
                      <span aria-hidden>{elapsed(mins)}</span>
                      <span className="sr-only">{t("social.live.for", { time: elapsed(mins) })}</span>
                    </span>
                  )}
                </button>
                {p.cheers !== false && (
                  <div
                    className="mt-2 flex flex-wrap gap-2"
                    role="group"
                    aria-label={t("social.live.cheer", { emoji: "", name: p.name }).trim()}
                  >
                    {CHEERS.map((c) => {
                      const just = last && !last.error && last.emoji === c && left > 0;
                      return (
                        <button
                          key={`${c}${just ? last.at : ""}`}
                          type="button"
                          aria-label={t("social.live.cheer", { emoji: c, name: p.name })}
                          disabled={left > 0 || busy === p.handle}
                          onClick={(e) => void send(p, c, e)}
                          className={`press grid h-11 w-11 place-items-center rounded-full border text-xl transition-opacity disabled:cursor-default ${
                            just ? "animate-pop border-accent bg-accent/15" : "border-line bg-raised"
                          } ${left > 0 && !just ? "opacity-40" : ""}`}
                        >
                          {c}
                        </button>
                      );
                    })}
                  </div>
                )}
                {last && (
                  <p role="status" className={`mt-2 text-sm ${last.error ? "text-bad" : "text-muted"}`}>
                    {last.error ??
                      (left > 0
                        ? t("social.live.sentWait", { emoji: last.emoji, name: p.name, n: left })
                        : t("social.live.sent", { emoji: last.emoji, name: p.name }))}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </Section>
    </div>
  );
}

/** How long a friend has been training: "26 min", or "1 h 5 min" from an hour. */
function elapsed(mins: number): string {
  return mins < 60 ? t("social.live.min", { n: mins }) : t("social.live.hourMin", { h: Math.floor(mins / 60), n: mins % 60 });
}
