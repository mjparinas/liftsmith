"use client";

// Sonos (a lab, `labSonos`; docs/decisions/sonos.md). `SonosSettings` is the speaker, the volumes and Follow my
// workout, shown in Connected apps under Sonos and in the workout's Sonos sheet. `SonosBar` sits on the workout
// screen under the set or rest card: what's playing, previous, play or pause, next and volume − / +.
import { useEffect, useRef, useState } from "react";

import { t } from "@/lib/i18n";
import { clampVol, refreshSonos, setSonosPrefs, sonosSend, useSonos } from "@/lib/sonos";
import { useVisible } from "@/lib/visibility";

import { Icon, type IconName } from "./icons";
import { Bump, BumpField, Chip, InlineSwitch, Sheet } from "./ui";

function SonosError() {
  const error = useSonos((s) => s.error);
  if (!error) return null;
  return (
    <p className="mt-2 text-sm text-warn" role="alert">
      {error === "unlinked" ? t("conn.sonos.unlinked") : error === "offline" ? t("conn.offline") : t("conn.sonos.failed")}
    </p>
  );
}

export function SonosSettings() {
  const prefs = useSonos((s) => s.prefs);
  const state = useSonos((s) => s.state);
  const loading = useSonos((s) => s.loading);
  useEffect(() => {
    void refreshSonos();
  }, []);
  const groups = state?.groups ?? [];
  const favourites = (state?.favourites ?? []).filter((f) => {
    const g = groups.find((x) => x.id === prefs.group);
    return !g || f.household === g.household;
  });
  return (
    <div className="mt-3 space-y-3">
      <div>
        <p className="text-sm font-semibold">{t("conn.sonos.speaker")}</p>
        {groups.length ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {groups.map((g) => (
              <Chip
                key={g.id}
                active={g.id === prefs.group}
                onClick={() => {
                  setSonosPrefs({ group: g.id, groupName: g.name });
                  void refreshSonos();
                }}
              >
                {g.name}
              </Chip>
            ))}
          </div>
        ) : (
          !loading && state && <p className="mt-1 text-sm text-muted">{t("conn.sonos.noSpeakers")}</p>
        )}
      </div>
      <InlineSwitch
        label={t("conn.sonos.follow")}
        hint={t("conn.sonos.followHint")}
        on={prefs.follow}
        onChange={(v) => setSonosPrefs({ follow: v })}
      />
      {prefs.follow && (
        <>
          <div>
            <p className="text-sm font-semibold">{t("conn.sonos.setVolume")}</p>
            <BumpField
              className="mt-1"
              value={String(prefs.setVolume)}
              onChange={(v) => setSonosPrefs({ setVolume: Number(v) })}
              step={5}
              start={40}
              max={100}
              label={t("conn.sonos.setVolume")}
            />
          </div>
          <div>
            <p className="text-sm font-semibold">{t("conn.sonos.restVolume")}</p>
            <BumpField
              className="mt-1"
              value={String(prefs.restVolume)}
              onChange={(v) => setSonosPrefs({ restVolume: Number(v) })}
              step={5}
              start={25}
              max={100}
              label={t("conn.sonos.restVolume")}
            />
          </div>
          <div>
            <p className="text-sm font-semibold">{t("conn.sonos.start")}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Chip active={!prefs.startFavourite} onClick={() => setSonosPrefs({ startFavourite: null })}>
                {t("conn.sonos.keep")}
              </Chip>
              {favourites.map((f) => (
                <Chip key={f.id} active={prefs.startFavourite === f.id} onClick={() => setSonosPrefs({ startFavourite: f.id })}>
                  {f.name}
                </Chip>
              ))}
            </div>
          </div>
          <InlineSwitch label={t("conn.sonos.pauseAtEnd")} on={prefs.pauseAtEnd} onChange={(v) => setSonosPrefs({ pauseAtEnd: v })} />
        </>
      )}
      <SonosError />
    </div>
  );
}

function Round({ icon, label, onClick, big }: { icon: IconName; label: string; onClick: () => void; big?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`press grid shrink-0 place-items-center rounded-full ${big ? "h-12 w-12 bg-accent/15 text-accent" : "h-11 w-11 text-ink"}`}
    >
      <Icon name={icon} size={big ? 24 : 20} />
    </button>
  );
}

/** How long the volume waits after the last − / + before it's sent, so a held button sends one change, not twenty. */
const VOLUME_WAIT_MS = 350;

export function SonosBar({ resting }: { resting: boolean }) {
  const state = useSonos((s) => s.state);
  const prefs = useSonos((s) => s.prefs);
  const visible = useVisible();
  const [open, setOpen] = useState(false);
  const [vol, setVol] = useState<number | null>(null);
  const wait = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // Read again when the screen opens, comes back, and when rest starts or ends (a good moment for a new song name).
  useEffect(() => {
    if (visible) void refreshSonos();
  }, [visible, resting]);
  useEffect(() => () => clearTimeout(wait.current), []);
  const now = state?.now && state.now.group === prefs.group ? state.now : null;
  const group = state?.groups.find((g) => g.id === prefs.group);
  const shown = vol ?? now?.volume ?? null;

  const bump = (d: 1 | -1) => {
    if (shown === null) return false;
    const next = clampVol(shown + d * 5);
    if (next === shown) return false;
    setVol(next);
    clearTimeout(wait.current);
    wait.current = setTimeout(() => {
      setVol(null);
      void sonosSend({ do: "volume", level: next });
    }, VOLUME_WAIT_MS);
    return true;
  };

  return (
    <section className="card mt-3 px-3 py-2.5" aria-label="Sonos" data-testid="sonos-bar">
      <div className="flex items-center gap-3">
        {now?.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- album art from the music service, any host
          <img src={now.image} alt="" className="h-11 w-11 shrink-0 rounded-xl object-cover" referrerPolicy="no-referrer" />
        ) : (
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-raised text-muted" aria-hidden>
            <Icon name="speaker" size={20} />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{now?.track ?? t("conn.sonos.nothing")}</p>
          <p className="truncate text-xs text-muted">
            {[now?.artist, group ? t("conn.sonos.on", { speaker: group.name }) : null].filter(Boolean).join(" · ")}
          </p>
        </div>
        <Round icon="settings" label={t("conn.sonos.settings")} onClick={() => setOpen(true)} />
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-1">
        <div className="flex items-center gap-1">
          <Round icon="skipPrev" label={t("conn.sonos.previous")} onClick={() => void sonosSend({ do: "previous" })} />
          <Round
            big
            icon={now?.playing ? "pause" : "play"}
            label={now?.playing ? t("conn.sonos.pause") : t("conn.sonos.play")}
            onClick={() => void sonosSend({ do: now?.playing ? "pause" : "play" })}
          />
          <Round icon="skipNext" label={t("conn.sonos.next")} onClick={() => void sonosSend({ do: "next" })} />
        </div>
        {shown === null ? (
          <span className="px-2 text-xs text-muted">{now ? t("conn.sonos.fixed") : ""}</span>
        ) : (
          <div className="flex items-center gap-2">
            <Bump dir={-1} size="sm" aria={t("conn.sonos.quieter")} onStep={() => bump(-1)} />
            <span className="num w-8 text-center font-semibold">
              <span className="sr-only">{t("conn.sonos.volume")} </span>
              {shown}
            </span>
            <Bump dir={1} size="sm" aria={t("conn.sonos.louder")} onStep={() => bump(1)} />
          </div>
        )}
      </div>
      <SonosError />
      <Sheet open={open} onClose={() => setOpen(false)} title={t("conn.sonos.settings")}>
        <SonosSettings />
      </Sheet>
    </section>
  );
}
