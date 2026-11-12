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
