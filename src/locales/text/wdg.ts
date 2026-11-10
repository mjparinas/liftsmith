import type { Message } from "@/lib/i18n";

// Text for keys starting "wdg.", in every language: the home-screen widget (src/lib/widget.ts).
// English is the source: add a key here first, then its Spanish and French. A missing translation falls back to English.

export const en = {
  "wdg.title": "{call} · {minutes} min",
  "wdg.start": "Start",
  "wdg.resume": "Resume",
  "wdg.log": "Log set",
  "wdg.activeWhy": "Your next set is ready. Log it here or open the workout.",
  "wdg.stale": "Open Liftsmith for today's plan.",
  "wdg.note": "{note} · {action}",
  "wdg.goal": {
    one: "{done} of {goal} this week. {count} more to hit your goal.",
    other: "{done} of {goal} this week. {count} more to hit your goal.",
  },
  "wdg.goalStreak": {
    one: "{done} of {goal} this week. {count} more keeps your {weeks}-week streak.",
    other: "{done} of {goal} this week. {count} more keep your {weeks}-week streak.",
  },
  "wdg.goalMet": "Weekly goal met: {done} of {goal}. Rest is training too.",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "wdg.title": "{call} · {minutes} min",
  "wdg.start": "Empezar",
  "wdg.resume": "Seguir",
  "wdg.log": "Registrar serie",
  "wdg.activeWhy": "Tu próxima serie está lista. Regístrala aquí o abre el entrenamiento.",
  "wdg.stale": "Abre Liftsmith para ver el plan de hoy.",
  "wdg.note": "{note} · {action}",
  "wdg.goal": {
    one: "{done} de {goal} esta semana. {count} más para cumplir tu objetivo.",
    other: "{done} de {goal} esta semana. {count} más para cumplir tu objetivo.",
  },
  "wdg.goalStreak": {
    one: "{done} de {goal} esta semana. {count} más mantiene tu racha de {weeks} semanas.",
    other: "{done} de {goal} esta semana. {count} más mantienen tu racha de {weeks} semanas.",
  },
  "wdg.goalMet": "Objetivo semanal cumplido: {done} de {goal}. Descansar también es entrenar.",
};

export const fr: Partial<Record<Key, Message>> = {
  "wdg.title": "{call} · {minutes} min",
  "wdg.start": "Commencer",
  "wdg.resume": "Reprendre",
  "wdg.log": "Noter la série",
  "wdg.activeWhy": "Votre prochaine série est prête. Notez-la ici ou ouvrez la séance.",
  "wdg.stale": "Ouvrez Liftsmith pour le plan du jour.",
  "wdg.note": "{note} · {action}",
  "wdg.goal": {
    one: "{done} sur {goal} cette semaine. Encore {count} pour atteindre votre objectif.",
    other: "{done} sur {goal} cette semaine. Encore {count} pour atteindre votre objectif.",
  },
  "wdg.goalStreak": {
    one: "{done} sur {goal} cette semaine. Encore {count} pour garder votre série de {weeks} semaines.",
    other: "{done} sur {goal} cette semaine. Encore {count} pour garder votre série de {weeks} semaines.",
  },
  "wdg.goalMet": "Objectif de la semaine atteint : {done} sur {goal}. Le repos fait aussi partie de l’entraînement.",
};
