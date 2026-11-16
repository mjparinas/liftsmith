import type { Message } from "@/lib/i18n";

// Text for keys starting "egg.", in every language: the easter eggs (src/lib/eggs.ts). English is the source.

export const en = {
  "egg.joke.420": "420 on the bar. Nice. Very chill number for a very heavy set.",
  "egg.joke.1337": "1337: elite. Literally. That's hacker speak for very, very good.",
  "egg.flame.ok": "You found a secret: an extra day of adaptive workouts. Today's plan is adaptive.",
  "egg.flame.today": "Today's already a bonus day. Come back tomorrow.",
  "egg.flame.week": "That's three bonus days this week. The flame rests until next week.",
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
  "egg.flame.ok": "Has encontrado un secreto: un día extra de entrenamientos adaptativos. El plan de hoy es adaptativo.",
  "egg.flame.today": "Hoy ya es un día extra. Vuelve mañana.",
  "egg.flame.week": "Ya van tres días extra esta semana. La llama descansa hasta la semana que viene.",
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
  "egg.flame.ok": "Vous avez trouvé un secret : un jour de plus d’entraînements adaptatifs. Le plan du jour est adaptatif.",
  "egg.flame.today": "Aujourd’hui est déjà un jour bonus. Revenez demain.",
  "egg.flame.week": "Trois jours bonus cette semaine. La flamme se repose jusqu’à la semaine prochaine.",
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
  "egg.flame.ok": "Du hast ein Geheimnis gefunden: einen zusätzlichen Tag mit adaptiven Workouts. Der heutige Plan ist adaptiv.",
  "egg.flame.today": "Heute ist schon ein Bonustag. Komm morgen wieder.",
  "egg.flame.week": "Das sind drei Bonustage diese Woche. Die Flamme ruht bis nächste Woche.",
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
  "egg.flame.ok": "Hai trovato un segreto: un giorno in più di allenamenti adattivi. Il piano di oggi è adattivo.",
  "egg.flame.today": "Oggi è già un giorno bonus. Torna domani.",
  "egg.flame.week": "Sono già tre giorni bonus questa settimana. La fiamma riposa fino alla prossima.",
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
  "egg.flame.ok": "秘密を見つけました：アダプティブワークアウトがもう1日使えます。今日のプランはアダプティブです。",
  "egg.flame.today": "今日はすでにボーナスデーです。また明日どうぞ。",
  "egg.flame.week": "今週のボーナスデーは3日に達しました。炎は来週まで休みます。",
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

export const pt: Partial<Record<Key, Message>> = {
  "egg.joke.420": "420 na barra. Boa. Número bem tranquilo para uma série bem pesada.",
  "egg.joke.1337": "1337: elite. Literalmente. É a gíria hacker para muito, muito bom.",
  "egg.flame.ok": "Você achou um segredo: um dia extra de treinos adaptativos. O plano de hoje é adaptativo.",
  "egg.flame.today": "Hoje já é um dia bônus. Volte amanhã.",
  "egg.flame.week": "Já são três dias bônus esta semana. A chama descansa até a semana que vem.",
  "egg.title": "Sua vida toda, em outras unidades",
  "egg.lead": "Você já levantou {total} no total. Isso é cerca de:",
  "egg.empty": "Levante alguma coisa primeiro, depois volte para ver quanto pesa em elefantes.",
  "egg.note": "Massas aproximadas, só por diversão. Você achou um segredo.",
  "egg.unit.elephant": {
    one: "{n} elefante-africano",
    other: "{n} elefantes-africanos",
  },
  "egg.unit.trex": {
    one: "{n} T. rex",
    other: "{n} T. rex",
  },
  "egg.unit.bus": {
    one: "{n} ônibus de dois andares",
    other: "{n} ônibus de dois andares",
  },
  "egg.unit.car": {
    one: "{n} carro de passeio",
    other: "{n} carros de passeio",
  },
  "egg.unit.piano": {
    one: "{n} piano de cauda",
    other: "{n} pianos de cauda",
  },
  "egg.unit.retriever": {
    one: "{n} golden retriever",
    other: "{n} golden retrievers",
  },
  "egg.unit.bluewhale": {
    one: "{n} baleia-azul",
    other: "{n} baleias-azuis",
  },
};

export const ko: Partial<Record<Key, Message>> = {
  "egg.joke.420": "바에 420. 좋네요. 아주 무거운 세트에 아주 여유로운 숫자예요.",
  "egg.joke.1337": "1337: 엘리트. 진짜로요. 해커 말로 엄청, 엄청 잘한다는 뜻이에요.",
  "egg.flame.ok": "비밀을 찾았어요: 적응형 운동을 하루 더 할 수 있어요. 오늘 계획은 적응형이에요.",
  "egg.flame.today": "오늘은 이미 보너스 데이예요. 내일 다시 와 주세요.",
  "egg.flame.week": "이번 주 보너스 데이를 세 번 모두 썼어요. 불꽃은 다음 주까지 쉬어요.",
  "egg.title": "지금까지 든 무게, 다른 단위로",
  "egg.lead": "지금까지 총 {total}을(를) 들었어요. 대략 이 정도예요:",
  "egg.empty": "먼저 뭔가를 들어 보고, 다시 와서 코끼리로 몇 마리인지 확인하세요.",
  "egg.note": "재미로 보는 대략적인 무게예요. 비밀을 찾았네요.",
  "egg.unit.elephant": {
    other: "아프리카코끼리 {n}마리",
  },
  "egg.unit.trex": {
    other: "티라노사우루스 {n}마리",
  },
  "egg.unit.bus": {
    other: "2층 버스 {n}대",
  },
  "egg.unit.car": {
    other: "승용차 {n}대",
  },
  "egg.unit.piano": {
    other: "그랜드 피아노 {n}대",
  },
  "egg.unit.retriever": {
    other: "골든 리트리버 {n}마리",
  },
  "egg.unit.bluewhale": {
    other: "대왕고래 {n}마리",
  },
};

export const tr: Partial<Record<Key, Message>> = {
  "egg.joke.420": "Barda 420. Güzel. Çok ağır bir set için epey rahat bir sayı.",
  "egg.joke.1337": "1337: elit. Gerçekten. Hacker dilinde çok, çok iyi demek.",
  "egg.flame.ok": "Bir sır buldun: bir gün daha uyarlanabilir antrenman. Bugünün planı uyarlanabilir.",
  "egg.flame.today": "Bugün zaten bonus gün. Yarın tekrar gel.",
  "egg.flame.week": "Bu hafta üç bonus gün oldu. Alev gelecek haftaya kadar dinleniyor.",
  "egg.title": "Tüm zamanlar, başka birimlerle",
  "egg.lead": "Toplamda {total} kaldırdın. Bu yaklaşık:",
  "egg.empty": "Önce bir şey kaldır, sonra gel ve kaç fil ettiğini gör.",
  "egg.note": "Kaba ağırlıklar, eğlence için. Bir sır buldun.",
  "egg.unit.elephant": {
    one: "{n} Afrika fili",
    other: "{n} Afrika fili",
  },
  "egg.unit.trex": {
    one: "{n} T. rex",
    other: "{n} T. rex",
  },
  "egg.unit.bus": {
    one: "{n} iki katlı otobüs",
    other: "{n} iki katlı otobüs",
  },
  "egg.unit.car": {
    one: "{n} aile arabası",
    other: "{n} aile arabası",
  },
  "egg.unit.piano": {
    one: "{n} kuyruklu piyano",
    other: "{n} kuyruklu piyano",
  },
  "egg.unit.retriever": {
    one: "{n} golden retriever",
    other: "{n} golden retriever",
  },
  "egg.unit.bluewhale": {
    one: "{n} mavi balina",
    other: "{n} mavi balina",
  },
};

export const pl: Partial<Record<Key, Message>> = {
  "egg.joke.420": "420 na sztandze. Nieźle. Bardzo wyluzowana liczba jak na bardzo ciężką serię.",
  "egg.joke.1337": "1337: elita. Dosłownie. W języku hakerów to znaczy bardzo, bardzo dobrze.",
  "egg.flame.ok": "Odkryto sekret: dodatkowy dzień treningów adaptacyjnych. Dzisiejszy plan jest adaptacyjny.",
  "egg.flame.today": "Dziś to już dzień bonusowy. Wróć jutro.",
  "egg.flame.week": "To już trzy dni bonusowe w tym tygodniu. Płomień odpoczywa do przyszłego tygodnia.",
  "egg.title": "Całe życie, w innych jednostkach",
  "egg.lead": "Łącznie podniesiono {total}. To mniej więcej:",
  "egg.empty": "Najpierw coś podnieś, a potem wróć i sprawdź, ile to waży w słoniach.",
  "egg.note": "Przybliżone masy, dla zabawy. Udało Ci się znaleźć sekret.",
  "egg.unit.elephant": {
    one: "{n} słoń afrykański",
    few: "{n} słonie afrykańskie",
    many: "{n} słoni afrykańskich",
    other: "{n} słonia afrykańskiego",
  },
  "egg.unit.trex": {
    one: "{n} T. rex",
    few: "{n} T. reksy",
    many: "{n} T. reksów",
    other: "{n} T. reksa",
  },
  "egg.unit.bus": {
    one: "{n} autobus piętrowy",
    few: "{n} autobusy piętrowe",
    many: "{n} autobusów piętrowych",
    other: "{n} autobusu piętrowego",
  },
  "egg.unit.car": {
    one: "{n} samochód rodzinny",
    few: "{n} samochody rodzinne",
    many: "{n} samochodów rodzinnych",
    other: "{n} samochodu rodzinnego",
  },
  "egg.unit.piano": {
    one: "{n} fortepian",
    few: "{n} fortepiany",
    many: "{n} fortepianów",
    other: "{n} fortepianu",
  },
  "egg.unit.retriever": {
    one: "{n} golden retriever",
    few: "{n} golden retrievery",
    many: "{n} golden retrieverów",
    other: "{n} golden retrievera",
  },
  "egg.unit.bluewhale": {
    one: "{n} płetwal błękitny",
    few: "{n} płetwale błękitne",
    many: "{n} płetwali błękitnych",
    other: "{n} płetwala błękitnego",
  },
};
