"use client";

// Scan to follow (Friends gap list 3, item 4; docs/decisions/friends.md). People › Scan to follow opens one sheet:
// the lifter's own QR code (their invite link, so whoever scans it and the lifter follow each other) and a
// scanner for someone else's. Meeting at the gym takes one scan, no handle typing. The phone's own camera app can
// scan the code too: the link opens the app on Android (App Links) and the web app elsewhere.
import jsQR from "jsqr";
import { useEffect, useRef, useState } from "react";

import { QrCode } from "@/components/QrCode";
import { track } from "@/lib/analytics";
import { t } from "@/lib/i18n";
import { inviteUrl } from "@/lib/invite";
import { haptic, oops } from "@/lib/juice";
import { scanTarget, type ScanTarget } from "@/lib/scanLink";
import { social, socialError } from "@/lib/social";

import { go } from "./router";
import { Button, Sheet } from "./ui";

/** How often a camera frame is checked (the browser's own detector or jsQR, both on the device). */
const SCAN_EVERY_MS = 200;

interface Detector {
  detect(source: CanvasImageSource): Promise<{ rawValue: string }[]>;
}
type DetectorCtor = new (o: { formats: string[] }) => Detector;

/** Mounted only while open, so each opening starts on the lifter's own code. */
export function ScanToFollow({ onClose }: { onClose: () => void }) {
  const [code, setCode] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    social<{ code: string }>("invite")
      .then((r) => live && setCode(r.code))
      .catch((e: unknown) => live && setNote(socialError(e)));
    return () => {
      live = false;
    };
  }, []);
  const found = (target: ScanTarget) => {
    haptic("success");
    track("feature", { name: "social_scan", value: target.screen });
    onClose();
    go(target.screen, target.arg);
  };
  return (
    <Sheet open onClose={onClose} title={t("social.scan.title")}>
      {scanning ? (
        <Scanner onFound={found} onError={(m) => (setScanning(false), setNote(m))} />
      ) : (
        <div className="mx-auto w-56 max-w-full rounded-2xl bg-white p-2">
          {code ? (
            <QrCode text={inviteUrl(code)} label={t("social.scan.myCode")} className="block h-auto w-full" />
          ) : (
            <div className="aspect-square w-full" />
          )}
        </div>
      )}
      <p className="mt-3 text-center text-sm text-muted">{t(scanning ? "social.scan.aim" : "social.scan.hint")}</p>
      {note && (
        <p role="status" className="mt-2 text-center text-sm text-muted">
          {note}
        </p>
      )}
      <Button
        kind={scanning ? "ghost" : "primary"}
        icon={scanning ? undefined : "camera"}
        className="mt-4 w-full"
        onClick={() => {
          haptic("tick");
          setNote(null);
          setScanning((v) => !v);
        }}
      >
        {t(scanning ? "social.scan.showMine" : "social.scan.theirs")}
      </Button>
    </Sheet>
  );
}

/** The back camera, checked a few times a second for one of our links. Stops the camera when it closes. */
function Scanner({ onFound, onError }: { onFound: (t: ScanTarget) => void; onError: (message: string) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [wrong, setWrong] = useState(false);
  useEffect(() => {
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let done = false;
    const canvas = document.createElement("canvas");
    const Ctor = (window as unknown as { BarcodeDetector?: DetectorCtor }).BarcodeDetector;
    let detector: Detector | null = null;
    try {
      detector = Ctor ? new Ctor({ formats: ["qr_code"] }) : null;
    } catch {
      detector = null;
    }
    const read = async (v: HTMLVideoElement): Promise<string | null> => {
      if (detector) {
        const [hit] = await detector.detect(v).catch(() => []);
        if (hit) return hit.rawValue;
        return null;
      }
      const w = v.videoWidth;
      const h = v.videoHeight;
      if (!w || !h) return null;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return null;
      ctx.drawImage(v, 0, 0, w, h);
      return jsQR(ctx.getImageData(0, 0, w, h).data, w, h)?.data ?? null;
    };
    const tick = async () => {
      const v = video.current;
      if (done || !v) return;
      // While the app is away the camera has stopped anyway; nothing to read until it's back.
      const text = document.visibilityState === "visible" ? await read(v) : null;
      if (done) return;
      if (text) {
        const target = scanTarget(text, location.hostname);
        if (target) {
          done = true;
          onFound(target);
          return;
        }
        setWrong(true);
      }
      timer = setTimeout(() => void tick(), SCAN_EVERY_MS);
    };
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: "environment" } });
        if (done || !video.current) return;
        video.current.srcObject = stream;
        await video.current.play();
        void tick();
      } catch {
        if (!done) {
          oops();
          onError(t("social.scan.noCamera"));
        }
      }
    })().catch(() => undefined);
    return () => {
      done = true;
      clearTimeout(timer);
      stream?.getTracks().forEach((tr) => tr.stop());
    };
    // The callbacks come from the sheet and stay the same while it's open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <>
      <div className="relative mx-auto aspect-square w-56 max-w-full overflow-hidden rounded-2xl bg-black">
        <video ref={video} muted playsInline aria-label={t("social.scan.camera")} className="h-full w-full object-cover" />
        <div aria-hidden className="pointer-events-none absolute inset-6 rounded-xl border-2 border-white/80" />
      </div>
      {wrong && (
        <p role="status" className="mt-2 text-center text-sm text-muted">
          {t("social.scan.notOurs")}
        </p>
      )}
    </>
  );
}
