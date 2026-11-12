"use client";

// Settings for the delightful extras, in two places: Settings › Workout has the voice coach, ghost mode,
// plate memory and rest timer extras (part "workout"); Settings › Look and feel has earned themes and app
// icons (part "look").
import { useMemo, useState } from "react";

import { SECTION_LABEL } from "@/components/titles";
import { useLight } from "@/lib/appearance";
import {
  BREATH_PATTERNS,
  breathPattern,
  clampCustom,
  CUSTOM_LIMITS,
  DEFAULT_PATTERN,
  patternCounts,
  type BreathCustom,
} from "@/lib/breathing";
import { inSentence, t } from "@/lib/i18n";
import { haptic } from "@/lib/juice";
import { useApp } from "@/lib/store";
import { APP_ICONS, appIconSupported, setAppIcon, THEMES, unlockContext, unlocked } from "@/lib/themes";
import type { DelightPrefs } from "@/lib/types";
import { useNow } from "@/lib/useNow";
import { say, voiceSupported } from "@/lib/voice";

import { Icon } from "./icons";
import { Bump, Chip, Section, SwitchRow } from "./ui";

function Toggle({ label, on, set, hint }: { label: string; on: boolean; set: (v: boolean) => void; hint?: string }) {
  return <SwitchRow label={label} hint={hint} on={on} onChange={set} />;
}

export function DelightSettings({ part }: { part: "workout" | "look" }) {
  const { profile, setProfile, stats, events } = useApp();
  const light = useLight(profile.theme ?? "dark");
  const now = useNow(60_000);
  const d = profile.delight ?? {};
  const put = (p: Partial<DelightPrefs>) => setProfile({ delight: { ...d, ...p } });
  const ctx = useMemo(() => unlockContext(events, stats, profile, now), [events, stats, profile, now]);
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
              if (voice) say(t("vc.on"), true);
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
        {d.restExtra === "breathe" && <BreathSettings />}
      </>
    );
  return (
    <>
      <section id="themes" className="mt-6 scroll-mt-4">
        <h2 className={`mb-2 px-1 ${SECTION_LABEL}`}>{t("delight.themes")}</h2>
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
                    if (!open) return setIconNote(t("delight.iconLocked", { name: theme.name, how: inSentence(theme.how) }));
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

/** The breathing guide's pattern: box breathing, 4-7-8, the double sigh, slow breaths or the lifter's own. */
function BreathSettings() {
  const { profile, setProfile } = useApp();
  const d = profile.delight ?? {};
  const id = d.breath ?? DEFAULT_PATTERN;
  const custom = clampCustom(d.breathCustom);
  const put = (p: Partial<DelightPrefs>) => setProfile({ delight: { ...d, ...p } });
  const bump = (k: keyof BreathCustom, dir: 1 | -1, size: number) => {
    const next = clampCustom({ ...custom, [k]: custom[k] + dir * size });
    if (next[k] === custom[k]) return false;
    put({ breathCustom: next });
    return true;
  };
  return (
    <Section title={t("delight.pattern")} info="breathPattern">
      <div className="flex flex-wrap gap-2">
        {BREATH_PATTERNS.map((p) => (
          <Chip key={p} active={id === p} onClick={() => put({ breath: p })}>
            {t(`extra.p.${p}`)}
            {p !== "custom" && p !== "relax" && <span className="text-faint tabular-nums">{patternCounts(breathPattern(p))}</span>}
          </Chip>
        ))}
      </div>
      {id === "custom" && (
        <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-surface">
          {(Object.keys(CUSTOM_LIMITS) as (keyof BreathCustom)[]).map((k) => {
            const what = t(`delight.side.${k}`);
            return (
              <li key={k} className="flex items-center justify-between gap-3 px-3 py-2">
                <span className="text-sm">{what}</span>
                <span className="flex items-center gap-2">
                  <Bump dir={-1} size="sm" aria={t("delight.shorter", { what })} onStep={(dir, n) => bump(k, dir, n)} />
                  <span className="display w-12 text-center text-lg" aria-live="polite">
                    {t("delight.secs", { n: custom[k] })}
                  </span>
                  <Bump dir={1} size="sm" aria={t("delight.longer", { what })} onStep={(dir, n) => bump(k, dir, n)} />
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}
