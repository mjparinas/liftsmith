// The maintenance switch (Gradelings' src/server/maintenance.ts), kept in admin_settings. src/proxy.api.ts reads it
// on every request, so each server keeps the answer for MAINTENANCE_CACHE_MS; switching it clears this server's copy
// at once and the others pick it up within that time. If the database can't be read, the site stays open.
import { MAINTENANCE_CACHE_MS } from "@/lib/maintenance";

import { getJson, setSetting } from "./settings";

const KEY = "maintenance";

export interface MaintenanceState {
  on: boolean;
  /** When it was switched on, and by whom; null while it's off. */
  since: number | null;
  by: string | null;
}

const OFF: MaintenanceState = { on: false, since: null, by: null };
type Cache = { at: number; state: MaintenanceState } | null;
const holder = globalThis as unknown as { __maintenance?: Cache };

export async function getMaintenance(): Promise<MaintenanceState> {
  const v = await getJson<Partial<MaintenanceState>>(KEY, {});
  return v.on === true
    ? { on: true, since: typeof v.since === "number" ? v.since : null, by: typeof v.by === "string" ? v.by : null }
    : OFF;
}

export async function setMaintenance(on: boolean, by: string, now = Date.now()): Promise<MaintenanceState> {
  const state: MaintenanceState = on ? { on: true, since: now, by } : OFF;
  await setSetting(KEY, JSON.stringify(state), now);
  holder.__maintenance = { at: now, state };
  return state;
}

export async function maintenanceOn(now = Date.now()): Promise<boolean> {
  const hit = holder.__maintenance;
  if (hit && now - hit.at < MAINTENANCE_CACHE_MS) return hit.state.on;
  try {
    const state = await getMaintenance();
    holder.__maintenance = { at: now, state };
    return state.on;
  } catch (e) {
    console.error("[maintenance] couldn't read the switch", (e as Error).message);
    holder.__maintenance = { at: now, state: hit?.state ?? OFF };
    return hit?.state.on ?? false;
  }
}

/** For tests. */
export function clearMaintenanceCache() {
  holder.__maintenance = null;
}
