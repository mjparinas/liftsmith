"use client";

// Share cards when the lifter takes a screenshot (Melvin, 2026-11-15, from a banking app that does the same: "when I
// take a screenshot on any page, the app takes over and does this instead"; docs/decisions/sharing.md "Share cards when
// you take a screenshot"). The screenshot is taken as usual; this sheet slides up over it with branded training cards:
// a span (1M, 3M, 6M, 1Y, All), three card styles to swipe through (totals, where the sets went, best lifts), an eye
// button that hides weights, and the lifter's invite link printed on the card and sent with it. Easy to wave away
// (swipe down, ✕, back), and "Don't show this on screenshots" turns it off (Settings › Your data and privacy has the switch).
// Phones only hear about screenshots (screenshots.ts); the same sheet opens from Progress on every platform.
import { useEffect, useMemo, useRef, useState } from "react";

import { bodyFor } from "@/components/demo/LiftDemo";
import { track } from "@/lib/analytics";
import { useProMember } from "@/lib/billing";
import { t } from "@/lib/i18n";
import { invitePrinted, inviteUrl } from "@/lib/inviteLink";
import { haptic, oops, sound } from "@/lib/juice";
import { trackInvite } from "@/lib/referral";
import { onScreenshot, takeShot } from "@/lib/screenshots";
import { shareText } from "@/lib/shareCards";
import { drawCard, shareCanvas } from "@/lib/shareImage";
import { hasStats, SPANS, statsShares, type Span } from "@/lib/statsCards";
import { useApp } from "@/lib/store";
import { toast } from "@/lib/toast";
import { useNow } from "@/lib/useNow";

import { useGame } from "./Achievements";
import { Icon } from "./icons";
import { loadPrefs, savePrefs, still, useShareContext, type Prefs } from "./ShareSheet";
import { Button, Sheet, SwitchRow } from "./ui";
import { useShareInvite } from "./useShareInvite";
import { useUnlocked } from "./useUnlocked";

const SPAN_KEY = "liftsmith.shotSpan";
function loadSpan(): Span {
  try {
    const s = localStorage.getItem(SPAN_KEY);
    return (SPANS as readonly string[]).includes(s ?? "") ? (s as Span) : "3m";
  } catch {
    return "3m";
  }
}

export type StatsShareFrom = "screenshot" | "progress";

export function StatsShareSheet({ open, onClose, from }: { open: boolean; onClose: () => void; from: StatsShareFrom }) {
  return (
    <Sheet open={open} onClose={onClose} title={t("card.shot.title")}>
      <StatsBody from={from} onClose={onClose} />
    </Sheet>
  );
}

function StatsBody({ from, onClose }: { from: StatsShareFrom; onClose: () => void }) {
  const { events, profile, setProfile } = useApp();
  const ctx = useShareContext(useGame());
  const now = useNow(3_600_000);
  const member = useProMember();
  const invite = useShareInvite();
  const [span, setSpanState] = useState<Span>(loadSpan);
  const [prefs, setPrefsState] = useState<Prefs>(loadPrefs);
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [figures, setFigures] = useState<Record<string, HTMLCanvasElement | null>>({});
  const strip = useRef<HTMLDivElement>(null);
  const setPrefs = (p: Partial<Prefs>) => {
    const next = { ...prefs, ...p };
    setPrefsState(next);
    savePrefs(next);
  };
  const setSpan = (s: Span) => {
    setSpanState(s);
    setIndex(0);
    strip.current?.scrollTo?.({ left: 0 });
    try {
      localStorage.setItem(SPAN_KEY, s);
    } catch {
      // private mode: back to 3M next time
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const items = useMemo(() => statsShares(events, span, ctx, now), [events, span, now, ctx.unit, ctx.accent, ctx.game.level.level]);
  const body = bodyFor(profile.sex);
  const wanted = items.map((i) => i.figure).filter((f): f is string => !!f);
  const wantedKey = wanted.join(",");
  useEffect(() => {
    let live = true;
    for (const id of wanted)
      if (!(id in figures)) void still(id, body).then((c) => live && setFigures((f) => (id in f ? f : { ...f, [id]: c })));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wantedKey, body]);

  const printed = invite.can && prefs.invite && invite.code ? invitePrinted(invite.code) : null;
  const opts = { weights: prefs.weights, name: null };
  const drawn = useMemo(
    () =>
      typeof document === "undefined"
        ? []
        : items.map((item) => {
            const card = item.card(opts);
            const canvas = document.createElement("canvas");
            drawCard(canvas, card, {
              size: "post",
              figure: item.figure ? (figures[item.figure] ?? null) : null,
              pro: member,
              invite: printed,
            });
            let src: string | null = null;
            try {
              src = canvas.toDataURL("image/png");
            } catch {
              src = null;
            }
            return { item, card, canvas, src };
          }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, figures, prefs.weights, member, printed],
  );
  const current = drawn[Math.min(index, drawn.length - 1)];

  const onScroll = () => {
    const el = strip.current;
    const first = el?.firstElementChild as HTMLElement | null;
    if (!el || !first) return;
    const step = first.offsetWidth + 12;
    setIndex(Math.max(0, Math.min(drawn.length - 1, Math.round(el.scrollLeft / step))));
  };

  const share = async () => {
    if (!current || busy) return;
    setBusy(true);
    haptic("tap");
    const code = invite.can && prefs.invite ? await invite.get() : null;
    const url = code ? inviteUrl(code) : undefined;
    const how = await shareCanvas(current.canvas, current.item.file, shareText(current.card), url);
    setBusy(false);
    if (url && how !== "cancelled" && how !== "failed") trackInvite(from === "screenshot" ? "screenshot" : "card");
    track("feature", { name: "share_card", detail: `${current.item.id}:${span}:${how}:${from}` });
    if (how === "failed") oops();
    else if (how !== "cancelled") sound.done();
    if (how === "download") toast(t("card.saved"));
    if (how === "failed") toast(t("card.failed"));
  };

  const turnOff = () => {
    setProfile({ shotShare: false });
    track("feature", { name: "screenshot_share", detail: "off" });
    toast(t("card.shot.offDone"));
    onClose();
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <div role="group" aria-label={t("card.shot.spanLabel")} className="flex flex-1 flex-wrap gap-1">
          {SPANS.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={s === span}
              aria-label={t(`card.shot.span.${s}`)}
              onClick={() => {
                haptic("select");
                sound.tick();
                setSpan(s);
              }}
              className={`press min-h-11 min-w-11 rounded-full px-3 text-sm font-semibold ${s === span ? "bg-raised text-ink ring-1 ring-line" : "text-muted"}`}
            >
              {t(`card.shot.tab.${s}`)}
            </button>
          ))}
        </div>
        <button
          type="button"
          aria-pressed={!prefs.weights}
          aria-label={t("card.shot.hide")}
          title={t("card.shot.hide")}
          onClick={() => {
            haptic("toggle");
            setPrefs({ weights: !prefs.weights });
          }}
          className={`press flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${prefs.weights ? "text-muted" : "bg-raised text-ink ring-1 ring-line"}`}
        >
          <Icon name={prefs.weights ? "eye" : "eyeOff"} size={22} />
        </button>
      </div>

      {drawn.length ? (
        <>
          <div
            ref={strip}
            onScroll={onScroll}
            data-no-swipe
            // A scrolling region with cards to read: reachable and scrollable by keyboard (arrow keys).
            tabIndex={0}
            role="region"
            aria-label={t("card.shot.cards")}
            className="-mx-5 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-[10%] pb-2 [scrollbar-width:none]"
          >
            {drawn.map(({ item, card, src }) => (
              <div key={item.id} className="w-[80%] shrink-0 snap-center">
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element -- a data URL drawn on the device
                  <img
                    src={src}
                    alt={t("card.preview", { headline: card.headline })}
                    className="w-full rounded-2xl border border-line shadow-lg"
                  />
                ) : (
                  <div className="flex aspect-[4/5] items-center justify-center rounded-2xl border border-line bg-surface p-4 text-center font-semibold">
                    {card.headline}
                  </div>
                )}
              </div>
            ))}
          </div>
          {drawn.length > 1 && (
            <div className="mt-2 flex justify-center gap-1.5" aria-hidden="true">
              {drawn.map(({ item }, i) => (
                <span key={item.id} className={`h-1.5 w-1.5 rounded-full ${i === index ? "bg-ink" : "bg-line"}`} />
              ))}
            </div>
          )}
          <p className="sr-only" aria-live="polite">
            {current ? t("card.shot.position", { n: index + 1, total: drawn.length, name: current.item.label }) : ""}
          </p>
        </>
      ) : (
        <p className="card mt-4 p-4 text-center text-sm text-muted">{t("card.shot.none")}</p>
      )}

      {invite.can && (
        <SwitchRow label={t("card.invite")} hint={t("card.inviteNote")} on={prefs.invite} onChange={(v) => setPrefs({ invite: v })} />
      )}
      <Button className="mt-4 w-full py-4" icon="share" disabled={busy || !current} onClick={() => void share()}>
        {t("card.share")}
      </Button>
      {from === "screenshot" && (
        <Button kind="quiet" className="mt-2 w-full" onClick={turnOff}>
          {t("card.shot.off")}
        </Button>
      )}
    </div>
  );
}

/**
 * Listens for screenshots while the app is open and offers the sheet (phones only, screenshots.ts). Not during a
 * workout or setup, not over another sheet, not twice within 20 seconds, and only once there's a workout to share.
 */
export function ScreenshotShare({ route }: { route: string }) {
  // Waits for a new lifter's third workout, with Friends and the invite (unlocks.ts).
  const unlocked = useUnlocked("friends");
  const enabled = useApp((s) => s.profile.shotShare !== false) && unlocked;
  const has = useApp((s) => hasStats(s.events));
  const [open, setOpen] = useState(false);
  const last = useRef<number | null>(null);
  const where = useRef(route);
  useEffect(() => {
    where.current = route;
  }, [route]);
  useEffect(() => {
    if (!enabled || !has) return;
    return onScreenshot(() => {
      if (where.current === "workout" || where.current === "setup") return;
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;
      const at = Date.now();
      if (!takeShot(at, last.current)) return;
      last.current = at;
      track("feature", { name: "screenshot_share", detail: "open" });
      setOpen(true);
    });
  }, [enabled, has]);
  return <StatsShareSheet open={open} onClose={() => setOpen(false)} from="screenshot" />;
}
