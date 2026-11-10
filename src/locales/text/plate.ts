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
