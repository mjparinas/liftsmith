"use client";

// Training now (Melvin, 2026-11-12, Friends gap list 2: item 4; docs/decisions/friends.md): mutual friends who are
// in a workout right now and share it, at the top of the Feed, each with the exercise they're on and five cheers.
// A cheer is one tap and floats up their workout screen (workout/CheerRain.tsx). Nothing shows when nobody is training.
import { useEffect, useState } from "react";

import { track } from "@/lib/analytics";
import { readAccount } from "@/lib/auth";
import { EXERCISE_BY_ID } from "@/lib/exercises";
import { t } from "@/lib/i18n";
import { haptic, oops } from "@/lib/juice";
import { social, socialError } from "@/lib/social";
import { cached, fetchPart, fresh } from "@/lib/socialCache";
import { CHEERS, type Cheer, type TrainingNow as Live } from "@/lib/socialTypes";
import { useNow } from "@/lib/useNow";

import { Avatar } from "./AvatarFace";
import { go } from "./router";
import { Section } from "./ui";

export function TrainingNow() {
  const tick = useNow(60_000);
  // Usually comes with the tab's one "home" request (socialCache.ts), then again each minute.
  const account = readAccount()?.id ?? "";
  const [rows, setRows] = useState<Live[]>(() => cached<Live[]>(account, "training") ?? []);
  const [note, setNote] = useState<string | null>(null);
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
  const send = async (p: Live, emoji: Cheer) => {
    haptic("tick");
    try {
      await social("cheer", { handle: p.handle, emoji });
      track("feature", { name: "social_cheer", value: emoji });
      setNote(t("social.live.sent", { name: p.name }));
    } catch (e) {
      oops();
      setNote(socialError(e));
    }
  };
  if (!rows.length) return null;
  return (
    <Section title={t("social.live.title")} icon="flame">
      <ul className="card divide-y divide-line">
        {rows.map((p) => {
          const ex = EXERCISE_BY_ID.get(p.exercise)?.name;
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
                <span className="min-w-0">
                  <span className="block truncate font-medium">{p.name}</span>
                  <span className="block truncate text-xs text-muted">
                    {t("social.live.progress", { exercise: ex ?? t("social.live.title"), count: p.done, total: p.total })}
                  </span>
                </span>
              </button>
              {p.cheers !== false && (
                <div
                  className="mt-2 flex flex-wrap gap-2"
                  role="group"
                  aria-label={t("social.live.cheer", { emoji: "", name: p.name }).trim()}
                >
                  {CHEERS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-label={t("social.live.cheer", { emoji: c, name: p.name })}
                      onClick={() => void send(p, c)}
                      className="press grid h-11 w-11 place-items-center rounded-full border border-line bg-raised text-xl"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {note && (
        <p role="status" className="mt-2 text-sm text-muted">
          {note}
        </p>
      )}
    </Section>
  );
}
