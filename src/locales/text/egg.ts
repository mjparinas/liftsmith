import type { Message } from "@/lib/i18n";

// Text for keys starting "egg.", in every language: the easter eggs (src/lib/eggs.ts). English is the source.

export const en = {
  "egg.joke.420": "420 on the bar. Nice. Very chill number for a very heavy set.",
  "egg.joke.1337": "1337: elite. Literally. That's hacker speak for very, very good.",
  "egg.title": "Lifetime, in other units",
  "egg.lead": "You've lifted {total} in all. That's about:",
  "egg.empty": "Lift something first, then come back and see what it weighs in elephants.",
  "egg.note": "Rough masses, for fun. You found a secret.",
  "egg.unit.elephant": { one: "{n} African elephant", other: "{n} African elephants" },
  "egg.unit.trex": { one: "{n} T. rex", other: "{n} T. rexes" },
  "egg.unit.bus": { one: "{n} double-decker bus", other: "{n} double-decker buses" },
  "egg.unit.car": { one: "{n} family car", other: "{n} family cars" },
  "egg.unit.piano": { one: "{n} grand piano", other: "{n} grand pianos" },
  "egg.unit.retriever": { one: "{n} golden retriever", other: "{n} golden retrievers" },
  "egg.unit.bluewhale": { one: "{n} blue whale", other: "{n} blue whales" },
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "egg.joke.420": "420 en la barra. Qué bien. Un número muy tranquilo para una serie muy pesada.",
  "egg.joke.1337": "1337: élite. Literalmente. Así dicen los hackers «muy, muy bueno».",
  "egg.title": "Tu total, en otras unidades",
  "egg.lead": "Has levantado {total} en total. Eso es más o menos:",
  "egg.empty": "Levanta algo primero y vuelve para ver cuánto pesa en elefantes.",
  "egg.note": "Pesos aproximados, por diversión. Has encontrado un secreto.",
  "egg.unit.elephant": { one: "{n} elefante africano", other: "{n} elefantes africanos" },
  "egg.unit.trex": { one: "{n} T. rex", other: "{n} T. rex" },
  "egg.unit.bus": { one: "{n} autobús de dos pisos", other: "{n} autobuses de dos pisos" },
  "egg.unit.car": { one: "{n} coche familiar", other: "{n} coches familiares" },
  "egg.unit.piano": { one: "{n} piano de cola", other: "{n} pianos de cola" },
  "egg.unit.retriever": { one: "{n} golden retriever", other: "{n} golden retrievers" },
  "egg.unit.bluewhale": { one: "{n} ballena azul", other: "{n} ballenas azules" },
};

export const fr: Partial<Record<Key, Message>> = {
  "egg.joke.420": "420 sur la barre. Joli. Un nombre très cool pour une série très lourde.",
  "egg.joke.1337": "1337 : élite. Littéralement. C’est « très, très fort » en langage de hacker.",
  "egg.title": "Votre total, en d’autres unités",
  "egg.lead": "Vous avez soulevé {total} au total. Soit environ :",
  "egg.empty": "Soulevez quelque chose d’abord, puis revenez voir combien ça pèse en éléphants.",
  "egg.note": "Masses approximatives, pour le plaisir. Vous avez trouvé un secret.",
  "egg.unit.elephant": { one: "{n} éléphant d’Afrique", other: "{n} éléphants d’Afrique" },
  "egg.unit.trex": { one: "{n} T. rex", other: "{n} T. rex" },
  "egg.unit.bus": { one: "{n} bus à impériale", other: "{n} bus à impériale" },
  "egg.unit.car": { one: "{n} voiture familiale", other: "{n} voitures familiales" },
  "egg.unit.piano": { one: "{n} piano à queue", other: "{n} pianos à queue" },
  "egg.unit.retriever": { one: "{n} golden retriever", other: "{n} golden retrievers" },
  "egg.unit.bluewhale": { one: "{n} baleine bleue", other: "{n} baleines bleues" },
};

export const de: Partial<Record<Key, Message>> = {
  "egg.joke.420": "420 auf der Stange. Nice. Eine sehr entspannte Zahl für einen sehr schweren Satz.",
  "egg.joke.1337": "1337: Elite. Wörtlich. Das ist Hackersprache für „sehr, sehr gut“.",
  "egg.title": "Dein Gesamtgewicht in anderen Einheiten",
  "egg.lead": "Du hast insgesamt {total} gehoben. Das sind ungefähr:",
  "egg.empty": "Heb erst etwas und schau dann, wie viele Elefanten das sind.",
  "egg.note": "Grobe Gewichte, zum Spaß. Du hast ein Geheimnis gefunden.",
  "egg.unit.elephant": { one: "{n} Afrikanischer Elefant", other: "{n} Afrikanische Elefanten" },
  "egg.unit.trex": { one: "{n} T. rex", other: "{n} T. rex" },
  "egg.unit.bus": { one: "{n} Doppeldeckerbus", other: "{n} Doppeldeckerbusse" },
  "egg.unit.car": { one: "{n} Familienauto", other: "{n} Familienautos" },
  "egg.unit.piano": { one: "{n} Konzertflügel", other: "{n} Konzertflügel" },
  "egg.unit.retriever": { one: "{n} Golden Retriever", other: "{n} Golden Retriever" },
  "egg.unit.bluewhale": { one: "{n} Blauwal", other: "{n} Blauwale" },
};

export const it: Partial<Record<Key, Message>> = {
  "egg.joke.420": "420 sul bilanciere. Niente male. Un numero molto rilassato per una serie molto pesante.",
  "egg.joke.1337": "1337: élite. Letteralmente. In gergo hacker vuol dire «molto, molto bravo».",
  "egg.title": "Il tuo totale, in altre unità",
  "egg.lead": "Hai sollevato {total} in tutto. Più o meno:",
  "egg.empty": "Solleva qualcosa prima, poi torna a vedere quanto pesa in elefanti.",
  "egg.note": "Pesi approssimativi, per divertimento. Hai trovato un segreto.",
  "egg.unit.elephant": { one: "{n} elefante africano", other: "{n} elefanti africani" },
  "egg.unit.trex": { one: "{n} T. rex", other: "{n} T. rex" },
  "egg.unit.bus": { one: "{n} autobus a due piani", other: "{n} autobus a due piani" },
  "egg.unit.car": { one: "{n} auto familiare", other: "{n} auto familiari" },
  "egg.unit.piano": { one: "{n} pianoforte a coda", other: "{n} pianoforti a coda" },
  "egg.unit.retriever": { one: "{n} golden retriever", other: "{n} golden retriever" },
  "egg.unit.bluewhale": { one: "{n} balenottera azzurra", other: "{n} balenottere azzurre" },
};

export const ja: Partial<Record<Key, Message>> = {
  "egg.joke.420": "バーに420。いいね。とても重いセットに、とてもゆるい数字。",
  "egg.joke.1337": "1337：エリート。文字どおり。ハッカー語で「めちゃくちゃすごい」という意味です。",
  "egg.title": "これまでの合計を別の単位で",
  "egg.lead": "これまでに合計{total}を挙げました。だいたい：",
  "egg.empty": "まず何か挙げてから、ゾウ何頭分か見に来てください。",
  "egg.note": "おおよその重さで、お遊びです。秘密を見つけましたね。",
  "egg.unit.elephant": { other: "アフリカゾウ{n}頭" },
  "egg.unit.trex": { other: "ティラノサウルス{n}頭" },
  "egg.unit.bus": { other: "2階建てバス{n}台" },
  "egg.unit.car": { other: "ファミリーカー{n}台" },
  "egg.unit.piano": { other: "グランドピアノ{n}台" },
  "egg.unit.retriever": { other: "ゴールデンレトリバー{n}匹" },
  "egg.unit.bluewhale": { other: "シロナガスクジラ{n}頭" },
};
