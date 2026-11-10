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

export const de: Partial<Record<Key, Message>> = {
  "band.fresh": "Frisch",
  "band.fresh.hint": "Voll erholt",
  "band.ready": "Bereit",
  "band.ready.hint": "Gut zum Trainieren",
  "band.recovering": "In Erholung",
  "band.recovering.hint": "Nur leichte Arbeit",
  "band.fatigued": "Ermüdet",
  "band.fatigued.hint": "Braucht Ruhe",
};

export const it: Partial<Record<Key, Message>> = {
  "band.fresh": "Fresco",
  "band.fresh.hint": "Del tutto recuperato",
  "band.ready": "Pronto",
  "band.ready.hint": "Pronto per l’allenamento",
  "band.recovering": "In recupero",
  "band.recovering.hint": "Solo lavoro leggero",
  "band.fatigued": "Affaticato",
  "band.fatigued.hint": "Ha bisogno di riposo",
};

export const ja: Partial<Record<Key, Message>> = {
  "band.fresh": "万全",
  "band.fresh.hint": "完全に回復",
  "band.ready": "準備OK",
  "band.ready.hint": "トレーニングできる",
  "band.recovering": "回復中",
  "band.recovering.hint": "軽めのみ",
  "band.fatigued": "疲労",
  "band.fatigued.hint": "休養が必要",
};
