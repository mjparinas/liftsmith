import type { Message } from "@/lib/i18n";

// Text for keys starting "plate.": the words on the plate graphic (PLATE_WORDS in src/components/PlateBar.tsx,
// which keeps the English for the website's plate calculator). English is the source and must match
// PLATE_WORDS (a test checks).

export const en = {
  "plate.label": "Load {plates} {unit} on each side of a {bar} {unit} bar",
  "plate.noPlates": "no plates",
  "plate.bar": "{bar} {unit} bar",
  "plate.eachSide": "Each side:",
  "plate.empty": "Empty bar",
  "plate.nearest": "nearest you can load",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "plate.label": "Carga {plates} {unit} a cada lado de una barra de {bar} {unit}",
  "plate.noPlates": "ningún disco",
  "plate.bar": "Barra de {bar} {unit}",
  "plate.eachSide": "Cada lado:",
  "plate.empty": "Barra vacía",
  "plate.nearest": "lo más cercano que puedes cargar",
};

export const fr: Partial<Record<Key, Message>> = {
  "plate.label": "Chargez {plates} {unit} de chaque côté d’une barre de {bar} {unit}",
  "plate.noPlates": "aucun disque",
  "plate.bar": "Barre de {bar} {unit}",
  "plate.eachSide": "Chaque côté :",
  "plate.empty": "Barre vide",
  "plate.nearest": "le plus proche possible",
};

export const de: Partial<Record<Key, Message>> = {
  "plate.label": "{plates} {unit} auf jede Seite einer {bar}-{unit}-Stange laden",
  "plate.noPlates": "keine Scheiben",
  "plate.bar": "{bar}-{unit}-Stange",
  "plate.eachSide": "Pro Seite:",
  "plate.empty": "Leere Stange",
  "plate.nearest": "das Nächste, was du laden kannst",
};

export const it: Partial<Record<Key, Message>> = {
  "plate.label": "Carica {plates} {unit} per lato su un bilanciere da {bar} {unit}",
  "plate.noPlates": "nessun disco",
  "plate.bar": "Bilanciere da {bar} {unit}",
  "plate.eachSide": "Per lato:",
  "plate.empty": "Bilanciere vuoto",
  "plate.nearest": "il più vicino che puoi caricare",
};

export const ja: Partial<Record<Key, Message>> = {
  "plate.label": "{bar} {unit}のバーの片側に{plates} {unit}を付ける",
  "plate.noPlates": "プレートなし",
  "plate.bar": "{bar} {unit}のバー",
  "plate.eachSide": "片側：",
  "plate.empty": "バーのみ",
  "plate.nearest": "付けられる最も近い重さ",
};

export const pt: Partial<Record<Key, Message>> = {
  "plate.label": "Coloque {plates} {unit} de cada lado de uma barra de {bar} {unit}",
  "plate.noPlates": "sem anilhas",
  "plate.bar": "Barra de {bar} {unit}",
  "plate.eachSide": "Cada lado:",
  "plate.empty": "Barra vazia",
  "plate.nearest": "o mais próximo que dá para montar",
};

export const ko: Partial<Record<Key, Message>> = {
  "plate.label": "{bar} {unit} 바의 양쪽에 각각 {plates} {unit} 끼우기",
  "plate.noPlates": "원판 없음",
  "plate.bar": "{bar} {unit} 바",
  "plate.eachSide": "한쪽당:",
  "plate.empty": "빈 바",
  "plate.nearest": "끼울 수 있는 가장 가까운 무게",
};

export const tr: Partial<Record<Key, Message>> = {
  "plate.label": "{bar} {unit} barın her iki yanına {plates} {unit} tak",
  "plate.noPlates": "plaka yok",
  "plate.bar": "{bar} {unit} bar",
  "plate.eachSide": "Her yana:",
  "plate.empty": "Boş bar",
  "plate.nearest": "takabileceğin en yakın ağırlık",
};

export const pl: Partial<Record<Key, Message>> = {
  "plate.label": "Załóż {plates} {unit} z każdej strony sztangi {bar} {unit}",
  "plate.noPlates": "bez talerzy",
  "plate.bar": "Sztanga {bar} {unit}",
  "plate.eachSide": "Z każdej strony:",
  "plate.empty": "Pusta sztanga",
  "plate.nearest": "najbliżej, ile się da załadować",
};
