"use client";
import { equipmentTips, plateTips } from "@/lib/buying";
import { useApp } from "@/lib/store";
import type { Gym } from "@/lib/types";
import { Section } from "./ui";
import { t } from "@/lib/i18n";

// "What to buy next" for home gyms (buying.ts). Advice only: no shop links or sponsored picks.

export function BuyNext({ gym }: { gym: Gym }) {
  const { events, saveGym } = useApp();
  // A commercial gym has most of it; the lifter doesn't buy its plates.
  if (gym.equipment.length >= 15) return null;
  const plates = plateTips(gym, events);
  const kit = equipmentTips(gym);
  if (!plates.length && !kit.length) return null;
  const addPair = (w: number) => {
    const has = gym.plates.some((p) => p.weight === w);
    const next = has ? gym.plates.map((p) => (p.weight === w ? { ...p, count: p.count + 2 } : p)) : [...gym.plates, { weight: w, count: 2 }].sort((a, b) => b.weight - a.weight);
    saveGym({ ...gym, plates: next });
  };
  return (
    <Section title={t("buy.title")}>
      <ul className="card divide-y divide-line">
        {[...plates.map((p) => ({ key: `p${p.weight}`, text: p.text, act: () => addPair(p.weight), label: t("buy.got") })), ...kit.map((k) => ({ key: k.item, text: k.text, act: () => saveGym({ ...gym, equipment: [...gym.equipment, k.item] }), label: t("buy.have") }))].map((row) => (
          <li key={row.key} className="flex items-start justify-between gap-3 px-4 py-3">
            <p className="text-sm">{row.text}</p>
            <button type="button" onClick={row.act} className="press min-h-11 shrink-0 rounded-full border border-line px-3 text-sm text-accent">{row.label}</button>
          </li>
        ))}
      </ul>
      <p className="mt-2 px-1 text-xs text-faint">{t("buy.note")}</p>
    </Section>
  );
}
