"use client";

// The gym machine link for the workout in progress (Labs, `labGymMachines`). Like the heart rate link it
// outlives the workout screen, reconnects by itself with growing waits when the link drops, and lets
// go of the machine when the workout ends. Readings are added up by `MachineTally` and handed to the
// sink: the cardio set on screen (Workout.tsx binds it to the store). The sink's key changes when a set
// is logged or the exercise on screen changes, which starts the next set from that point; a null key
// means nothing on screen takes machine readings (a strength exercise, or the lab is off).
import { MachineTally, type MachineReading, type MachineSet } from "./ftms";
import { connectMachine, MachineError, machineMessage, type MachineConnection } from "./machine";

export type MachineStatus = "off" | "connecting" | "live" | "reconnecting";

export interface MachineLinkState {
  status: MachineStatus;
  name?: string;
  /** The set so far, from the machine. */
  set: MachineSet | null;
  error: string | null;
}

export interface MachineSink {
  key(): string | null;
  apply(set: MachineSet): void;
}

/** Waits between reconnects after a drop, in ms; after the last one the lifter is told and can tap Connect again. */
export const MACHINE_RETRY_MS = [2_000, 4_000, 8_000, 15_000, 30_000];

type Connect = typeof connectMachine;

export class MachineLink {
  private state: MachineLinkState = { status: "off", set: null, error: null };
  private conn: MachineConnection | null = null;
  private known: { id: string; name: string } | null = null;
  private listeners = new Set<() => void>();
  private tally = new MachineTally();
  private sink: MachineSink = { key: () => null, apply: () => {} };
  private lastKey: string | null | undefined = undefined;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private attempt = 0;
  /** Bumped by every connect and stop, so a connect that finishes after a stop is let go. */
  private run = 0;

  constructor(
    private connect: Connect = connectMachine,
    private now: () => number = Date.now,
  ) {}

  get = (): MachineLinkState => this.state;

  subscribe = (f: () => void): (() => void) => {
    this.listeners.add(f);
    return () => this.listeners.delete(f);
  };

  bind(sink: MachineSink): void {
    this.sink = sink;
  }

  private set(next: Partial<MachineLinkState>): void {
    this.state = { ...this.state, ...next };
    this.listeners.forEach((f) => f());
  }

  /** One reading from the machine. Exposed for tests; the connection calls it. */
  reading(r: MachineReading): void {
    const key = this.sink.key();
    // A logged set, another exercise, or nothing on screen to fill: what comes next is a new set.
    if (key === null || (this.lastKey !== undefined && key !== this.lastKey)) this.tally.nextSet();
    this.lastKey = key;
    this.tally.add(r, this.now());
    if (key === null) {
      if (this.state.set) this.set({ set: null });
      return;
    }
    const s = this.tally.set();
    this.sink.apply(s);
    this.set({ set: s });
  }

  /** The lifter tapped Connect machine: the picker opens. A failure lands in `error`. */
  tap(): Promise<void> {
    if (this.state.status === "connecting" || this.state.status === "live") return Promise.resolve();
    return this.open(null);
  }

  dismiss(): void {
    this.set({ error: null });
  }

  private clearTimer(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  private async open(again: { id: string; name: string } | null): Promise<void> {
    this.clearTimer();
    const run = ++this.run;
    this.set(again ? { status: "reconnecting" } : { status: "connecting", error: null });
    try {
      const conn = await this.connect(
        (r) => {
          if (run === this.run) this.reading(r);
        },
        () => {
          if (run === this.run) this.dropped();
        },
        again ?? undefined,
      );
      if (run !== this.run) {
        await conn.disconnect();
        return;
      }
      this.conn = conn;
      this.known = { id: conn.id, name: conn.name };
      this.attempt = 0;
      this.set({ status: "live", name: conn.name, error: null });
    } catch (e) {
      if (run !== this.run) return;
      if (again) {
        this.retry();
        return;
      }
      this.set({ status: "off", error: e instanceof MachineError ? machineMessage(e.problem, e.device) : machineMessage("failed") });
    }
  }

  /** The link dropped (the machine slept, or the lifter walked off): keep what it sent and try again. */
  private dropped(): void {
    this.conn = null;
    this.tally.gap();
    this.attempt = 0;
    this.set({ status: "reconnecting" });
    this.retry();
  }

  private retry(): void {
    const wait = MACHINE_RETRY_MS[this.attempt];
    if (wait === undefined || !this.known?.id) {
      this.set({ status: "off", error: machineMessage("lost", this.state.name) });
      return;
    }
    this.attempt++;
    this.clearTimer();
    const known = this.known;
    this.timer = setTimeout(() => void this.open(known), wait);
  }

  /** The lifter tapped Disconnect, or the workout ended: let the machine go. What it filled in stays. */
  async stop(): Promise<void> {
    this.run++;
    this.clearTimer();
    this.attempt = 0;
    const conn = this.conn;
    this.conn = null;
    this.known = null;
    this.tally = new MachineTally();
    this.lastKey = undefined;
    this.set({ status: "off", name: undefined, set: null, error: null });
    await conn?.disconnect();
  }
}

export const machineLink = new MachineLink();
