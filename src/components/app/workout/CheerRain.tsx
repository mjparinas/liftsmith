"use client";

// Friends' cheers on the workout screen (Melvin, 2026-11-12: "it should also show the celebration emoji animation on
// their workout screen", Friends gap list 2 item 4; docs/decisions/friends.md). Each cheer floats up the right
// edge with the friend's name and fades, like reactions in a video call. It never takes a tap (pointer-events
// none) and never covers Log set. Lean mode and reduced motion show it as a still line at the top instead. A
// screen reader hears "Alex cheered you on 🔥" once.
//
// Cheers are read when the screen opens, after each logged set, when a cheer's push arrives while the app is open
// (phones), and every 30 seconds while the screen is on and the lifter shares their training. Nothing while away.
import { useEffect, useRef, useState } from "react";

import { t } from "@/lib/i18n";
import { calm } from "@/lib/juice";
import { useSocial } from "@/lib/social";
import { loadCheers, onCheerPush } from "@/lib/socialLive";
import type { CheerIn } from "@/lib/socialTypes";
import { useApp } from "@/lib/store";
import { useNow } from "@/lib/useNow";

const SEEN = (sessionId: string) => `ls.cheersSeen.${sessionId}`;
/** At most this many float at once; more just wait their turn. */
const MAX_ON_SCREEN = 6;
const FLOAT_MS = 2600;
const STAGGER_MS = 350;

interface Shown extends CheerIn {
  dx: number;
  right: number;
}

/** A steady number from a cheer's id, so each one drifts its own way. */
function spread(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

function readSeen(sessionId: string, fallback: number): number {
  try {
    return Number(sessionStorage.getItem(SEEN(sessionId))) || fallback;
  } catch {
    return fallback;
  }
}

/** Floats the waiting cheers, a few at a time, each a moment after the last. */
function drain(queue: CheerIn[], timers: ReturnType<typeof setTimeout>[], setShown: (f: (list: Shown[]) => Shown[]) => void) {
  const take = queue.splice(0, MAX_ON_SCREEN);
  take.forEach((c, i) => {
    const start = setTimeout(() => {
      const h = spread(c.id);
      const s: Shown = { ...c, dx: (h % 61) - 30, right: 12 + (Math.floor(h / 61) % 41) };
      setShown((list) => [...list, s]);
      timers.push(setTimeout(() => setShown((list) => list.filter((x) => x.id !== c.id)), calm() ? 3000 : FLOAT_MS));
    }, i * STAGGER_MS);
    timers.push(start);
  });
  if (queue.length) timers.push(setTimeout(() => drain(queue, timers, setShown), take.length * STAGGER_MS + FLOAT_MS));
}

export function CheerRain({ sessionId, startedAt }: { sessionId: string; startedAt: number }) {
  const sharing = useSocial((s) => !!s.me?.profile?.live && s.me.profile.cheers !== false);
  const setsDone = useApp((s) => s.events.length);
  const tick = useNow(30_000);
  const [shown, setShown] = useState<Shown[]>([]);
  const [said, setSaid] = useState("");
  const since = useRef(0);
  const queue = useRef<CheerIn[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [pushes, setPushes] = useState(0);

  useEffect(() => onCheerPush(() => setPushes((n) => n + 1)), []);

  useEffect(() => {
    if (!sharing) return;
    let live = true;
    if (!since.current) since.current = readSeen(sessionId, startedAt);
    void loadCheers(sessionId, since.current).then((list) => {
      if (!live || !list.length) return;
      since.current = Math.max(since.current, ...list.map((c) => c.at));
      try {
        sessionStorage.setItem(SEEN(sessionId), String(since.current));
      } catch {}
      queue.current.push(...list);
      setSaid(list.map((c) => t("social.cheer.said", { name: c.name, emoji: c.emoji })).join(" "));
      drain(queue.current, timers.current, setShown);
    });
    return () => {
      live = false;
    };
  }, [sharing, sessionId, startedAt, setsDone, tick, pushes]);

  useEffect(() => {
    const all = timers.current;
    return () => all.forEach(clearTimeout);
  }, []);

  const still = calm();
  return (
    <>
      <span className="sr-only" role="status" aria-live="polite">
        {said}
      </span>
      {!!shown.length &&
        (still ? (
          <div
            aria-hidden
            className="pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center px-5 pt-[max(env(safe-area-inset-top),12px)]"
          >
            <p className="card px-4 py-2 text-sm font-medium">
              {t("social.cheer.said", { name: shown.at(-1)!.name, emoji: shown.at(-1)!.emoji })}
            </p>
          </div>
        ) : (
          <div aria-hidden className="pointer-events-none fixed inset-0 z-40 overflow-hidden" data-testid="cheer-rain">
            {shown.map((c) => (
              <span
                key={c.id}
                className="cheer-float absolute flex flex-col items-center"
                style={{ right: c.right, bottom: "34vh", ["--dx" as string]: `${c.dx}px` }}
              >
                <span className="text-5xl leading-none drop-shadow-lg">{c.emoji}</span>
                <span className="mt-1 max-w-[7rem] truncate rounded-full bg-surface/90 px-2 py-0.5 text-xs font-medium shadow">
                  {c.name}
                </span>
              </span>
            ))}
          </div>
        ))}
    </>
  );
}
