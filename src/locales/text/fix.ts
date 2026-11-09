import type { Message } from "@/lib/i18n";

// Text for keys starting "fix.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "fix.reset": "Reset and rebuild",
  "fix.reset.what": "Drop the weight about 10% and build back up over the next sessions. Most lifters pass their old best within three weeks.",
  "fix.reps": "Change the rep range",
  "fix.reps.what": "Three weeks in a different rep range. A new stimulus, with the weight worked out from your current strength.",
  "fix.volume": "More weekly sets",
  "fix.volume.what": "One extra set each time you do it for three weeks, to give the muscle more work to adapt to.",
  "fix.rest": "Rest longer",
  "fix.rest.what": "One more minute of rest between sets for three weeks, so each set is done fresh.",
  "fix.variation": "Switch to a close variation",
  "fix.variation.what": "Three weeks on a similar lift, then back. It works the same muscles a different way.",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "fix.reset": "Bajar y reconstruir",
  "fix.reset.what": "Baja el peso un 10% aproximadamente y vuelve a subir en las próximas sesiones. La mayoría supera su mejor marca anterior en tres semanas.",
  "fix.reps": "Cambiar el rango de repeticiones",
  "fix.reps.what": "Tres semanas en otro rango de repeticiones. Un estímulo nuevo, con el peso calculado a partir de tu fuerza actual.",
  "fix.volume": "Más series semanales",
  "fix.volume.what": "Una serie extra cada vez que lo hagas durante tres semanas, para darle al músculo más trabajo al que adaptarse.",
  "fix.rest": "Descansar más",
  "fix.rest.what": "Un minuto más de descanso entre series durante tres semanas, para hacer cada serie fresco.",
  "fix.variation": "Cambiar a una variante parecida",
  "fix.variation.what": "Tres semanas con un ejercicio similar y luego de vuelta. Trabaja los mismos músculos de otra forma.",
};

export const fr: Partial<Record<Key, Message>> = {
  "fix.reset": "Redescendre et reconstruire",
  "fix.reset.what": "Baissez la charge d’environ 10 % et remontez au fil des prochaines séances. La plupart dépassent leur ancien record en trois semaines.",
  "fix.reps": "Changer la fourchette de répétitions",
  "fix.reps.what": "Trois semaines dans une autre fourchette de répétitions. Un nouveau stimulus, avec la charge calculée d’après votre force actuelle.",
  "fix.volume": "Plus de séries par semaine",
  "fix.volume.what": "Une série de plus à chaque fois pendant trois semaines, pour donner au muscle plus de travail auquel s’adapter.",
  "fix.rest": "Se reposer plus longtemps",
  "fix.rest.what": "Une minute de repos en plus entre les séries pendant trois semaines, pour faire chaque série à frais.",
  "fix.variation": "Passer à une variante proche",
  "fix.variation.what": "Trois semaines sur un exercice similaire, puis retour. Il travaille les mêmes muscles autrement.",
};
