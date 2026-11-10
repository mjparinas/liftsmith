import type { Message } from "@/lib/i18n";

// Text for keys starting "rmd.": reminder notifications and emails (src/lib/messages.ts, the server's
// src/server/reminderEmails.ts). The server must not import i18n.ts, so these are read through
// src/lib/messageText.ts, which needs only this file. English is the source. {brand} is the app's name.

export const en = {
  "rmd.streakOne": "One workout today keeps your {weeks}-week streak.",
  "rmd.streakMany": "{needed} workouts left this week to keep your {weeks}-week streak.",
  "rmd.firstReady": "Your first workout is ready",
  "rmd.todayReady": "Today's workout is ready",
  "rmd.firstReadyBody": "It's planned around your gym and takes one tap a set.",
  "rmd.todayReadyBody": "Planned from your recovery and last session. Tap to start.",
  "rmd.week": "Your training week",
  "rmd.weekBody": "This week: {days} at {time}. Each workout is planned when you open the app.",
  "rmd.weekBodyLast":
    "This week: {days} at {time}. Last week you trained {trained} of {goal}. Each workout is planned when you open the app.",
  "rmd.days": { one: "{count} day", other: "{count} days" },
  "rmd.keepStreak": "Keep your streak",
  "rmd.missedTwo": "Two training days slipped by",
  "rmd.missedOne": "Missed yesterday? Today works too",
  "rmd.missedBody": "A short workout today picks your freshest muscles. Your streak counts weeks, so there's still time.",
  "rmd.ready": "Ready when you are",
  "rmd.firstWaiting": "Your first workout is still waiting",
  "rmd.comeback": "It's been {days} days. Your next workout starts a little lighter so you can ease back in.",
  "rmd.firstWaitingBody": "Pick a length, tap start, and the app does the planning.",
  "rmd.trialEnds": "Your Pro trial ends in 2 days",
  "rmd.trialEndsBody": "Keep adaptive workouts, the recovery map and full stats, or do nothing and stay on the free plan.",
  "rmd.pro1": "Workouts that adapt to you",
  "rmd.pro1.body": "Pro plans each session from your recovery, your gym and how every set felt. Try Pro free, cancel in two taps.",
  "rmd.pro2": "See what's recovered",
  "rmd.pro2.body": "The recovery map shows which muscles are fresh before you pick a workout. Try Pro free, cancel in two taps.",
  "rmd.pro3": "Know you're getting stronger",
  "rmd.pro3.body": "Pro tracks your estimated max on every lift and your weekly sets per muscle. Try Pro free, cancel in two taps.",
  "rmd.pro4": "Push days and easy days",
  "rmd.pro4.body": "Pro reads your readiness and adjusts the day's workout. You can always override it. Try Pro free, cancel in two taps.",
  "rmd.firstDone": "Your first workout is in the books",
  "rmd.firstDoneBody": "Nice work. Your next workout builds on today's weights and reps, and your recovery map now shows what you trained.",
  "rmd.streakWeeks": "{weeks} weeks in a row",
  "rmd.streakWeeksBody": "You've hit your training goal {weeks} weeks running. That's how strength is built.",
  "rmd.mail.link": "{label}: {url}",
  "rmd.mail.choose": "Choose which emails you get in the app under Settings, Reminders.",
  "rmd.mail.unsubscribe": "Unsubscribe from all {brand} emails",
  "rmd.mail.ignore": "If you didn't ask for this, ignore it and you won't hear from us again.",
  "rmd.mail.confirm": "Confirm your {brand} emails",
  "rmd.mail.confirmBody": "Tap the button to start getting workout reminders by email. Nothing is sent until you do.",
  "rmd.mail.confirmButton": "Confirm my email",
  "rmd.mail.confirmWhy": "Someone (hopefully you) entered this address in {brand}.",
  "rmd.mail.welcome": "Welcome to {brand}",
  "rmd.mail.welcome1":
    "You're all set. Each workout is planned when you open the app, from your gym's equipment, what's recovered and how your last sets went.",
  "rmd.mail.welcome2":
    "Log a set with one tap. The next set is filled in and the rest timer starts itself, so you can put the phone down and lift.",
  "rmd.mail.welcome3":
    "We'll email you on Monday with your training week, and only when it helps after that. You can turn any of it off in Settings.",
  "rmd.mail.open": "Open today's workout",
  "rmd.mail.seePro": "See Pro",
  "rmd.mail.whyOn": "You're getting this because you turned on email from the app.",
  "rmd.mail.whyReminder": "You're getting this because you turned on reminder emails in the app.",
  "rmd.mail.whyPro": "You're getting this because you turned on Pro trial and offer emails in the app.",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "rmd.streakOne": "Un entrenamiento hoy mantiene tu racha de {weeks} semanas.",
  "rmd.streakMany": "Te quedan {needed} entrenamientos esta semana para mantener tu racha de {weeks} semanas.",
  "rmd.firstReady": "Tu primer entrenamiento está listo",
  "rmd.todayReady": "El entrenamiento de hoy está listo",
  "rmd.firstReadyBody": "Está planificado según tu gimnasio y cada serie se registra con un toque.",
  "rmd.todayReadyBody": "Planificado según tu recuperación y tu última sesión. Toca para empezar.",
  "rmd.week": "Tu semana de entrenamiento",
  "rmd.weekBody": "Esta semana: {days} a las {time}. Cada entrenamiento se planifica al abrir la app.",
  "rmd.weekBodyLast":
    "Esta semana: {days} a las {time}. La semana pasada entrenaste {trained} de {goal}. Cada entrenamiento se planifica al abrir la app.",
  "rmd.days": { one: "{count} día", other: "{count} días" },
  "rmd.keepStreak": "Mantén tu racha",
  "rmd.missedTwo": "Se te han pasado dos días de entrenamiento",
  "rmd.missedOne": "¿Te saltaste ayer? Hoy también vale",
  "rmd.missedBody": "Un entrenamiento corto hoy elige tus músculos más descansados. Tu racha cuenta semanas, así que aún hay tiempo.",
  "rmd.ready": "Cuando tú quieras",
  "rmd.firstWaiting": "Tu primer entrenamiento sigue esperando",
  "rmd.comeback": "Han pasado {days} días. Tu próximo entrenamiento empieza un poco más ligero para que vuelvas poco a poco.",
  "rmd.firstWaitingBody": "Elige una duración, toca empezar y la app se encarga de planificar.",
  "rmd.trialEnds": "Tu prueba de Pro termina en 2 días",
  "rmd.trialEndsBody":
    "Conserva los entrenamientos adaptativos, el mapa de recuperación y las estadísticas completas, o no hagas nada y sigue con el plan gratuito.",
  "rmd.pro1": "Entrenamientos que se adaptan a ti",
  "rmd.pro1.body":
    "Pro planifica cada sesión según tu recuperación, tu gimnasio y cómo te fue cada serie. Prueba Pro gratis y cancela en dos toques.",
  "rmd.pro2": "Mira qué se ha recuperado",
  "rmd.pro2.body":
    "El mapa de recuperación muestra qué músculos están frescos antes de elegir un entrenamiento. Prueba Pro gratis y cancela en dos toques.",
  "rmd.pro3": "Comprueba que te estás haciendo más fuerte",
  "rmd.pro3.body":
    "Pro sigue tu máximo estimado en cada ejercicio y tus series semanales por músculo. Prueba Pro gratis y cancela en dos toques.",
  "rmd.pro4": "Días de apretar y días suaves",
  "rmd.pro4.body":
    "Pro lee tu disposición y ajusta el entrenamiento del día. Siempre puedes cambiarlo. Prueba Pro gratis y cancela en dos toques.",
  "rmd.firstDone": "Tu primer entrenamiento, hecho",
  "rmd.firstDoneBody":
    "Buen trabajo. Tu próximo entrenamiento parte de los pesos y repeticiones de hoy, y tu mapa de recuperación ya muestra lo que trabajaste.",
  "rmd.streakWeeks": "{weeks} semanas seguidas",
  "rmd.streakWeeksBody": "Has cumplido tu objetivo de entrenamiento {weeks} semanas seguidas. Así se construye la fuerza.",
  "rmd.mail.link": "{label}: {url}",
  "rmd.mail.choose": "Elige qué correos recibes en la app, en Ajustes, Recordatorios.",
  "rmd.mail.unsubscribe": "Darte de baja de todos los correos de {brand}",
  "rmd.mail.ignore": "Si no lo pediste, ignóralo y no volverás a saber de nosotros.",
  "rmd.mail.confirm": "Confirma tus correos de {brand}",
  "rmd.mail.confirmBody":
    "Toca el botón para empezar a recibir recordatorios de entrenamiento por correo. No se envía nada hasta que lo hagas.",
  "rmd.mail.confirmButton": "Confirmar mi correo",
  "rmd.mail.confirmWhy": "Alguien (esperamos que tú) introdujo esta dirección en {brand}.",
  "rmd.mail.welcome": "Te damos la bienvenida a {brand}",
  "rmd.mail.welcome1":
    "Todo listo. Cada entrenamiento se planifica al abrir la app, según el equipo de tu gimnasio, lo que se ha recuperado y cómo fueron tus últimas series.",
  "rmd.mail.welcome2":
    "Registra una serie con un toque. La siguiente ya está rellenada y el descanso empieza solo, así que puedes dejar el teléfono y levantar.",
  "rmd.mail.welcome3":
    "Te escribiremos el lunes con tu semana de entrenamiento, y después solo cuando sirva de algo. Puedes desactivar cualquier cosa en Ajustes.",
  "rmd.mail.open": "Abrir el entrenamiento de hoy",
  "rmd.mail.seePro": "Ver Pro",
  "rmd.mail.whyOn": "Recibes esto porque activaste los correos en la app.",
  "rmd.mail.whyReminder": "Recibes esto porque activaste los correos de recordatorio en la app.",
  "rmd.mail.whyPro": "Recibes esto porque activaste los correos de la prueba y las ofertas de Pro en la app.",
};

export const fr: Partial<Record<Key, Message>> = {
  "rmd.streakOne": "Une séance aujourd’hui préserve votre série de {weeks} semaines.",
  "rmd.streakMany": "Encore {needed} séances cette semaine pour préserver votre série de {weeks} semaines.",
  "rmd.firstReady": "Votre première séance est prête",
  "rmd.todayReady": "La séance du jour est prête",
  "rmd.firstReadyBody": "Elle est planifiée selon votre salle et chaque série s’enregistre d’un toucher.",
  "rmd.todayReadyBody": "Planifiée selon votre récupération et votre dernière séance. Touchez pour commencer.",
  "rmd.week": "Votre semaine d’entraînement",
  "rmd.weekBody": "Cette semaine : {days} à {time}. Chaque séance est planifiée à l’ouverture de l’app.",
  "rmd.weekBodyLast":
    "Cette semaine : {days} à {time}. La semaine dernière, vous vous êtes entraîné {trained} sur {goal}. Chaque séance est planifiée à l’ouverture de l’app.",
  "rmd.days": { one: "{count} jour", other: "{count} jours" },
  "rmd.keepStreak": "Préservez votre série",
  "rmd.missedTwo": "Deux jours d’entraînement sont passés",
  "rmd.missedOne": "Séance manquée hier ? Aujourd’hui, c’est bien aussi",
  "rmd.missedBody":
    "Une courte séance aujourd’hui choisit vos muscles les plus frais. Votre série compte en semaines, il reste donc du temps.",
  "rmd.ready": "Quand vous voulez",
  "rmd.firstWaiting": "Votre première séance vous attend toujours",
  "rmd.comeback": "Cela fait {days} jours. Votre prochaine séance commence un peu plus léger pour reprendre en douceur.",
  "rmd.firstWaitingBody": "Choisissez une durée, touchez Commencer, et l’app s’occupe du programme.",
  "rmd.trialEnds": "Votre essai Pro se termine dans 2 jours",
  "rmd.trialEndsBody":
    "Gardez les séances adaptatives, la carte de récupération et les stats complètes, ou ne faites rien et restez sur l’offre gratuite.",
  "rmd.pro1": "Des séances qui s’adaptent à vous",
  "rmd.pro1.body":
    "Pro planifie chaque séance selon votre récupération, votre salle et le ressenti de chaque série. Essayez Pro gratuitement, résiliez en deux touchers.",
  "rmd.pro2": "Voyez ce qui a récupéré",
  "rmd.pro2.body":
    "La carte de récupération montre quels muscles sont frais avant de choisir une séance. Essayez Pro gratuitement, résiliez en deux touchers.",
  "rmd.pro3": "Sachez que vous progressez",
  "rmd.pro3.body":
    "Pro suit votre max estimé sur chaque exercice et vos séries hebdomadaires par muscle. Essayez Pro gratuitement, résiliez en deux touchers.",
  "rmd.pro4": "Jours pour pousser et jours légers",
  "rmd.pro4.body":
    "Pro lit votre forme du jour et ajuste la séance. Vous pouvez toujours la modifier. Essayez Pro gratuitement, résiliez en deux touchers.",
  "rmd.firstDone": "Votre première séance est faite",
  "rmd.firstDoneBody":
    "Bravo. Votre prochaine séance s’appuie sur les charges et répétitions d’aujourd’hui, et votre carte de récupération montre ce que vous avez travaillé.",
  "rmd.streakWeeks": "{weeks} semaines d’affilée",
  "rmd.streakWeeksBody": "Vous avez atteint votre objectif d’entraînement {weeks} semaines de suite. C’est comme ça qu’on devient fort.",
  "rmd.mail.link": "{label} : {url}",
  "rmd.mail.choose": "Choisissez les e-mails que vous recevez dans l’app, sous Réglages, Rappels.",
  "rmd.mail.unsubscribe": "Se désabonner de tous les e-mails {brand}",
  "rmd.mail.ignore": "Si vous ne l’avez pas demandé, ignorez ce message et vous n’entendrez plus parler de nous.",
  "rmd.mail.confirm": "Confirmez vos e-mails {brand}",
  "rmd.mail.confirmBody": "Touchez le bouton pour recevoir des rappels d’entraînement par e-mail. Rien n’est envoyé avant.",
  "rmd.mail.confirmButton": "Confirmer mon e-mail",
  "rmd.mail.confirmWhy": "Quelqu’un (vous, espérons-le) a saisi cette adresse dans {brand}.",
  "rmd.mail.welcome": "Bienvenue dans {brand}",
  "rmd.mail.welcome1":
    "Tout est prêt. Chaque séance est planifiée à l’ouverture de l’app, selon l’équipement de votre salle, ce qui a récupéré et vos dernières séries.",
  "rmd.mail.welcome2":
    "Enregistrez une série d’un toucher. La suivante est déjà remplie et le repos démarre tout seul : posez le téléphone et soulevez.",
  "rmd.mail.welcome3":
    "Nous vous écrirons le lundi avec votre semaine d’entraînement, puis seulement quand c’est utile. Vous pouvez tout désactiver dans Réglages.",
  "rmd.mail.open": "Ouvrir la séance du jour",
  "rmd.mail.seePro": "Voir Pro",
  "rmd.mail.whyOn": "Vous recevez ceci parce que vous avez activé les e-mails dans l’app.",
  "rmd.mail.whyReminder": "Vous recevez ceci parce que vous avez activé les e-mails de rappel dans l’app.",
  "rmd.mail.whyPro": "Vous recevez ceci parce que vous avez activé les e-mails sur l’essai et les offres Pro dans l’app.",
};
