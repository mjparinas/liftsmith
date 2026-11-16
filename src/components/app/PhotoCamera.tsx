"use client";

// The progress photo camera (Melvin, 2026-11-15: progress photos with compare). A fair comparison needs the same
// framing every time, so the last photo of the pose sits over the live camera as a faint outline to line up with,
// and a self-timer gives time to step back. The photo is checked before it's kept. Pure web code (the camera
// through getUserMedia, which the Android and iOS web views already allow for rep counting and scanning a
// friend's code), so Android, iOS and the web get it together. Nothing leaves the device (photos.ts).
/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useRef, useState } from "react";

import { t } from "@/lib/i18n";
import { haptic, oops, sound } from "@/lib/juice";
import { preparePhoto, type Photo, type Pose } from "@/lib/photos";

import { Icon } from "./icons";
import { Button, Chip, InlineSwitch, Sheet } from "./ui";

/** Self-timer choices in seconds (0 is off). */
export const TIMERS = [0, 3, 10] as const;
const TIMER_KEY = "liftsmith.photoTimer";

function savedTimer(): number {
  try {
    const n = Number(localStorage.getItem(TIMER_KEY));
    return (TIMERS as readonly number[]).includes(n) ? n : 10;
  } catch {
    return 10;
  }
}

/** Whether this browser or web view can show a live camera at all. */
export const canUseCamera = () => typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

export function PhotoCamera({
  open,
  pose,
  ghost,
  onClose,
  onSaved,
  onPickFile,
}: {
  open: boolean;
  pose: Pose;
  /** The last photo of this pose, drawn faintly over the camera to line up with. */
  ghost: Photo | null;
  onClose: () => void;
  onSaved: (p: Photo) => Promise<void>;
  /** Fallback and alternative: pick a photo that's already on the phone. */
  onPickFile: () => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} title={t("photos.cam.title")}>
      {open && <CameraBody pose={pose} ghost={ghost} onClose={onClose} onSaved={onSaved} onPickFile={onPickFile} />}
    </Sheet>
  );
}

function CameraBody({
  pose,
  ghost,
  onClose,
  onSaved,
  onPickFile,
}: {
  pose: Pose;
  ghost: Photo | null;
  onClose: () => void;
  onSaved: (p: Photo) => Promise<void>;
  onPickFile: () => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [facing, setFacing] = useState<"user" | "environment">("user");
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [showGhost, setShowGhost] = useState(true);
  const [timer, setTimer] = useState(savedTimer);
  const [count, setCount] = useState<number | null>(null);
  const [shot, setShot] = useState<Photo | null>(null);
  const [busy, setBusy] = useState(false);
  const ghostUrl = useMemo(() => (ghost ? URL.createObjectURL(ghost.blob) : undefined), [ghost]);
  const shotUrl = useMemo(() => (shot ? URL.createObjectURL(shot.blob) : undefined), [shot]);
  useEffect(() => () => void (ghostUrl && URL.revokeObjectURL(ghostUrl)), [ghostUrl]);
  useEffect(() => () => void (shotUrl && URL.revokeObjectURL(shotUrl)), [shotUrl]);

  const capture = async () => {
    const v = video.current;
    if (!v || !v.videoWidth) return;
    const c = document.createElement("canvas");
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    // Saved the way the world sees you (not mirrored), like the phone's own camera.
    c.getContext("2d")!.drawImage(v, 0, 0);
    const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/jpeg", 0.92));
    if (!blob) return oops();
    try {
      setShot(await preparePhoto(blob, pose));
      haptic("tap");
      sound.log();
    } catch {
      oops();
    }
  };

  useEffect(() => {
    if (shot) return;
    let stream: MediaStream | undefined;
    let done = false;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1920 } },
        });
        if (done || !video.current) return stream.getTracks().forEach((tr) => tr.stop());
        video.current.srcObject = stream;
        await video.current.play();
        if (!done) setReady(true);
      } catch {
        if (!done) setFailed(true);
      }
    })().catch(() => undefined);
    return () => {
      done = true;
      stream?.getTracks().forEach((tr) => tr.stop());
    };
  }, [facing, shot]);

  // The self-timer: one tick a second, then the shot.
  useEffect(() => {
    if (count === null) return;
    sound.tick();
    haptic("select");
    const id = setTimeout(() => {
      if (count <= 1) {
        setCount(null);
        void capture();
      } else setCount(count - 1);
    }, 1000);
    return () => clearTimeout(id);
    // capture reads the live video; it doesn't need to re-run the timer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  const take = () => {
    if (timer) setCount(timer);
    else void capture();
  };

  const keep = async () => {
    if (!shot) return;
    setBusy(true);
    try {
      await onSaved(shot);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  if (failed)
    return (
      <div className="space-y-3">
        <p role="alert" className="text-sm text-muted">
          {t("photos.cam.none")}
        </p>
        <Button className="w-full" onClick={onPickFile}>
          {t("photos.cam.pick")}
        </Button>
      </div>
    );

  if (shot && shotUrl)
    return (
      <div className="space-y-3">
        <img src={shotUrl} alt={t("photos.cam.preview")} className="mx-auto max-h-[60vh] rounded-2xl" />
        <div className="grid grid-cols-2 gap-2">
          <Button
            kind="ghost"
            onClick={() => {
              setReady(false);
              setShot(null);
            }}
          >
            {t("photos.cam.retake")}
          </Button>
          <Button disabled={busy} onClick={() => void keep()}>
            {busy ? t("photos.saving") : t("photos.cam.keep")}
          </Button>
        </div>
      </div>
    );

  // The front camera previews mirrored, like a mirror; the outline is mirrored with it so they line up.
  const mirror = facing === "user" ? { transform: "scaleX(-1)" } : undefined;
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">{t(ghost ? "photos.cam.hint" : "photos.cam.hintFirst")}</p>
      <div className="relative mx-auto aspect-[3/4] max-h-[55vh] overflow-hidden rounded-2xl bg-black" data-no-swipe>
        <div className="absolute inset-0" style={mirror}>
          <video ref={video} muted playsInline aria-label={t("photos.cam.live")} className="h-full w-full object-cover" />
          {ghost && ghostUrl && showGhost && (
            <img src={ghostUrl} alt="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-35" />
          )}
        </div>
        {count !== null && (
          <span
            role="timer"
            aria-live="assertive"
            className="display absolute inset-0 grid place-items-center text-[6rem] text-white drop-shadow-lg"
          >
            {count}
          </span>
        )}
      </div>
      {ghost && <InlineSwitch label={t("photos.cam.ghost")} on={showGhost} onChange={setShowGhost} />}
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t("photos.cam.timer")}>
        <span className="text-sm text-muted">{t("photos.cam.timer")}</span>
        {TIMERS.map((s) => (
          <Chip
            key={s}
            active={timer === s}
            onClick={() => {
              setTimer(s);
              try {
                localStorage.setItem(TIMER_KEY, String(s));
              } catch {}
            }}
          >
            {s ? t("photos.cam.secs", { n: s }) : t("photos.cam.off")}
          </Chip>
        ))}
      </div>
      <div className="flex gap-2">
        <Button className="flex-1" disabled={!ready || count !== null} onClick={take}>
          {count !== null ? t("photos.cam.counting") : t("photos.cam.take")}
        </Button>
        <button
          type="button"
          onClick={() => {
            setReady(false);
            setFacing((f) => (f === "user" ? "environment" : "user"));
          }}
          className="press grid min-h-11 min-w-11 place-items-center rounded-full border border-line bg-surface text-ink"
          aria-label={t("photos.cam.flip")}
        >
          <Icon name="flip" />
        </button>
      </div>
      <Button kind="quiet" className="w-full" onClick={onPickFile}>
        {t("photos.cam.pick")}
      </Button>
    </div>
  );
}
