"use client";

// A club's chat (Melvin, 2026-11-17: community gap 1; docs/decisions/friends.md "Club chat and crew sessions"). Opens
// from the club sheet's Chat chip: the newest messages, Load earlier, a box to write in and Send. While it's on screen
// and the app is in front it asks for new messages every 15 seconds (never in the background, docs/decisions/battery.md);
// pushes cover the rest. Each message from someone else has Report, and the writer or the club's starter can delete.
import { useEffect, useRef, useState, type FormEvent } from "react";

import { track } from "@/lib/analytics";
import { mergeMessages } from "@/lib/crew";
import { date, t } from "@/lib/i18n";
import { haptic, oops, sound } from "@/lib/juice";
import { social, socialError } from "@/lib/social";
import { SOCIAL_LIMITS, type ClubDetail, type ClubMessage } from "@/lib/socialTypes";
import { isVisible, onVisibility } from "@/lib/visibility";

import { Avatar } from "./AvatarFace";
import { ago } from "./format";
import { ReportSheet } from "./Friends";
import { Icon } from "./icons";
import { Button, EmptyState, InlineSwitch, Sheet, Skeleton } from "./ui";

/** How often the open chat asks for new messages. */
export const CHAT_POLL_MS = 15_000;

type Page = { messages: ClubMessage[]; more: boolean };

export function ClubChat({ club }: { club: ClubDetail }) {
  const [messages, setMessages] = useState<ClubMessage[] | null>(null);
  const [more, setMore] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [push, setPush] = useState(club.chatPush !== false);
  const [options, setOptions] = useState<ClubMessage | null>(null);
  const [reporting, setReporting] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const last = useRef(0);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let live = true;
    social<Page>("clubChat", { id: club.id })
      .then((r) => {
        if (!live) return;
        setMessages(r.messages);
        setMore(r.more);
        last.current = r.messages.at(-1)?.at ?? 0;
        setReady(true);
      })
      .catch((e: unknown) => live && (setMessages([]), setNote(socialError(e))));
    return () => {
      live = false;
    };
  }, [club.id]);

  // New messages while the chat is on screen and the app is in front.
  useEffect(() => {
    if (!ready) return;
    let timer: ReturnType<typeof setInterval> | null = null;
    const look = () => {
      social<Page>("clubChat", { id: club.id, after: last.current || 1 })
        .then((r) => {
          if (!r.messages.length) return;
          if (r.messages.some((m) => !m.mine)) sound.message();
          last.current = Math.max(last.current, r.messages.at(-1)?.at ?? 0);
          setMessages((have) => mergeMessages(have ?? [], r.messages));
        })
        .catch(() => undefined);
    };
    const start = () => {
      if (timer || !isVisible()) return;
      timer = setInterval(look, CHAT_POLL_MS);
    };
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };
    start();
    const off = onVisibility((v) => (v ? (look(), start()) : stop()));
    return () => {
      stop();
      off();
    };
  }, [club.id, ready]);

  useEffect(() => {
    end.current?.scrollIntoView?.({ block: "nearest" });
  }, [messages?.length]);

  const earlier = async () => {
    const first = messages?.[0];
    if (!first) return;
    try {
      const r = await social<Page>("clubChat", { id: club.id, before: first.at });
      setMessages((have) => mergeMessages(have ?? [], r.messages));
      setMore(r.more);
    } catch (e) {
      setNote(socialError(e));
    }
  };

  const send = async (e: FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (busy || !body) return;
    setBusy(true);
    setNote(null);
    try {
      const r = await social<{ message: ClubMessage }>("clubSay", { id: club.id, text: body });
      setMessages((have) => mergeMessages(have ?? [], [r.message]));
      last.current = Math.max(last.current, r.message.at);
      setText("");
      haptic("tick");
      sound.pop();
      track("feature", { name: "social_club_chat" });
    } catch (err) {
      oops();
      setNote(socialError(err));
    }
    setBusy(false);
  };

  const remove = async (m: ClubMessage) => {
    setOptions(null);
    try {
      await social("clubUnsay", { id: m.id });
      haptic("select");
      setMessages((have) => (have ?? []).filter((x) => x.id !== m.id));
    } catch (e) {
      oops();
      setNote(socialError(e));
    }
  };

  const toggle = async (on: boolean) => {
    setPush(on);
    try {
      await social("clubChatPush", { id: club.id, on });
    } catch (e) {
      setPush(!on);
      setNote(socialError(e));
    }
  };

  return (
    <div className="mt-3">
      {messages === null ? (
        <Skeleton className="h-40" />
      ) : messages.length ? (
        <>
          {more && (
            <Button kind="quiet" className="w-full" onClick={() => void earlier()}>
              {t("crew.earlier")}
            </Button>
          )}
          <ol className="mt-1 space-y-2" aria-label={t("crew.chat")}>
            {messages.map((m) => (
              <li key={m.id} className={`flex items-end gap-2 ${m.mine ? "flex-row-reverse" : ""}`}>
                {!m.mine && <Avatar name={m.name} avatar={m.avatar} size={28} />}
                <div className={`min-w-0 max-w-[80%] rounded-2xl px-3 py-2 ${m.mine ? "bg-accent/15" : "border border-line bg-surface"}`}>
                  <p className="text-xs text-muted">
                    <span className="font-semibold text-ink">{m.mine ? t("crew.you") : m.name}</span>{" "}
                    <time dateTime={new Date(m.at).toISOString()}>
                      {ago(m.at)} · {date(m.at, { hour: "numeric", minute: "2-digit" })}
                    </time>
                  </p>
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                </div>
                {(m.canDelete || !m.mine) && (
                  <button
                    type="button"
                    aria-label={t("crew.options", { name: m.mine ? t("crew.you") : m.name })}
                    onClick={() => setOptions(m)}
                    className="press grid h-11 w-11 shrink-0 place-items-center rounded-xl text-muted hover:text-ink"
                  >
                    <Icon name="more" size={18} />
                  </button>
                )}
              </li>
            ))}
          </ol>
          <div ref={end} />
        </>
      ) : (
        <EmptyState icon="chat" title={t("crew.chatNone")} body={t("crew.chatNoneBody")} />
      )}
      <form onSubmit={(e) => void send(e)} className="mt-3">
        <label htmlFor={`club-chat-${club.id}`} className="sr-only">
          {t("crew.write")}
        </label>
        <div className="flex items-end gap-2">
          <textarea
            id={`club-chat-${club.id}`}
            value={text}
            rows={1}
            maxLength={SOCIAL_LIMITS.clubMessage}
            placeholder={t("crew.write")}
            onChange={(e) => setText(e.target.value)}
            className="card min-h-12 min-w-0 flex-1 resize-none px-4 py-3"
          />
          <Button submit disabled={busy || !text.trim()}>
            {t("crew.send")}
          </Button>
        </div>
      </form>
      {note && (
        <p role="alert" className="mt-2 text-sm text-bad">
          {note}
        </p>
      )}
      <InlineSwitch
        className="mt-4"
        label={t("crew.notify")}
        hint={club.gymClub ? t("crew.notifyGym") : t("crew.notifyNote")}
        on={push}
        onChange={(v) => void toggle(v)}
      />
      <Sheet
        open={!!options}
        onClose={() => setOptions(null)}
        title={t("crew.options", { name: options?.mine ? t("crew.you") : (options?.name ?? "") })}
      >
        {options && (
          <>
            <p className="whitespace-pre-wrap break-words text-sm text-muted">{options.body}</p>
            <div className="mt-4 space-y-2">
              {!options.mine && (
                <Button
                  kind="ghost"
                  icon="flag"
                  className="w-full"
                  onClick={() => {
                    setReporting(options.id);
                    setOptions(null);
                  }}
                >
                  {t("crew.reportIt")}
                </Button>
              )}
              {options.canDelete && (
                <Button kind="danger" icon="trash" className="w-full" onClick={() => void remove(options)}>
                  {t("crew.deleteIt")}
                </Button>
              )}
            </div>
          </>
        )}
      </Sheet>
      <ReportSheet open={!!reporting} onClose={() => setReporting(null)} kind="message" id={reporting ?? ""} />
    </div>
  );
}
