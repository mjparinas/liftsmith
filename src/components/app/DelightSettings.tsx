"use client";

// Settings for the delightful extras, in two places: Settings › Workout has the voice coach, ghost mode,
// plate memory and rest timer extras (part "workout"); Settings › Look and feel has earned themes and app
// icons (part "look").
import { useState } from "react";

import { useLight } from "@/lib/appearance";
import { goalStreak } from "@/lib/game";
import { t } from "@/lib/i18n";
import { haptic } from "@/lib/juice";
import { useApp } from "@/lib/store";
import { APP_ICONS, appIconSupported, setAppIcon, THEMES, unlocked } from "@/lib/themes";
import type { DelightPrefs } from "@/lib/types";
import { useNow } from "@/lib/useNow";
import { say, voiceSupported } from "@/lib/voice";

import { Icon } from "./icons";
import { Chip, Section, SwitchRow } from "./ui";

function Toggle({ label, on, set, hint }: { label: string; on: boolean; set: (v: boolean) => void; hint?: string }) {
  return <SwitchRow label={label} hint={hint} on={on} onChange={set} />;
}

export function DelightSettings({ part }: { part: "workout" | "look" }) {
  const { profile, setProfile, stats } = useApp();
  const light = useLight(profile.theme ?? "dark");
  const now = useNow(60_000);
  const d = profile.delight ?? {};
  const put = (p: Partial<DelightPrefs>) => setProfile({ delight: { ...d, ...p } });
  const ctx = { stats, goalWeeks: goalStreak(stats, profile, now).weeks, now };
  const [iconNote, setIconNote] = useState<string | null>(null);
  if (part === "workout")
    return (
      <>
        {voiceSupported() && (
          <Toggle
            label={t("delight.voice")}
            on={!!d.voice}
            set={(voice) => {
              put({ voice });
              if (voice) say("Voice coach on. I'll call out each set.", true);
            }}
            hint={t("delight.voiceHint")}
          />
        )}
        <Toggle label={t("delight.ghost")} on={d.ghost !== false} set={(ghost) => put({ ghost })} hint={t("delight.ghostHint")} />
        <Toggle
          label={t("delight.plates")}
          on={d.plateMemory !== false}
          set={(plateMemory) => put({ plateMemory })}
          hint={t("delight.platesHint")}
        />
        <Section title={t("delight.rest")}>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["breathe", t("delight.breathe")],
                ["game", t("delight.game")],
                ["off", t("delight.neither")],
              ] as const
            ).map(([v, l]) => (
              <Chip key={v} active={(d.restExtra ?? "off") === v} onClick={() => put({ restExtra: v })}>
                {l}
              </Chip>
            ))}
          </div>
        </Section>
      </>
    );
  return (
    <>
      <section id="themes" className="mt-6 scroll-mt-4">
        <h2 className="mb-2 px-1 text-sm font-semibold uppercase tracking-wider text-muted">{t("delight.themes")}</h2>
        {light && <p className="mb-2 px-1 text-sm text-muted">{t("delight.lightNote")}</p>}
        <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,9.5rem),1fr))] gap-2">
          {THEMES.map((th) => {
            const open = unlocked(th, ctx);
            const on = (d.theme ?? "midnight") === th.id;
            return (
              <li key={th.id}>
                <button
                  type="button"
                  disabled={!open}
                  aria-pressed={on}
                  onClick={() => {
                    haptic("tick");
                    put({ theme: th.id, seenThemes: [...new Set([...(d.seenThemes ?? []), th.id])] });
                  }}
                  className={`press flex w-full items-center gap-3 rounded-2xl border p-3 text-left ${on ? "border-accent" : "border-line"} ${open ? "" : "opacity-60"}`}
                  style={{ background: th.palette.surface }}
                >
                  <span
                    className="h-9 w-9 shrink-0 rounded-full border-4"
                    style={{ background: th.palette.bg, borderColor: th.palette.accent }}
                    aria-hidden
                  />
                  <span className="min-w-0">
                    <span className="block font-semibold" style={{ color: "#e8edf3" }}>
                      {!open && <Icon name="lock" size={14} className="mr-1 inline-block align-[-2px]" />}
                      {th.name}
                    </span>
                    <span className="block text-xs" style={{ color: "#a3afbf" }}>
                      {th.how}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
      {appIconSupported() && (
        <Section title={t("delight.icon")}>
          <div className="flex flex-wrap gap-2">
            {APP_ICONS.map(({ id, theme }) => {
              const open = unlocked(theme, ctx);
              return (
                <Chip
                  key={id}
                  active={(d.icon ?? "default") === id}
                  onClick={async () => {
                    if (!open) return setIconNote(t("delight.iconLocked", { name: theme.name, how: theme.how.toLowerCase() }));
                    const ok = await setAppIcon(id);
                    if (ok) put({ icon: id });
                    setIconNote(t(ok ? "delight.iconDone" : "delight.iconFailed"));
                  }}
                >
                  {!open && <Icon name="lock" size={14} className="mr-1 inline-block align-[-2px]" />}
                  {id === "default" ? t("delight.classic") : theme.name}
                </Chip>
              );
            })}
          </div>
          {iconNote && (
            <p className="mt-2 text-xs text-faint" role="status">
              {iconNote}
            </p>
          )}
        </Section>
      )}
    </>
  );
}
