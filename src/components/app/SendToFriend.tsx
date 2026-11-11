"use client";

// "Send to a friend" (Friends stage 2, docs/decisions/friends.md): a workout or routine goes to someone the lifter
// follows who follows them back, as a routine code, so it carries exercises and set counts only. It shows in their
// Activity, and opening it shows the routine with Save (#/routine/<code>). Shown only once the lifter has joined.
import { useEffect, useState } from "react";

import { track } from "@/lib/analytics";
import { t } from "@/lib/i18n";
import { haptic, oops, sound } from "@/lib/juice";
import { encodeRoutine } from "@/lib/routineShare";
import { social, socialError, socialOn, useSocial } from "@/lib/social";
import type { RoutineItem } from "@/lib/types";

import { Icon } from "./icons";
import { Button, EmptyState, Sheet, Skeleton } from "./ui";

type Friend = { handle: string; name: string };

export function SendToFriend({ name, items, className = "" }: { name: string; items: readonly RoutineItem[]; className?: string }) {
  const me = useSocial((s) => s.me);
  const [open, setOpen] = useState(false);
  if (!socialOn() || !me?.profile || me.suspended || !items.length) return null;
  return (
    <>
      <Button kind="quiet" icon="people" className={`w-full ${className}`} onClick={() => setOpen(true)}>
        {t("friends.send")}
      </Button>
      {open && <SendSheet name={name} items={items} onClose={() => setOpen(false)} />}
    </>
  );
}

function SendSheet({ name, items, onClose }: { name: string; items: readonly RoutineItem[]; onClose: () => void }) {
  const [friends, setFriends] = useState<Friend[] | null>(null);
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [note, setNote] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    social<{ people: Friend[] }>("people", { list: "friends" })
      .then((r) => live && setFriends(r.people))
      .catch((e: unknown) => live && (setFriends([]), setNote(socialError(e))));
    return () => {
      live = false;
    };
  }, []);
  const send = async (f: Friend) => {
    haptic("tap");
    try {
      await social("send", { handle: f.handle, code: encodeRoutine({ name, items: [...items] }) });
      sound.toggle(true);
      setSent((s) => new Set(s).add(f.handle));
      setNote(t("friends.send.sent", { name: f.name }));
      track("feature", { name: "social_send" });
    } catch (e) {
      oops();
      setNote(socialError(e));
    }
  };
  return (
    <Sheet open onClose={onClose} title={t("friends.send")}>
      <p className="text-sm text-muted">{t("friends.send.body")}</p>
      <div className="mt-3">
        {friends === null ? (
          <Skeleton className="h-24" />
        ) : friends.length ? (
          <ul className="card divide-y divide-line">
            {friends.map((f) => {
              const done = sent.has(f.handle);
              return (
                <li key={f.handle}>
                  <button
                    type="button"
                    disabled={done}
                    aria-label={t("friends.send.to", { name: f.name })}
                    onClick={() => void send(f)}
                    className="press flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left disabled:opacity-70"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{f.name}</span>
                      <span className="block truncate text-xs text-muted">@{f.handle}</span>
                    </span>
                    <Icon name={done ? "check" : "send"} size={20} className={done ? "text-good" : "text-accent"} />
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          !note && <EmptyState icon="people" title={t("friends.send.none")} body={t("friends.send.noneBody")} />
        )}
      </div>
      {note && (
        <p role="status" className="mt-3 text-sm text-muted">
          {note}
        </p>
      )}
    </Sheet>
  );
}
