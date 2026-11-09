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
  "prog.adaptiveBlurb": "Planifica cada entrenamiento según tu gimnasio, tu recuperación y tu bloque de entrenamiento, ajustado al tiempo que tienes.",
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
  "prog.intro": "Choisissez comment vos séances sont planifiées. Vous pouvez changer à tout moment ; votre historique et vos stats restent.",
  "prog.adaptive": "Adaptatif (recommandé)",
  "prog.adaptiveBlurb": "Planifie chaque séance selon votre salle, votre récupération et votre bloc d’entraînement, à la mesure du temps dont vous disposez.",
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
