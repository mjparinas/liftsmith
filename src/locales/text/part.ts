import type { Message } from "@/lib/i18n";

// Text for keys starting "part.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "part.neck": "Neck",
  "part.shoulder": "Shoulder",
  "part.elbow": "Elbow",
  "part.wrist": "Wrist or hand",
  "part.chest": "Chest",
  "part.upperBack": "Upper back",
  "part.lowerBack": "Lower back",
  "part.abs": "Abs or core",
  "part.hip": "Hip",
  "part.groin": "Groin",
  "part.quad": "Front of thigh",
  "part.hamstring": "Hamstring",
  "part.knee": "Knee",
  "part.calf": "Calf",
  "part.ankle": "Ankle or foot",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "part.neck": "Cuello",
  "part.shoulder": "Hombro",
  "part.elbow": "Codo",
  "part.wrist": "Muñeca o mano",
  "part.chest": "Pecho",
  "part.upperBack": "Espalda alta",
  "part.lowerBack": "Zona lumbar",
  "part.abs": "Abdomen o core",
  "part.hip": "Cadera",
  "part.groin": "Ingle",
  "part.quad": "Parte delantera del muslo",
  "part.hamstring": "Isquiotibiales",
  "part.knee": "Rodilla",
  "part.calf": "Pantorrilla",
  "part.ankle": "Tobillo o pie",
};

export const fr: Partial<Record<Key, Message>> = {
  "part.neck": "Cou",
  "part.shoulder": "Épaule",
  "part.elbow": "Coude",
  "part.wrist": "Poignet ou main",
  "part.chest": "Poitrine",
  "part.upperBack": "Haut du dos",
  "part.lowerBack": "Bas du dos",
  "part.abs": "Abdos ou gainage",
  "part.hip": "Hanche",
  "part.groin": "Aine",
  "part.quad": "Avant de la cuisse",
  "part.hamstring": "Ischio-jambiers",
  "part.knee": "Genou",
  "part.calf": "Mollet",
  "part.ankle": "Cheville ou pied",
};
