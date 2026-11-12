"use client";

// Settings › Connected apps (#/connections; docs/decisions/connected-apps.md): Health Connect or Apple Health
// (status, what's allowed, last sync, Sync now), the Bluetooth heart rate monitor (a test before the gym),
// the Garmin watch app, Strava, Oura, WHOOP, Withings, Polar and Concept2 (through the account), and the music app for Today's playlist.
// Samsung Health comes in through Health Connect (a line on the Android card says how); bar speed is a camera lab.
import { useEffect, useRef, useState } from "react";

import { platform, useAccount } from "@/lib/auth";
import { CLOUD, type Cloud } from "@/lib/cloud";
import {
  CLOUD_NAME,
  connectCloud,
  disconnectCloud,
  MUSIC_APPS,
  MUSIC_NAME,
  openOutside,
  pullCloud,
  refreshCloud,
  stravaWaiting,
  useCloud,
} from "@/lib/connections";
import { chooseGarmin, GARMIN_STORE_URL, garminStatus, onGarminChange, watchState, type GarminStatus } from "@/lib/garmin";
import {
  allowWorkouts,
  askHealth,
  healthAvailable,
  healthLastSync,
  healthPermissions,
  openHealthPermissions,
  READ,
  workoutsAllowed,
  WRITE,
  type HealthPerm,
} from "@/lib/health";
import { connectHeartRate, HrError, hrMessage, hrSupported, savedHr, saveHr, type HrConnection } from "@/lib/heartRate";
import { relative, t } from "@/lib/i18n";
import { haptic, oops } from "@/lib/juice";
import { useApp } from "@/lib/store";
import type { MusicApp } from "@/lib/types";
import type { MessageKey } from "@/locales/en";

import { go, useRoute } from "./router";
import { Button, Chip, ScreenHeader, Section, SwitchRow } from "./ui";

function ago(ms: number): string {
  const s = Math.round((ms - Date.now()) / 1000);
  if (s > -60) return relative(0, "minute");
  if (s > -3600) return relative(Math.round(s / 60), "minute");
  if (s > -86400) return relative(Math.round(s / 3600), "hour");
  return relative(Math.round(s / 86400), "day");
}

function Status({ on, children }: { on: boolean; children: React.ReactNode }) {
  return (
    <p className="mt-1 flex items-center gap-1.5 text-sm">
      <span aria-hidden className={`inline-block h-2 w-2 rounded-full ${on ? "bg-good" : "bg-faint"}`} />
      <span className={on ? "text-ink" : "text-muted"}>{children}</span>
    </p>
  );
}

// --- Health Connect / Apple Health ---

function HealthCard() {
  const p = platform();
  const store = p === "ios" ? t("conn.health.ios") : t("conn.health.android");
  const [avail, setAvail] = useState<boolean | null>(null);
  const [perms, setPerms] = useState<Awaited<ReturnType<typeof healthPermissions>>>(null);
  const [last, setLast] = useState<number | null>(() => (typeof window === "undefined" ? null : healthLastSync()));
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [workouts, setWorkouts] = useState<boolean | null>(null);

  const check = () =>
    healthAvailable().then(async (a) => {
      setAvail(a);
      setPerms(a ? await healthPermissions() : null);
      setWorkouts(a ? await workoutsAllowed() : null);
      setLast(healthLastSync());
    });
  useEffect(() => {
    void check();
  }, []);

  if (p === "web")
    return (
      <div className="card px-4 py-3">
        <p className="font-semibold">
          {t("conn.health.android")} · {t("conn.health.ios")}
        </p>
        <p className="mt-1 text-sm text-muted">{t("conn.health.web")}</p>
      </div>
    );

  const anyAllowed = !!perms && ((perms.reads?.length ?? 0) > 0 || perms.writes.length > 0 || perms.reads === null);
  // Apple Health never says whether reads were allowed; a sync that ran is the best sign it's connected.
  const connected = p === "ios" ? !!last || !!perms?.writes.length : anyAllowed;

  const sync = async () => {
    if (busy) return;
    setBusy(true);
    setNote(t("conn.syncing"));
    try {
      if (!connected) {
        const r = await askHealth();
        if (r.state !== "granted") {
          setNote(r.state === "denied" ? t("twin.ask.deniedAll", { source: store }) : t("conn.health.missing"));
          return;
        }
      }
      const s = useApp.getState();
      const [a, b] = await Promise.all([s.importHealthDaily(), s.importHealthBody()]);
      haptic("success");
      setNote(a + b ? t("conn.synced", { count: a + b }) : t("conn.upToDate"));
    } catch {
      oops();
      setNote(t("conn.failed"));
    } finally {
      setBusy(false);
      await check();
    }
  };

  const allowed = (k: HealthPerm) => ((WRITE as readonly string[]).includes(k) ? perms?.writes.includes(k) : perms?.reads?.includes(k));

  return (
    <div className="card px-4 py-3">
      <p className="font-semibold">{store}</p>
      {avail === false ? (
        <>
          <Status on={false}>{t("conn.health.missing")}</Status>
          {p === "android" && (
            <Button kind="ghost" className="mt-3 w-full" onClick={() => void openHealthPermissions()}>
              {t("conn.health.install")}
            </Button>
          )}
        </>
      ) : (
        <>
          <Status on={connected}>
            {connected
              ? `${t("conn.connected")} · ${last ? t("conn.lastSync", { when: ago(last) }) : t("conn.neverSynced")}`
              : t("conn.notConnected")}
          </Status>
          <p className="mt-2 text-sm text-muted">{t("conn.health.what")}</p>
          {perms?.reads && (
            <ul className="mt-3 grid grid-cols-1 gap-1 text-sm sm:grid-cols-2">
              {[...READ, ...WRITE].map((k) => (
                <li key={k} className="flex items-center gap-2">
                  <span aria-hidden className={allowed(k) ? "text-good" : "text-faint"}>
                    {allowed(k) ? "✓" : "–"}
                  </span>
                  <span className={allowed(k) ? "" : "text-muted"}>{t(`conn.perm.${k}` as MessageKey)}</span>
                  <span className="sr-only">{allowed(k) ? t("conn.health.allowed") : t("conn.health.notAllowed")}</span>
                </li>
              ))}
              <li className="flex items-center gap-2">
                <span aria-hidden className={workouts ? "text-good" : "text-faint"}>
                  {workouts ? "✓" : "–"}
                </span>
                <span className={workouts ? "" : "text-muted"}>{t("conn.perm.workouts")}</span>
                <span className="sr-only">{workouts ? t("conn.health.allowed") : t("conn.health.notAllowed")}</span>
              </li>
            </ul>
          )}
          {connected && workouts === false && (
            <Button kind="ghost" className="mt-3 w-full" onClick={() => void allowWorkouts().then(() => check())}>
              {t("conn.health.allowWorkouts", { store })}
            </Button>
          )}
          {p === "ios" && <p className="mt-2 text-xs text-muted">{t("conn.health.iosReads")}</p>}
          <Button className="mt-3 w-full" onClick={() => void sync()} disabled={busy}>
            {connected ? t("conn.syncNow") : t("conn.connect")}
          </Button>
          {note && (
            <p className="mt-2 text-sm text-muted" role="status">
              {note}
            </p>
          )}
          {p === "android" ? (
            <Button kind="ghost" className="mt-2 w-full" onClick={() => void openHealthPermissions().then(() => check())}>
              {t("conn.health.manage")}
            </Button>
          ) : (
            <p className="mt-3 text-sm text-muted">{t("conn.health.iosManage")}</p>
          )}
        </>
      )}
      <p className="mt-3 text-xs text-muted">{t("conn.health.via", { store })}</p>
      {p === "android" && <p className="mt-2 text-xs text-muted">{t("conn.health.samsung")}</p>}
    </div>
  );
}

// --- Heart rate monitor ---

function HeartRateCard() {
  const [conn, setConn] = useState<HrConnection | null>(null);
  const [bpm, setBpm] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [last, setLast] = useState<string | null>(() => (typeof window === "undefined" ? null : (savedHr()?.name ?? null)));
  const ref = useRef<HrConnection | null>(null);
  useEffect(
    () => () => {
      void ref.current?.disconnect();
    },
    [],
  );

  if (!hrSupported())
    return (
      <div className="card px-4 py-3">
        <p className="text-sm text-muted">{t("conn.hr.what")}</p>
        <p className="mt-2 text-sm text-muted">{t("conn.hr.web")}</p>
      </div>
    );

  const test = async () => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const c = await connectHeartRate(setBpm, () => {
        setConn(null);
        setBpm(null);
      });
      ref.current = c;
      setConn(c);
      setLast(c.name);
      haptic("success");
    } catch (e) {
      const m = e instanceof HrError ? hrMessage(e.problem, e.device) : hrMessage("failed");
      if (m) {
        setError(m);
        oops();
      }
    } finally {
      setBusy(false);
    }
  };
  const stop = () => {
    void conn?.disconnect();
    ref.current = null;
    setConn(null);
    setBpm(null);
  };

  return (
    <div className="card px-4 py-3">
      <p className="text-sm text-muted">{t("conn.hr.what")}</p>
      {conn ? (
        <p className="display mt-3 text-lg" role="status">
          {bpm ? t("conn.hr.live", { name: conn.name, bpm }) : t("conn.hr.waiting", { name: conn.name })}
        </p>
      ) : (
        last && (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
            <span>{t("conn.hr.last", { name: last })}</span>
            <Button
              kind="quiet"
              className="px-2 py-1"
              onClick={() => {
                saveHr(null);
                setLast(null);
              }}
            >
              {t("conn.hr.forget")}
            </Button>
          </div>
        )
      )}
      {error && (
        <p className="mt-2 text-sm text-warn" role="alert">
          {error}
        </p>
      )}
      <Button kind="ghost" className="mt-3 w-full" icon="heart" disabled={busy} onClick={() => (conn ? stop() : void test())}>
        {conn ? t("conn.hr.stop") : t("conn.hr.test")}
      </Button>
    </div>
  );
}

// --- Strava, Oura, WHOOP, Withings, Polar, Concept2 ---

function CloudRow({ p }: { p: Cloud }) {
  const status = useCloud((s) => s.status);
  const busy = useCloud((s) => s.busy);
  const pulled = useCloud((s) => s.pulled[p]);
  const profile = useApp((s) => s.profile);
  const setProfile = useApp((s) => s.setProfile);
  const [note, setNote] = useState("");
  const link = status?.linked[p];
  const ready = status?.ready[p] ?? false;
  const waiting = p === "strava" && link ? stravaWaiting() : 0;

  const sync = async () => {
    setNote(t("conn.syncing"));
    const n = await pullCloud(true);
    setNote(n ? t("conn.synced", { count: n }) : t("conn.upToDate"));
  };

  return (
    <div className="card mt-3 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold">{CLOUD_NAME[p]}</p>
        {!ready && !link && <span className="rounded-full bg-raised px-2.5 py-0.5 text-xs text-muted">{t("conn.soon")}</span>}
      </div>
      {link ? (
        <Status on>
          {link.who ? t("conn.as", { who: link.who }) : t("conn.since", { when: ago(link.since) })}
          {p !== "strava" && pulled ? ` · ${t("conn.lastSync", { when: ago(pulled) })}` : ""}
        </Status>
      ) : (
        ready && <Status on={false}>{t("conn.notConnected")}</Status>
      )}
      <p className="mt-2 text-sm text-muted">{t(`conn.${p}.what` as MessageKey)}</p>
      {p === "strava" && link && (
        <SwitchRow
          label={t("conn.strava.post")}
          hint={waiting ? t("conn.strava.waiting", { count: waiting }) : undefined}
          on={profile.connections?.stravaPost !== false}
          onChange={(v) => setProfile({ connections: { ...profile.connections, stravaPost: v } })}
        />
      )}
      {link && p !== "strava" && (
        <Button className="mt-3 w-full" onClick={() => void sync()}>
          {t("conn.syncNow")}
        </Button>
      )}
      {note && (
        <p className="mt-2 text-sm text-muted" role="status">
          {note}
        </p>
      )}
      {(link || ready) && (
        <Button
          kind={link ? "ghost" : "primary"}
          className="mt-3 w-full"
          disabled={busy === p}
          onClick={() => void (link ? disconnectCloud(p) : connectCloud(p))}
        >
          {link ? t("conn.disconnect") : t("conn.connect")}
        </Button>
      )}
    </div>
  );
}

function CloudCards() {
  const account = useAccount((s) => s.account);
  const error = useCloud((s) => s.error);
  useEffect(() => {
    void refreshCloud();
    const back = () => {
      if (document.visibilityState === "visible") void refreshCloud();
    };
    document.addEventListener("visibilitychange", back);
    return () => document.removeEventListener("visibilitychange", back);
  }, [account]);
  return (
    <>
      {!account && (
        <div className="card px-4 py-3">
          <p className="text-sm text-muted">{t("conn.cloud.signIn")}</p>
          <Button className="mt-3 w-full" onClick={() => go("account")}>
            {t("conn.cloud.signInButton")}
          </Button>
        </div>
      )}
      {error && (
        <p className="mt-2 text-sm text-warn" role="alert">
          {error}
        </p>
      )}
      {account ? (
        CLOUD.map((p) => <CloudRow key={p} p={p} />)
      ) : (
        <ul className="mt-3 space-y-1 px-1 text-sm text-muted">
          {CLOUD.map((p) => (
            <li key={p}>
              <span className="font-semibold text-ink">{CLOUD_NAME[p]}</span> · {t(`conn.${p}.what` as MessageKey)}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

// --- Garmin watch ---

function GarminCard() {
  const p = platform();
  const [status, setStatus] = useState<GarminStatus | null | undefined>(undefined);
  const check = () => garminStatus().then(setStatus);
  useEffect(() => {
    if (p === "web") return;
    void check();
    // Garmin Connect sends the lifter back after picking a watch or installing our app.
    const back = () => document.visibilityState === "visible" && void check();
    document.addEventListener("visibilitychange", back);
    const off = onGarminChange(() => void check());
    return () => {
      document.removeEventListener("visibilitychange", back);
      off();
    };
  }, [p]);

  if (p === "web")
    return (
      <div className="card px-4 py-3">
        <p className="text-sm text-muted">{t("conn.garmin.web")}</p>
      </div>
    );
  if (status === undefined) return <div className="card px-4 py-3 text-sm text-muted">{t("conn.garmin.checking")}</div>;

  const missing = !status || status.app === "missing";
  const devices = status?.devices ?? [];
  const needsApp = devices.some((w) => watchState(w) === "install");
  return (
    <div className="card px-4 py-3">
      <p className="text-sm text-muted">{t("conn.garmin.what")}</p>
      {missing ? (
        <>
          <Status on={false}>{t("conn.garmin.missing")}</Status>
          <Button kind="ghost" className="mt-3 w-full" onClick={() => void chooseGarmin()}>
            {t("conn.garmin.getConnect")}
          </Button>
        </>
      ) : devices.length === 0 ? (
        <>
          <Status on={false}>{p === "ios" ? t("conn.garmin.noneIos") : t("conn.garmin.none")}</Status>
          <Button kind="ghost" className="mt-3 w-full" onClick={() => void chooseGarmin()}>
            {p === "ios" ? t("conn.garmin.choose") : t("conn.garmin.openConnect")}
          </Button>
        </>
      ) : (
        <>
          <ul className="mt-1">
            {devices.map((w) => (
              <li key={w.name}>
                <Status on={watchState(w) === "ready"}>
                  {w.name} · {t(`conn.garmin.${watchState(w)}`)}
                </Status>
              </li>
            ))}
          </ul>
          {needsApp && !GARMIN_STORE_URL && <p className="mt-2 text-sm text-muted">{t("conn.garmin.soon")}</p>}
          {needsApp && !!GARMIN_STORE_URL && (
            <Button kind="ghost" className="mt-3 w-full" onClick={() => openOutside(GARMIN_STORE_URL)}>
              {t("conn.garmin.getApp")}
            </Button>
          )}
          {p === "ios" && (
            <Button kind="ghost" className="mt-3 w-full" onClick={() => void chooseGarmin()}>
              {t("conn.garmin.change")}
            </Button>
          )}
        </>
      )}
    </div>
  );
}

// --- Music ---

function MusicCard() {
  const profile = useApp((s) => s.profile);
  const setProfile = useApp((s) => s.setProfile);
  const app = profile.connections?.music;
  const pick = (m: MusicApp | undefined) => setProfile({ connections: { ...profile.connections, music: m } });
  return (
    <div className="card px-4 py-3">
      <p className="text-sm text-muted">{t("conn.music.what")}</p>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={t("conn.music.title")}>
        <Chip active={!app} onClick={() => pick(undefined)}>
          {t("conn.music.none")}
        </Chip>
        {MUSIC_APPS.map((m) => (
          <Chip key={m} active={app === m} onClick={() => pick(m)}>
            {MUSIC_NAME[m]}
          </Chip>
        ))}
      </div>
    </div>
  );
}

export function Connections() {
  // #/connections/hr (the health twin's "Pair a monitor") lands on the heart rate monitor. Pairing itself
  // stays one tap there: the phone's Bluetooth picker only opens from a tap.
  const { arg } = useRoute();
  useEffect(() => {
    if (arg === "hr") document.getElementById("conn-hr")?.scrollIntoView?.({ block: "start" });
  }, [arg]);
  return (
    <div className="pb-2">
      <ScreenHeader back={{ label: `‹ ${t("settings.title")}`, onClick: () => go("settings") }} title={t("conn.title")} />
      <p className="mt-1 text-sm text-muted">{t("conn.intro")}</p>
      <Section
        title={{ ios: t("conn.health.ios"), android: t("conn.health.android"), web: t("conn.health.web.title") }[platform()]}
        icon="heart"
      >
        <HealthCard />
      </Section>
      <div id="conn-hr" className="scroll-mt-14">
        <Section title={t("conn.hr.title")} icon="bolt">
          <HeartRateCard />
        </Section>
      </div>
      <Section title={t("conn.garmin.title")} icon="watch">
        <GarminCard />
      </Section>
      <Section title={t("conn.cloud.title")} icon="link">
        <CloudCards />
      </Section>
      <Section title={t("conn.music.title")} icon="play">
        <MusicCard />
      </Section>
    </div>
  );
}
