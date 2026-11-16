import type { Message } from "@/lib/i18n";

// Text for keys starting "buy.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "buy.title": "What to buy next",
  "buy.got": "I got them",
  "buy.have": "I have it",
  "buy.note": "Based on your plates, equipment and the weights you lift. No ads or sponsored picks.",
  "buy.pair": "A pair of {w} plates: {why}.",
  "buy.sep": "; ",
  "buy.jumps": "jumps of {to} instead of {from}, so slow lifts like the press keep moving",
  "buy.more": { one: "{count} more weight you can load up to {hi}", other: "{count} more weights you can load up to {hi}" },
  "buy.room": "room past your current {max} limit",
  "buy.kit": { one: "{item}: {count} new exercise.", other: "{item}: {count} new exercises." },
  "buy.kitMuscles": {
    one: "{item}: {unlocks}, and the first loaded work for {count} muscle.",
    other: "{item}: {unlocks}, and the first loaded work for {count} muscles.",
  },
  "buy.newEx": { one: "{count} new exercise", other: "{count} new exercises" },
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "buy.title": "Qué comprar ahora",
  "buy.got": "Ya los tengo",
  "buy.have": "Ya lo tengo",
  "buy.note": "Según tus discos, tu equipo y los pesos que levantas. Sin anuncios ni recomendaciones patrocinadas.",
  "buy.pair": "Un par de discos de {w}: {why}.",
  "buy.sep": "; ",
  "buy.jumps": "saltos de {to} en vez de {from}, para que los ejercicios lentos como el press sigan avanzando",
  "buy.more": { one: "{count} peso más que puedes cargar hasta {hi}", other: "{count} pesos más que puedes cargar hasta {hi}" },
  "buy.room": "margen por encima de tu límite actual de {max}",
  "buy.kit": { one: "{item}: {count} ejercicio nuevo.", other: "{item}: {count} ejercicios nuevos." },
  "buy.kitMuscles": {
    one: "{item}: {unlocks}, y el primer trabajo con carga para {count} músculo.",
    other: "{item}: {unlocks}, y el primer trabajo con carga para {count} músculos.",
  },
  "buy.newEx": { one: "{count} ejercicio nuevo", other: "{count} ejercicios nuevos" },
};

export const fr: Partial<Record<Key, Message>> = {
  "buy.title": "Quoi acheter ensuite",
  "buy.got": "Je les ai",
  "buy.have": "Je l’ai",
  "buy.note": "D’après vos disques, votre matériel et les charges que vous soulevez. Pas de pub ni de choix sponsorisés.",
  "buy.pair": "Une paire de disques de {w} : {why}.",
  "buy.sep": " ; ",
  "buy.jumps": "des sauts de {to} au lieu de {from}, pour que les mouvements lents comme le développé militaire continuent de progresser",
  "buy.more": { one: "{count} charge de plus possible jusqu’à {hi}", other: "{count} charges de plus possibles jusqu’à {hi}" },
  "buy.room": "de la marge au-delà de votre limite actuelle de {max}",
  "buy.kit": { one: "{item} : {count} nouvel exercice.", other: "{item} : {count} nouveaux exercices." },
  "buy.kitMuscles": {
    one: "{item} : {unlocks}, et le premier travail chargé pour {count} muscle.",
    other: "{item} : {unlocks}, et le premier travail chargé pour {count} muscles.",
  },
  "buy.newEx": { one: "{count} nouvel exercice", other: "{count} nouveaux exercices" },
};

export const de: Partial<Record<Key, Message>> = {
  "buy.title": "Was du als Nächstes kaufen solltest",
  "buy.got": "Hab ich gekauft",
  "buy.have": "Hab ich",
  "buy.note":
    "Basierend auf deinen Scheiben, deiner Ausrüstung und den Gewichten, die du bewegst. Keine Werbung, keine gesponserten Tipps.",
  "buy.pair": "Ein Paar {w}-Scheiben: {why}.",
  "buy.sep": ";",
  "buy.jumps": "Sprünge von {to} statt {from}, damit langsame Übungen wie das Drücken weiter vorankommen",
  "buy.more": {
    one: "{count} weiteres Gewicht, das du bis {hi} laden kannst",
    other: "{count} weitere Gewichte, die du bis {hi} laden kannst",
  },
  "buy.room": "Luft über deine aktuelle Grenze von {max}",
  "buy.kit": { one: "{item}: {count} neue Übung.", other: "{item}: {count} neue Übungen." },
  "buy.kitMuscles": {
    one: "{item}: {unlocks} und das erste Training mit Gewicht für {count} Muskel.",
    other: "{item}: {unlocks} und das erste Training mit Gewicht für {count} Muskeln.",
  },
  "buy.newEx": { one: "{count} neue Übung", other: "{count} neue Übungen" },
};

export const it: Partial<Record<Key, Message>> = {
  "buy.title": "Cosa comprare dopo",
  "buy.got": "Li ho presi",
  "buy.have": "Ce l’ho",
  "buy.note": "In base ai tuoi dischi, all’attrezzatura e ai pesi che sollevi. Niente pubblicità né consigli sponsorizzati.",
  "buy.pair": "Una coppia di dischi da {w}: {why}.",
  "buy.sep": ";",
  "buy.jumps": "salti di {to} invece di {from}, così gli esercizi lenti come la distensione continuano a progredire",
  "buy.more": { one: "{count} peso in più che puoi caricare fino a {hi}", other: "{count} pesi in più che puoi caricare fino a {hi}" },
  "buy.room": "margine oltre il tuo limite attuale di {max}",
  "buy.kit": { one: "{item}: {count} nuovo esercizio.", other: "{item}: {count} nuovi esercizi." },
  "buy.kitMuscles": {
    one: "{item}: {unlocks}, e il primo lavoro con carico per {count} muscolo.",
    other: "{item}: {unlocks}, e il primo lavoro con carico per {count} muscoli.",
  },
  "buy.newEx": { one: "{count} nuovo esercizio", other: "{count} nuovi esercizi" },
};

export const ja: Partial<Record<Key, Message>> = {
  "buy.title": "次に買うもの",
  "buy.got": "買いました",
  "buy.have": "持っています",
  "buy.note": "手持ちのプレート、器具、扱う重量をもとにしています。広告やスポンサーのおすすめはありません。",
  "buy.pair": "{w}のプレート2枚：{why}。",
  "buy.sep": "、",
  "buy.jumps": "{from}ではなく{to}刻みになり、プレスのように伸びにくい種目も前進し続けます",
  "buy.more": { other: "{hi}までで付けられる重量が{count}通り増えます" },
  "buy.room": "今の上限{max}を超える余裕",
  "buy.kit": { other: "{item}：新しい種目が{count}つ。" },
  "buy.kitMuscles": { other: "{item}：{unlocks}。さらに{count}つの筋肉で初めて負荷をかけたトレーニングができます。" },
  "buy.newEx": { other: "新しい種目{count}つ" },
};

export const pt: Partial<Record<Key, Message>> = {
  "buy.title": "O que comprar em seguida",
  "buy.got": "Comprei",
  "buy.have": "Já tenho",
  "buy.note": "Com base nas suas anilhas, no seu equipamento e nos pesos que você levanta. Sem anúncios nem indicações patrocinadas.",
  "buy.pair": "Um par de anilhas de {w}: {why}.",
  "buy.sep": "; ",
  "buy.jumps": "saltos de {to} em vez de {from}, para que exercícios que evoluem devagar, como o desenvolvimento, continuem progredindo",
  "buy.more": {
    one: "mais {count} peso que você pode montar até {hi}",
    other: "mais {count} pesos que você pode montar até {hi}",
  },
  "buy.room": "espaço além do seu limite atual de {max}",
  "buy.kit": {
    one: "{item}: {count} exercício novo.",
    other: "{item}: {count} exercícios novos.",
  },
  "buy.kitMuscles": {
    one: "{item}: {unlocks}, e o primeiro trabalho com carga para {count} músculo.",
    other: "{item}: {unlocks}, e o primeiro trabalho com carga para {count} músculos.",
  },
  "buy.newEx": {
    one: "{count} exercício novo",
    other: "{count} exercícios novos",
  },
};

export const ko: Partial<Record<Key, Message>> = {
  "buy.title": "다음에 살 것",
  "buy.got": "샀어요",
  "buy.have": "있어요",
  "buy.note": "가진 원판, 장비, 드는 무게를 바탕으로 했어요. 광고나 협찬 추천은 없어요.",
  "buy.pair": "{w} 원판 한 쌍: {why}.",
  "buy.sep": "; ",
  "buy.jumps": "{from} 대신 {to} 단위로 올릴 수 있어서 프레스처럼 더디게 느는 운동도 계속 발전해요",
  "buy.more": {
    other: "{hi}까지 올릴 수 있는 무게가 {count}개 더 생겨요",
  },
  "buy.room": "현재 한계 {max} 이상으로 여유",
  "buy.kit": {
    other: "{item}: 새 운동 동작 {count}개.",
  },
  "buy.kitMuscles": {
    other: "{item}: {unlocks}, 그리고 근육 {count}곳에 처음으로 중량 운동 가능.",
  },
  "buy.newEx": {
    other: "새 운동 동작 {count}개",
  },
};

export const tr: Partial<Record<Key, Message>> = {
  "buy.title": "Sırada ne alınır",
  "buy.got": "Aldım",
  "buy.have": "Bende var",
  "buy.note": "Plakalarına, ekipmanına ve kaldırdığın ağırlıklara göre. Reklam ya da sponsorlu öneri yok.",
  "buy.pair": "Bir çift {w} plaka: {why}.",
  "buy.sep": "; ",
  "buy.jumps": "{from} yerine {to} artışlar, böylece press gibi yavaş ilerleyen hareketler ilerlemeye devam eder",
  "buy.more": {
    one: "{hi} değerine kadar takabileceğin {count} ağırlık daha",
    other: "{hi} değerine kadar takabileceğin {count} ağırlık daha",
  },
  "buy.room": "şu anki {max} sınırının ötesine geçme imkânı",
  "buy.kit": {
    one: "{item}: {count} yeni egzersiz.",
    other: "{item}: {count} yeni egzersiz.",
  },
  "buy.kitMuscles": {
    one: "{item}: {unlocks} ve {count} kas için ilk ağırlıklı çalışma.",
    other: "{item}: {unlocks} ve {count} kas için ilk ağırlıklı çalışma.",
  },
  "buy.newEx": {
    one: "{count} yeni egzersiz",
    other: "{count} yeni egzersiz",
  },
};

export const pl: Partial<Record<Key, Message>> = {
  "buy.title": "Co kupić w następnej kolejności",
  "buy.got": "Kupione",
  "buy.have": "Mam to",
  "buy.note": "Na podstawie Twoich talerzy, sprzętu i ciężarów, które podnosisz. Bez reklam i sponsorowanych propozycji.",
  "buy.pair": "Para talerzy {w}: {why}.",
  "buy.sep": "; ",
  "buy.jumps": "skoki co {to} zamiast {from}, więc wolno rosnące ćwiczenia, jak wyciskanie nad głowę, dalej idą do przodu",
  "buy.more": {
    one: "{count} ciężar więcej, który możesz założyć, do {hi}",
    few: "{count} ciężary więcej, które możesz założyć, do {hi}",
    many: "{count} ciężarów więcej, które możesz założyć, do {hi}",
    other: "{count} ciężaru więcej, który możesz założyć, do {hi}",
  },
  "buy.room": "zapas ponad Twój obecny limit {max}",
  "buy.kit": {
    one: "{item}: {count} nowe ćwiczenie.",
    few: "{item}: {count} nowe ćwiczenia.",
    many: "{item}: {count} nowych ćwiczeń.",
    other: "{item}: {count} nowego ćwiczenia.",
  },
  "buy.kitMuscles": {
    one: "{item}: {unlocks} oraz pierwsza praca z obciążeniem dla {count} mięśnia.",
    few: "{item}: {unlocks} oraz pierwsza praca z obciążeniem dla {count} mięśni.",
    many: "{item}: {unlocks} oraz pierwsza praca z obciążeniem dla {count} mięśni.",
    other: "{item}: {unlocks} oraz pierwsza praca z obciążeniem dla {count} mięśnia.",
  },
  "buy.newEx": {
    one: "{count} nowe ćwiczenie",
    few: "{count} nowe ćwiczenia",
    many: "{count} nowych ćwiczeń",
    other: "{count} nowego ćwiczenia",
  },
};
