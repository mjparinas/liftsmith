import type { Message } from "@/lib/i18n";

// Text for keys starting "twin.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "twin.lead": "Your numbers against your own normal, each with what to do about it.",
  "twin.today": "Today: {call}",
  "twin.proWould": "With Pro, your sleep and heart data would make today: {call}.",
  "twin.seePro": "See Pro",
  "twin.plan": "See today's plan",
  "twin.connect": "Connect {source}",
  "twin.connect.body": "Allow sleep, HRV, resting heart rate, steps, VO₂ max and breathing rate, and they show up here.",
  "twin.connect.none": "Nothing came through yet. Check what Liftsmith may read in {source}.",
  "twin.group.body": "Body and energy",
  "twin.group.heart": "Heart, sleep and steps",
  "twin.figure": "3D body with your health numbers: {summary}",
  "twin.from.health": "From {source}",
  "twin.from.app": "From Liftsmith",
  "twin.normal": "Your normal: {low} to {high}",
  "twin.chart": "The last 30 days",
  "twin.chart.label": "{label} over the last 30 days",
  "twin.did": "Today's plan",
  "twin.why": "What it means",
  "twin.notMedical": "For training only, not medical advice. If a number worries you, ask a doctor.",
  "twin.web": "Sleep, HRV, steps and the rest come from your phone's health app, in the Android and iOS apps.",
  "twin.easy": "Make today an easy day",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "twin.lead": "Tus cifras frente a tu propio valor normal, cada una con qué hacer.",
  "twin.today": "Hoy: {call}",
  "twin.proWould": "Con Pro, tus datos de sueño y corazón harían de hoy: {call}.",
  "twin.seePro": "Ver Pro",
  "twin.plan": "Ver el plan de hoy",
  "twin.connect": "Conectar {source}",
  "twin.connect.body": "Permite sueño, VFC, frecuencia cardiaca en reposo, pasos, VO₂ máx. y frecuencia respiratoria, y aparecerán aquí.",
  "twin.connect.none": "Aún no ha llegado nada. Revisa qué puede leer Liftsmith en {source}.",
  "twin.group.body": "Cuerpo y energía",
  "twin.group.heart": "Corazón, sueño y pasos",
  "twin.figure": "Cuerpo en 3D con tus cifras de salud: {summary}",
  "twin.from.health": "De {source}",
  "twin.from.app": "De Liftsmith",
  "twin.normal": "Tu normal: de {low} a {high}",
  "twin.chart": "Los últimos 30 días",
  "twin.chart.label": "{label} en los últimos 30 días",
  "twin.did": "El plan de hoy",
  "twin.why": "Qué significa",
  "twin.notMedical": "Solo para entrenar, no es consejo médico. Si una cifra te preocupa, consulta a un médico.",
  "twin.web": "El sueño, la VFC, los pasos y lo demás vienen de la app de salud del teléfono, en las apps de Android e iOS.",
  "twin.easy": "Hacer de hoy un día suave",
};

export const fr: Partial<Record<Key, Message>> = {
  "twin.lead": "Vos chiffres comparés à votre propre normale, chacun avec ce qu’il faut faire.",
  "twin.today": "Aujourd’hui : {call}",
  "twin.proWould": "Avec Pro, vos données de sommeil et de cœur feraient d’aujourd’hui : {call}.",
  "twin.seePro": "Voir Pro",
  "twin.plan": "Voir le plan du jour",
  "twin.connect": "Connecter {source}",
  "twin.connect.body":
    "Autorisez le sommeil, la VFC, la fréquence cardiaque au repos, les pas, la VO₂ max et la fréquence respiratoire, et ils s’afficheront ici.",
  "twin.connect.none": "Rien n’est encore arrivé. Vérifiez ce que Liftsmith peut lire dans {source}.",
  "twin.group.body": "Corps et énergie",
  "twin.group.heart": "Cœur, sommeil et pas",
  "twin.figure": "Corps en 3D avec vos chiffres de santé : {summary}",
  "twin.from.health": "De {source}",
  "twin.from.app": "De Liftsmith",
  "twin.normal": "Votre normale : de {low} à {high}",
  "twin.chart": "Les 30 derniers jours",
  "twin.chart.label": "{label} sur les 30 derniers jours",
  "twin.did": "Le plan du jour",
  "twin.why": "Ce que ça veut dire",
  "twin.notMedical": "Pour l’entraînement uniquement, pas un avis médical. Si un chiffre vous inquiète, demandez à un médecin.",
  "twin.web": "Le sommeil, la VFC, les pas et le reste viennent de l’app santé du téléphone, dans les apps Android et iOS.",
  "twin.easy": "Faire une journée facile",
};
