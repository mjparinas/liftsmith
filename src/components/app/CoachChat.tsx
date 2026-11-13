"use client";

// Chat between a coach and a client (2026-11-12, after Melvin chose "chat, body data, alerts" from the coaching gap
// list; docs/decisions/trainer-mode.md). #/trainer/m.<id> is the thread with that person, from either side. Messages
// are plain text, newest at the bottom. The thread loads when it opens, when the app comes back to the front, and
// every 20 seconds while it's on screen (nothing runs in the background, battery.md); the other side gets a push on
// Android and iOS. Sending the first message asks for notification permission, so replies reach this phone too.
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";

import { track } from "@/lib/analytics";
import { useAccount } from "@/lib/auth";
import { date, t } from "@/lib/i18n";
import { haptic, oops, sound } from "@/lib/juice";
import { startPush } from "@/lib/push";
import { loadMessages, markRead, MESSAGE_MAX, sendMessage, trainerError, type Message } from "@/lib/trainer";

import { go, goBack, historyDepth } from "./router";
import { Button, EmptyState, ScreenHeader } from "./ui";

const POLL_MS = 20_000;

/** Back to where the lifter came from in Coaching (a page of it), or Coaching itself when nothing is behind (a push). */
export const backToCoaching = () => (historyDepth() > 0 ? goBack() : go("trainer"));

/** The chat with one person on its own screen (#/trainer/m.<id>). */
export function ChatScreen({ id }: { id: string }) {
  return <ChatThread id={id} />;
}

/**
 * One chat thread. On its own screen it has the header and a send box above the tab bar; `embedded` (the coach's
 * Messages page on a desktop, beside the list of people) drops the header and scrolls inside its own box.
 */
export function ChatThread({ id, embedded = false }: { id: string; embedded?: boolean }) {
  const me = useAccount((s) => s.account?.id ?? "");
  const [list, setList] = useState<Message[] | null>(null);
  const [name, setName] = useState("");
  const [more, setMore] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gone, setGone] = useState(false);
  const [them, setThem] = useState<"coach" | "client" | null>(null);
  const end = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLOListElement>(null);

  const load = useCallback(
    () =>
      loadMessages(id).then(
        (r) => {
          setName(r.name ?? "");
          setThem(r.them ?? null);
          setMore(r.more);
          // Keep any older page already shown; the newest page replaces its own part.
          setList((old) => {
            const first = r.messages[0]?.at ?? Infinity;
            const older = (old ?? []).filter((m) => m.at < first);
            return [...older, ...r.messages];
          });
          markRead(id);
          setError(null);
        },
        (e: unknown) => {
          const msg = trainerError(e);
          if (msg === t("trn.err.gone")) setGone(true);
          setError(msg);
          setList((old) => old ?? []);
        },
      ),
    [id],
  );

  useEffect(() => {
    void load();
    const tick = () => document.visibilityState === "visible" && void load();
    const timer = setInterval(tick, POLL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [load]);

  // The newest message in view whenever the list grows at the bottom.
  const last = list?.[list.length - 1]?.id;
  useEffect(() => {
    // Beside the list, only the thread's own box scrolls, so the page stays where it is.
    if (embedded && box.current) box.current.scrollTop = box.current.scrollHeight;
    else end.current?.scrollIntoView?.({ block: "end" });
  }, [last, embedded]);

  const older = async () => {
    const first = list?.[0];
    if (!first) return;
    try {
      const r = await loadMessages(id, first.at);
      setMore(r.more);
      setList((old) => [...r.messages, ...(old ?? [])]);
    } catch (e) {
      oops();
      setError(trainerError(e));
    }
  };

  const send = async (e: FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true);
    try {
      const m = await sendMessage(id, body);
      setList((old) => [...(old ?? []), m]);
      setText("");
      haptic("tap");
      sound.log();
      track("feature", { name: "trainer", detail: "message" });
      // Ask once, here, so the reply can reach this phone.
      void startPush(true);
    } catch (err) {
      oops();
      setError(trainerError(err));
    } finally {
      setBusy(false);
    }
  };

  const back = { label: t("trn.back"), onClick: backToCoaching };
  const who = name || t("trn.noName");
  if (gone)
    return (
      <div className="pb-2">
        {!embedded && <ScreenHeader back={back} title={t("trn.chat")} />}
        <EmptyState icon="info" title={t("trn.err.gone")} action={<Button onClick={() => go("trainer")}>{t("trn.back")}</Button>} />
      </div>
    );
  return (
    <div className={embedded ? "card flex h-[70dvh] flex-col p-4" : "flex min-h-[70dvh] flex-col pb-2"}>
      {embedded ? (
        <p className="font-semibold">{who}</p>
      ) : (
        <ScreenHeader back={back} kicker={them === "coach" ? t("trn.chatCoach") : t("trn.chat")} title={who} />
      )}
      {more && (
        <Button kind="quiet" className="mt-2 self-center" onClick={() => void older()}>
          {t("trn.older")}
        </Button>
      )}
      <ol ref={box} className={`mt-3 flex-1 space-y-2 ${embedded ? "overflow-y-auto" : ""}`} aria-live="polite" aria-label={t("trn.chat")}>
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
            return (
              <li key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2 ${mine ? "bg-accent/15 text-ink" : "card"}`}
                  aria-label={t("trn.chatLine", {
                    who: mine ? t("trn.you") : who,
                    date: date(m.at, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }),
                  })}
                >
                  <p className="whitespace-pre-line break-words">{m.text}</p>
                  <p className="mt-1 text-right text-xs text-muted">
                    {date(m.at, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                  </p>
                </div>
              </li>
            );
          })
        )}
      </ol>
      <div ref={end} />
      {error && (
        <p className="mt-2 text-sm text-warn" role="status">
          {error}
        </p>
      )}
      <form
        onSubmit={(e) => void send(e)}
        className={embedded ? "mt-3 border-t border-line pt-3" : "card sticky bottom-[var(--nav-h,0px)] mt-3 p-3"}
      >
        <label htmlFor={`trn-chat-${id}`} className="sr-only">
          {t("trn.chatLabel")}
        </label>
        <div className="flex items-end gap-2">
          <textarea
            id={`trn-chat-${id}`}
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MESSAGE_MAX))}
            maxLength={MESSAGE_MAX}
            rows={2}
            placeholder={them === "coach" ? t("trn.messageNamed", { name: who }) : t("trn.chatLabel")}
            className="min-w-0 flex-1 rounded-xl border border-line bg-raised px-3 py-2"
          />
          <Button submit disabled={busy || !text.trim()}>
            {t("trn.send")}
          </Button>
        </div>
      </form>
    </div>
  );
}
