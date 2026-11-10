import type { Message } from "@/lib/i18n";

// Text for keys starting "prog.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "prog.title": "Programs",
  "prog.intro": "Pick how your workouts are planned. You can switch any time; your history and stats stay.",
  "prog.adaptive": "Adaptive (recommended)",
  "prog.adaptiveBlurb": "Plans each workout from your gym, recovery and training block, sized to the time you have.",
  "prog.current": "Current",
  "prog.pro": "Pro",
  "prog.unlock": "Unlock with Pro",
  "prog.free": "Free",
  "prog.start": "Start this program",
  "prog.restart": "Restart from the beginning",
  "prog.needs": "This gym is missing {items}. Exercises it can't do are swapped for the closest match.",
  "prog.week": "A typical week, in hard sets per muscle",
  "prog.perWeek": { one: "{count} day a week", other: "{count} days a week" },
  "prog.aka": "also known as {name}",
  "prog.owners": "Names belong to their owners; this app isn't affiliated with them.",
  "prog.level.Beginner": "Beginner",
  "prog.level.Intermediate": "Intermediate",
  "prog.level.Any level": "Any level",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "prog.title": "Programas",
  "prog.intro": "Elige cómo se planifican tus entrenamientos. Puedes cambiar cuando quieras; tu historial y tus estadísticas se mantienen.",
  "prog.adaptive": "Adaptativo (recomendado)",
  "prog.adaptiveBlurb":
    "Planifica cada entrenamiento según tu gimnasio, tu recuperación y tu bloque de entrenamiento, ajustado al tiempo que tienes.",
  "prog.current": "Actual",
  "prog.pro": "Pro",
  "prog.unlock": "Desbloquear con Pro",
  "prog.free": "Gratis",
  "prog.start": "Empezar este programa",
  "prog.restart": "Empezar de nuevo desde el principio",
  "prog.needs": "A este gimnasio le falta: {items}. Los ejercicios que no se pueden hacer se cambian por el más parecido.",
  "prog.week": "Una semana típica, en series duras por músculo",
  "prog.perWeek": { one: "{count} día a la semana", other: "{count} días a la semana" },
  "prog.aka": "también conocido como {name}",
  "prog.owners": "Los nombres pertenecen a sus dueños; esta app no está afiliada a ellos.",
  "prog.level.Beginner": "Principiante",
  "prog.level.Intermediate": "Intermedio",
  "prog.level.Any level": "Cualquier nivel",
};

export const fr: Partial<Record<Key, Message>> = {
  "prog.title": "Programmes",
  "prog.intro":
    "Choisissez comment vos séances sont planifiées. Vous pouvez changer à tout moment ; votre historique et vos stats restent.",
  "prog.adaptive": "Adaptatif (recommandé)",
  "prog.adaptiveBlurb":
    "Planifie chaque séance selon votre salle, votre récupération et votre bloc d’entraînement, à la mesure du temps dont vous disposez.",
  "prog.current": "Actuel",
  "prog.pro": "Pro",
  "prog.unlock": "Débloquer avec Pro",
  "prog.free": "Gratuit",
  "prog.start": "Commencer ce programme",
  "prog.restart": "Recommencer depuis le début",
  "prog.needs": "Il manque à cette salle : {items}. Les exercices impossibles ici sont remplacés par le plus proche.",
  "prog.week": "Une semaine type, en séries difficiles par muscle",
  "prog.perWeek": { one: "{count} jour par semaine", other: "{count} jours par semaine" },
  "prog.aka": "aussi appelé {name}",
  "prog.owners": "Les noms appartiennent à leurs propriétaires ; cette app n’y est pas affiliée.",
  "prog.level.Beginner": "Débutant",
  "prog.level.Intermediate": "Intermédiaire",
  "prog.level.Any level": "Tous niveaux",
};

export const de: Partial<Record<Key, Message>> = {
  "prog.title": "Programme",
  "prog.intro": "Wähle, wie deine Trainings geplant werden. Du kannst jederzeit wechseln; dein Verlauf und deine Statistiken bleiben.",
  "prog.adaptive": "Adaptiv (empfohlen)",
  "prog.adaptiveBlurb":
    "Plant jedes Training nach deinem Studio, deiner Erholung und deinem Trainingsblock, passend zur Zeit, die du hast.",
  "prog.current": "Aktuell",
  "prog.pro": "Pro",
  "prog.unlock": "Mit Pro freischalten",
  "prog.free": "Kostenlos",
  "prog.start": "Dieses Programm starten",
  "prog.restart": "Von vorn beginnen",
  "prog.needs": "Diesem Studio fehlt {items}. Übungen, die hier nicht gehen, werden durch die nächste Entsprechung ersetzt.",
  "prog.week": "Eine typische Woche, in harten Sätzen pro Muskel",
  "prog.perWeek": { one: "{count} Tag pro Woche", other: "{count} Tage pro Woche" },
  "prog.aka": "auch bekannt als {name}",
  "prog.owners": "Die Namen gehören ihren Inhabern; diese App ist nicht mit ihnen verbunden.",
  "prog.level.Beginner": "Anfänger",
  "prog.level.Intermediate": "Mittelstufe",
  "prog.level.Any level": "Jedes Niveau",
};

export const it: Partial<Record<Key, Message>> = {
  "prog.title": "Programmi",
  "prog.intro": "Scegli come vengono pianificati i tuoi allenamenti. Puoi cambiare quando vuoi; storico e statistiche restano.",
  "prog.adaptive": "Adattivo (consigliato)",
  "prog.adaptiveBlurb": "Pianifica ogni allenamento in base a palestra, recupero e blocco di allenamento, sul tempo che hai.",
  "prog.current": "Attuale",
  "prog.pro": "Pro",
  "prog.unlock": "Sblocca con Pro",
  "prog.free": "Gratis",
  "prog.start": "Inizia questo programma",
  "prog.restart": "Ricomincia dall’inizio",
  "prog.needs": "In questa palestra manca {items}. Gli esercizi che non si possono fare vengono sostituiti dal più simile.",
  "prog.week": "Una settimana tipo, in serie impegnative per muscolo",
  "prog.perWeek": { one: "{count} giorno a settimana", other: "{count} giorni a settimana" },
  "prog.aka": "noto anche come {name}",
  "prog.owners": "I nomi appartengono ai rispettivi proprietari; questa app non è affiliata a loro.",
  "prog.level.Beginner": "Principiante",
  "prog.level.Intermediate": "Intermedio",
  "prog.level.Any level": "Ogni livello",
};

export const ja: Partial<Record<Key, Message>> = {
  "prog.title": "プログラム",
  "prog.intro": "ワークアウトの組み方を選びます。いつでも切り替えられ、履歴と統計はそのまま残ります。",
  "prog.adaptive": "アダプティブ（おすすめ）",
  "prog.adaptiveBlurb": "ジム、回復、トレーニングブロックをもとに、使える時間に合わせて毎回のワークアウトを組みます。",
  "prog.current": "使用中",
  "prog.pro": "Pro",
  "prog.unlock": "Pro で解除",
  "prog.free": "無料",
  "prog.start": "このプログラムを開始",
  "prog.restart": "最初からやり直す",
  "prog.needs": "このジムには{items}がありません。できない種目は最も近い種目に置き換えます。",
  "prog.week": "典型的な1週間（筋肉ごとのハードセット数）",
  "prog.perWeek": { other: "週{count}日" },
  "prog.aka": "別名 {name}",
  "prog.owners": "名称は各所有者に帰属します。このアプリは所有者と提携していません。",
  "prog.level.Beginner": "初心者",
  "prog.level.Intermediate": "中級者",
  "prog.level.Any level": "すべてのレベル",
};
