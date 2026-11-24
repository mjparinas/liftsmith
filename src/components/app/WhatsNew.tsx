"use client";

// What's new (src/lib/appNews.ts; docs/decisions/whats-new.md): the newest release's changes in a sheet, opened from
// Settings › Help › Version, and a small note on Today once after an update. Changes a lifter hasn't unlocked yet
// (unlocks.ts) or that don't apply to them are left out, and so are their counts.
import { useEffect, useMemo, useState, type CSSProperties } from "react";

import { CARD_TITLE, SECTION_LABEL } from "@/components/titles";
import { autoAction, countKinds, KINDS, LATEST, markSeen, readSeen, visibleChanges, type AppChange, type NewsKind } from "@/lib/appNews";
import { checkForUpdate, restartNow, updateNow, useAppUpdate } from "@/lib/appUpdate";
import { BRAND } from "@/lib/brand";
import { versionLabel } from "@/lib/build";
import { communityOn } from "@/lib/community";
import { date, t } from "@/lib/i18n";
import { installInfo, type InstallInfo } from "@/lib/installInfo";
import { haptic, isNative } from "@/lib/juice";
import { useApp } from "@/lib/store";
import { isTeen } from "@/lib/teen";
import { isUnlocked } from "@/lib/unlocks";
import type { MessageKey } from "@/locales/en";

import { Icon } from "./icons";
import { HUE } from "./theme";
import { Button, Sheet } from "./ui";

const TINT: Record<NewsKind, string> = { new: HUE.mint, better: HUE.accent, fixed: HUE.violet };

/** The newest release's changes this lifter can see. */
export function useNews(): AppChange[] {
  const profile = useApp((s) => s.profile);
  const workouts = useApp((s) => s.stats.sessions.length);
  return useMemo(
    () =>
      visibleChanges(LATEST, {
        unlocked: (id) => isUnlocked(id, profile, workouts),
        community: communityOn(),
        teen: isTeen(profile),
        native: isNative(),
      }),
    [profile, workouts],
  );
}

/** "3 new · 2 better · 1 fixed", leaving out a kind with none. */
export function newsSummary(changes: readonly AppChange[]): string {
  const n = countKinds(changes);
  return KINDS.filter((k) => n[k] > 0)
    .map((k) => t(`wn.count.${k}`, { count: n[k] }))
    .join(" · ");
}

function useVersion(): string {
  const [native, setNative] = useState<InstallInfo | null>(null);
  useEffect(() => {
    let live = true;
    void installInfo().then((i) => live && setNative(i));
    return () => {
      live = false;
    };
  }, []);
  return versionLabel(native);
}

const releaseDate = () => date(new Date(`${LATEST.day}T12:00:00Z`), { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export function WhatsNewSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const changes = useNews();
  const version = useVersion();
  useEffect(() => {
    if (open) markSeen();
  }, [open]);
  return (
    <Sheet open={open} onClose={onClose} title={t("wn.title")}>
      <div className="space-y-5" data-testid="whats-new">
        <div className="card-tint p-4" style={{ "--tint": HUE.accent } as CSSProperties}>
          <p className={`${SECTION_LABEL} !text-accent`}>{t("wn.kicker", { brand: BRAND.name, date: releaseDate() })}</p>
          <p className="display mt-1 text-2xl">{t("wn.version", { version })}</p>
          <p className="mt-1 text-sm text-muted tabular-nums">{newsSummary(changes)}</p>
        </div>
        {KINDS.map((kind) => {
          const items = changes.filter((c) => c.kind === kind);
          if (!items.length) return null;
          return (
            <section key={kind} aria-labelledby={`wn-${kind}`}>
              <h3
                id={`wn-${kind}`}
                className="inline-block rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-[0.12em] text-ink"
                style={{
                  borderColor: `color-mix(in srgb, ${TINT[kind]} 50%, transparent)`,
                  background: `color-mix(in srgb, ${TINT[kind]} 16%, transparent)`,
                }}
              >
                {t(`wn.kind.${kind}`)}
              </h3>
              <ul className="mt-2 space-y-2">
                {items.map((c) => (
                  <li key={c.id} className="card flex gap-3 p-4">
                    <span
                      aria-hidden
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
                      style={{ background: `color-mix(in srgb, ${TINT[kind]} 16%, transparent)`, color: TINT[kind] }}
                    >
                      <Icon name={c.icon} size={20} />
                    </span>
                    <span className="min-w-0">
                      <span className={`block ${CARD_TITLE} !text-base`}>{t(`wn.c.${c.id}.title` as MessageKey)}</span>
                      <span className="mt-0.5 block text-sm text-muted">{t(`wn.c.${c.id}.body` as MessageKey)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
        <Button className="w-full" onClick={onClose}>
          {t("wn.go")}
        </Button>
      </div>
    </Sheet>
  );
}

/** Settings › Help: the version, What's new, and on the phones Check for updates / Install (appUpdate.ts). */
export function VersionRow() {
  const [open, setOpen] = useState(false);
  const version = useVersion();
  const native = isNative();
  const phase = useAppUpdate((s) => s.phase);
  const [checking, setChecking] = useState(false);
  const [note, setNote] = useState<"idle" | "current" | "error">("idle");
  const busy = checking || phase === "downloading";
  const canInstall = phase === "available" || phase === "ready" || phase === "downloading";
  const status =
    phase === "ready"
      ? t("x.updateReadyBody")
      : phase === "downloading"
        ? t("x.updateDownloading")
        : phase === "available"
          ? t("x.updateNewBody")
          : note === "current"
            ? t("wn.current")
            : note === "error"
              ? t("wn.checkFail")
              : null;
  const onCheck = async () => {
    haptic("tick");
    setChecking(true);
    setNote("idle");
    const result = await checkForUpdate(Date.now(), { force: true });
    setChecking(false);
    if (result === "upToDate") setNote("current");
    else if (result === "error") setNote("error");
    else setNote("idle");
  };
  const onInstall = () => {
    haptic("tick");
    void (phase === "ready" ? restartNow() : updateNow());
  };
  return (
    <div className="card space-y-3 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{t("wn.row")}</span>
          <span className="block text-sm text-muted tabular-nums">{version}</span>
        </span>
        <Button kind="ghost" className="min-h-11 shrink-0 !rounded-full px-4" onClick={() => setOpen(true)}>
          {t("wn.open")}
        </Button>
      </div>
      {native && (
        <div className="flex items-center gap-3 border-t border-line pt-3">
          <span className="min-w-0 flex-1 text-sm text-muted">{status ?? "\u00a0"}</span>
          {canInstall ? (
            <Button kind="ghost" className="min-h-11 shrink-0 !rounded-full px-4" disabled={busy && phase !== "ready"} onClick={onInstall}>
              {phase === "ready" ? t("x.updateRestart") : t("wn.install")}
            </Button>
          ) : (
            <Button kind="ghost" className="min-h-11 shrink-0 !rounded-full px-4" disabled={busy} onClick={() => void onCheck()}>
              {checking ? t("wn.checking") : t("wn.check")}
            </Button>
          )}
        </div>
      )}
      <WhatsNewSheet open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

/**
 * Once after an update, a small note at the top of Today (like the update note, in the page rather than over it):
 * See all opens the sheet, ✕ closes it, and either way it doesn't come back until the next release. A lifter
 * with no workouts yet never sees it (appNews.ts `autoAction`).
 */
export function WhatsNewNote() {
  const changes = useNews();
  const workouts = useApp((s) => s.stats.sessions.length);
  // Decided once when Today opens: a workout finished meanwhile doesn't pop it up.
  const [act] = useState(() => autoAction(readSeen(), LATEST.day, workouts));
  const [shown, setShown] = useState(act === "show" && changes.length > 0);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (act !== "none" && !shown) markSeen();
  }, [act, shown]);
  if (!shown) return null;
  const close = () => {
    markSeen();
    setShown(false);
  };
  return (
    <div className="pt-3" data-testid="whats-new-note">
      <div role="status" className="toast animate-rise flex w-full items-center gap-2 !rounded-2xl py-1.5 pl-3 pr-1">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent/15 text-accent" aria-hidden>
          <Icon name="sparkle" size={18} />
        </span>
        <span className="min-w-0 flex-1 py-1">
          <span className="block break-words text-sm font-semibold">{t("wn.note", { brand: BRAND.name })}</span>
          <span className="block text-xs text-muted">{newsSummary(changes)}</span>
        </span>
        <button
          type="button"
          onClick={() => {
            haptic("tick");
            setOpen(true);
          }}
          className="press min-h-11 shrink-0 rounded-full px-3 text-sm font-semibold text-accent"
        >
          {t("wn.see")}
        </button>
        <button
          type="button"
          aria-label={t("x.dismiss")}
          onClick={() => {
            haptic("tick");
            close();
          }}
          className="press grid h-11 w-11 shrink-0 place-items-center rounded-full text-muted hover:text-ink"
        >
          <Icon name="close" size={18} />
        </button>
      </div>
      <WhatsNewSheet
        open={open}
        onClose={() => {
          setOpen(false);
          close();
        }}
      />
    </div>
  );
}
