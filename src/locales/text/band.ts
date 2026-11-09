import type { Message } from "@/lib/i18n";

// Text for keys starting "band.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "band.fresh": "Fresh",
  "band.fresh.hint": "Fully recovered",
  "band.ready": "Ready",
  "band.ready.hint": "Good to train",
  "band.recovering": "Recovering",
  "band.recovering.hint": "Light work only",
  "band.fatigued": "Fatigued",
  "band.fatigued.hint": "Needs rest",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "band.fresh": "Fresco",
  "band.fresh.hint": "Recuperado del todo",
  "band.ready": "Listo",
  "band.ready.hint": "Listo para entrenar",
  "band.recovering": "Recuperándose",
  "band.recovering.hint": "Solo trabajo ligero",
  "band.fatigued": "Fatigado",
  "band.fatigued.hint": "Necesita descanso",
};

export const fr: Partial<Record<Key, Message>> = {
  "band.fresh": "Frais",
  "band.fresh.hint": "Entièrement récupéré",
  "band.ready": "Prêt",
  "band.ready.hint": "Prêt à s’entraîner",
  "band.recovering": "En récupération",
  "band.recovering.hint": "Travail léger seulement",
  "band.fatigued": "Fatigué",
  "band.fatigued.hint": "Besoin de repos",
};
