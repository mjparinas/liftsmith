import { defaultProfile } from "./defaults";
import type { AppEvent, Gym, Profile } from "./types";

// Restore a full backup (Settings › Saving and backup; Melvin, 2026-11-09: "it's not clear how to save
// my information"). Until accounts and sync land, a backup file is how a lifter moves their data from
// the web app to the Android or iOS app, or to a new phone. The file is the one `backupJson` writes.
// Restoring adds and never deletes: every event is kept by id (so restoring twice adds nothing), the
// backup's gyms replace gyms with the same id, and the backup's profile comes back, because the lifter
// asked for it back.

export interface Backup {
  profile: Profile;
  gyms: Gym[];
  events: AppEvent[];
  exportedAt?: string;
}

const MAX_BYTES = 50_000_000;
const obj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

/** Reads a Liftsmith backup file, or null when it isn't one. Bad events and gyms are dropped, not trusted. */
export function parseBackup(text: string): Backup | null {
  if (text.length > MAX_BYTES) return null;
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return null;
  }
  if (!obj(raw) || raw.app !== "liftsmith" || typeof raw.version !== "number" || raw.version < 1) return null;
  if (!obj(raw.profile) || !Array.isArray(raw.gyms) || !Array.isArray(raw.events)) return null;
  const gyms = raw.gyms.filter((g): g is Gym => obj(g) && typeof g.id === "string" && !!g.id && typeof g.name === "string" && Array.isArray(g.equipment));
  const events = raw.events.filter(
    (e): e is AppEvent => obj(e) && typeof e.id === "string" && !!e.id && typeof e.type === "string" && typeof e.at === "number" && Number.isFinite(e.at),
  );
  const profile = { ...defaultProfile(), ...(raw.profile as Partial<Profile>) } as Profile;
  if (!gyms.some((g) => g.id === profile.activeGymId)) profile.activeGymId = gyms[0]?.id ?? profile.activeGymId;
  return { profile, gyms, events, exportedAt: typeof raw.exportedAt === "string" ? raw.exportedAt : undefined };
}

/** What this device holds after restoring `b`: nothing on the device is removed. */
export function mergeBackup(cur: { profile: Profile; gyms: Gym[]; events: readonly AppEvent[] }, b: Backup, now = Date.now()) {
  const have = new Set(cur.events.map((e) => e.id));
  const fresh = b.events.filter((e) => !have.has(e.id) && (have.add(e.id), true));
  const fromBackup = new Map(b.gyms.map((g) => [g.id, g]));
  const gyms = [...cur.gyms.map((g) => fromBackup.get(g.id) ?? g), ...b.gyms.filter((g) => !cur.gyms.some((x) => x.id === g.id))];
  const profile: Profile = { ...b.profile, onboarded: true, updatedAt: now };
  if (!gyms.some((g) => g.id === profile.activeGymId)) profile.activeGymId = gyms[0]?.id ?? cur.profile.activeGymId;
  return { profile, gyms, fresh };
}
