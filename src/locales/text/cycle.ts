import type { Message } from "@/lib/i18n";

// Text for keys starting "cycle.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "cycle.title": "Cycle-aware readiness",
  "cycle.intro": "Optional. Log the day your period starts and Liftsmith nudges the day's push or easy call a little around your cycle.",
  "cycle.setUp": "Set up",
  "cycle.day": "Cycle day {day} of about {length}.",
  "cycle.logFirst": "Log the first day of your next period to start.",
  "cycle.today": "Period started today",
  "cycle.yesterday": "Started yesterday",
  "cycle.offNote": "This turns it off and deletes every period you logged on this device.",
  "cycle.offConfirm": "Turn off and delete",
  "cycle.cancel": "Cancel",
  "cycle.off": "Turn off and delete cycle data",
  "cycle.consent1": "You log the first day of each period. Liftsmith estimates where you are in your cycle from your own typical length and adjusts the day's readiness a little. For example, it might suggest going by feel during your period. You can always override the call.",
  "cycle.consent2a": "Your cycle data stays on this phone.",
  "cycle.consent2b": "It only leaves it through your own backup and sync if you turn those on. It is never used for analytics or ads, never included in feedback reports, and never shared or sold.",
  "cycle.consent3": "Research on cycle phase and strength is mixed and varies between people, so the effect is small. This isn't medical advice, contraception or a fertility tool.",
  "cycle.consent4": "You can turn it off at any time, which deletes everything you logged.",
  "cycle.agree": "I agree, turn it on",
  "cycle.notNow": "Not now",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "cycle.title": "Preparación según el ciclo",
  "cycle.intro": "Opcional. Registra el día en que empieza tu periodo y Liftsmith ajusta un poco la recomendación del día (apretar o ir suave) según tu ciclo.",
  "cycle.setUp": "Configurar",
  "cycle.day": "Día {day} del ciclo, de unos {length}.",
  "cycle.logFirst": "Registra el primer día de tu próximo periodo para empezar.",
  "cycle.today": "El periodo empezó hoy",
  "cycle.yesterday": "Empezó ayer",
  "cycle.offNote": "Esto lo desactiva y borra todos los periodos que registraste en este dispositivo.",
  "cycle.offConfirm": "Desactivar y borrar",
  "cycle.cancel": "Cancelar",
  "cycle.off": "Desactivar y borrar los datos del ciclo",
  "cycle.consent1": "Registras el primer día de cada periodo. Liftsmith estima en qué punto del ciclo estás según tu duración habitual y ajusta un poco la preparación del día. Por ejemplo, puede sugerir guiarte por sensaciones durante el periodo. Siempre puedes cambiar la recomendación.",
  "cycle.consent2a": "Los datos de tu ciclo se quedan en este teléfono.",
  "cycle.consent2b": "Solo salen de él mediante tu propia copia de seguridad y sincronización, si las activas. Nunca se usan para estadísticas ni anuncios, nunca se incluyen en los informes de comentarios y nunca se comparten ni se venden.",
  "cycle.consent3": "La investigación sobre la fase del ciclo y la fuerza no es concluyente y varía entre personas, así que el efecto es pequeño. Esto no es consejo médico, ni anticoncepción, ni una herramienta de fertilidad.",
  "cycle.consent4": "Puedes desactivarlo cuando quieras, y se borra todo lo que registraste.",
  "cycle.agree": "Acepto, activarlo",
  "cycle.notNow": "Ahora no",
};

export const fr: Partial<Record<Key, Message>> = {
  "cycle.title": "Forme selon le cycle",
  "cycle.intro": "Facultatif. Indiquez le jour où vos règles commencent et Liftsmith ajuste un peu la recommandation du jour (pousser ou y aller doucement) selon votre cycle.",
  "cycle.setUp": "Configurer",
  "cycle.day": "Jour {day} du cycle, sur environ {length}.",
  "cycle.logFirst": "Indiquez le premier jour de vos prochaines règles pour commencer.",
  "cycle.today": "Règles commencées aujourd’hui",
  "cycle.yesterday": "Commencées hier",
  "cycle.offNote": "Cela le désactive et supprime toutes les règles enregistrées sur cet appareil.",
  "cycle.offConfirm": "Désactiver et supprimer",
  "cycle.cancel": "Annuler",
  "cycle.off": "Désactiver et supprimer les données du cycle",
  "cycle.consent1": "Vous indiquez le premier jour de chaque période de règles. Liftsmith estime où vous en êtes dans votre cycle d’après votre durée habituelle et ajuste un peu la forme du jour. Par exemple, il peut suggérer d’y aller au ressenti pendant vos règles. Vous pouvez toujours changer la recommandation.",
  "cycle.consent2a": "Vos données de cycle restent sur ce téléphone.",
  "cycle.consent2b": "Elles n’en sortent que par votre propre sauvegarde et synchronisation, si vous les activez. Elles ne servent jamais aux statistiques ni à la publicité, ne figurent jamais dans les rapports de retour et ne sont jamais partagées ni vendues.",
  "cycle.consent3": "La recherche sur la phase du cycle et la force est partagée et varie selon les personnes, donc l’effet est faible. Ce n’est ni un avis médical, ni une contraception, ni un outil de fertilité.",
  "cycle.consent4": "Vous pouvez le désactiver à tout moment, ce qui supprime tout ce que vous avez enregistré.",
  "cycle.agree": "J’accepte, l’activer",
  "cycle.notNow": "Pas maintenant",
};
