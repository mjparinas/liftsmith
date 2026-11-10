"use client";

// The heart rate link for the workout in progress. It outlives the workout screen (leaving for Today
// and coming back keeps the monitor), connects to the monitor used last time as soon as a workout
// starts, reconnects by itself with growing waits when the link drops, and releases the monitor
// cleanly when the workout ends so the next one can find it again.
import { connectHeartRate, HrError, hrMessage, savedHr, type HrConnection } from "./heartRate";

export type HrStatus = "off" | "connecting" | "live" | "reconnecting";

export interface HrLinkState {
  status: HrStatus;
  /** The monitor's name while connected or reconnecting. */
  name?: string;
  /** What to tell the lifter after a failure they should know about; quiet attempts never set it. */
  error: string | null;
}

/** Waits between reconnects after a drop, in ms; after the last one the lifter is told and can tap Connect. */
export const RETRY_MS = [2_000, 4_000, 8_000, 15_000, 30_000, 30_000, 30_000, 30_000];

type Connect = typeof connectHeartRate;

export class HrLink {
  private state: HrLinkState = { status: "off", error: null };
  private conn: HrConnection | null = null;
  private listeners = new Set<() => void>();
  private bpm: (bpm: number) => void = () => {};
  private timer: ReturnType<typeof setTimeout> | null = null;
  private attempt = 0;
  /** Bumped by every start and stop, so a connect that finishes after a stop is let go. */
  private run = 0;
  private autoFor: string | null = null;

  constructor(private connect: Connect = connectHeartRate) {}

  get = (): HrLinkState => this.state;

  subscribe = (f: () => void): (() => void) => {
    this.listeners.add(f);
    return () => this.listeners.delete(f);
  };

  /** Where readings go (the workout screen sets it while it's shown). */
  onBpm(f: (bpm: number) => void): void {
    this.bpm = f;
  }

  private set(next: Partial<HrLinkState>): void {
    this.state = { ...this.state, ...next };
    this.listeners.forEach((f) => f());
  }

  private clearTimer(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  /**
   * Connect once per workout without asking, if a monitor has connected before. Nothing is shown if
   * it isn't around; the Connect button stays for the lifter to try.
   */
  auto(sessionId: string): void {
    if (this.autoFor === sessionId || this.state.status !== "off" || !savedHr()) return;
    this.autoFor = sessionId;
    void this.open(true);
  }

  /** The lifter tapped Connect: try the saved monitor, then open the picker. A failure lands in `error`. */
  tap(): Promise<void> {
    if (this.state.status === "connecting" || this.state.status === "live") return Promise.resolve();
    return this.open(false);
  }

  dismiss(): void {
    this.set({ error: null });
  }

  private async open(quiet: boolean, reconnecting = false): Promise<void> {
    this.clearTimer();
    const run = ++this.run;
    this.set(reconnecting ? { status: "reconnecting" } : { status: "connecting", error: null });
    try {
      const conn = await this.connect(
        (b) => {
          if (run === this.run) this.bpm(b);
        },
        () => {
          if (run === this.run) this.dropped();
        },
        { quiet },
      );
      if (run !== this.run) {
        await conn.disconnect();
        return;
      }
      this.conn = conn;
      this.attempt = 0;
      this.set({ status: "live", name: conn.name, error: null });
    } catch (e) {
      if (run !== this.run) return;
      if (reconnecting) {
        this.retry();
        return;
      }
      const msg = quiet ? null : e instanceof HrError ? hrMessage(e.problem, e.device) : hrMessage("failed");
      this.set({ status: "off", error: msg });
    }
  }

  /** The link dropped mid-workout (out of range, watch asleep): keep trying, waiting longer each time. */
  private dropped(): void {
    this.conn = null;
    this.attempt = 0;
    this.set({ status: "reconnecting" });
    this.retry();
  }

  private retry(): void {
    const wait = RETRY_MS[this.attempt];
    if (wait === undefined) {
      this.set({ status: "off", error: hrMessage("lost", this.state.name) });
      return;
    }
    this.attempt++;
    this.clearTimer();
    this.timer = setTimeout(() => void this.open(true, true), wait);
  }

  /** The workout ended: stop retrying and release the monitor fully. */
  async stop(): Promise<void> {
    this.run++;
    this.clearTimer();
    this.attempt = 0;
    this.autoFor = null;
    const conn = this.conn;
    this.conn = null;
    this.set({ status: "off", name: undefined, error: null });
    await conn?.disconnect();
  }
}

export const hrLink = new HrLink();
