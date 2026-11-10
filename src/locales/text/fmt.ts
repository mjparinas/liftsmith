import type { Message } from "@/lib/i18n";

// Text for keys starting "fmt.": the short load, reps and plate lines shared by Today, the workout screen
// and routines (src/components/app/format.ts), and the superset labels (src/lib/superset.ts), in every
// language. English is the source.

export const en = {
  "fmt.bodyweight": "Bodyweight",
  "fmt.each": "{weight} each",
  "fmt.reps": { one: "{n} rep", other: "{n} reps" },
  "fmt.seconds": "{n} s",
  "fmt.eachSide": "Each side: {plates} {unit}",
  "fmt.emptyBar": "Empty bar",
  "fmt.superset": "Superset {letter} · {n} of {total}",
  "fmt.link": "Superset {second} with {first}",
  "fmt.unlink": "Split {second} from {first}",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "fmt.bodyweight": "Peso corporal",
  "fmt.each": "{weight} cada una",
  "fmt.reps": { one: "{n} rep.", other: "{n} reps" },
  "fmt.seconds": "{n} s",
  "fmt.eachSide": "Cada lado: {plates} {unit}",
  "fmt.emptyBar": "Barra vacía",
  "fmt.superset": "Superserie {letter} · {n} de {total}",
  "fmt.link": "Hacer {second} en superserie con {first}",
  "fmt.unlink": "Separar {second} de {first}",
};

export const fr: Partial<Record<Key, Message>> = {
  "fmt.bodyweight": "Poids du corps",
  "fmt.each": "{weight} chacun",
  "fmt.reps": { one: "{n} rép.", other: "{n} rép." },
  "fmt.seconds": "{n} s",
  "fmt.eachSide": "Chaque côté : {plates} {unit}",
  "fmt.emptyBar": "Barre vide",
  "fmt.superset": "Superset {letter} · {n} sur {total}",
  "fmt.link": "Enchaîner {second} en superset avec {first}",
  "fmt.unlink": "Séparer {second} de {first}",
};

export const de: Partial<Record<Key, Message>> = {
  "fmt.bodyweight": "Körpergewicht",
  "fmt.each": "je {weight}",
  "fmt.reps": { one: "{n} Wdh.", other: "{n} Wdh." },
  "fmt.seconds": "{n} s",
  "fmt.eachSide": "Pro Seite: {plates} {unit}",
  "fmt.emptyBar": "Leere Stange",
  "fmt.superset": "Supersatz {letter} · {n} von {total}",
  "fmt.link": "{second} mit {first} zum Supersatz verbinden",
  "fmt.unlink": "{second} von {first} trennen",
};

export const it: Partial<Record<Key, Message>> = {
  "fmt.bodyweight": "Corpo libero",
  "fmt.each": "{weight} ciascuno",
  "fmt.reps": { one: "{n} rip.", other: "{n} rip." },
  "fmt.seconds": "{n} s",
  "fmt.eachSide": "Per lato: {plates} {unit}",
  "fmt.emptyBar": "Bilanciere vuoto",
  "fmt.superset": "Superserie {letter} · {n} di {total}",
  "fmt.link": "Unisci {second} a {first} in superserie",
  "fmt.unlink": "Separa {second} da {first}",
};

export const ja: Partial<Record<Key, Message>> = {
  "fmt.bodyweight": "自重",
  "fmt.each": "各{weight}",
  "fmt.reps": { other: "{n}回" },
  "fmt.seconds": "{n}秒",
  "fmt.eachSide": "片側：{plates} {unit}",
  "fmt.emptyBar": "バーのみ",
  "fmt.superset": "スーパーセット {letter} · {n}/{total}",
  "fmt.link": "{second}を{first}とスーパーセットにする",
  "fmt.unlink": "{second}を{first}から分ける",
};
