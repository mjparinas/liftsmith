"use client";

// The chat dock (Melvin, 2026-11-13: "Facebook Messenger / google meets style chats on the bottom right of the screen
// that is collapsible. This is for desktop"; built 2026-11-15, docs/decisions/trainer-mode.md "Chat dock, statuses and
// stickers"). On the desktop layout only, for anyone with a coach or clients: a bar at the bottom right with everyone
// they can message, their status and unread counts, and up to two chat windows beside it, each folding down to its
// title bar. A message that comes in opens that person's window folded, with its count, plays the message sound once
// and puts the unread count in the tab's title. The lifter's own status is picked at the top of the list. Hidden on
// the workout and on Coaching's own Messages page and chat screen, which show the same threads.
import { useEffect, useRef, useState } from "react";

import { useAccount } from "@/lib/auth";
import { unreadTotal, useLive, useLivePoll, useUnreadTitle } from "@/lib/chatLive";
import { t } from "@/lib/i18n";
import { haptic, sound } from "@/lib/juice";
import { useDesktop } from "@/lib/layout";
import type { LivePerson } from "@/lib/trainer";
import { useNow } from "@/lib/useNow";

import { MyStatusButton, presenceText, StatusDot } from "./ChatStatus";
import { ChatThread } from "./CoachChat";
import { Icon } from "./icons";
import { TeamChat } from "./TeamChat";

/** Open windows at once; a third replaces the one opened longest ago. */
export const DOCK_WINDOWS = 2;
const KEY = "ls.chatDock";

/** A window: a person's id, or `tc:<team id>` for a team's chat (with the team's name as its title). */
type Win = { id: string; folded: boolean; title?: string };
type Saved = { open: boolean; wins: Win[] };

function readSaved(): Saved {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "null") as Partial<Saved> | null;
    const wins = Array.isArray(raw?.wins)
      ? raw.wins
          .filter(
            (w): w is Win =>
              !!w && typeof w.id === "string" && typeof w.folded === "boolean" && (w.title === undefined || typeof w.title === "string"),
          )
          .slice(-DOCK_WINDOWS)
      : [];
    return { open: raw?.open === true, wins };
  } catch {
    return { open: false, wins: [] };
  }
}

/** The event another screen sends to open someone's chat in the dock (`openInDock`). */
const OPEN_EVENT = "ls:openChat";

/**
 * Opens `id`'s chat in the dock, unfolded, with the list expanded (Melvin, 2026-11-26: "rather than taking you to a
 * completely new screen to chat, it should expand the collapsed messages and open it directly to the coach's chat").
 */
export function openInDock(id: string, title?: string): void {
  window.dispatchEvent(new CustomEvent<Opened>(OPEN_EVENT, { detail: { id, title } }));
}
type Opened = { id: string; title?: string };

/** The dock window id for a team's chat (Melvin, 2026-11-26: "when the coach clicks on team chat, it opens it up in the messages"). */
export const teamWin = (team: string) => `tc:${team}`;
const teamOf = (id: string) => (id.startsWith("tc:") ? id.slice(3) : null);

/** Opens a window for `id` (or unfolds it), keeping at most DOCK_WINDOWS, the newest on the right next to the list. */
export function openWin(wins: readonly Win[], id: string, folded = false, title?: string): Win[] {
  const had = wins.find((w) => w.id === id);
  if (had) return wins.map((w) => (w.id === id ? { ...w, folded: folded && w.folded, ...(title ? { title } : {}) } : w));
  return [...wins, { id, folded, ...(title ? { title } : {}) }].slice(-DOCK_WINDOWS);
}

/** The line under a name in the list: typing, or the newest message ("You: …", a sticker's name), or their status. */
function preview(p: LivePerson, me: string, now: number): string {
  if (p.typing) return t("trn.typingShort");
  const m = p.last;
  if (!m) return presenceText(p.presence, now);
  const body = m.sticker ? t("trn.stickerSent", { sticker: t(`trn.stk.${m.sticker}`) }) : m.text.replace(/\s+/g, " ");
  return m.from === me ? t("trn.youSaid", { text: body }) : body;
}

function Initial({ person }: { person: LivePerson }) {
  const name = person.name || t("trn.noName");
  return (
    <span
      className="relative inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-accent/15 font-bold text-accent"
      aria-hidden
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
      <StatusDot state={person.presence.state} className="absolute -bottom-0.5 -right-0.5" />
    </span>
  );
}

function Count({ n, label }: { n: number; label: string }) {
  if (n <= 0) return null;
  return (
    <span className="animate-pop inline-flex min-w-5 shrink-0 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-bold text-accent-ink">
      <span aria-hidden>{n > 99 ? "99+" : n}</span>
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function ChatDock({ hidden }: { hidden: boolean }) {
  const me = useAccount((s) => s.account?.id ?? null);
  const desktop = useDesktop();
  const on = desktop && !!me;
  useLivePoll(me, on, true);
  useUnreadTitle(on);
  const live = useLive((s) => s.live);
  const now = useNow(30_000);
  const [saved, setSaved] = useState<Saved>(() => (typeof window === "undefined" ? { open: false, wins: [] } : readSaved()));
  const save = (next: Saved) => {
    setSaved(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // Blocked storage: the dock just starts closed next time.
    }
  };
  const savedRef = useRef(saved);
  useEffect(() => {
    savedRef.current = saved;
  }, [saved]);

  // Message <name> elsewhere on the page opens that chat here instead of leaving the page.
  useEffect(() => {
    const onOpen = (e: Event) => {
      const { id, title } = (e as CustomEvent<Opened>).detail ?? {};
      if (typeof id !== "string" || !id) return;
      haptic("select");
      save({ open: true, wins: openWin(savedRef.current.wins, id, false, title) });
    };
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, []);

  // Someone writes: their window opens, folded, with its count (once per new message).
  // Only messages after the dock first showed open windows; ones already waiting just show their counts.
  const poppedAt = useRef(0);
  useEffect(() => {
    poppedAt.current = Date.now();
  }, []);
  useEffect(() => {
    if (!live || !me) return;
    const fresh = live.people.filter((p) => p.unread > 0 && p.last && p.last.from !== me && p.last.at > poppedAt.current);
    if (fresh.length === 0) return;
    poppedAt.current = Math.max(...fresh.map((p) => p.last?.at ?? 0));
    let wins = savedRef.current.wins;
    for (const p of fresh) wins = openWin(wins, p.id, true);
    save({ ...savedRef.current, wins });
  }, [live, me]);

  const byId = new Map((live?.people ?? []).map((p) => [p.id, p]));
  // A team's chat needs no one in the list; a person's window only while they're still there.
  const wins = saved.wins.filter((w) => (teamOf(w.id) ? !!w.title : byId.has(w.id)));
  const list = !!live && live.people.length > 0;
  if (!on || hidden || (!list && wins.length === 0)) return null;
  const people = [...(live?.people ?? [])].sort(
    (a, b) => b.unread - a.unread || (b.last?.at ?? 0) - (a.last?.at ?? 0) || (a.name || "").localeCompare(b.name || ""),
  );
  const unread = live ? unreadTotal(live) : 0;
  const toggleList = () => {
    haptic("select");
    sound.pop();
    save({ ...saved, open: !saved.open });
  };
  return (
    <section aria-label={t("trn.dock")} className="chat-dock fixed bottom-0 right-6 z-30 flex items-end gap-3" data-testid="chat-dock">
      {wins.map((w) => {
        const team = teamOf(w.id);
        const p = team ? null : byId.get(w.id)!;
        const name = team ? (w.title ?? t("mt.chat")) : p?.name || t("trn.noName");
        return (
          <div
            key={w.id}
            className="animate-rise flex w-80 flex-col overflow-hidden rounded-t-2xl border border-b-0 border-line bg-surface shadow-[0_-12px_40px_-12px_rgb(0_0_0/0.6)]"
            data-testid="chat-window"
          >
            <div className="flex items-center gap-1 border-b border-line/70 pl-2 pr-1">
              <button
                type="button"
                onClick={() => save({ ...saved, wins: saved.wins.map((x) => (x.id === w.id ? { ...x, folded: !x.folded } : x)) })}
                aria-expanded={!w.folded}
                className="press flex min-h-12 min-w-0 flex-1 items-center gap-2 py-1.5 text-left"
              >
                {p ? (
                  <Initial person={p} />
                ) : (
                  <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-raised text-ember">
                    <Icon name="trophy" size={18} />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{name}</span>
                  <span className="block truncate text-xs text-muted">
                    {!p ? t("mt.chat") : p.typing ? t("trn.typingShort") : presenceText(p.presence, now)}
                  </span>
                </span>
                {w.folded && p && <Count n={p.unread} label={t("trn.unread", { count: p.unread })} />}
                <Icon name={w.folded ? "chevronUp" : "chevronDown"} size={18} className="text-muted" />
              </button>
              <button
                type="button"
                onClick={() => save({ ...saved, wins: saved.wins.filter((x) => x.id !== w.id) })}
                aria-label={t("trn.closeChat", { name })}
                className="press flex size-11 items-center justify-center rounded-xl text-muted hover:text-ink"
              >
                <Icon name="close" size={18} />
              </button>
            </div>
            {!w.folded && (
              <div className="h-[26rem]">
                {team ? <TeamChat key={w.id} id={team} mode="dock" /> : <ChatThread key={w.id} id={w.id} mode="dock" />}
              </div>
            )}
          </div>
        );
      })}
      {list && live && (
        <div className="flex w-72 flex-col overflow-hidden rounded-t-2xl border border-b-0 border-line bg-surface shadow-[0_-12px_40px_-12px_rgb(0_0_0/0.6)]">
          <button
            type="button"
            onClick={toggleList}
            aria-expanded={saved.open}
            className="press flex min-h-12 items-center gap-2 px-4 text-left"
          >
            <Icon name="chat" size={20} className="text-accent" />
            <span className="flex-1 font-semibold">{t("trn.chat")}</span>
            <Count n={unread} label={t("trn.unread", { count: unread })} />
            <Icon name={saved.open ? "chevronDown" : "chevronUp"} size={18} className="text-muted" />
          </button>
          {saved.open && (
            <div className="border-t border-line/70">
              <div className="px-3 pt-3">
                <MyStatusButton status={live.me.status} until={live.me.until} now={now} className="w-full" />
              </div>
              <ul className="max-h-80 overflow-y-auto overscroll-contain p-2">
                {people.map((p) => {
                  const name = p.name || t("trn.noName");
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => {
                          haptic("select");
                          save({ ...saved, wins: openWin(saved.wins, p.id) });
                        }}
                        className="press flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-raised"
                      >
                        <Initial person={p} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold">{name}</span>
                          <span className={`block truncate text-sm ${p.unread > 0 ? "font-semibold text-ink" : "text-muted"}`}>
                            {preview(p, me ?? "", now)}
                          </span>
                          <span className="sr-only">{presenceText(p.presence, now)}</span>
                        </span>
                        <Count n={p.unread} label={t("trn.unread", { count: p.unread })} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
