"use client";

import { platform } from "@/lib/auth";
import { t } from "@/lib/i18n";
import type { MessageKey } from "@/locales/en";

import { Icon } from "./icons";

// Hands-free Log set (polish pass, Melvin 2026-11-10): the shortcuts already exist on every platform
// (voice-and-system-shortcuts.md); this is the short guide in Settings › Workout that says where they are.

const STEPS: Record<"android" | "ios" | "web", MessageKey[]> = {
  android: ["pol.hf.notif", "pol.hf.androidTile", "pol.hf.androidWidget"],
  ios: ["pol.hf.notif", "pol.hf.iosBackTap", "pol.hf.iosAction"],
  web: ["pol.hf.web"],
};

export function HandsFree() {
  const steps = STEPS[platform()];
  return (
    <div className="card p-4" data-testid="hands-free">
      <p className="text-sm text-muted">{t("pol.hf.intro")}</p>
      <ul className="mt-3 space-y-2.5">
        {steps.map((k) => (
          <li key={k} className="flex items-start gap-2.5 text-sm">
            <Icon name="check" size={16} className="mt-0.5 shrink-0 text-accent" />
            <span>{t(k)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
