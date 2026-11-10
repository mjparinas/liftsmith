import { EXERCISE_BY_ID } from "./exercises";
import { isNative } from "./juice";
import type { AppEvent, Gym, Profile, Unit } from "./types";
import { fromKg } from "./units";

// Export everything the lifter has (data rights, table stakes; Melvin, 2026-11-09). Two files:
// a full JSON backup (profile, gyms and every event, enough to restore or move elsewhere) and a
// CSV of every working set for spreadsheets. On the phone the file goes to the share sheet
// (Android and iOS), so it can be saved to Files or Drive, mailed or sent to a coach; in the
// browser it downloads.

export const EXPORT_VERSION = 1;

export function backupJson(profile: Profile, gyms: Gym[], events: readonly AppEvent[], now = Date.now()): string {
  return JSON.stringify(
    { app: "liftsmith", version: EXPORT_VERSION, exportedAt: new Date(now).toISOString(), profile, gyms, events },
    null,
    1,
  );
}

const cell = (v: string | number | undefined) => {
  if (v === undefined) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const pad = (n: number) => String(n).padStart(2, "0");
/** Local date and time, the way spreadsheets read them. */
function local(at: number) {
  const d = new Date(at);
  return [`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, `${pad(d.getHours())}:${pad(d.getMinutes())}`];
}

export const CSV_HEADER = [
  "Date",
  "Time",
  "Workout",
  "Exercise",
  "Set",
  "Weight",
  "Unit",
  "Per hand",
  "Reps",
  "Target reps",
  "Target RIR",
  "Seconds",
  "Rest seconds",
  "Avg HR",
  "Max HR",
];

/** Every working set, oldest first. Weights in the lifter's unit; dumbbells are per hand. */
export function setsCsv(events: readonly AppEvent[], unit: Unit): string {
  const rows = [CSV_HEADER.join(",")];
  const count = new Map<string, number>();
  const sets = events.filter((e) => e.type === "set").sort((a, b) => a.at - b.at);
  for (const s of sets) {
    if (s.type !== "set") continue;
    const ex = EXERCISE_BY_ID.get(s.exerciseId);
    const key = `${s.sessionId}:${s.exerciseId}`;
    const n = (count.get(key) ?? 0) + 1;
    count.set(key, n);
    const [date, time] = local(s.at);
    rows.push(
      [
        date,
        time,
        s.sessionId.slice(0, 8),
        ex?.name ?? s.exerciseId,
        n,
        Math.round(fromKg(s.weight, unit) * 100) / 100,
        unit,
        ex?.load === "dumbbell" || ex?.load === "kettlebell" ? "yes" : "",
        s.reps,
        s.targetReps,
        s.rir,
        s.durationSec,
        s.restSec,
        s.hrAvg,
        s.hrMax,
      ]
        .map(cell)
        .join(","),
    );
  }
  return rows.join("\n") + "\n";
}

/** Hands a text file to the share sheet on the phone, or downloads it in the browser. */
export async function saveFile(name: string, mime: string, text: string): Promise<void> {
  if (isNative()) {
    const [{ Filesystem, Directory, Encoding }, { Share }] = await Promise.all([
      import("@capacitor/filesystem"),
      import("@capacitor/share"),
    ]);
    const { uri } = await Filesystem.writeFile({ path: name, data: text, directory: Directory.Cache, encoding: Encoding.UTF8 });
    await Share.share({ title: name, files: [uri] });
    return;
  }
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function stamp(now = Date.now()) {
  return local(now)[0];
}
