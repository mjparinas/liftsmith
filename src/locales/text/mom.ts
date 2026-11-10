import type { Message } from "@/lib/i18n";

// Text for keys starting "mom.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "mom.days": { one: "{count} day", other: "{count} days" },
  "mom.weeks": { one: "{count} week", other: "{count} weeks" },
  "mom.months": { one: "{count} month", other: "{count} months" },
  "mom.anniv": { one: "{count} year since your first workout", other: "{count} years since your first workout" },
  "mom.annivBody": "{workouts} workouts and {sets} sets since then. Happy liftiversary.",
  "mom.back": "Welcome back",
  "mom.backBody": "It’s been {time}. Today’s plan eases you back in, and your streak starts fresh this week. No catching up needed.",
  "mom.count": "Workout number {n}",
  "mom.count100": "Triple digits. That’s a habit for life.",
  "mom.countBody": "Every one of them counted.",
  "mom.ton": "You’ve now lifted {name}",
  "mom.tonBody": "About {kg} in total, one set at a time.",
  "mom.comeback": "Comeback complete",
  "mom.comebackBody": "First workout in {time}. The hardest one is done.",
  "mom.years": { one: "{count} year of lifting", other: "{count} years of lifting" },
  "mom.yearsBody": "You trained on your liftiversary. Fitting.",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "mom.days": { one: "{count} día", other: "{count} días" },
  "mom.weeks": { one: "{count} semana", other: "{count} semanas" },
  "mom.months": { one: "{count} mes", other: "{count} meses" },
  "mom.anniv": { one: "{count} año desde tu primer entrenamiento", other: "{count} años desde tu primer entrenamiento" },
  "mom.annivBody": "{workouts} entrenamientos y {sets} series desde entonces. Feliz aniversario.",
  "mom.back": "Bienvenido de nuevo",
  "mom.backBody":
    "Han pasado {time}. El plan de hoy te ayuda a volver poco a poco, y tu racha empieza de nuevo esta semana. No hace falta recuperar nada.",
  "mom.count": "Entrenamiento número {n}",
  "mom.count100": "Tres cifras. Eso ya es un hábito para toda la vida.",
  "mom.countBody": "Cada uno contó.",
  "mom.ton": "Ya has levantado {name}",
  "mom.tonBody": "Unos {kg} en total, serie a serie.",
  "mom.comeback": "Regreso completado",
  "mom.comebackBody": "Primer entrenamiento en {time}. Lo más difícil ya está hecho.",
  "mom.years": { one: "{count} año entrenando", other: "{count} años entrenando" },
  "mom.yearsBody": "Entrenaste en tu aniversario. Muy apropiado.",
};

export const fr: Partial<Record<Key, Message>> = {
  "mom.days": { one: "{count} jour", other: "{count} jours" },
  "mom.weeks": { one: "{count} semaine", other: "{count} semaines" },
  "mom.months": { one: "{count} mois", other: "{count} mois" },
  "mom.anniv": { one: "{count} an depuis votre première séance", other: "{count} ans depuis votre première séance" },
  "mom.annivBody": "{workouts} séances et {sets} séries depuis. Joyeux anniversaire d’entraînement.",
  "mom.back": "Bon retour",
  "mom.backBody": "Ça fait {time}. Le plan du jour vous remet en douceur, et votre série repart de zéro cette semaine. Rien à rattraper.",
  "mom.count": "Séance numéro {n}",
  "mom.count100": "Trois chiffres. C’est une habitude pour la vie.",
  "mom.countBody": "Chacune a compté.",
  "mom.ton": "Vous avez maintenant soulevé {name}",
  "mom.tonBody": "Environ {kg} au total, une série à la fois.",
  "mom.comeback": "Retour réussi",
  "mom.comebackBody": "Première séance depuis {time}. Le plus dur est fait.",
  "mom.years": { one: "{count} an d’entraînement", other: "{count} ans d’entraînement" },
  "mom.yearsBody": "Vous vous êtes entraîné le jour de votre anniversaire d’entraînement. Bien vu.",
};

export const de: Partial<Record<Key, Message>> = {
  "mom.days": { one: "{count} Tag", other: "{count} Tage" },
  "mom.weeks": { one: "{count} Woche", other: "{count} Wochen" },
  "mom.months": { one: "{count} Monat", other: "{count} Monate" },
  "mom.anniv": { one: "{count} Jahr seit deinem ersten Training", other: "{count} Jahre seit deinem ersten Training" },
  "mom.annivBody": "Seitdem {workouts} Trainings und {sets} Sätze. Alles Gute zum Lift-Jahrestag.",
  "mom.back": "Willkommen zurück",
  "mom.backBody":
    "Es ist {time} her. Der heutige Plan bringt dich sanft zurück, und deine Serie beginnt diese Woche neu. Nichts nachzuholen.",
  "mom.count": "Training Nummer {n}",
  "mom.count100": "Dreistellig. Das ist eine Gewohnheit fürs Leben.",
  "mom.countBody": "Jedes einzelne hat gezählt.",
  "mom.ton": "Du hast jetzt {name} gehoben",
  "mom.tonBody": "Insgesamt etwa {kg}, Satz für Satz.",
  "mom.comeback": "Comeback geschafft",
  "mom.comebackBody": "Erstes Training seit {time}. Das schwerste ist geschafft.",
  "mom.years": { one: "{count} Jahr Training", other: "{count} Jahre Training" },
  "mom.yearsBody": "Du hast an deinem Lift-Jahrestag trainiert. Passend.",
};

export const it: Partial<Record<Key, Message>> = {
  "mom.days": { one: "{count} giorno", other: "{count} giorni" },
  "mom.weeks": { one: "{count} settimana", other: "{count} settimane" },
  "mom.months": { one: "{count} mese", other: "{count} mesi" },
  "mom.anniv": { one: "{count} anno dal tuo primo allenamento", other: "{count} anni dal tuo primo allenamento" },
  "mom.annivBody": "Da allora {workouts} allenamenti e {sets} serie. Buon anniversario di allenamento.",
  "mom.back": "Bentornato",
  "mom.backBody":
    "È passato {time}. Il piano di oggi ti fa ripartire con calma, e la tua serie riparte questa settimana. Niente da recuperare.",
  "mom.count": "Allenamento numero {n}",
  "mom.count100": "Tre cifre. Questa è un’abitudine per la vita.",
  "mom.countBody": "Ognuno è servito.",
  "mom.ton": "Ora hai sollevato {name}",
  "mom.tonBody": "Circa {kg} in totale, una serie alla volta.",
  "mom.comeback": "Ritorno completato",
  "mom.comebackBody": "Primo allenamento dopo {time}. Il più difficile è fatto.",
  "mom.years": { one: "{count} anno di allenamento", other: "{count} anni di allenamento" },
  "mom.yearsBody": "Ti sei allenato nel tuo anniversario. Perfetto.",
};

export const ja: Partial<Record<Key, Message>> = {
  "mom.days": { other: "{count}日" },
  "mom.weeks": { other: "{count}週間" },
  "mom.months": { other: "{count}か月" },
  "mom.anniv": { other: "初めてのワークアウトから{count}年" },
  "mom.annivBody": "それから{workouts}回のワークアウトと{sets}セット。トレーニング記念日おめでとうございます。",
  "mom.back": "おかえりなさい",
  "mom.backBody":
    "{time}ぶりですね。今日のプランは無理なく再開できる内容で、連続記録は今週から新しく始まります。遅れを取り戻す必要はありません。",
  "mom.count": "{n}回目のワークアウト",
  "mom.count100": "3桁到達。一生ものの習慣です。",
  "mom.countBody": "どれもが積み重ねです。",
  "mom.ton": "これで{name}を持ち上げました",
  "mom.tonBody": "合計約{kg}、1セットずつ積み重ねて。",
  "mom.comeback": "カムバック達成",
  "mom.comebackBody": "{time}ぶりのワークアウト。一番大変な1回が終わりました。",
  "mom.years": { other: "トレーニング歴{count}年" },
  "mom.yearsBody": "トレーニング記念日にトレーニング。さすがです。",
};
