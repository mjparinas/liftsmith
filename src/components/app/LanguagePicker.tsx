"use client";

import { useEffect, useState } from "react";

import { LANG_NAME, LANGS, t, type LangPref } from "@/lib/i18n";
import { isNative } from "@/lib/juice";
import { readSiteLang } from "@/lib/siteLang";
import { useApp } from "@/lib/store";
import { useLang } from "@/lib/useLang";

import { Icon } from "./icons";
import { Chip, Sheet } from "./ui";

// Choosing the app's language (Melvin, 2026-11-16: "allow users on the web to change their language"). One list of
// choices for Settings › Look and feel and the welcome screen's language button: follow the phone (in the apps) or the
// browser (on the web), or one of the ten languages, each named in itself. Saved as `profile.language`, which syncs.

/** "Match my phone" in the apps, "Match my browser" on the web. */
export const followLabel = () => (isNative() ? t("settings.language.system") : t("settings.language.browser"));
/** What following the phone or the browser means, under the choices. */
export const followNote = () => (isNative() ? t("settings.language.note") : t("settings.language.noteWeb"));

export const languageOptions = (): [LangPref, string][] => [
  ["system", followLabel()],
  ...LANGS.map((l) => [l, LANG_NAME[l]] as [LangPref, string]),
];

/** The choices as chips, for a sheet or a settings section. */
export function LanguageChoices({ label }: { label: string }) {
  const { profile, setProfile } = useApp();
  const value = profile.language ?? "system";
  return (
    <>
      <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
        {languageOptions().map(([v, l]) => (
          <span key={v} lang={v === "system" ? undefined : v}>
            <Chip active={v === value} onClick={() => setProfile({ language: v })}>
              {l}
            </Chip>
          </span>
        ))}
      </div>
      <p className="mt-2 px-1 text-xs text-faint">{followNote()}</p>
    </>
  );
}

/**
 * The welcome screen's language button (top corner): the language showing now, in itself, opening the choices. It's there
 * before setup's first question, so nobody answers setup in a language they can't read. On the web, a first visit that came
 * from the website in another language starts in that language (`readSiteLang`, written by the site's language switcher).
 */
export function LanguageButton({ className = "" }: { className?: string }) {
  const lang = useLang();
  const [open, setOpen] = useState(false);
  const { profile, setProfile } = useApp();
  const chosen = profile.language;
  useEffect(() => {
    if (chosen || isNative()) return;
    const site = readSiteLang();
    if (site) setProfile({ language: site });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const label = t("settings.language");
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`${label}: ${LANG_NAME[lang]}`}
        className={`press inline-flex min-h-11 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-sm font-medium text-muted hover:text-ink ${className}`}
      >
        <Icon name="globe" size={18} />
        <span lang={lang}>{LANG_NAME[lang]}</span>
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title={label}>
        <LanguageChoices label={label} />
      </Sheet>
    </>
  );
}
