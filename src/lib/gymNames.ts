// Names the app gave a gym or a bar itself ("Commercial gym", "Olympic bar"), shown in the lifter's language.
// Gyms set up before the names were translated (2026-11-15) kept the English name, so a name that is exactly
// one of ours is shown translated; a name the lifter typed is shown as it is.
import { defaultBars, PRESETS } from "./defaults";
import { t } from "./i18n";

export function gymName(name: string): string {
  const p = PRESETS.find((x) => x.name === name);
  return p ? t(`gym.kind.${p.id}`) : name;
}

export function barName(bar: { name: string }): string {
  const d = defaultBars("kg").find((x) => x.name === bar.name);
  return d ? t(`gym.bar.${d.id as "olympic" | "ez" | "trap"}`) : bar.name;
}
