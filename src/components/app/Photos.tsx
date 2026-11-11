"use client";

// Body weight and progress photos (#/photos). Weigh-ins are events (they sync with the user's own data
// like everything else); photos never leave this phone (photos.ts). Compare the first and latest photo of
// a pose with a side-by-side slider. Plain <img> on purpose: photos are local blob URLs, not optimisable.
/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useRef, useState } from "react";

import { date, t } from "@/lib/i18n";
import { haptic, oops } from "@/lib/juice";
import { deletePhoto, listPhotos, pairFor, preparePhoto, savePhoto, type Photo, type Pose } from "@/lib/photos";
import { useApp } from "@/lib/store";
import { parseBodyFat } from "@/lib/tdee";
import type { BodyweightEvent } from "@/lib/types";
import { fmtNum, fromKg, plainNum, toKg } from "@/lib/units";

import { BodyFatField } from "./BodyFatField";
import { Measurements } from "./Measurements";
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

  const { before, after } = pairFor(photos, pose);
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
          <Compare before={before} after={after} />
        ) : after ? (
          <Single photo={after} />
        ) : (
          <p className="card mt-3 p-4 text-sm text-muted">{t(`photos.none.${pose}`)}</p>
        )}
        <input
          ref={file}
          type="file"
          accept="image/*"
          capture="user"
          className="hidden"
          onChange={(e) => void onFile(e.target.files?.[0])}
          aria-label={t("photos.pick")}
        />
        <Button className="mt-3 w-full" disabled={busy} onClick={() => file.current?.click()}>
          {busy ? t("photos.saving") : t(`photos.add.${pose}`)}
        </Button>
        {error && (
          <p className="mt-2 text-sm text-bad" role="alert">
            {error}
          </p>
        )}
        {photos.filter((p) => p.pose === pose).length > 0 && (
          <Strip
            photos={photos.filter((p) => p.pose === pose)}
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

/** Before and after in one frame, with a slider that wipes between them. */
function Compare({ before, after }: { before: Photo; after: Photo }) {
  const a = useObjectUrl(before.blob);
  const b = useObjectUrl(after.blob);
  const [split, setSplit] = useState(50);
  const fmt = (ms: number) => date(ms, { month: "short", day: "numeric", year: "numeric" });
  if (!a || !b) return null;
  return (
    <div className="mt-3">
      <div className="relative overflow-hidden rounded-2xl" style={{ aspectRatio: `${after.w} / ${after.h}` }}>
        <img src={b} alt={t("photos.after", { date: fmt(after.at) })} className="absolute inset-0 h-full w-full object-cover" />
        <img
          src={a}
          alt={t("photos.before", { date: fmt(before.at) })}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}
        />
        <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white/90" style={{ left: `${split}%` }} />
        <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">{fmt(before.at)}</span>
        <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">{fmt(after.at)}</span>
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
