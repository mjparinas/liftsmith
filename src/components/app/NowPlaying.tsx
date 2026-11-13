"use client";

// The Now playing control (src/lib/nowPlaying.ts; docs/decisions/now-playing.md): one row with what's playing
// and previous, play or pause, next, on Today and the workout screen. It shows only while a music app has
// something playing or paused, and never when the switch in Settings › Workout is off. `NowPlayingSetting` is that
// switch, plus the one button that turns on song names (Android's notification access, iOS's Apple Music).
import { useEffect, useState } from "react";

import { platform } from "@/lib/auth";
import { t } from "@/lib/i18n";
import { haptic } from "@/lib/juice";
import {
  askNowAccess,
  nowAccess,
  nowPlayingOn,
  nowSend,
  useNowPlaying,
  useNowPlayingWatch,
  type NowAccess,
  type NowCommand,
} from "@/lib/nowPlaying";
import { useApp } from "@/lib/store";
import { useVisible } from "@/lib/visibility";

import { Icon, type IconName } from "./icons";
import { Button, SwitchRow } from "./ui";

function Round({ icon, label, what, big }: { icon: IconName; label: string; what: NowCommand; big?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => {
        haptic("tick");
        void nowSend(what);
      }}
      className={`press grid shrink-0 place-items-center rounded-full ${big ? "h-11 w-11 bg-accent/15 text-accent" : "h-11 w-11 text-ink"}`}
    >
      <Icon name={icon} size={big ? 22 : 20} />
    </button>
  );
}

export function NowPlayingBar({ className = "" }: { className?: string }) {
  const profile = useApp((s) => s.profile);
  const on = nowPlayingOn(profile);
  useNowPlayingWatch(on);
  const now = useNowPlaying((s) => s.now);
  if (!on || !now) return null;
  const title = now.title ?? (now.playing ? t("now.playing") : t("now.paused"));
  const line = [now.artist, now.app].filter(Boolean).join(" · ");
  return (
    <section className={`card flex items-center gap-2 px-3 py-2 ${className}`} aria-label={t("now.title")} data-testid="now-playing">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-raised text-cyan" aria-hidden>
        <Icon name="play" size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{title}</p>
        {line && <p className="truncate text-xs text-muted">{line}</p>}
      </div>
      <Round icon="skipPrev" label={t("now.previous")} what="previous" />
      <Round
        big
        icon={now.playing ? "pause" : "play"}
        label={now.playing ? t("now.pause") : t("now.play")}
        what={now.playing ? "pause" : "play"}
      />
      <Round icon="skipNext" label={t("now.next")} what="next" />
    </section>
  );
}

/** Settings › Workout: the switch, and while it's on, song names (asked for here, never on Today or during a set). */
export function NowPlayingSetting({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  const ios = platform() === "ios";
  const visible = useVisible();
  const [access, setAccess] = useState<NowAccess | null>(null);
  // Read again on return, because Android's notification access is switched on in its own settings page.
  useEffect(() => {
    if (on && visible) void nowAccess().then(setAccess);
  }, [on, visible]);
  return (
    <>
      <SwitchRow label={t("now.setting")} hint={ios ? t("now.hintIos") : t("now.hint")} on={on} onChange={onChange} />
      {on && access && !access.granted && (
        <div className="card mt-2 px-4 py-3">
          <p className="text-sm text-muted">{ios ? t("now.namesIos") : t("now.names")}</p>
          <Button kind="ghost" className="mt-2" onClick={() => void askNowAccess().then((a) => a && setAccess(a))}>
            {ios ? (access.canAsk ? t("now.allowIos") : t("now.settingsIos")) : t("now.allow")}
          </Button>
        </div>
      )}
    </>
  );
}
