/* eslint-disable @next/next/no-img-element -- the badge preview is our own SVG; the static export has no image optimizer */
"use client";

import { useState } from "react";

import type { OwnedGym } from "@/lib/gymClaims";
import {
  BADGE_HEIGHT,
  BADGE_WIDTH,
  WIDGET_HEIGHT,
  WIDGET_KINDS,
  WIDGET_LANGS,
  WIDGET_MAX_WIDTH,
  widgetSnippet,
  widgetUrl,
  type WidgetKind,
  type WidgetTheme,
} from "@/lib/gymWidgets";
import { currentLang, LANG_NAME, t, type Lang } from "@/lib/i18n";
import { haptic, oops } from "@/lib/juice";

import { Button, Chip, Section } from "./ui";

// "Widgets for your website" on an official gym's owner page (GymEdit.tsx; docs/decisions/gyms.md "Website widgets"):
// pick the class schedule, the equipment or the badge, a look and a language, see it as it'll show, and copy the code.
// Pure web code, so Android, iOS and the web app get it together.

const KIND_LABEL: Record<WidgetKind, "gym.edit.widget.schedule" | "gym.edit.widget.equipment" | "gym.edit.widget.badge"> = {
  schedule: "gym.edit.widget.schedule",
  equipment: "gym.edit.widget.equipment",
  badge: "gym.edit.widget.badge",
};

export function WidgetsSection({ gym }: { gym: Pick<OwnedGym, "id" | "name" | "citySlug" | "slug"> }) {
  const [kind, setKind] = useState<WidgetKind>("schedule");
  const [theme, setTheme] = useState<WidgetTheme>("light");
  const [lang, setLang] = useState<Lang>(currentLang());
  const [copied, setCopied] = useState<"yes" | "no" | null>(null);
  const opts = { lang, theme };
  const code = widgetSnippet(gym, kind, opts);
  const pick =
    <T,>(set: (v: T) => void) =>
    (v: T) => {
      set(v);
      setCopied(null);
    };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      haptic("success");
      setCopied("yes");
    } catch {
      oops();
      setCopied("no");
    }
  };
  const preview = `${t("gym.edit.widgetPreview")}: ${t(KIND_LABEL[kind])}`;
  return (
    <Section title={t("gym.edit.widgets")} icon="link">
      <p className="mb-3 text-sm text-muted">{t("gym.edit.widgetsNote")}</p>
      <div className="flex flex-wrap gap-2" role="group" aria-label={t("gym.edit.widgets")}>
        {WIDGET_KINDS.map((k) => (
          <Chip key={k} active={kind === k} onClick={() => pick(setKind)(k)}>
            {t(KIND_LABEL[k])}
          </Chip>
        ))}
      </div>
      <p className="mt-4 mb-2 text-sm text-muted" id="gw-look">
        {t("gym.edit.widgetLook")}
      </p>
      <div className="flex flex-wrap gap-2" role="group" aria-labelledby="gw-look">
        <Chip active={theme === "light"} onClick={() => pick(setTheme)("light")}>
          {t("gym.edit.widgetLight")}
        </Chip>
        <Chip active={theme === "dark"} onClick={() => pick(setTheme)("dark")}>
          {t("gym.edit.widgetDark")}
        </Chip>
      </div>
      <p className="mt-4 mb-2 text-sm text-muted" id="gw-lang">
        {t("gym.edit.widgetLang")}
      </p>
      <div className="flex flex-wrap gap-2" role="group" aria-labelledby="gw-lang">
        {WIDGET_LANGS.map((l) => (
          <Chip key={l} active={lang === l} onClick={() => pick(setLang)(l)}>
            <span lang={l}>{LANG_NAME[l]}</span>
          </Chip>
        ))}
      </div>
      <p className="mt-4 mb-2 text-sm text-muted">{t("gym.edit.widgetPreview")}</p>
      {kind === "badge" ? (
        <img src={widgetUrl(gym.id, "badge", opts)} alt={preview} width={BADGE_WIDTH[lang]} height={BADGE_HEIGHT} />
      ) : (
        <iframe
          key={`${kind}-${theme}-${lang}`}
          src={widgetUrl(gym.id, kind, opts)}
          title={preview}
          height={WIDGET_HEIGHT[kind]}
          className="w-full rounded-2xl border-0"
          style={{ maxWidth: WIDGET_MAX_WIDTH }}
          loading="lazy"
          sandbox="allow-popups allow-popups-to-escape-sandbox"
        />
      )}
      <label htmlFor="gw-code" className="mt-4 mb-2 block text-sm text-muted">
        {t("gym.edit.widgetCode")}
      </label>
      <textarea
        id="gw-code"
        readOnly
        value={code}
        rows={kind === "badge" ? 3 : 5}
        spellCheck={false}
        className="card w-full px-4 py-3 font-mono text-xs break-all"
        onFocus={(e) => e.currentTarget.select()}
      />
      <Button kind="ghost" className="mt-2 w-full" onClick={() => void copy()}>
        {t("gym.edit.widgetCopy")}
      </Button>
      {copied && (
        <p className={`mt-2 text-sm ${copied === "yes" ? "text-muted" : "text-bad"}`} role="status">
          {t(copied === "yes" ? "gym.edit.widgetCopied" : "gym.edit.widgetFailed")}
        </p>
      )}
    </Section>
  );
}
