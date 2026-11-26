"use client";

// A school team's chat (#/trainer/tc.<team id>; Melvin, 2026-11-25: My team has "team chat, coach chat";
// docs/decisions/school-teams.md "My team"; server teamChat.ts). Everyone on the team and its coach. Like the coach chat,
// on a phone or tablet it fills the visible screen with the send box at the bottom and only the messages scrolling; on
// the desktop layout it's a page with the send box stuck to the bottom. While it's on screen and the app is in front it
// asks for new messages every 15 seconds (never in the background, docs/decisions/battery.md); pushes cover the rest.
// The coach can delete any message, an athlete their own.
import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";

import { track } from "@/lib/analytics";
import { date, t } from "@/lib/i18n";
import { haptic, oops, sound } from "@/lib/juice";
import { useKeyboardViewport } from "@/lib/keyboard";
import { useDesktop } from "@/lib/layout";
import { loadTeamChat, sayToTeam, teamError, unsayToTeam, type TeamMessage } from "@/lib/teams";
import { refreshCoachNotes } from "@/lib/trainer";
import { isVisible, onVisibility } from "@/lib/visibility";

import { Avatar } from "./AvatarFace";
import { backToCoaching } from "./CoachChat";
import { Icon } from "./icons";
import { Button, EmptyState, ScreenHeader, Sheet } from "./ui";

/** How often the open chat asks for new messages. */
export const TEAM_CHAT_POLL_MS = 15_000;
/** The longest message (the server's limit, teamChat.ts). */
const MAX = 500;

const stamp = (at: number) => date(at, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

/** Adds messages, oldest first, without doubles. */
export function mergeTeamMessages(old: readonly TeamMessage[], add: readonly TeamMessage[]): TeamMessage[] {
  const ids = new Set(old.map((m) => m.id));
  const fresh = add.filter((m) => !ids.has(m.id));
  return fresh.length ? [...old, ...fresh].sort((a, b) => a.at - b.at) : [...old];
}

/**
 * `screen` is its own page; `dock` fills a chat dock window or a sheet (Melvin, 2026-11-26: "when the coach clicks on
 * team chat, it opens it up in the messages"), whose header names the team.
 */
export function TeamChat({ id, mode = "screen" }: { id: string; mode?: "screen" | "dock" }) {
  const [list, setList] = useState<TeamMessage[] | null>(null);
  const [name, setName] = useState("");
  const [coach, setCoach] = useState(false);
  const [more, setMore] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gone, setGone] = useState(false);
  const [options, setOptions] = useState<TeamMessage | null>(null);
  const last = useRef(0);
  const box = useRef<HTMLDivElement>(null);
  const end = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const desktop = useDesktop();
  const dock = mode === "dock";
  const pane = !desktop && !dock;
  const inBox = pane || dock;
  useKeyboardViewport(pane);

  useEffect(() => {
    let live = true;
    loadTeamChat(id)
      .then((r) => {
        if (!live) return;
        setList(r.messages);
        setMore(r.more);
        setName(r.team.name);
        setCoach(r.coach);
        last.current = r.messages.at(-1)?.at ?? 0;
        // Read now: the red counts on My team and the app icon drop.
        void refreshCoachNotes(Date.now(), true);
      })
      .catch((e: unknown) => {
        if (!live) return;
        setList([]);
        if (e instanceof Error && e.message === "unknown") setGone(true);
        else setError(teamError(e));
      });
    return () => {
      live = false;
    };
  }, [id]);

  // New messages while the chat is on screen and the app is in front.
  useEffect(() => {
    if (list === null || gone) return;
    let timer: ReturnType<typeof setInterval> | null = null;
    const look = () => {
      loadTeamChat(id, { after: last.current || 1 })
        .then((r) => {
          if (!r.messages.length) return;
          if (r.messages.some((m) => !m.mine)) sound.message();
          last.current = Math.max(last.current, r.messages.at(-1)?.at ?? 0);
          setList((have) => mergeTeamMessages(have ?? [], r.messages));
        })
        .catch(() => undefined);
    };
    const start = () => {
      if (timer || !isVisible()) return;
      timer = setInterval(look, TEAM_CHAT_POLL_MS);
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
    // Only once the first page is in: `list` changing afterwards mustn't restart the timer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, list === null, gone]);

  // The newest message stays in view.
  useEffect(() => {
    const el = box.current;
    if (inBox && el) el.scrollTop = el.scrollHeight;
    else end.current?.scrollIntoView?.({ block: "nearest" });
  }, [list?.length, inBox]);

  // The box grows with what's typed, up to its max height.
  useEffect(() => {
    const el = input.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [text]);

  const earlier = async () => {
    const first = list?.[0];
    if (!first) return;
    try {
      const r = await loadTeamChat(id, { before: first.at });
      setList((have) => mergeTeamMessages(have ?? [], r.messages));
      setMore(r.more);
    } catch (e) {
      setError(teamError(e));
    }
  };

  const send = useCallback(
    async (e?: FormEvent) => {
      e?.preventDefault();
      const body = text.trim();
      if (busy || !body) return;
      setBusy(true);
      setError(null);
      try {
        const m = await sayToTeam(id, body);
        setList((have) => mergeTeamMessages(have ?? [], [m]));
        last.current = Math.max(last.current, m.at);
        setText("");
        haptic("tick");
        sound.pop();
        track("feature", { name: "team", detail: "chat" });
      } catch (err) {
        oops();
        setError(teamError(err));
      }
      setBusy(false);
    },
    [busy, id, text],
  );

  // Enter sends on a keyboard with a desktop layout; Shift+Enter (and every phone) makes a new line.
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (desktop && e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  };

  const remove = async (m: TeamMessage) => {
    setOptions(null);
    try {
      await unsayToTeam(m.id);
      haptic("select");
      setList((have) => (have ?? []).filter((x) => x.id !== m.id));
    } catch (e) {
      oops();
      setError(teamError(e));
    }
  };

  const back = { label: t("trn.back"), onClick: backToCoaching };
  if (gone)
    return (
      <div className="pb-2">
        {!dock && <ScreenHeader back={back} title={t("mt.chat")} />}
        <EmptyState
          icon="info"
          title={t("mt.chatGone")}
          body={t("mt.chatGoneBody")}
          action={dock ? undefined : <Button onClick={() => backToCoaching()}>{t("trn.back")}</Button>}
        />
      </div>
    );
  const who = (m: TeamMessage) => (m.mine ? t("crew.you") : m.name || t("trn.noName"));
  return (
    <div
      className={dock ? "flex h-full min-h-0 flex-col px-3 pb-3" : pane ? "vv-pane max-w-lg px-5" : "flex min-h-[70dvh] flex-col pb-2"}
      data-testid="team-chat"
    >
      {!dock && (
        <>
          <ScreenHeader className="shrink-0" back={back} kicker={t("mt.chat")} title={name || t("mt.chat")} />
          <p className="mt-1 shrink-0 text-sm text-muted">{coach ? t("mt.chatLeadCoach") : t("mt.chatLead")}</p>
        </>
      )}
      {more && (
        <Button kind="quiet" className="mt-2 shrink-0 self-center" onClick={() => void earlier()}>
          {t("crew.earlier")}
        </Button>
      )}
      <div
        ref={box}
        className={`${dock ? "mt-1" : "mt-3"} flex-1 ${inBox ? "min-h-0 overflow-y-auto overscroll-contain [mask-image:linear-gradient(to_bottom,transparent,black_1rem)]" : ""}`}
        {...(inBox ? { role: "region", tabIndex: 0, "aria-label": t("mt.chatOf", { team: name || t("mt.chat") }) } : {})}
      >
        {list === null ? (
          <p className="pt-3 text-sm text-muted">{t("trn.loading")}</p>
        ) : list.length === 0 ? (
          <EmptyState icon="chat" title={t("mt.chatNone")} body={coach ? t("mt.chatNoneCoach") : t("mt.chatNoneBody")} />
        ) : (
          <ol className="space-y-2 pt-3" aria-live="polite" aria-label={inBox ? undefined : t("mt.chat")}>
            {list.map((m) => (
              <li key={m.id} className={`flex items-end gap-2 ${m.mine ? "flex-row-reverse" : ""}`}>
                {!m.mine && <Avatar name={who(m)} avatar={m.avatar} size={32} />}
                <div
                  className={`min-w-0 max-w-[85%] rounded-2xl px-4 py-2 ${m.mine ? "bg-accent/15" : m.coach ? "card card-tint" : "card"}`}
                  style={m.coach && !m.mine ? { ["--tint" as string]: "var(--color-violet)" } : undefined}
                  role="group"
                  aria-label={t("trn.chatLine", { who: who(m), date: stamp(m.at) })}
                >
                  {!m.mine && (
                    <p className="flex items-center gap-1.5 text-xs font-semibold">
                      <span className="truncate">{who(m)}</span>
                      {m.coach && (
                        <span className="shrink-0 rounded-full bg-violet/15 px-1.5 py-0.5 text-[0.6875rem] text-violet">
                          {t("mt.coachTag")}
                        </span>
                      )}
                    </p>
                  )}
                  <p className="whitespace-pre-line break-words">{m.body}</p>
                  <p className="mt-1 text-right text-xs text-muted">{stamp(m.at)}</p>
                </div>
                {m.canDelete && (
                  <button
                    type="button"
                    aria-label={t("crew.options", { name: who(m) })}
                    onClick={() => setOptions(m)}
                    className="press grid h-11 w-11 shrink-0 place-items-center rounded-xl text-muted hover:text-ink"
                  >
                    <Icon name="more" size={18} />
                  </button>
                )}
              </li>
            ))}
          </ol>
        )}
        {!inBox && <div ref={end} />}
      </div>
      {error && (
        <p className="mt-2 shrink-0 text-sm text-warn" role="status">
          {error}
        </p>
      )}
      <form
        onSubmit={(e) => void send(e)}
        className={
          dock
            ? "mt-2 shrink-0 border-t border-line pt-2"
            : pane
              ? "card mt-3 shrink-0 p-2"
              : "card sticky bottom-[var(--nav-h,0px)] mt-3 p-2"
        }
      >
        <label htmlFor={`team-chat-${id}`} className="sr-only">
          {t("mt.write")}
        </label>
        <div className="flex items-end gap-2">
          <textarea
            ref={input}
            id={`team-chat-${id}`}
            value={text}
            rows={1}
            maxLength={MAX}
            placeholder={t("mt.write")}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKey}
            className="max-h-40 min-h-11 min-w-0 flex-1 resize-none rounded-3xl border border-line bg-raised px-4 py-2.5 leading-6"
          />
          <Button
            submit
            disabled={busy || !text.trim()}
            label={t("crew.send")}
            icon="send"
            className="size-11 shrink-0 !rounded-full !px-0"
          >
            {null}
          </Button>
        </div>
      </form>
      <Sheet open={!!options} onClose={() => setOptions(null)} title={t("crew.options", { name: options ? who(options) : "" })}>
        {options && (
          <>
            <p className="whitespace-pre-wrap break-words text-sm text-muted">{options.body}</p>
            <Button kind="danger" icon="trash" className="mt-4 w-full" onClick={() => void remove(options)}>
              {t("crew.deleteIt")}
            </Button>
          </>
        )}
      </Sheet>
    </div>
  );
}
