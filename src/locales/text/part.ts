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

export const de: Partial<Record<Key, Message>> = {
  "part.neck": "Nacken",
  "part.shoulder": "Schulter",
  "part.elbow": "Ellenbogen",
  "part.wrist": "Handgelenk oder Hand",
  "part.chest": "Brust",
  "part.upperBack": "Oberer Rücken",
  "part.lowerBack": "Unterer Rücken",
  "part.abs": "Bauch oder Rumpf",
  "part.hip": "Hüfte",
  "part.groin": "Leiste",
  "part.quad": "Oberschenkelvorderseite",
  "part.hamstring": "Oberschenkelrückseite",
  "part.knee": "Knie",
  "part.calf": "Wade",
  "part.ankle": "Knöchel oder Fuß",
};

export const it: Partial<Record<Key, Message>> = {
  "part.neck": "Collo",
  "part.shoulder": "Spalla",
  "part.elbow": "Gomito",
  "part.wrist": "Polso o mano",
  "part.chest": "Petto",
  "part.upperBack": "Parte alta della schiena",
  "part.lowerBack": "Zona lombare",
  "part.abs": "Addominali o core",
  "part.hip": "Anca",
  "part.groin": "Inguine",
  "part.quad": "Parte anteriore della coscia",
  "part.hamstring": "Femorali",
  "part.knee": "Ginocchio",
  "part.calf": "Polpaccio",
  "part.ankle": "Caviglia o piede",
};

export const ja: Partial<Record<Key, Message>> = {
  "part.neck": "首",
  "part.shoulder": "肩",
  "part.elbow": "肘",
  "part.wrist": "手首・手",
  "part.chest": "胸",
  "part.upperBack": "背中上部",
  "part.lowerBack": "腰",
  "part.abs": "腹部・体幹",
  "part.hip": "股関節",
  "part.groin": "鼠径部",
  "part.quad": "太もも前側",
  "part.hamstring": "ハムストリング",
  "part.knee": "膝",
  "part.calf": "ふくらはぎ",
  "part.ankle": "足首・足",
};
