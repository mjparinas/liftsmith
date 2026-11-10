import type { Message } from "@/lib/i18n";

// Text for keys starting "demo.": the 3D exercise demo's labels and controls (DEMO_WORDS in
// src/components/demo/LiftDemoCore.tsx, which keeps the English for the website). English is the source
// and must match DEMO_WORDS (a test checks).

export const en = {
  "demo.figure": "Figure",
  "demo.alt": "3D figure doing {name}",
  "demo.altDrag": "3D figure doing {name}. Drag to rotate.",
  "demo.altNone": "3D figure",
  "demo.drag": "Drag to rotate",
  "demo.controls": "Demo controls",
  "demo.body": "Body",
  "demo.male": "Male",
  "demo.female": "Female",
  "demo.view": "View",
  "demo.orbit": "Orbit",
  "demo.front": "Front",
  "demo.side": "Side",
  "demo.skeleton": "Skeleton",
  "demo.muscles": "Target muscles",
  "demo.barPath": "Bar path",
  "demo.handPath": "Hand path",
  "demo.tempo": "Tempo",
  "demo.pause": "Pause",
  "demo.play": "Play",
  "demo.works": "Works",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "demo.figure": "Figura",
  "demo.alt": "Figura 3D haciendo {name}",
  "demo.altDrag": "Figura 3D haciendo {name}. Arrastra para girarla.",
  "demo.altNone": "Figura 3D",
  "demo.drag": "Arrastra para girar",
  "demo.controls": "Controles de la demostración",
  "demo.body": "Cuerpo",
  "demo.male": "Hombre",
  "demo.female": "Mujer",
  "demo.view": "Vista",
  "demo.orbit": "Órbita",
  "demo.front": "Frente",
  "demo.side": "Lado",
  "demo.skeleton": "Esqueleto",
  "demo.muscles": "Músculos trabajados",
  "demo.barPath": "Recorrido de la barra",
  "demo.handPath": "Recorrido de las manos",
  "demo.tempo": "Ritmo",
  "demo.pause": "Pausa",
  "demo.play": "Reproducir",
  "demo.works": "Trabaja",
};

export const fr: Partial<Record<Key, Message>> = {
  "demo.figure": "Silhouette",
  "demo.alt": "Silhouette 3D qui fait {name}",
  "demo.altDrag": "Silhouette 3D qui fait {name}. Faites glisser pour la tourner.",
  "demo.altNone": "Silhouette 3D",
  "demo.drag": "Glissez pour tourner",
  "demo.controls": "Commandes de la démo",
  "demo.body": "Corps",
  "demo.male": "Homme",
  "demo.female": "Femme",
  "demo.view": "Vue",
  "demo.orbit": "Orbite",
  "demo.front": "Face",
  "demo.side": "Profil",
  "demo.skeleton": "Squelette",
  "demo.muscles": "Muscles ciblés",
  "demo.barPath": "Trajet de la barre",
  "demo.handPath": "Trajet des mains",
  "demo.tempo": "Tempo",
  "demo.pause": "Pause",
  "demo.play": "Lecture",
  "demo.works": "Travaille",
};
