import type { Message } from "@/lib/i18n";

// Text for keys starting "fmt.": the short load, reps and plate lines shared by Today, the workout screen
// and routines (src/components/app/format.ts), and the superset labels (src/lib/superset.ts), in every
// language. English is the source.

export const en = {
  "fmt.bodyweight": "Bodyweight",
  "fmt.each": "{weight} per hand",
  "fmt.reps": { one: "{n} rep", other: "{n} reps" },
  "fmt.seconds": "{n} s",
  "fmt.repsSide": { one: "{n} rep each side", other: "{n} reps each side" },
  "fmt.secondsSide": "{n} s each side",
  "fmt.repsLR": "{left} left · {right} right",
  "fmt.perSide": "Each side",
  "fmt.sideReps": "Reps are per side. Do them on both sides.",
  "fmt.sideHold": "Time is per side. Hold on both sides.",
  "fmt.perHand": "Weight is per dumbbell, one in each hand.",
  "fmt.eachSide": "Each side: {plates} {unit}",
  "fmt.emptyBar": "Empty bar",
  "fmt.superset": "Superset {letter} · {n} of {total}",
  "fmt.link": "Superset {second} with {first}",
  "fmt.unlink": "Split {second} from {first}",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "fmt.bodyweight": "Peso corporal",
  "fmt.each": "{weight} por mano",
  "fmt.reps": { one: "{n} rep.", other: "{n} reps" },
  "fmt.seconds": "{n} s",
  "fmt.repsSide": { one: "{n} rep. por lado", other: "{n} reps por lado" },
  "fmt.secondsSide": "{n} s por lado",
  "fmt.repsLR": "{left} izquierda · {right} derecha",
  "fmt.perSide": "Por lado",
  "fmt.sideReps": "Las repeticiones son por lado. Hazlas con ambos lados.",
  "fmt.sideHold": "El tiempo es por lado. Mantén la posición con ambos lados.",
  "fmt.perHand": "El peso es por mancuerna, una en cada mano.",
  "fmt.eachSide": "Cada lado: {plates} {unit}",
  "fmt.emptyBar": "Barra vacía",
  "fmt.superset": "Superserie {letter} · {n} de {total}",
  "fmt.link": "Hacer {second} en superserie con {first}",
  "fmt.unlink": "Separar {second} de {first}",
};

export const fr: Partial<Record<Key, Message>> = {
  "fmt.bodyweight": "Poids du corps",
  "fmt.each": "{weight} par main",
  "fmt.reps": { one: "{n} rép.", other: "{n} rép." },
  "fmt.seconds": "{n} s",
  "fmt.repsSide": { one: "{n} rép. par côté", other: "{n} rép. par côté" },
  "fmt.secondsSide": "{n} s par côté",
  "fmt.repsLR": "{left} gauche · {right} droite",
  "fmt.perSide": "Par côté",
  "fmt.sideReps": "Les répétitions sont par côté. Fais-les des deux côtés.",
  "fmt.sideHold": "Le temps est par côté. Tiens la position des deux côtés.",
  "fmt.perHand": "Le poids est par haltère, un dans chaque main.",
  "fmt.eachSide": "Chaque côté : {plates} {unit}",
  "fmt.emptyBar": "Barre vide",
  "fmt.superset": "Superset {letter} · {n} sur {total}",
  "fmt.link": "Enchaîner {second} en superset avec {first}",
  "fmt.unlink": "Séparer {second} de {first}",
};

export const de: Partial<Record<Key, Message>> = {
  "fmt.bodyweight": "Körpergewicht",
  "fmt.each": "{weight} pro Hand",
  "fmt.reps": { one: "{n} Wdh.", other: "{n} Wdh." },
  "fmt.seconds": "{n} s",
  "fmt.repsSide": { one: "{n} Wdh. pro Seite", other: "{n} Wdh. pro Seite" },
  "fmt.secondsSide": "{n} s pro Seite",
  "fmt.repsLR": "{left} links · {right} rechts",
  "fmt.perSide": "Pro Seite",
  "fmt.sideReps": "Die Wiederholungen gelten pro Seite. Mach sie auf beiden Seiten.",
  "fmt.sideHold": "Die Zeit gilt pro Seite. Halte auf beiden Seiten.",
  "fmt.perHand": "Das Gewicht gilt pro Kurzhantel, eine in jeder Hand.",
  "fmt.eachSide": "Pro Seite: {plates} {unit}",
  "fmt.emptyBar": "Leere Stange",
  "fmt.superset": "Supersatz {letter} · {n} von {total}",
  "fmt.link": "{second} mit {first} zum Supersatz verbinden",
  "fmt.unlink": "{second} von {first} trennen",
};

export const it: Partial<Record<Key, Message>> = {
  "fmt.bodyweight": "Corpo libero",
  "fmt.each": "{weight} per mano",
  "fmt.reps": { one: "{n} rip.", other: "{n} rip." },
  "fmt.seconds": "{n} s",
  "fmt.repsSide": { one: "{n} rip. per lato", other: "{n} rip. per lato" },
  "fmt.secondsSide": "{n} s per lato",
  "fmt.repsLR": "{left} sinistra · {right} destra",
  "fmt.perSide": "Per lato",
  "fmt.sideReps": "Le ripetizioni sono per lato. Falle su entrambi i lati.",
  "fmt.sideHold": "Il tempo è per lato. Tieni la posizione su entrambi i lati.",
  "fmt.perHand": "Il peso è per manubrio, uno in ogni mano.",
  "fmt.eachSide": "Per lato: {plates} {unit}",
  "fmt.emptyBar": "Bilanciere vuoto",
  "fmt.superset": "Superserie {letter} · {n} di {total}",
  "fmt.link": "Unisci {second} a {first} in superserie",
  "fmt.unlink": "Separa {second} da {first}",
};

export const ja: Partial<Record<Key, Message>> = {
  "fmt.bodyweight": "自重",
  "fmt.each": "片手{weight}",
  "fmt.reps": { other: "{n}回" },
  "fmt.seconds": "{n}秒",
  "fmt.repsSide": { other: "片側{n}回" },
  "fmt.secondsSide": "片側{n}秒",
  "fmt.repsLR": "左{left} · 右{right}",
  "fmt.perSide": "左右それぞれ",
  "fmt.sideReps": "回数は片側ずつです。左右どちらも行います。",
  "fmt.sideHold": "時間は片側ずつです。左右どちらもキープします。",
  "fmt.perHand": "重さはダンベル1つ分です。両手に1つずつ持ちます。",
  "fmt.eachSide": "片側：{plates} {unit}",
  "fmt.emptyBar": "バーのみ",
  "fmt.superset": "スーパーセット {letter} · {n}/{total}",
  "fmt.link": "{second}を{first}とスーパーセットにする",
  "fmt.unlink": "{second}を{first}から分ける",
};

export const pt: Partial<Record<Key, Message>> = {
  "fmt.bodyweight": "Peso corporal",
  "fmt.each": "{weight} por mão",
  "fmt.reps": {
    one: "{n} rep",
    other: "{n} reps",
  },
  "fmt.seconds": "{n} s",
  "fmt.repsSide": {
    one: "{n} rep de cada lado",
    other: "{n} reps de cada lado",
  },
  "fmt.secondsSide": "{n} s de cada lado",
  "fmt.repsLR": "{left} esquerda · {right} direita",
  "fmt.perSide": "Cada lado",
  "fmt.sideReps": "As reps são por lado. Faça dos dois lados.",
  "fmt.sideHold": "O tempo é por lado. Segure dos dois lados.",
  "fmt.perHand": "O peso é por halter, um em cada mão.",
  "fmt.eachSide": "Cada lado: {plates} {unit}",
  "fmt.emptyBar": "Barra vazia",
  "fmt.superset": "Bi-set {letter} · {n} de {total}",
  "fmt.link": "Fazer {second} em bi-set com {first}",
  "fmt.unlink": "Separar {second} de {first}",
};

export const ko: Partial<Record<Key, Message>> = {
  "fmt.bodyweight": "맨몸",
  "fmt.each": "한 손에 {weight}",
  "fmt.reps": {
    other: "{n}회",
  },
  "fmt.seconds": "{n} s",
  "fmt.repsSide": {
    other: "양쪽 각 {n}회",
  },
  "fmt.secondsSide": "양쪽 각 {n} s",
  "fmt.repsLR": "왼쪽 {left} · 오른쪽 {right}",
  "fmt.perSide": "양쪽 각각",
  "fmt.sideReps": "횟수는 한쪽 기준이에요. 양쪽 모두 하세요.",
  "fmt.sideHold": "시간은 한쪽 기준이에요. 양쪽 모두 버티세요.",
  "fmt.perHand": "무게는 덤벨 하나 기준이고, 양손에 하나씩 들어요.",
  "fmt.eachSide": "한쪽에: {plates} {unit}",
  "fmt.emptyBar": "빈 바",
  "fmt.superset": "슈퍼세트 {letter} · {total}개 중 {n}번째",
  "fmt.link": "{second}을(를) {first}와(과) 슈퍼세트로",
  "fmt.unlink": "{second}을(를) {first}에서 분리",
};

export const tr: Partial<Record<Key, Message>> = {
  "fmt.bodyweight": "Vücut ağırlığı",
  "fmt.each": "El başına {weight}",
  "fmt.reps": {
    one: "{n} tekrar",
    other: "{n} tekrar",
  },
  "fmt.seconds": "{n} s",
  "fmt.repsSide": {
    one: "Her taraf {n} tekrar",
    other: "Her taraf {n} tekrar",
  },
  "fmt.secondsSide": "Her taraf {n} s",
  "fmt.repsLR": "Sol {left} · sağ {right}",
  "fmt.perSide": "Her taraf",
  "fmt.sideReps": "Tekrarlar taraf başına. İki tarafta da yap.",
  "fmt.sideHold": "Süre taraf başına. İki tarafta da tut.",
  "fmt.perHand": "Ağırlık dambıl başına, her elde bir tane.",
  "fmt.eachSide": "Her taraf: {plates} {unit}",
  "fmt.emptyBar": "Boş bar",
  "fmt.superset": "Süperset {letter} · {n}/{total}",
  "fmt.link": "{second} hareketini {first} ile süperset yap",
  "fmt.unlink": "{second} hareketini {first} hareketinden ayır",
};

export const pl: Partial<Record<Key, Message>> = {
  "fmt.bodyweight": "Masa ciała",
  "fmt.each": "{weight} na rękę",
  "fmt.reps": {
    one: "{n} powtórzenie",
    few: "{n} powtórzenia",
    many: "{n} powtórzeń",
    other: "{n} powtórzenia",
  },
  "fmt.seconds": "{n} s",
  "fmt.repsSide": {
    one: "{n} powtórzenie na stronę",
    few: "{n} powtórzenia na stronę",
    many: "{n} powtórzeń na stronę",
    other: "{n} powtórzenia na stronę",
  },
  "fmt.secondsSide": "{n} s na stronę",
  "fmt.repsLR": "{left} lewa · {right} prawa",
  "fmt.perSide": "Na stronę",
  "fmt.sideReps": "Powtórzenia są na stronę. Zrób je po obu stronach.",
  "fmt.sideHold": "Czas jest na stronę. Wytrzymaj po obu stronach.",
  "fmt.perHand": "Ciężar to jeden hantel, po jednym w każdej ręce.",
  "fmt.eachSide": "Na stronę: {plates} {unit}",
  "fmt.emptyBar": "Pusta sztanga",
  "fmt.superset": "Superseria {letter} · {n} z {total}",
  "fmt.link": "Superseria: {second} z {first}",
  "fmt.unlink": "Rozdziel: {second} i {first}",
};
