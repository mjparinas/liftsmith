import type { CardioCloud, CloudCardio, CloudReading } from "../cloud";
import { cloudCardioEvents, cloudReadingEvents } from "../cloudImport";
import { derive } from "../derive";
import { cleanResult } from "../fitTests";
import { askOutside, healthAvailable, noteHealthSync, readBody, readDaily, readOutside } from "../health";
import { deleteEvents } from "../localdb";
import { MEASURE_RANGE } from "../measure";
import { outsideEvents, sessionWindows } from "../outside";
import { bodyUpdates, currentTdee, snapshotDue, type BodyReadings } from "../tdee";
import type { AppEvent, FitTest, MeasureSite } from "../types";
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
  /** Log a fitness test result (fitTests.ts): seconds, or stands for the chair stand. Returns false when out of range. */
  logFitTest(test: FitTest, value: number, eyes?: "open" | "closed"): boolean;
  /** Weigh-ins and body fat from Health Connect or Apple Health (native, when allowed), deduplicated by day. */
  importHealthBody(): Promise<number>;
  /** Sleep, HRV, resting HR, steps, VO2 max and breathing rate from Health, one reading a day (the health twin). */
  importHealthDaily(): Promise<number>;
  /** Workouts other apps saved to Health (outside.ts), while Count workouts from other apps is on. */
  importOutside(now?: number): Promise<number>;
  /**
   * Turns Count workouts from other apps on (asks Health first; "denied" leaves it off) or off (removes every
   * workout it brought in).
   */
  setOutsideWorkouts(on: boolean): Promise<"on" | "off" | "denied">;
  /**
   * Readings from a connected cloud service (Oura, Whoop, Withings, Polar: connections.ts), stored like Health's
   * so the health twin and the readiness call use them; a scale's weight and body fat become a weigh-in. Ids
   * start with the service, so a re-import adds nothing.
   */
  importCloudReadings(source: string, readings: readonly CloudReading[]): number;
  /** Concept2 Logbook sessions as finished cardio workouts under the active gym (cloudImport.ts). */
  /** Cardio sessions from Concept2 (the default) or Garmin as finished workouts; returns how many were new. */
  importCloudCardio(sessions: readonly CloudCardio[], now?: number, source?: CardioCloud): number;
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

    logFitTest(test, value, eyes) {
      const v = cleanResult(test, value);
      if (v === null) return false;
      commit([{ type: "fitTest", id: uid(), at: Date.now(), test, value: v, ...(test === "balance" ? { eyes: eyes ?? "open" } : {}) }]);
      return true;
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
      // commit() moves profile.bodyweight to the newest weigh-in when one of these is newer.
      if (fresh.length) {
        commit(fresh);
        get().refreshTdee();
      }
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
      const outside = get().profile.outsideWorkouts
        ? await get()
            .importOutside()
            .catch(() => 0)
        : 0;
      return fresh.length + outside;
    },

    async importOutside(now = Date.now()) {
      const since = get().profile.outsideWorkouts;
      if (!since) return 0;
      const workouts = await readOutside(45, now);
      const events = get().events;
      // The switch may have gone off while Health was being read.
      if (get().profile.outsideWorkouts !== since) return 0;
      const fresh = outsideEvents(workouts, new Set(events.map((e) => e.id)), sessionWindows(events), now, since);
      if (fresh.length) {
        commit(fresh);
        if (!get().active) get().replan();
      }
      return fresh.length;
    },

    async setOutsideWorkouts(on) {
      if (on) {
        if (!(await askOutside())) return "denied";
        get().setProfile({ outsideWorkouts: Date.now() });
        await get()
          .importOutside()
          .catch(() => 0);
        return "on";
      }
      get().setProfile({ outsideWorkouts: undefined });
      const ids = get()
        .events.filter((e) => e.type === "outside")
        .map((e) => e.id);
      if (ids.length) {
        const events = get().events.filter((e) => e.type !== "outside");
        set({ events, stats: derive(events, Date.now()) });
        await deleteEvents(ids);
        if (!get().active) get().replan();
      }
      return "off";
    },

    importCloudReadings(source, readings) {
      const have = new Set(get().events.map((e) => e.id));
      const fresh = cloudReadingEvents(source, readings, have);
      if (fresh.length) {
        commit(fresh);
        if (!get().active) get().replan();
        if (fresh.some((e) => (e.type === "health" && e.metric === "steps") || e.type === "bodyweight")) get().refreshTdee();
      }
      return fresh.length;
    },

    importCloudCardio(sessions, now = Date.now(), source = "concept2") {
      const events = get().events;
      const have = new Set(events.map((e) => e.id));
      // Workouts already here (a Garmin run inside a Liftsmith workout is the same session, not a new one).
      const starts = new Map<string, number>();
      const busy: [number, number][] = [];
      for (const e of events) if (e.type === "sessionStart") starts.set(e.sessionId, e.at);
      for (const e of events) if (e.type === "sessionEnd" && starts.has(e.sessionId)) busy.push([starts.get(e.sessionId)!, e.at]);
      const fresh = cloudCardioEvents(sessions, get().profile.activeGymId, now, have, source, busy);
      if (fresh.length) {
        commit(fresh);
        if (!get().active) get().replan();
      }
      return fresh.filter((e) => e.type === "sessionStart").length;
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
