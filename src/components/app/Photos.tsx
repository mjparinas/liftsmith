"use client";

// Body weight and progress photos (#/photos). Weigh-ins are events (they sync with the user's own data
// like everything else); photos never leave this phone (photos.ts) except in a backup file the lifter asks for.
// Compare any two photos of a pose, with a wipe slider or side by side, each with the weight on its day; take
// new ones with the last one as a faint outline to line up with (PhotoCamera.tsx); adults can share the pair as
// one image. Docs: docs/decisions/progress-photos.md. Plain <img> on purpose: photos are local blob URLs.
/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useRef, useState } from "react";

import { BRAND } from "@/lib/brand";
import { date, t } from "@/lib/i18n";
import { haptic, oops } from "@/lib/juice";
import {
  deletePhoto,
  drawSideBySide,
  listPhotos,
  nextPhotoDue,
  ofPose,
  pickPair,
  preparePhoto,
  savePhoto,
  stepPair,
  weightNear,
  type Photo,
  type Pose,
} from "@/lib/photos";
import { shareCanvas } from "@/lib/shareImage";
import { useApp } from "@/lib/store";
import { parseBodyFat } from "@/lib/tdee";
import { isTeen } from "@/lib/teen";
import type { BodyweightEvent } from "@/lib/types";
import { fmtNum, fromKg, plainNum, toKg } from "@/lib/units";
import { useNow } from "@/lib/useNow";

import { BodyFatField } from "./BodyFatField";
import { Icon } from "./icons";
import { Measurements } from "./Measurements";
import { canUseCamera, PhotoCamera } from "./PhotoCamera";
import { go } from "./router";
import { BumpField, Button, Chip, ScreenHeader, Section } from "./ui";

function useObjectUrl(blob: Blob | undefined): string | undefined {
  const url = useMemo(() => (blob ? URL.createObjectURL(blob) : undefined), [blob]);
  useEffect(() => () => void (url && URL.revokeObjectURL(url)), [url]);
  return url;
}

export function Photos() {
  const { events, profile, logBodyweight } = useApp();
  const unit = profile.unit;
  const weighIns = useMemo(() => events.filter((e): e is BodyweightEvent => e.type === "bodyweight").sort((a, b) => a.at - b.at), [events]);
  const [value, setValue] = useState(plainNum(fromKg(profile.bodyweight, unit)));
  const [fat, setFat] = useState("");
  const [fatError, setFatError] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [pose, setPose] = useState<Pose>("front");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [camera, setCamera] = useState(false);
  const [mode, setModeState] = useState<CompareMode>(savedMode);
  const setMode = (m: CompareMode) => {
    setModeState(m);
    try {
      localStorage.setItem(MODE_KEY, m);
    } catch {}
  };
  // The chosen pair per pose; null means the default (first and latest).
  const [chosen, setChosen] = useState<Partial<Record<Pose, { before?: string; after?: string }>>>({});
  const file = useRef<HTMLInputElement>(null);
  const reload = () =>
    void listPhotos()
      .then(setPhotos)
      .catch(() => setPhotos([]));
  useEffect(reload, []);

  const save = () => {
    const kg = toKg(Number(value.replace(",", ".")), unit);
    const pct = parseBodyFat(fat);
    setFatError(fat.trim() !== "" && pct === undefined);
    if (!(kg > 20 && kg < 400) || (fat.trim() !== "" && pct === undefined)) return;
    haptic("success");
    logBodyweight(kg, pct);
    setFat("");
  };

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    setBusy(true);
    setError(null);
    try {
      await savePhoto(await preparePhoto(f, pose));
      haptic("success");
      reload();
    } catch {
      oops();
      setError(t("photos.error"));
    } finally {
      setBusy(false);
      if (file.current) file.current.value = "";
    }
  };

  const { before, after } = pickPair(photos, pose, chosen[pose]?.before, chosen[pose]?.after);
  const step = (side: "before" | "after", dir: -1 | 1) => (before && after ? stepPair(photos, pose, before, after, side, dir) : null);
  const move = (side: "before" | "after", dir: -1 | 1) => {
    const id = step(side, dir);
    if (!id) return;
    haptic("select");
    setChosen((c) => ({ ...c, [pose]: { before: before?.id, after: after?.id, [side]: id } }));
  };
  const weightOn = (p: Photo) => {
    const w = weightNear(weighIns, p.at);
    return w ? `${fmtNum(Math.round(fromKg(w.kg, unit) * 10) / 10)} ${unit}` : null;
  };
  const posePhotos = ofPose(photos, pose);
  const due = nextPhotoDue(photos, pose);
  const now = useNow(60 * 60_000);
  const addPhoto = () => (canUseCamera() ? setCamera(true) : file.current?.click());
  const first = weighIns[0];
  const last = weighIns.at(-1);
  const change = first && last && first !== last ? fromKg(last.kg - first.kg, unit) : null;

  return (
    <div className="pb-2">
      <ScreenHeader back={{ label: t("photos.back"), onClick: () => go("stats") }} title={t("photos.title")} />
      <p className="mt-1 text-sm text-muted">{t("photos.private")}</p>

      <Section title={t("photos.weight", { unit })}>
        <div className="card p-4">
          <BumpField
            label={t("photos.weightIn", { unit })}
            value={value}
            onChange={setValue}
            step={unit === "lb" ? 0.2 : 0.1}
            start={Number(value) || 70}
            min={1}
          />
          <div className="mt-2 flex flex-wrap items-end gap-2">
            <BodyFatField id="photos-bf" value={fat} onChange={setFat} />
            <Button onClick={save}>{t("photos.log")}</Button>
          </div>
          {fatError && (
            <p role="alert" className="mt-2 text-sm text-bad">
              {t("body.fat.range")}
            </p>
          )}
          {weighIns.length > 1 && <WeightChart points={weighIns.map((w) => ({ at: w.at, v: fromKg(w.kg, unit) }))} />}
          {change !== null && (
            <p className="num mt-2 text-sm text-muted">
              {t("photos.since", {
                change: `${change >= 0 ? "+" : ""}${fmtNum(Math.round(change * 10) / 10)}`,
                unit,
                date: date(first!.at, { month: "short", day: "numeric" }),
              })}
            </p>
          )}
        </div>
      </Section>

      <Measurements />

      <Section title={t("photos.progress")}>
        <div className="flex gap-2" role="group" aria-label={t("photos.pose")}>
          {(["front", "side", "back"] as Pose[]).map((p) => (
            <Chip key={p} active={pose === p} onClick={() => setPose(p)}>
              {t(`photos.pose.${p}`)}
            </Chip>
          ))}
        </div>
        {before && after ? (
          <>
            <div className="mt-3 flex gap-2" role="group" aria-label={t("photos.mode")}>
              <Chip active={mode === "wipe"} onClick={() => setMode("wipe")}>
                {t("photos.mode.wipe")}
              </Chip>
              <Chip active={mode === "side"} onClick={() => setMode("side")}>
                {t("photos.mode.side")}
              </Chip>
            </div>
            <Compare before={before} after={after} mode={mode} weightOn={weightOn} />
            <div className="mt-3 grid grid-cols-2 gap-2">
              <PairPicker
                side="before"
                photo={before}
                older={!!step("before", -1)}
                newer={!!step("before", 1)}
                onMove={(d) => move("before", d)}
              />
              <PairPicker
                side="after"
                photo={after}
                older={!!step("after", -1)}
                newer={!!step("after", 1)}
                onMove={(d) => move("after", d)}
              />
            </div>
            <p className="num mt-2 text-sm text-muted">{apart(before, after, weighIns, unit)}</p>
            {!isTeen(profile) && <ShareSideBySide before={before} after={after} weightOn={weightOn} />}
          </>
        ) : after ? (
          <Single photo={after} />
        ) : (
          <p className="card mt-3 p-4 text-sm text-muted">{t(`photos.none.${pose}`)}</p>
        )}
        {due !== null && (
          <p className="mt-3 text-sm text-muted">
            {due <= now ? t("photos.dueNow") : t("photos.due", { date: date(due, { month: "short", day: "numeric" }) })}
          </p>
        )}
        <input
          ref={file}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => void onFile(e.target.files?.[0])}
          aria-label={t("photos.pick")}
        />
        <Button className="mt-3 w-full" disabled={busy} onClick={addPhoto}>
          {busy ? t("photos.saving") : t(`photos.add.${pose}`)}
        </Button>
        <PhotoCamera
          open={camera}
          pose={pose}
          ghost={posePhotos.at(-1) ?? null}
          onClose={() => setCamera(false)}
          onSaved={async (p) => {
            await savePhoto(p);
            haptic("success");
            setChosen((c) => ({ ...c, [pose]: undefined }));
            reload();
          }}
          onPickFile={() => {
            setCamera(false);
            file.current?.click();
          }}
        />
        {error && (
          <p className="mt-2 text-sm text-bad" role="alert">
            {error}
          </p>
        )}
        {posePhotos.length > 0 && (
          <Strip
            photos={posePhotos}
            onDelete={async (id) => {
              await deletePhoto(id);
              reload();
            }}
          />
        )}
      </Section>
    </div>
  );
}

function WeightChart({ points }: { points: { at: number; v: number }[] }) {
  const w = 300;
  const h = 80;
  const xs = points.map((p) => p.at);
  const ys = points.map((p) => p.v);
  const [x0, x1] = [Math.min(...xs), Math.max(...xs)];
  const [y0, y1] = [Math.min(...ys) - 0.5, Math.max(...ys) + 0.5];
  const d = points
    .map((p, i) => `${i ? "L" : "M"}${((p.at - x0) / Math.max(1, x1 - x0)) * w},${h - ((p.v - y0) / (y1 - y0)) * (h - 8) - 4}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-3 h-20 w-full" role="img" aria-label={t("photos.chart")}>
      <path
        d={d}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function Single({ photo }: { photo: Photo }) {
  const url = useObjectUrl(photo.blob);
  return url ? <img src={url} alt={t(`photos.latest.${photo.pose}`)} className="mt-3 w-full rounded-2xl" /> : null;
}

type CompareMode = "wipe" | "side";
const MODE_KEY = "liftsmith.photoCompare";
function savedMode(): CompareMode {
  try {
    return localStorage.getItem(MODE_KEY) === "side" ? "side" : "wipe";
  } catch {
    return "wipe";
  }
}

const fmtDay = (ms: number) => date(ms, { month: "short", day: "numeric", year: "numeric" });

/** "12 weeks apart · −3.2 kg": how far apart the two photos are, and the weight change between them when known. */
function apart(before: Photo, after: Photo, weighIns: readonly BodyweightEvent[], unit: "kg" | "lb"): string {
  const days = Math.round((after.at - before.at) / 86_400_000);
  const gap = days >= 14 ? t("photos.apart.weeks", { count: Math.round(days / 7) }) : t("photos.apart.days", { count: days });
  const a = weightNear(weighIns, before.at);
  const b = weightNear(weighIns, after.at);
  if (!a || !b || a === b) return gap;
  const d = Math.round(fromKg(b.kg - a.kg, unit) * 10) / 10;
  return t("photos.apart.weight", { gap, change: `${d > 0 ? "+" : d < 0 ? "−" : ""}${fmtNum(Math.abs(d))}`, unit });
}

function Label({ when, weight, side }: { when: number; weight: string | null; side: "left" | "right" }) {
  return (
    <span className={`absolute top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white ${side === "left" ? "left-2" : "right-2"}`}>
      {fmtDay(when)}
      {weight ? ` · ${weight}` : ""}
    </span>
  );
}

/** Before and after: in one frame with a slider that wipes between them, or side by side. */
function Compare({
  before,
  after,
  mode,
  weightOn,
}: {
  before: Photo;
  after: Photo;
  mode: CompareMode;
  weightOn: (p: Photo) => string | null;
}) {
  const a = useObjectUrl(before.blob);
  const b = useObjectUrl(after.blob);
  const [split, setSplit] = useState(50);
  if (!a || !b) return null;
  if (mode === "side")
    return (
      <div className="mt-3 grid grid-cols-2 gap-1.5">
        {[
          { p: before, url: a, alt: t("photos.before", { date: fmtDay(before.at) }) },
          { p: after, url: b, alt: t("photos.after", { date: fmtDay(after.at) }) },
        ].map(({ p, url, alt }) => (
          <figure key={p.id} className="relative overflow-hidden rounded-2xl">
            <img src={url} alt={alt} className="aspect-[3/4] w-full object-cover" />
            <figcaption className="num absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1 text-center text-xs text-white">
              {fmtDay(p.at)}
              {weightOn(p) ? ` · ${weightOn(p)}` : ""}
            </figcaption>
          </figure>
        ))}
      </div>
    );
  return (
    <div className="mt-3">
      <div className="relative overflow-hidden rounded-2xl" style={{ aspectRatio: `${after.w} / ${after.h}` }} data-no-swipe>
        <img src={b} alt={t("photos.after", { date: fmtDay(after.at) })} className="absolute inset-0 h-full w-full object-cover" />
        <img
          src={a}
          alt={t("photos.before", { date: fmtDay(before.at) })}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}
        />
        <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white/90" style={{ left: `${split}%` }} />
        <Label when={before.at} weight={weightOn(before)} side="left" />
        <Label when={after.at} weight={weightOn(after)} side="right" />
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={split}
        onChange={(e) => setSplit(Number(e.target.value))}
        className="slider mt-3 w-full"
        aria-label={t("photos.compare")}
      />
    </div>
  );
}

/** Before or after: its date, with arrows to the next older or newer photo of the pose. One hand, no typing. */
function PairPicker({
  side,
  photo,
  older,
  newer,
  onMove,
}: {
  side: "before" | "after";
  photo: Photo;
  older: boolean;
  newer: boolean;
  onMove: (dir: -1 | 1) => void;
}) {
  const arrow = "press grid min-h-11 min-w-11 place-items-center rounded-full text-ink disabled:opacity-30";
  return (
    <div className="card flex items-center justify-between p-1" role="group" aria-label={t(`photos.pick.${side}`)}>
      <button type="button" className={arrow} disabled={!older} onClick={() => onMove(-1)} aria-label={t(`photos.${side}.older`)}>
        <Icon name="chevronLeft" />
      </button>
      <span className="num min-w-0 text-center text-sm">
        <span className="block text-xs text-muted">{t(`photos.pick.${side}`)}</span>
        {date(photo.at, { month: "short", day: "numeric" })}
      </span>
      <button type="button" className={arrow} disabled={!newer} onClick={() => onMove(1)} aria-label={t(`photos.${side}.newer`)}>
        <Icon name="chevronRight" />
      </button>
    </div>
  );
}

/** The pair as one side by side image for the share sheet. Never offered to under-18s (teen.ts). */
function ShareSideBySide({ before, after, weightOn }: { before: Photo; after: Photo; weightOn: (p: Photo) => string | null }) {
  const [busy, setBusy] = useState(false);
  const label = (p: Photo) => [fmtDay(p.at), weightOn(p)].filter(Boolean).join(" · ");
  const share = async () => {
    setBusy(true);
    try {
      const c = document.createElement("canvas");
      await drawSideBySide(c, before, after, { before: label(before), after: label(after), brand: BRAND.name });
      const how = await shareCanvas(c, "liftsmith-progress", t("photos.share.text"));
      if (how === "failed") oops();
    } catch {
      oops();
    } finally {
      setBusy(false);
    }
  };
  return (
    <Button kind="ghost" className="mt-3 w-full" disabled={busy} onClick={() => void share()}>
      {t("photos.share")}
    </Button>
  );
}

function Strip({ photos, onDelete }: { photos: Photo[]; onDelete: (id: string) => void }) {
  return (
    <ul className="mt-4 grid grid-cols-4 gap-2">
      {photos.map((p) => (
        <Thumb key={p.id} photo={p} onDelete={onDelete} />
      ))}
    </ul>
  );
}

function Thumb({ photo, onDelete }: { photo: Photo; onDelete: (id: string) => void }) {
  const url = useObjectUrl(photo.blob);
  const [ask, setAsk] = useState(false);
  return (
    <li className="relative">
      {url && (
        <img
          src={url}
          alt={t("photos.thumb", { pose: t(`photos.pose.${photo.pose}`), date: date(photo.at, { dateStyle: "medium" }) })}
          className="aspect-[3/4] w-full rounded-xl object-cover"
        />
      )}
      <button
        type="button"
        onClick={() => (ask ? onDelete(photo.id) : setAsk(true))}
        className={`press absolute bottom-1 right-1 min-h-11 min-w-11 rounded-full text-xs ${ask ? "bg-bad text-white" : "bg-black/60 text-white"}`}
        aria-label={ask ? t("photos.confirmDelete") : t("photos.delete")}
      >
        {ask ? t("photos.deleteShort") : "✕"}
      </button>
    </li>
  );
}
