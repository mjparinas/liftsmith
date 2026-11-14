"use client";

// "A new version is ready" (src/lib/appUpdate.ts; docs/decisions/app-updates.md): a small note at the top of every
// screen but the workout, in the page like friends' check-ins, until the lifter updates or closes it.
import { dismissUpdate, restartNow, updateNow, useAppUpdate } from "@/lib/appUpdate";
import { t } from "@/lib/i18n";
import { haptic } from "@/lib/juice";

import { Icon } from "./icons";

export function UpdateToast({ hidden }: { hidden: boolean }) {
  const phase = useAppUpdate((s) => s.phase);
  if (hidden || phase === "none") return null;
  const ready = phase === "ready";
  const busy = phase === "downloading";
  return (
    <div className="pt-3" data-testid="update-toast">
      <div role="status" className="toast animate-rise flex w-full items-center gap-2 !rounded-2xl py-1.5 pl-3 pr-1">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent/15 text-accent" aria-hidden>
          <Icon name={ready ? "repeat" : "sparkle"} size={18} />
        </span>
        <span className="min-w-0 flex-1 py-1">
          <span className="block break-words text-sm font-semibold">{t(ready ? "x.updateReady" : "x.updateNew")}</span>
          <span className="block text-xs text-muted">
            {t(ready ? "x.updateReadyBody" : busy ? "x.updateDownloading" : "x.updateNewBody")}
          </span>
        </span>
        {!busy && (
          <button
            type="button"
            onClick={() => {
              haptic("tick");
              void (ready ? restartNow() : updateNow());
            }}
            className="press min-h-11 shrink-0 rounded-full px-3 text-sm font-semibold text-accent"
          >
            {t(ready ? "x.updateRestart" : "x.update")}
          </button>
        )}
        <button
          type="button"
          aria-label={t("x.dismiss")}
          onClick={() => {
            haptic("tick");
            dismissUpdate();
          }}
          className="press grid h-11 w-11 shrink-0 place-items-center rounded-full text-muted hover:text-ink"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
