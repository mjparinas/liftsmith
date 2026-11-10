import type { Message } from "@/lib/i18n";

// Text for keys starting "note.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "note.firstLevel": "First time: find your level",
  "note.deloadEasy": "Deload: easy reps",
  "note.oneMoreRep": "Hit every set last time: one more rep",
  "note.sameAgain": "A set came up short last time: same again until they all hit",
  "note.fromNumbers": "First time: from the numbers you entered",
  "note.cautious": "First time: a cautious start, adjust if it's light",
  "note.calibrated": "Calibrated from your first session",
  "note.deloadLighter": "Deload week: 10% lighter so you recover",
  "note.tooHard": "You said it felt too hard: a step lighter",
  "note.missedTwo": "Missed 2+ reps last time: a step lighter",
  "note.comeback": {
    one: "Back after a week off: starting {pct}% lighter",
    other: "Back after {count} weeks off: starting {pct}% lighter",
  },
  "note.rampBack": "Building back to your weight from before the break",
  "note.feltEasy": "You said it felt easy: weight up",
  "note.topOfRange": "Hit the top of your rep range: weight up",
  "note.easyReps": "Easy day: fewer reps",
  "note.easyLighter": "Easy day: a step lighter",
  "note.push": "Push day: one rep closer to failure",
  "note.challenge": "Challenge: last set, as many good reps as you can",
  "note.injury": "Injury: {pct}% of usual, stop if it hurts",
  "note.fixSet": "Plateau fix: one extra set",
  "note.fixRest": "Plateau fix: longer rest",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "note.firstLevel": "Primera vez: encuentra tu nivel",
  "note.deloadEasy": "Descarga: repeticiones fáciles",
  "note.oneMoreRep": "Completaste todas las series la última vez: una repetición más",
  "note.sameAgain": "Una serie se quedó corta la última vez: lo mismo hasta completarlas todas",
  "note.fromNumbers": "Primera vez: a partir de los números que diste",
  "note.cautious": "Primera vez: un comienzo prudente, ajústalo si es ligero",
  "note.calibrated": "Calibrado con tu primera sesión",
  "note.deloadLighter": "Semana de descarga: un 10% más ligero para recuperarte",
  "note.tooHard": "Dijiste que se hizo demasiado duro: un escalón más ligero",
  "note.missedTwo": "Fallaste 2 o más repeticiones la última vez: un escalón más ligero",
  "note.comeback": {
    one: "De vuelta tras una semana sin entrenar: empiezas un {pct}% más ligero",
    other: "De vuelta tras {count} semanas sin entrenar: empiezas un {pct}% más ligero",
  },
  "note.rampBack": "Recuperando el peso que movías antes del descanso",
  "note.feltEasy": "Dijiste que se hizo fácil: más peso",
  "note.topOfRange": "Llegaste al tope de tu rango de repeticiones: más peso",
  "note.easyReps": "Día suave: menos repeticiones",
  "note.easyLighter": "Día suave: un escalón más ligero",
  "note.push": "Día para apretar: una repetición más cerca del fallo",
  "note.challenge": "Reto: en la última serie, todas las buenas repeticiones que puedas",
  "note.injury": "Lesión: {pct}% de lo habitual, para si duele",
  "note.fixSet": "Plan contra el estancamiento: una serie extra",
  "note.fixRest": "Plan contra el estancamiento: más descanso",
};

export const fr: Partial<Record<Key, Message>> = {
  "note.firstLevel": "Première fois : trouvez votre niveau",
  "note.deloadEasy": "Décharge : répétitions faciles",
  "note.oneMoreRep": "Toutes les séries réussies la dernière fois : une répétition de plus",
  "note.sameAgain": "Une série a manqué la dernière fois : on refait pareil jusqu’à toutes les réussir",
  "note.fromNumbers": "Première fois : d’après les chiffres que vous avez saisis",
  "note.cautious": "Première fois : un départ prudent, ajustez si c’est léger",
  "note.calibrated": "Calibré d’après votre première séance",
  "note.deloadLighter": "Semaine de décharge : 10 % plus léger pour récupérer",
  "note.tooHard": "Vous avez trouvé ça trop dur : un cran plus léger",
  "note.missedTwo": "2 répétitions ou plus manquées la dernière fois : un cran plus léger",
  "note.comeback": {
    one: "De retour après une semaine sans entraînement : {pct} % plus léger pour commencer",
    other: "De retour après {count} semaines sans entraînement : {pct} % plus léger pour commencer",
  },
  "note.rampBack": "On remonte vers votre charge d’avant la pause",
  "note.feltEasy": "Vous avez trouvé ça facile : on augmente la charge",
  "note.topOfRange": "Haut de votre fourchette de répétitions atteint : on augmente la charge",
  "note.easyReps": "Jour tranquille : moins de répétitions",
  "note.easyLighter": "Jour tranquille : un cran plus léger",
  "note.push": "Jour pour pousser : une répétition plus près de l’échec",
  "note.challenge": "Défi : dernière série, autant de bonnes répétitions que possible",
  "note.injury": "Blessure : {pct} % de l’habitude, arrêtez si ça fait mal",
  "note.fixSet": "Plan anti-plateau : une série de plus",
  "note.fixRest": "Plan anti-plateau : repos plus long",
};
