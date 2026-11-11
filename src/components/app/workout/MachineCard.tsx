"use client";

import { useSyncExternalStore } from "react";

import { track } from "@/lib/analytics";
import { exercise } from "@/lib/exercises";
import { t } from "@/lib/i18n";
import { oops } from "@/lib/juice";
import { labOn } from "@/lib/labs";
import { machineLink } from "@/lib/machineLink";
import { useApp } from "@/lib/store";

import { Icon } from "../icons";

// Bluetooth gym machines (a lab, Settings › Labs): on a cardio exercise, one card connects a bike, rower,
// treadmill or cross trainer, and then says it's filling in the set, with the average power when the
// machine has it. Time and distance go straight into the set card's own numbers, so Log set logs them
// as they are; the steppers still work if the machine gets something wrong.

/** Which set the machine is filling: changes when a set is logged or the exercise changes; null when nothing on screen takes it. */
export function machineKey(): string | null {
  const st = useApp.getState();
  const a = st.active;
  const item = a?.plan.items[a.index];
  if (!a || !item || !labOn("labGymMachines") || !exercise(item.exerciseId).cardio) return null;
  const sets = st.events.reduce((n, e) => (e.type === "set" && e.sessionId === a.sessionId ? n + 1 : n), 0);
  return `${a.sessionId}:${a.index}:${sets}`;
}

if (typeof window !== "undefined") {
  machineLink.bind({ key: machineKey, apply: (v) => useApp.getState().machineSet(v) });
  // However a workout ends, the machine is let go so the next lifter (or workout) can connect to it.
  useApp.subscribe((st, prev) => {
    if (prev.active && !st.active) void machineLink.stop();
  });
}

export function MachineCard() {
  const m = useSyncExternalStore(machineLink.subscribe, machineLink.get, machineLink.get);
  const connect = async () => {
    await machineLink.tap();
    const st = machineLink.get();
    if (st.error) oops();
    else if (st.status === "live") track("feature", { name: "gym_machine", detail: "workout" });
  };
  if (m.status === "off" || m.status === "connecting") {
    return (
      <div className="card mt-3 p-3">
        <button
          type="button"
          onClick={connect}
          disabled={m.status === "connecting"}
          aria-busy={m.status === "connecting"}
          className="press inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-line bg-raised px-4 text-sm font-semibold"
        >
          <Icon name="bolt" size={16} className="text-accent" />
          {m.status === "connecting" ? t("hr.connecting") : t("lab.machines.connect")}
        </button>
        {m.error && (
          <div role="alert" className="mt-2 flex items-start gap-2 text-sm">
            <p className="flex-1 text-muted">{m.error}</p>
            <button
              type="button"
              onClick={() => machineLink.dismiss()}
              className="press -m-2 min-h-11 min-w-11 rounded-full px-2 text-muted hover:text-ink"
            >
              {t("hr.dismiss")}
            </button>
          </div>
        )}
      </div>
    );
  }
  const name = m.name ?? t("lab.machines.device");
  return (
    <div className="card mt-3 flex items-center gap-2 p-3 text-sm" aria-live="polite">
      <Icon name="bolt" size={16} className="shrink-0 text-accent" />
      <p className="flex-1 text-muted">
        {m.status === "reconnecting" ? t("lab.machines.reconnecting", { name }) : t("lab.machines.live", { name })}
        {m.set?.powerW !== undefined && (
          <span className="num ml-1 font-semibold text-ink">{t("lab.machines.power", { watts: m.set.powerW })}</span>
        )}
      </p>
      <button
        type="button"
        onClick={() => void machineLink.stop()}
        className="press -my-2 min-h-11 rounded-full px-2 text-muted hover:text-ink"
      >
        {t("lab.machines.disconnect")}
      </button>
    </div>
  );
}
