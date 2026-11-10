import type { Message } from "@/lib/i18n";

// Text for keys starting "advice.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "advice.rest": "Rest it. It's ready {when}.",
  "advice.rest.why": "{pct}% recovered. Plans leave out lifts that work it hard until it's back.",
  "advice.easy": "Go light on it. It's ready {when}.",
  "advice.easy.why": "{pct}% recovered. Plans won't make it the day's focus until it's back to 70%.",
  "advice.train": {
    one: "Good to train. {count} more set reaches this week's {goal}.",
    other: "Good to train. {count} more sets reach this week's {goal}.",
  },
  "advice.train.why": "{pct}% recovered, {done} of {goal} sets done this week.",
  "advice.done": "This week's sets are done. Let it recover for next week.",
  "advice.done.why": "{done} of {goal} sets done this week, so more won't add much.",
  "advice.last": "Last worked {when}.",
  "advice.priority": "Make it a priority",
  "advice.priority.hint": "It gets a third more weekly sets and is picked first when recovered.",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "advice.rest": "Déjalo descansar. Estará listo {when}.",
  "advice.rest.why": "{pct}% recuperado. Los planes dejan fuera los ejercicios que lo trabajan a fondo hasta que se recupere.",
  "advice.easy": "Trabájalo suave. Estará listo {when}.",
  "advice.easy.why": "{pct}% recuperado. Los planes no lo harán el foco del día hasta que vuelva al 70%.",
  "advice.train": {
    one: "Listo para entrenar. Falta {count} serie para las {goal} de esta semana.",
    other: "Listo para entrenar. Faltan {count} series para las {goal} de esta semana.",
  },
  "advice.train.why": "{pct}% recuperado, {done} de {goal} series hechas esta semana.",
  "advice.done": "Las series de esta semana están hechas. Deja que se recupere para la próxima.",
  "advice.done.why": "{done} de {goal} series hechas esta semana, así que más no aportan mucho.",
  "advice.last": "Trabajado por última vez {when}.",
  "advice.priority": "Hacerlo prioridad",
  "advice.priority.hint": "Recibe un tercio más de series semanales y se elige primero cuando está recuperado.",
};

export const fr: Partial<Record<Key, Message>> = {
  "advice.rest": "Laissez-le se reposer. Il sera prêt {when}.",
  "advice.rest.why": "Récupéré à {pct} %. Les plans écartent les exercices qui le sollicitent fort jusqu'à sa récupération.",
  "advice.easy": "Allez-y doucement. Il sera prêt {when}.",
  "advice.easy.why": "Récupéré à {pct} %. Les plans n'en feront pas la cible du jour avant qu'il revienne à 70 %.",
  "advice.train": {
    one: "Prêt à travailler. Encore {count} série pour atteindre les {goal} de la semaine.",
    other: "Prêt à travailler. Encore {count} séries pour atteindre les {goal} de la semaine.",
  },
  "advice.train.why": "Récupéré à {pct} %, {done} séries sur {goal} faites cette semaine.",
  "advice.done": "Les séries de la semaine sont faites. Laissez-le récupérer pour la semaine prochaine.",
  "advice.done.why": "{done} séries sur {goal} faites cette semaine, en faire plus n'apporte pas grand-chose.",
  "advice.last": "Dernière séance {when}.",
  "advice.priority": "En faire une priorité",
  "advice.priority.hint": "Il reçoit un tiers de séries en plus par semaine et passe en premier une fois récupéré.",
};
