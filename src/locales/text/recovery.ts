import type { Message } from "@/lib/i18n";

// Text for keys starting "recovery.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "recovery.title": "Recovery",
  "recovery.lead": "Colours and marks show how recovered each muscle is from your recent sets.",
  "recovery.muscles": "Muscles · this week vs {goal}-set goal",
  "recovery.setsOf": "{done} of {goal} sets this week",
  "recovery.pct": "{pct}% recovered",
  "recovery.setsShort": "{done}/{goal} sets",
  "recovery.locked.title": "The recovery map is part of Pro",
  "recovery.locked.body": "See how recovered each muscle is, and which are ready to train today.",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "recovery.title": "Recuperación",
  "recovery.lead": "Los colores y las marcas muestran cuánto se ha recuperado cada músculo de tus series recientes.",
  "recovery.muscles": "Músculos · esta semana frente al objetivo de {goal} series",
  "recovery.setsOf": "{done} de {goal} series esta semana",
  "recovery.pct": "{pct}% recuperado",
  "recovery.setsShort": "{done}/{goal} series",
  "recovery.locked.title": "El mapa de recuperación es parte de Pro",
  "recovery.locked.body": "Mira cuánto se ha recuperado cada músculo y cuáles están listos para entrenar hoy.",
};

export const fr: Partial<Record<Key, Message>> = {
  "recovery.title": "Récupération",
  "recovery.lead": "Les couleurs et les motifs montrent la récupération de chaque muscle après vos séries récentes.",
  "recovery.muscles": "Muscles · cette semaine face à l’objectif de {goal} séries",
  "recovery.setsOf": "{done} séries sur {goal} cette semaine",
  "recovery.pct": "{pct} % récupéré",
  "recovery.setsShort": "{done}/{goal} séries",
  "recovery.locked.title": "La carte de récupération fait partie de Pro",
  "recovery.locked.body": "Voyez où en est la récupération de chaque muscle, et lesquels sont prêts pour aujourd’hui.",
};

export const de: Partial<Record<Key, Message>> = {
  "recovery.title": "Erholung",
  "recovery.lead": "Farben und Markierungen zeigen, wie gut sich jeder Muskel von deinen letzten Sätzen erholt hat.",
  "recovery.muscles": "Muskeln · diese Woche vs. Ziel von {goal} Sätzen",
  "recovery.setsOf": "{done} von {goal} Sätzen diese Woche",
  "recovery.pct": "{pct} % erholt",
  "recovery.setsShort": "{done}/{goal} Sätze",
  "recovery.locked.title": "Die Erholungskarte gehört zu Pro",
  "recovery.locked.body": "Sieh, wie erholt jeder Muskel ist und welche heute bereit fürs Training sind.",
};

export const it: Partial<Record<Key, Message>> = {
  "recovery.title": "Recupero",
  "recovery.lead": "Colori e segni mostrano quanto ogni muscolo si è ripreso dalle ultime serie.",
  "recovery.muscles": "Muscoli · questa settimana vs obiettivo di {goal} serie",
  "recovery.setsOf": "{done} di {goal} serie questa settimana",
  "recovery.pct": "{pct}% recuperato",
  "recovery.setsShort": "{done}/{goal} serie",
  "recovery.locked.title": "La mappa del recupero fa parte di Pro",
  "recovery.locked.body": "Guarda quanto è recuperato ogni muscolo e quali sono pronti per l’allenamento di oggi.",
};

export const ja: Partial<Record<Key, Message>> = {
  "recovery.title": "回復",
  "recovery.lead": "色と模様で、最近のセットから各筋肉がどれだけ回復したかを示します。",
  "recovery.muscles": "筋肉 · 今週の実績と目標{goal}セット",
  "recovery.setsOf": "今週 {done}/{goal}セット",
  "recovery.pct": "回復 {pct}%",
  "recovery.setsShort": "{done}/{goal}セット",
  "recovery.locked.title": "回復マップは Pro の機能です",
  "recovery.locked.body": "各筋肉の回復度と、今日トレーニングできる筋肉がわかります。",
};

export const pt: Partial<Record<Key, Message>> = {
  "recovery.title": "Recuperação",
  "recovery.lead": "Cores e marcas mostram o quanto cada músculo já se recuperou das suas séries recentes.",
  "recovery.muscles": "Músculos · esta semana vs meta de {goal} séries",
  "recovery.setsOf": "{done} de {goal} séries nesta semana",
  "recovery.pct": "{pct}% recuperado",
  "recovery.setsShort": "{done}/{goal} séries",
  "recovery.locked.title": "O mapa de recuperação faz parte do Pro",
  "recovery.locked.body": "Veja o quanto cada músculo se recuperou e quais estão prontos para treinar hoje.",
};

export const ko: Partial<Record<Key, Message>> = {
  "recovery.title": "회복",
  "recovery.lead": "색과 표시로 최근 세트 이후 각 근육이 얼마나 회복됐는지 보여 줘요.",
  "recovery.muscles": "근육 · 이번 주 vs {goal}세트 목표",
  "recovery.setsOf": "이번 주 {goal}세트 중 {done}세트",
  "recovery.pct": "{pct}% 회복",
  "recovery.setsShort": "{done}/{goal}세트",
  "recovery.locked.title": "회복 맵은 Pro 기능이에요",
  "recovery.locked.body": "각 근육이 얼마나 회복됐는지, 오늘 어떤 근육을 훈련할 수 있는지 확인하세요.",
};

export const tr: Partial<Record<Key, Message>> = {
  "recovery.title": "Toparlanma",
  "recovery.lead": "Renkler ve işaretler, son setlerinden sonra her kasın ne kadar toparlandığını gösterir.",
  "recovery.muscles": "Kaslar · bu hafta, {goal} setlik hedefe göre",
  "recovery.setsOf": "Bu hafta {goal} setten {done}",
  "recovery.pct": "%{pct} toparlandı",
  "recovery.setsShort": "{done}/{goal} set",
  "recovery.locked.title": "Toparlanma haritası Pro'nun parçası",
  "recovery.locked.body": "Her kasın ne kadar toparlandığını ve hangilerinin bugün çalışmaya hazır olduğunu gör.",
};

export const pl: Partial<Record<Key, Message>> = {
  "recovery.title": "Regeneracja",
  "recovery.lead": "Kolory i oznaczenia pokazują, jak bardzo każdy mięsień zregenerował się po ostatnich seriach.",
  "recovery.muscles": "Mięśnie · ten tydzień vs cel {goal} serii",
  "recovery.setsOf": "{done} z {goal} serii w tym tygodniu",
  "recovery.pct": "Regeneracja {pct}%",
  "recovery.setsShort": "{done}/{goal} serii",
  "recovery.locked.title": "Mapa regeneracji jest częścią Pro",
  "recovery.locked.body": "Zobacz, jak zregenerowany jest każdy mięsień i które są dziś gotowe do treningu.",
};
