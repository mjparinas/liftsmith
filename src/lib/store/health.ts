import type { CloudReading } from "../cloud";
import { derive } from "../derive";
import { healthAvailable, noteHealthSync, readBody, readDaily } from "../health";
import { deleteEvents } from "../localdb";
import { MEASURE_RANGE } from "../measure";
import { bodyUpdates, currentTdee, snapshotDue, type BodyReadings } from "../tdee";
import type { AppEvent, MeasureSite } from "../types";
import { uid, type Ctx } from "./shared";

// Cycle logs, weigh-ins, readings from Health Connect / Apple Health, and TDEE snapshots.
// One slice of the app's state (store.ts puts them together).

export interface HealthSlice {
  /** Log that a period started on this day (cycle-aware readiness). */
  logPeriod(day: number): void;
  /** Turn cycle-aware readiness off and erase every logged period. */
  forgetCycle(): Promise<void>;
  /** Log a weigh-in and make it the profile's body weight. */
  logBodyweight(kg: number, bodyFat?: number): void;
  /** Log a tape measurement (cm) at one body site. */
  logMeasure(site: MeasureSite, cm: number): void;
  /** Weigh-ins and body fat from Health Connect or Apple Health (native, when allowed), deduplicated by day. */
  importHealthBody(): Promise<number>;
  /** Sleep, HRV, resting HR, steps, VO2 max and breathing rate from Health, one reading a day (the health twin). */
  importHealthDaily(): Promise<number>;
  /**
   * Readings from a connected cloud service (Oura, Whoop: connections.ts), stored like Health's so the health
   * twin and the readiness call use them. Ids start with the service, so a re-import adds nothing.
   */
  importCloudReadings(source: string, readings: readonly CloudReading[]): number;
  /** Records a TDEE snapshot when an input that matters changed since the last one (tdee.ts). */
  refreshTdee(trigger?: "auto" | "manual", now?: number): AppEvent | null;
  /** Applies height read from Health Connect or Apple Health, then refreshes TDEE. */
  applyHealthBody(r: BodyReadings): void;
}

export function healthSlice(c: Ctx): HealthSlice {
  const { set, get, commit } = c;
  return {
    logPeriod(day) {
      if (get().events.some((e) => e.type === "cycle" && e.day === day)) return;
      commit([{ type: "cycle", id: uid(), at: Date.now(), day }]);
      get().replan();
    },

    async forgetCycle() {
      const ids = get()
        .events.filter((e) => e.type === "cycle")
        .map((e) => e.id);
      const events = get().events.filter((e) => e.type !== "cycle");
      set({ events, stats: derive(events, Date.now()) });
      await deleteEvents(ids);
      get().setProfile({ cycle: undefined });
      get().replan();
    },

    logBodyweight(kg, bodyFat) {
      if (!(kg > 0)) return;
      commit([{ type: "bodyweight", id: uid(), at: Date.now(), kg, ...(bodyFat && bodyFat > 0 ? { bodyFat } : {}) }]);
      get().setProfile({ bodyweight: kg });
    },

    logMeasure(site, cm) {
      if (!(cm >= MEASURE_RANGE[0] && cm <= MEASURE_RANGE[1])) return;
      commit([{ type: "measure", id: uid(), at: Date.now(), site, cm: Math.round(cm * 10) / 10 }]);
    },

    async importHealthBody() {
      const readings = await readBody(120);
      const have = new Set(get().events.map((e) => e.id));
      const fresh = readings
        .map((r) => ({
          type: "bodyweight" as const,
          id: `health-bw-${r.day}`,
          at: r.at,
          kg: r.kg,
          ...(r.bodyFat ? { bodyFat: r.bodyFat } : {}),
        }))
        .filter((e) => !have.has(e.id));
      if (fresh.length) {
        commit(fresh);
        const newest = fresh.reduce((a, b) => (b.at > a.at ? b : a));
        const last = get()
          .events.filter((e) => e.type === "bodyweight")
          .reduce((t, e) => Math.max(t, e.at), 0);
        if (newest.at >= last) get().setProfile({ bodyweight: newest.kg });
      }
      if (fresh.length) get().refreshTdee();
      return fresh.length;
    },

    async importHealthDaily() {
      const readings = await readDaily(45);
      if (await healthAvailable()) noteHealthSync();
      const have = new Set(get().events.map((e) => e.id));
      const fresh = readings
        .map((r) => ({
          type: "health" as const,
          id: `health-${r.metric}-${r.day}-${Math.round(r.value * 10)}`,
          at: r.at,
          metric: r.metric,
          day: r.day,
          value: r.value,
        }))
        .filter((e) => !have.has(e.id));
      if (fresh.length) {
        commit(fresh);
        if (!get().active) get().replan();
        if (fresh.some((e) => e.metric === "steps")) get().refreshTdee();
      }
      return fresh.length;
    },

    importCloudReadings(source, readings) {
      const have = new Set(get().events.map((e) => e.id));
      const fresh = readings
        .map((r) => ({
          type: "health" as const,
          id: `${source}-${r.metric}-${r.day}-${Math.round(r.value * 10)}`,
          at: r.at,
          metric: r.metric,
          day: r.day,
          value: r.value,
        }))
        .filter((e) => !have.has(e.id));
      if (fresh.length) {
        commit(fresh);
        if (!get().active) get().replan();
        if (fresh.some((e) => e.metric === "steps")) get().refreshTdee();
      }
      return fresh.length;
    },

    refreshTdee(trigger = "auto", now = Date.now()) {
      const { events, stats, profile } = get();
      const ev = snapshotDue(currentTdee(events, stats.sessions, profile, now), events, now, uid(), trigger);
      if (ev) commit([ev]);
      return ev;
    },

    applyHealthBody(r) {
      const p = bodyUpdates(r, get().profile);
      if (Object.keys(p).length) get().setProfile(p);
      get().refreshTdee();
    },
  };
}
