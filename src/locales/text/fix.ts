import type { Message } from "@/lib/i18n";

// Text for keys starting "fix.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "fix.reset": "Reset and rebuild",
  "fix.reset.what":
    "Drop the weight about 10% and build back up over the next sessions. Most lifters pass their old best within three weeks.",
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
  "fix.reset.what":
    "Baja el peso un 10% aproximadamente y vuelve a subir en las próximas sesiones. La mayoría supera su mejor marca anterior en tres semanas.",
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
  "fix.reset.what":
    "Baissez la charge d’environ 10 % et remontez au fil des prochaines séances. La plupart dépassent leur ancien record en trois semaines.",
  "fix.reps": "Changer la fourchette de répétitions",
  "fix.reps.what":
    "Trois semaines dans une autre fourchette de répétitions. Un nouveau stimulus, avec la charge calculée d’après votre force actuelle.",
  "fix.volume": "Plus de séries par semaine",
  "fix.volume.what": "Une série de plus à chaque fois pendant trois semaines, pour donner au muscle plus de travail auquel s’adapter.",
  "fix.rest": "Se reposer plus longtemps",
  "fix.rest.what": "Une minute de repos en plus entre les séries pendant trois semaines, pour faire chaque série à frais.",
  "fix.variation": "Passer à une variante proche",
  "fix.variation.what": "Trois semaines sur un exercice similaire, puis retour. Il travaille les mêmes muscles autrement.",
};

export const de: Partial<Record<Key, Message>> = {
  "fix.reset": "Zurücksetzen und neu aufbauen",
  "fix.reset.what":
    "Senke das Gewicht um etwa 10 % und baue es in den nächsten Einheiten wieder auf. Die meisten übertreffen ihre alte Bestleistung innerhalb von drei Wochen.",
  "fix.reps": "Wiederholungsbereich ändern",
  "fix.reps.what":
    "Drei Wochen in einem anderen Wiederholungsbereich. Ein neuer Reiz, mit dem Gewicht aus deiner aktuellen Kraft berechnet.",
  "fix.volume": "Mehr Sätze pro Woche",
  "fix.volume.what": "Drei Wochen lang jedes Mal ein Satz mehr, damit der Muskel mehr Arbeit hat, an die er sich anpassen kann.",
  "fix.rest": "Länger pausieren",
  "fix.rest.what": "Drei Wochen lang eine Minute mehr Pause zwischen den Sätzen, damit jeder Satz frisch gelingt.",
  "fix.variation": "Zu einer ähnlichen Variante wechseln",
  "fix.variation.what": "Drei Wochen eine ähnliche Übung, dann zurück. Sie trainiert dieselben Muskeln auf andere Weise.",
};

export const it: Partial<Record<Key, Message>> = {
  "fix.reset": "Riparti e ricostruisci",
  "fix.reset.what":
    "Abbassa il peso di circa il 10% e risali nelle prossime sedute. La maggior parte supera il vecchio record entro tre settimane.",
  "fix.reps": "Cambia l’intervallo di ripetizioni",
  "fix.reps.what":
    "Tre settimane con un altro intervallo di ripetizioni. Uno stimolo nuovo, con il peso calcolato dalla tua forza attuale.",
  "fix.volume": "Più serie a settimana",
  "fix.volume.what": "Una serie in più ogni volta per tre settimane, per dare al muscolo più lavoro a cui adattarsi.",
  "fix.rest": "Riposa di più",
  "fix.rest.what": "Un minuto in più di riposo tra le serie per tre settimane, così ogni serie è fatta da fresco.",
  "fix.variation": "Passa a una variante simile",
  "fix.variation.what": "Tre settimane su un esercizio simile, poi si torna. Lavora gli stessi muscoli in modo diverso.",
};

export const ja: Partial<Record<Key, Message>> = {
  "fix.reset": "リセットして積み直す",
  "fix.reset.what": "重量を約10%下げ、次の数回で積み上げ直します。多くの人は3週間以内に以前のベストを超えます。",
  "fix.reps": "レップ数の範囲を変える",
  "fix.reps.what": "3週間、別のレップ範囲で行います。今の筋力から重量を計算した新しい刺激です。",
  "fix.volume": "週のセット数を増やす",
  "fix.volume.what": "3週間、毎回1セット追加し、筋肉が適応する刺激を増やします。",
  "fix.rest": "休憩を長くする",
  "fix.rest.what": "3週間、セット間の休憩を1分延ばし、毎セットを万全の状態で行います。",
  "fix.variation": "近いバリエーションに替える",
  "fix.variation.what": "3週間似た種目を行ってから戻します。同じ筋肉を別の方法で鍛えます。",
};
