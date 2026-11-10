import type { Message } from "@/lib/i18n";

// Text for keys starting "creator.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "creator.title": "Redeem a code",
  "creator.have": "Have a code?",
  "creator.placeholder": "e.g. LIFT-ALEX",
  "creator.apply": "Apply",
  "creator.remove": "Remove code",
  "creator.note": "A code from us or a creator you follow gives you a longer Pro trial: {days} days.",
  "creator.ok": "Code {code} from {name}: your Pro trial is {days} days.",
  "creator.okNoName": "Code {code} applied: your Pro trial is {days} days.",
  "creator.pending": "Code {code} saved. We'll check it next time you're online.",
  "creator.unknown": "We don't know the code {code}. Check the spelling and try again.",
  "creator.invalid": "Codes are letters, digits and dashes, like LIFT-ALEX.",
  "creator.locked": "Your subscription already uses code {code}, so it can't change.",
  "creator.lockedNone": "Codes can only be added before a trial or subscription starts.",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "creator.title": "Canjear un código",
  "creator.have": "¿Tienes un código?",
  "creator.placeholder": "p. ej. LIFT-ALEX",
  "creator.apply": "Aplicar",
  "creator.remove": "Quitar código",
  "creator.note": "Un código nuestro o de un creador al que sigues te da una prueba de Pro más larga: {days} días.",
  "creator.ok": "Código {code} de {name}: tu prueba de Pro dura {days} días.",
  "creator.okNoName": "Código {code} aplicado: tu prueba de Pro dura {days} días.",
  "creator.pending": "Código {code} guardado. Lo comprobaremos la próxima vez que tengas conexión.",
  "creator.unknown": "No conocemos el código {code}. Revisa cómo se escribe y vuelve a intentarlo.",
  "creator.invalid": "Los códigos tienen letras, números y guiones, como LIFT-ALEX.",
  "creator.locked": "Tu suscripción ya usa el código {code}, así que no se puede cambiar.",
  "creator.lockedNone": "Los códigos solo se pueden añadir antes de empezar una prueba o suscripción.",
};

export const fr: Partial<Record<Key, Message>> = {
  "creator.title": "Utiliser un code",
  "creator.have": "Vous avez un code ?",
  "creator.placeholder": "ex. LIFT-ALEX",
  "creator.apply": "Appliquer",
  "creator.remove": "Retirer le code",
  "creator.note": "Un code de notre part ou d'un créateur que vous suivez vous donne un essai Pro plus long : {days} jours.",
  "creator.ok": "Code {code} de {name} : votre essai Pro dure {days} jours.",
  "creator.okNoName": "Code {code} appliqué : votre essai Pro dure {days} jours.",
  "creator.pending": "Code {code} enregistré. Nous le vérifierons à votre prochaine connexion.",
  "creator.unknown": "Nous ne connaissons pas le code {code}. Vérifiez l'orthographe et réessayez.",
  "creator.invalid": "Les codes contiennent des lettres, des chiffres et des tirets, comme LIFT-ALEX.",
  "creator.locked": "Votre abonnement utilise déjà le code {code}, il ne peut donc pas changer.",
  "creator.lockedNone": "Un code ne peut être ajouté qu'avant le début d'un essai ou d'un abonnement.",
};
