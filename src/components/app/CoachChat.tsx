"use client";

// Chat between a coach and a client (2026-11-12, after Melvin chose "chat, body data, alerts" from the coaching gap
// list; docs/decisions/trainer-mode.md). #/trainer/m.<id> is the thread with that person, from either side. Messages
// are words or one gym sticker, newest at the bottom. The thread loads when it opens, then asks only for newer messages:
// every 5 seconds while the other side is online or typing, every 20 seconds otherwise, and only while it's on screen
// (battery.md); the other side gets a push on Android and iOS. Sending the first message asks for notification
// permission, so replies reach this phone too. Since 2026-11-15 it also shows how the other side is (online, with a
// client, on vacation and the rest, src/lib/coachStatus.ts), when they've seen your newest message, when they're
// typing, and an emoji and sticker tray; and on a desktop it opens in the chat dock (ChatDock.tsx).
import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";

import { track } from "@/lib/analytics";
import { useAccount } from "@/lib/auth";
import { chimeFor, clearUnread } from "@/lib/chatLive";
import { date, t, tFor } from "@/lib/i18n";
import { haptic, oops, sound } from "@/lib/juice";
import { useKeyboardViewport } from "@/lib/keyboard";
import { useDesktop } from "@/lib/layout";
import { liveRead } from "@/lib/liveRead";
import { startPush } from "@/lib/push";
import { EMOJI, STICKERS, type StickerId } from "@/lib/stickers";
import {
  loadMessages,
  markRead,
  MESSAGE_MAX,
  sendMessage,
  sendTyping,
  trainerError,
  useCoachNotes,
  type Message,
  type ShownPresence,
  type Thread,
} from "@/lib/trainer";
import { isVisible, onVisibility } from "@/lib/visibility";

import { presenceText, StatusDot } from "./ChatStatus";
import { Icon } from "./icons";
import { go, goBack, historyDepth } from "./router";
import { StickerArt } from "./StickerArt";
import { Button, EmptyState, ScreenHeader } from "./ui";

/** How often an open thread asks for new messages: quickly while the other side is around, slowly otherwise. */
export const FAST_MS = 5_000;
export const SLOW_MS = 20_000;
/** Typing is reported at most this often while the lifter types. */
const TYPING_EVERY_MS = 3_000;

/** Back to where the lifter came from in Coaching (a page of it), or Coaching itself when nothing is behind (a push). */
export const backToCoaching = () => (historyDepth() > 0 ? goBack() : go("trainer"));

/** The chat with one person on its own screen (#/trainer/m.<id>). */
export function ChatScreen({ id }: { id: string }) {
  return <ChatThread id={id} />;
}

/** Where a thread is drawn: its own screen, beside the list on the desktop Messages page, or in a chat dock window. */
export type ChatMode = "screen" | "embedded" | "dock";

const stamp = (at: number) => date(at, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

/** Adds messages to a list, oldest first, without doubles (an answer can overlap one just sent). */
export function mergeMessages(old: readonly Message[], add: readonly Message[]): Message[] {
  const ids = new Set(old.map((m) => m.id));
  const fresh = add.filter((m) => !ids.has(m.id));
  return fresh.length === 0 ? [...old] : [...old, ...fresh].sort((a, b) => a.at - b.at);
}

/** Either wording means the other person ended the link. */
function stoppedSharing(msg: string): boolean {
  return msg === t("trn.err.gone") || msg === t("trn.err.gone.ath");
}

/**
 * One chat thread. On its own screen on a phone or tablet it fills the visible screen: the header at the top, the send
 * box fixed at the bottom above the tab bar (or on the keyboard while typing), and only the messages scroll between
 * them (Melvin, 2026-11-13). On a desktop's own screen it's a page with the send box stuck to the bottom; `embedded`
 * (the coach's Messages page on a desktop, beside the list of people) drops the header and scrolls inside its own box,
 * and `dock` fills a chat dock window, whose header the dock draws.
 */
export function ChatThread({ id, mode = "screen" }: { id: string; mode?: ChatMode }) {
  const athlete = useCoachNotes((s) => s.who.role) === "coach";
  const me = useAccount((s) => s.account?.id ?? "");
  const [list, setList] = useState<Message[] | null>(null);
  const [name, setName] = useState("");
  const [more, setMore] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gone, setGone] = useState(false);
  const [them, setThem] = useState<"coach" | "client" | null>(null);
  const [seen, setSeen] = useState(0);
  const [typing, setTyping] = useState(false);
  const [presence, setPresence] = useState<ShownPresence | null>(null);
  const [tray, setTray] = useState<"emoji" | "stickers" | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const end = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  // The box grows with what's typed, up to its max height, then scrolls.
  useEffect(() => {
    const el = input.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [text]);
  const listRef = useRef<Message[] | null>(null);
  useEffect(() => {
    listRef.current = list;
  }, [list]);
  const typedAt = useRef(0);
  const desktop = useDesktop();
  // Phone and tablet: the thread is a pane the size of the visible screen, and only its list scrolls.
  const pane = mode === "screen" && !desktop;
  const inBox = mode !== "screen" || pane;
  useKeyboardViewport(pane);
  // Whether the newest message was in view, so a list that shrinks (the keyboard opening) keeps it there.
  const atEnd = useRef(true);

  /** What's live about the other side, from any answer. */
  const meta = useCallback((r: Thread) => {
    if (r.seen !== undefined) setSeen(r.seen);
    if (r.typing !== undefined) setTyping(r.typing);
    if (r.presence) setPresence(r.presence);
    setNow(Date.now());
  }, []);

  const load = useCallback(
    () =>
      // The thread kept from last time shows at once (only before anything else is shown), then the server's answer.
      liveRead(
        `coach.chat.${id}`,
        () => loadMessages(id),
        (r, fresh) => {
          if (fresh) {
            setName(r.name ?? "");
            setThem(r.them ?? null);
            setMore(r.more);
            meta(r);
          } else {
            setName((n) => n || (r.name ?? ""));
            setThem((x) => x ?? r.them ?? null);
          }
          // Keep any older page already shown; the newest page replaces its own part.
          setList((old) => {
            if (!fresh && old) return old;
            const first = r.messages[0]?.at ?? Infinity;
            const older = (old ?? []).filter((m) => m.at < first);
            return [...older, ...r.messages];
          });
          if (!fresh) return;
          // Opening a thread doesn't ring for what was already waiting in it.
          chimeFor(
            [...r.messages].reverse().find((m) => m.from !== me),
            true,
          );
          markRead(id);
          clearUnread(id);
          setError(null);
        },
      ).then(
        () => undefined,
        (e: unknown) => {
          const msg = trainerError(e, useCoachNotes.getState().who.role === "coach");
          if (stoppedSharing(msg)) setGone(true);
          setError(msg);
          setList((old) => old ?? []);
        },
      ),
    [id, me, meta],
  );

  /** Asks only for what's new since the newest message shown. */
  const poll = useCallback(async () => {
    const shown = listRef.current;
    const lastAt = shown?.[shown.length - 1]?.at;
    if (!lastAt) return load();
    try {
      const r = await loadMessages(id, { after: lastAt });
      meta(r);
      if (r.messages.length > 0) {
        setList((old) => mergeMessages(old ?? [], r.messages));
        chimeFor([...r.messages].reverse().find((m) => m.from !== me));
        markRead(id);
        clearUnread(id);
      }
      setError(null);
    } catch (e) {
      const msg = trainerError(e, useCoachNotes.getState().who.role === "coach");
      if (stoppedSharing(msg)) setGone(true);
    }
  }, [id, load, me, meta]);

  // Quickly while the other side is around (online or typing), slowly otherwise, and never while the app is hidden.
  const quick = typing || presence?.state === "online";
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    const start = (visible: boolean) => {
      if (timer) clearInterval(timer);
      timer = null;
      if (!visible) return;
      timer = setInterval(() => void poll(), quick ? FAST_MS : SLOW_MS);
    };
    start(isVisible());
    const off = onVisibility((v) => {
      if (v) void poll();
      start(v);
    });
    return () => {
      if (timer) clearInterval(timer);
      off();
    };
  }, [poll, quick]);

  // The newest message in view whenever the list grows at the bottom, or the typing dots appear.
  const last = list?.[list.length - 1]?.id;
  useEffect(() => {
    // In a box, only the thread's own list scrolls, so the page stays where it is.
    if (inBox && box.current) box.current.scrollTop = box.current.scrollHeight;
    else end.current?.scrollIntoView?.({ block: "end" });
    atEnd.current = true;
  }, [last, inBox]);
  useEffect(() => {
    if (typing && inBox && box.current && atEnd.current) box.current.scrollTop = box.current.scrollHeight;
  }, [typing, inBox]);

  // The keyboard opening or the send box growing shrinks the list: keep the newest message in view if it was.
  useEffect(() => {
    const el = box.current;
    if (!inBox || !el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      if (atEnd.current) el.scrollTop = el.scrollHeight;
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [inBox]);
  const onScroll = () => {
    const el = box.current;
    if (el) atEnd.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
  };

  const older = async () => {
    const first = list?.[0];
    if (!first) return;
    try {
      const r = await loadMessages(id, { before: first.at });
      // Older messages go above the ones being read, so keep those where they are on screen.
      const el = box.current;
      const below = el ? el.scrollHeight - el.scrollTop : 0;
      setMore(r.more);
      setList((old) => [...r.messages, ...(old ?? [])]);
      if (inBox && el) requestAnimationFrame(() => (el.scrollTop = el.scrollHeight - below));
    } catch (e) {
      oops();
      setError(trainerError(e));
    }
  };

  const deliver = async (body: string, sticker?: StickerId) => {
    setBusy(true);
    try {
      const m = await sendMessage(id, body, sticker);
      setList((old) => mergeMessages(old ?? [], [m]));
      if (!sticker) setText("");
      setTray(null);
      typedAt.current = 0;
      haptic("tap");
      sound.log();
      track("feature", { name: "trainer", detail: sticker ? `sticker:${sticker}` : "message" });
      // Ask once, here, so the reply can reach this phone.
      void startPush(true);
    } catch (err) {
      oops();
      setError(trainerError(err));
    } finally {
      setBusy(false);
    }
  };

  const send = async (e?: FormEvent) => {
    e?.preventDefault();
    const body = text.trim();
    if (!body || busy) return;
    await deliver(body);
  };

  const type = (v: string) => {
    setText(v.slice(0, MESSAGE_MAX));
    // Tell the other side, at most every 3 seconds; a lost one only skips the dots.
    const at = Date.now();
    if (v.trim() && at - typedAt.current > TYPING_EVERY_MS) {
      typedAt.current = at;
      void sendTyping(id).catch(() => undefined);
    }
  };

  // On a desktop, Enter sends and Shift+Enter starts a new line; on a phone, the keyboard's return is a new line.
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!desktop || e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing) return;
    e.preventDefault();
    void send();
  };

  /** Puts an emoji where the cursor is. */
  const addEmoji = (emoji: string) => {
    const el = input.current;
    const at = el?.selectionStart ?? text.length;
    const to = el?.selectionEnd ?? text.length;
    const next = (text.slice(0, at) + emoji + text.slice(to)).slice(0, MESSAGE_MAX);
    type(next);
    sound.tick();
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(at + emoji.length, at + emoji.length);
    });
  };

  const back = { label: t("trn.back"), onClick: backToCoaching };
  const who = name || t("trn.noName");
  if (gone)
    return (
      <div className="pb-2">
        {mode === "screen" && <ScreenHeader back={back} title={t("trn.chat")} />}
        <EmptyState
          icon="info"
          title={tFor(athlete, "trn.err.gone")}
          action={<Button onClick={() => go("trainer")}>{t("trn.back")}</Button>}
        />
      </div>
    );
  // The newest message this lifter sent, which carries "Seen" or "Sent" under it.
  const mineLast = [...(list ?? [])].reverse().find((m) => m.from === me);
  const away = presence && (presence.state === "vacation" || presence.state === "dnd");
  const frame =
    mode === "embedded"
      ? "card flex h-[70dvh] flex-col p-4"
      : mode === "dock"
        ? "flex h-full min-h-0 flex-col px-3 pb-3"
        : pane
          ? "vv-pane max-w-lg px-5"
          : "flex min-h-[70dvh] flex-col pb-2";
  return (
    <div className={frame} data-testid="chat-thread">
      {mode === "embedded" && <p className="shrink-0 font-semibold">{who}</p>}
      {mode === "screen" && (
        <ScreenHeader className="shrink-0" back={back} kicker={them === "coach" ? t("trn.chatCoach") : t("trn.chat")} title={who} />
      )}
      {mode !== "dock" && presence && (
        <p className="mt-1 flex shrink-0 items-center gap-2 text-sm text-muted">
          <StatusDot state={presence.state} />
          {presenceText(presence, now)}
        </p>
      )}
      {more && (
        <Button kind="quiet" className="mt-2 shrink-0 self-center" onClick={() => void older()}>
          {t("trn.older")}
        </Button>
      )}
      <div
        ref={box}
        onScroll={inBox ? onScroll : undefined}
        className={`${mode === "dock" ? "mt-1" : "mt-3"} flex-1 ${inBox ? "min-h-0 overflow-y-auto overscroll-contain [mask-image:linear-gradient(to_bottom,transparent,black_1rem)]" : ""}`}
        // A scrolling box must be reachable by keyboard (axe: scrollable-region-focusable).
        {...(inBox ? { role: "region", tabIndex: 0, "aria-label": t("trn.chatWith", { name: who }) } : {})}
      >
        <ol className="space-y-2 pt-3" aria-live="polite" aria-label={inBox ? undefined : t("trn.chat")}>
          {list === null ? (
            <li className="text-sm text-muted">{t("trn.loading")}</li>
          ) : list.length === 0 ? (
            // Each side's empty thread speaks to them: a client is asked to tell their coach how training is going,
            // a coach to ask (Melvin, 2026-11-13: the old line read as if it were for the coach on both sides).
            <li className="px-1 text-sm text-muted">
              {them === "coach" ? t("trn.chatEmptyClient", { name: who }) : t("trn.chatEmptyCoach", { name: who })}
            </li>
          ) : (
            list.map((m) => {
              const mine = m.from === me;
              const label = t("trn.chatLine", { who: mine ? t("trn.you") : who, date: stamp(m.at) });
              return (
                <li key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
                  {m.sticker ? (
                    <div className="animate-pop" aria-label={label} role="group">
                      <StickerArt id={m.sticker} size={mode === "dock" ? 88 : 112} />
                      <p className="mt-1 text-right text-xs text-muted">{stamp(m.at)}</p>
                    </div>
                  ) : (
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2 ${mine ? "bg-accent/15 text-ink" : "card"}`}
                      aria-label={label}
                      role="group"
                    >
                      <p className="whitespace-pre-line break-words">{m.text}</p>
                      <p className="mt-1 text-right text-xs text-muted">{stamp(m.at)}</p>
                    </div>
                  )}
                  {mineLast?.id === m.id && (
                    <p className="mt-0.5 px-1 text-xs text-muted" data-testid="chat-receipt">
                      {seen >= m.at ? t("trn.seen", { time: date(seen, { hour: "numeric", minute: "2-digit" }) }) : t("trn.sent")}
                    </p>
                  )}
                </li>
              );
            })
          )}
          {typing && (
            <li className="flex items-center gap-2 px-1 text-sm text-muted" data-testid="chat-typing">
              <span className="typing-dots" aria-hidden>
                <span />
                <span />
                <span />
              </span>
              {t("trn.typing", { name: who })}
            </li>
          )}
        </ol>
        {!inBox && <div ref={end} />}
      </div>
      {error && (
        <p className="mt-2 shrink-0 text-sm text-warn" role="status">
          {error}
        </p>
      )}
      {away && (
        // A vacation or Do not disturb says so before you write, and that they'll see it later (no push goes now).
        <p className="mt-2 flex shrink-0 items-start gap-2 rounded-xl bg-raised px-3 py-2 text-sm text-muted" role="note">
          <StatusDot state={presence.state} className="mt-1.5" />
          {presence.state === "vacation"
            ? t("trn.awayVacation", { name: who, status: presenceText(presence, now) })
            : t("trn.awayDnd", { name: who })}
        </p>
      )}
      <form
        onSubmit={(e) => void send(e)}
        className={
          mode === "embedded"
            ? "mt-3 shrink-0 border-t border-line pt-3"
            : mode === "dock"
              ? "mt-2 shrink-0 border-t border-line pt-2"
              : pane
                ? "card mt-3 shrink-0 p-2"
                : "card sticky bottom-[var(--nav-h,0px)] mt-3 p-2"
        }
      >
        {tray && (
          <ChatTray
            kind={tray}
            onKind={setTray}
            compact={mode === "dock"}
            onEmoji={addEmoji}
            onSticker={(s) => void deliver("", s)}
            busy={busy}
          />
        )}
        <label htmlFor={`trn-chat-${mode}-${id}`} className="sr-only">
          {t("trn.chatLabel")}
        </label>
        {/* One rounded field holds the words and, at its end, the emoji and sticker buttons, so the box gets the whole row
            and grows with what's typed (up to about six lines); a round send button sits beside it. */}
        <div className="flex items-end gap-2">
          <div className="flex min-w-0 flex-1 items-end rounded-3xl border border-line bg-raised pl-4 pr-1 focus-within:border-accent focus-within:outline focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-accent/40">
            <textarea
              ref={input}
              id={`trn-chat-${mode}-${id}`}
              value={text}
              onChange={(e) => type(e.target.value)}
              onKeyDown={onKey}
              maxLength={MESSAGE_MAX}
              rows={1}
              placeholder={them === "coach" ? t("trn.messageNamed", { name: who }) : t("trn.chatLabel")}
              className="max-h-40 min-h-11 min-w-0 flex-1 resize-none bg-transparent py-2.5 leading-6 focus-visible:shadow-none! focus-visible:outline-none!"
            />
            <TrayButton icon="smile" label={t("trn.emojiStickers")} on={!!tray} onClick={() => setTray(tray ? null : "emoji")} />
          </div>
          <Button submit disabled={busy || !text.trim()} label={t("trn.send")} icon="send" className="size-11 shrink-0 !rounded-full !px-0">
            {null}
          </Button>
        </div>
      </form>
    </div>
  );
}

function TrayButton({ icon, label, on, onClick }: { icon: "smile"; label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={() => {
        haptic("select");
        onClick();
      }}
      aria-label={label}
      aria-expanded={on}
      className={`press flex size-11 shrink-0 items-center justify-center rounded-full ${on ? "bg-accent/15 text-accent" : "text-muted hover:text-ink"}`}
    >
      <Icon name={icon} size={22} />
    </button>
  );
}

/** The emoji grid or the sticker grid, above the send box. A sticker sends at once; an emoji goes into the box. */
function ChatTray({
  kind,
  onKind,
  compact,
  onEmoji,
  onSticker,
  busy,
}: {
  kind: "emoji" | "stickers";
  onKind: (k: "emoji" | "stickers") => void;
  compact: boolean;
  onEmoji: (e: string) => void;
  onSticker: (s: StickerId) => void;
  busy: boolean;
}) {
  return (
    <div
      className="animate-rise mb-2 overflow-hidden rounded-2xl border border-line bg-surface"
      role="group"
      aria-label={t("trn.emojiStickers")}
    >
      <div className="flex gap-1 border-b border-line/70 p-1">
        {(["emoji", "stickers"] as const).map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={kind === k}
            onClick={() => {
              haptic("select");
              onKind(k);
            }}
            className={`press flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-semibold ${kind === k ? "bg-accent/15 text-accent" : "text-muted hover:text-ink"}`}
          >
            <Icon name={k === "emoji" ? "smile" : "sticker"} size={18} />
            {k === "emoji" ? t("trn.emoji") : t("trn.stickers")}
          </button>
        ))}
      </div>
      <div className={`overflow-y-auto overscroll-contain p-2 ${compact ? "max-h-40" : "max-h-56"}`} data-no-swipe>
        {kind === "emoji" ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))]">
            {EMOJI.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => onEmoji(e)}
                className="press flex size-11 items-center justify-center rounded-xl text-2xl hover:bg-raised"
              >
                {e}
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(5rem,1fr))] gap-2">
            {STICKERS.map((s) => (
              <button
                key={s.id}
                type="button"
                disabled={busy}
                onClick={() => {
                  sound.pop();
                  onSticker(s.id);
                }}
                className="press flex flex-col items-center gap-1 rounded-2xl p-1 hover:bg-raised disabled:opacity-60"
                aria-label={t("trn.sendSticker", { sticker: t(`trn.stk.${s.id}`) })}
              >
                <StickerArt id={s.id} size={compact ? 60 : 72} bare />
                <span aria-hidden className="line-clamp-2 text-center text-xs font-semibold leading-tight text-muted">
                  {t(`trn.stk.${s.id}`)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
