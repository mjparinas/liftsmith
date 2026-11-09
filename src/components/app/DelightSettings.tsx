"use client";
// Settings for the delightful extras: voice coach, ghost mode, plate memory, rest timer extras, earned
// themes and app icons.
import { useLight } from "@/lib/appearance";
import { goalStreak } from "@/lib/game";
import { haptic } from "@/lib/juice";
import { useApp } from "@/lib/store";
import { APP_ICONS, appIconSupported, setAppIcon, THEMES, unlocked } from "@/lib/themes";
import type { DelightPrefs } from "@/lib/types";
import { useNow } from "@/lib/useNow";
import { say, voiceSupported } from "@/lib/voice";
import { useState } from "react";
import { Chip, Section } from "./ui";

function Toggle({ label, on, set, hint }: { label: string; on: boolean; set: (v: boolean) => void; hint?: string }) {
  return (
    <Section title={label}>
      <div className="flex flex-wrap gap-2">
        <Chip active={on} onClick={() => set(true)}>On</Chip>
        <Chip active={!on} onClick={() => set(false)}>Off</Chip>
      </div>
      {hint && <p className="mt-2 text-xs text-faint">{hint}</p>}
    </Section>
  );
}

export function DelightSettings() {
  const { profile, setProfile, stats } = useApp();
  const light = useLight(profile.theme ?? "dark");
  const now = useNow(60_000);
  const d = profile.delight ?? {};
  const put = (p: Partial<DelightPrefs>) => setProfile({ delight: { ...d, ...p } });
  const ctx = { stats, goalWeeks: goalStreak(stats, profile, now).weeks, now };
  const [iconNote, setIconNote] = useState<string | null>(null);
  return (
    <>
      {voiceSupported() && (
        <Toggle label="Voice coach" on={!!d.voice} set={(voice) => { put({ voice }); if (voice) say("Voice coach on. I'll call out each set.", true); }} hint="Spoken cues between sets: the next weight and reps, the last set, ten seconds left, and new bests. Music dips while it talks." />
      )}
      <Toggle label="Ghost mode" on={d.ghost !== false} set={(ghost) => put({ ghost })} hint="Race your last session of each exercise: its weights, reps and rests show on the rest timer." />
      <Toggle label="Smart plate memory" on={d.plateMemory !== false} set={(plateMemory) => put({ plateMemory })} hint="Between sets, show only the plates to add or take off." />
      <Section title="While you rest">
        <div className="flex flex-wrap gap-2">
          {([["breathe", "Breathing guide"], ["game", "Plate math game"], ["off", "Neither"]] as const).map(([v, l]) => <Chip key={v} active={(d.restExtra ?? "off") === v} onClick={() => put({ restExtra: v })}>{l}</Chip>)}
        </div>
      </Section>
      <section id="themes" className="mt-6 scroll-mt-4">
        <h2 className="mb-2 px-1 text-sm font-semibold uppercase tracking-wider text-muted">Themes</h2>
        {light && <p className="mb-2 px-1 text-sm text-muted">With Appearance set to light, a theme changes the accent colour only.</p>}
        <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,9.5rem),1fr))] gap-2">
          {THEMES.map((t) => {
            const open = unlocked(t, ctx);
            const on = (d.theme ?? "midnight") === t.id;
            return (
              <li key={t.id}>
                <button type="button" disabled={!open} aria-pressed={on} onClick={() => { haptic("tick"); put({ theme: t.id, seenThemes: [...new Set([...(d.seenThemes ?? []), t.id])] }); }} className={`press flex w-full items-center gap-3 rounded-2xl border p-3 text-left ${on ? "border-accent" : "border-line"} ${open ? "" : "opacity-60"}`} style={{ background: t.palette.surface }}>
                  <span className="h-9 w-9 shrink-0 rounded-full border-4" style={{ background: t.palette.bg, borderColor: t.palette.accent }} aria-hidden />
                  <span className="min-w-0">
                    <span className="block font-semibold" style={{ color: "#e8edf3" }}>{open ? t.name : `🔒 ${t.name}`}</span>
                    <span className="block text-xs" style={{ color: "#a3afbf" }}>{t.how}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
      {appIconSupported() && (
        <Section title="App icon">
          <div className="flex flex-wrap gap-2">
            {APP_ICONS.map(({ id, theme }) => {
              const open = unlocked(theme, ctx);
              return (
                <Chip key={id} active={(d.icon ?? "default") === id} onClick={async () => {
                  if (!open) return setIconNote(`${theme.name}: ${theme.how.toLowerCase()} to unlock.`);
                  const ok = await setAppIcon(id);
                  if (ok) put({ icon: id });
                  setIconNote(ok ? "Done. On Android the home screen updates once you leave the app." : "Couldn't change the icon on this phone.");
                }}>{open ? "" : "🔒 "}{id === "default" ? "Classic" : theme.name}</Chip>
              );
            })}
          </div>
          {iconNote && <p className="mt-2 text-xs text-faint" role="status">{iconNote}</p>}
        </Section>
      )}
    </>
  );
}
