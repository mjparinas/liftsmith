import type { Message } from "@/lib/i18n";

// Text for keys starting "remix.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "remix.broken": "This workout link didn’t open. It may be from a newer version of the app, or cut short.",
  "remix.back": "Back to today",
  "remix.title": "Shared workout",
  "remix.rebuilt": "Rebuilt for {gym} at your own weights. About {min} min.",
  "remix.yourGym": "your gym",
  "remix.closest": "(closest match here)",
  "remix.missing": "{name}: nothing similar here, left out",
  "remix.finishFirst": "Finish the workout you’re in first, then open the link again.",
  "remix.start": "Start this workout",
  "remix.notNow": "Not now",
  "remix.shareTitle": "A workout for you",
  "remix.noteSame": "From a shared workout, at your weights",
  "remix.noteSwap": "Swapped in for {name} at this gym",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "remix.broken": "Este enlace de entrenamiento no se abrió. Puede ser de una versión más nueva de la app o estar cortado.",
  "remix.back": "Volver a hoy",
  "remix.title": "Entrenamiento compartido",
  "remix.rebuilt": "Adaptado a {gym} con tus propios pesos. Unos {min} min.",
  "remix.yourGym": "tu gimnasio",
  "remix.closest": "(lo más parecido aquí)",
  "remix.missing": "{name}: nada parecido aquí, se omite",
  "remix.finishFirst": "Termina primero el entrenamiento en curso y luego abre el enlace otra vez.",
  "remix.start": "Empezar este entrenamiento",
  "remix.notNow": "Ahora no",
  "remix.shareTitle": "Un entrenamiento para ti",
  "remix.noteSame": "De un entrenamiento compartido, con tus pesos",
  "remix.noteSwap": "En lugar de {name} en este gimnasio",
};

export const fr: Partial<Record<Key, Message>> = {
  "remix.broken": "Ce lien de séance ne s’est pas ouvert. Il vient peut-être d’une version plus récente de l’app, ou il est coupé.",
  "remix.back": "Retour à aujourd’hui",
  "remix.title": "Séance partagée",
  "remix.rebuilt": "Adaptée à {gym} avec vos propres charges. Environ {min} min.",
  "remix.yourGym": "votre salle",
  "remix.closest": "(le plus proche ici)",
  "remix.missing": "{name} : rien de semblable ici, retiré",
  "remix.finishFirst": "Terminez d’abord la séance en cours, puis rouvrez le lien.",
  "remix.start": "Commencer cette séance",
  "remix.notNow": "Pas maintenant",
  "remix.shareTitle": "Une séance pour vous",
  "remix.noteSame": "Tiré d’une séance partagée, avec vos charges",
  "remix.noteSwap": "Remplace {name} dans cette salle",
};
