import type { Message } from "@/lib/i18n";

// Text for keys starting "creator.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "creator.title": "Redeem a code",
  "creator.have": "Have a code?",
  "creator.placeholder": "e.g. LIFT-ALEX",
  "creator.apply": "Apply",
  "creator.remove": "Remove code",
  "creator.note": "A code from us or a creator you follow can give you a longer Pro trial or a lower price.",
  "creator.ok": "Code {code} from {name}: your Pro trial is {days} days.",
  "creator.okNoName": "Code {code} applied: your Pro trial is {days} days.",
  "creator.pending": "Code {code} saved. We'll check it next time you're online.",
  "creator.unknown": "We don't know the code {code}. Check the spelling and try again.",
  "creator.invalid": "Codes are letters, digits and dashes, like LIFT-ALEX.",
  "creator.locked": "Your subscription already uses code {code}, so it can't change.",
  "creator.lockedNone": "Codes can only be added before a trial or subscription starts.",
  "creator.okOffer": "Code {code} applied: its price shows on the plans.",
  "creator.ended": "The code {code} has ended.",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "creator.title": "Canjear un código",
  "creator.have": "¿Tienes un código?",
  "creator.placeholder": "p. ej. LIFT-ALEX",
  "creator.apply": "Aplicar",
  "creator.remove": "Quitar código",
  "creator.note": "Un código nuestro o de un creador al que sigues puede darte una prueba de Pro más larga o un precio más bajo.",
  "creator.ok": "Código {code} de {name}: tu prueba de Pro dura {days} días.",
  "creator.okNoName": "Código {code} aplicado: tu prueba de Pro dura {days} días.",
  "creator.pending": "Código {code} guardado. Lo comprobaremos la próxima vez que tengas conexión.",
  "creator.unknown": "No conocemos el código {code}. Revisa cómo se escribe y vuelve a intentarlo.",
  "creator.invalid": "Los códigos tienen letras, números y guiones, como LIFT-ALEX.",
  "creator.locked": "Tu suscripción ya usa el código {code}, así que no se puede cambiar.",
  "creator.lockedNone": "Los códigos solo se pueden añadir antes de empezar una prueba o suscripción.",
  "creator.okOffer": "Código {code} aplicado: su precio aparece en los planes.",
  "creator.ended": "El código {code} ya no está disponible.",
};

export const fr: Partial<Record<Key, Message>> = {
  "creator.title": "Utiliser un code",
  "creator.have": "Vous avez un code ?",
  "creator.placeholder": "ex. LIFT-ALEX",
  "creator.apply": "Appliquer",
  "creator.remove": "Retirer le code",
  "creator.note": "Un code de notre part ou d'un créateur que vous suivez peut vous donner un essai Pro plus long ou un prix plus bas.",
  "creator.ok": "Code {code} de {name} : votre essai Pro dure {days} jours.",
  "creator.okNoName": "Code {code} appliqué : votre essai Pro dure {days} jours.",
  "creator.pending": "Code {code} enregistré. Nous le vérifierons à votre prochaine connexion.",
  "creator.unknown": "Nous ne connaissons pas le code {code}. Vérifiez l'orthographe et réessayez.",
  "creator.invalid": "Les codes contiennent des lettres, des chiffres et des tirets, comme LIFT-ALEX.",
  "creator.locked": "Votre abonnement utilise déjà le code {code}, il ne peut donc pas changer.",
  "creator.lockedNone": "Un code ne peut être ajouté qu'avant le début d'un essai ou d'un abonnement.",
  "creator.okOffer": "Code {code} appliqué : son prix s'affiche sur les offres.",
  "creator.ended": "Le code {code} n'est plus disponible.",
};

export const de: Partial<Record<Key, Message>> = {
  "creator.title": "Code einlösen",
  "creator.have": "Hast du einen Code?",
  "creator.placeholder": "z. B. LIFT-ALEX",
  "creator.apply": "Einlösen",
  "creator.remove": "Code entfernen",
  "creator.note":
    "Ein Code von uns oder von einem Creator, dem du folgst, kann dir eine längere Pro-Testphase oder einen günstigeren Preis geben.",
  "creator.ok": "Code {code} von {name}: Deine Pro-Testphase dauert {days} Tage.",
  "creator.okNoName": "Code {code} eingelöst: Deine Pro-Testphase dauert {days} Tage.",
  "creator.pending": "Code {code} gespeichert. Wir prüfen ihn, wenn du das nächste Mal online bist.",
  "creator.unknown": "Den Code {code} kennen wir nicht. Prüfe die Schreibweise und versuch es noch einmal.",
  "creator.invalid": "Codes bestehen aus Buchstaben, Ziffern und Bindestrichen, wie LIFT-ALEX.",
  "creator.locked": "Dein Abo nutzt bereits den Code {code}, deshalb lässt er sich nicht ändern.",
  "creator.lockedNone": "Codes lassen sich nur hinzufügen, bevor eine Testphase oder ein Abo beginnt.",
  "creator.okOffer": "Code {code} eingelöst: Sein Preis wird bei den Tarifen angezeigt.",
  "creator.ended": "Der Code {code} ist abgelaufen.",
};

export const it: Partial<Record<Key, Message>> = {
  "creator.title": "Riscatta un codice",
  "creator.have": "Hai un codice?",
  "creator.placeholder": "es. LIFT-ALEX",
  "creator.apply": "Applica",
  "creator.remove": "Rimuovi codice",
  "creator.note": "Un codice nostro o di un creator che segui può darti una prova Pro più lunga o un prezzo più basso.",
  "creator.ok": "Codice {code} di {name}: la tua prova Pro dura {days} giorni.",
  "creator.okNoName": "Codice {code} applicato: la tua prova Pro dura {days} giorni.",
  "creator.pending": "Codice {code} salvato. Lo verificheremo la prossima volta che sei online.",
  "creator.unknown": "Non conosciamo il codice {code}. Controlla come l’hai scritto e riprova.",
  "creator.invalid": "I codici sono lettere, cifre e trattini, come LIFT-ALEX.",
  "creator.locked": "Il tuo abbonamento usa già il codice {code}, quindi non si può cambiare.",
  "creator.lockedNone": "I codici si possono aggiungere solo prima che inizi una prova o un abbonamento.",
  "creator.okOffer": "Codice {code} applicato: il suo prezzo compare nei piani.",
  "creator.ended": "Il codice {code} è scaduto.",
};

export const ja: Partial<Record<Key, Message>> = {
  "creator.title": "コードを使う",
  "creator.have": "コードをお持ちですか？",
  "creator.placeholder": "例：LIFT-ALEX",
  "creator.apply": "適用",
  "creator.remove": "コードを削除",
  "creator.note": "私たちやフォローしているクリエイターのコードで、Pro のお試しが長くなったり、価格が安くなったりします。",
  "creator.ok": "{name}のコード {code}：Pro のお試しは{days}日間です。",
  "creator.okNoName": "コード {code} を適用しました：Pro のお試しは{days}日間です。",
  "creator.pending": "コード {code} を保存しました。次にオンラインになったときに確認します。",
  "creator.unknown": "コード {code} は見つかりません。綴りを確認してもう一度お試しください。",
  "creator.invalid": "コードは英字、数字、ハイフンでできています（例：LIFT-ALEX）。",
  "creator.locked": "サブスクリプションにはすでにコード {code} が使われているため、変更できません。",
  "creator.lockedNone": "コードはお試しやサブスクリプションの開始前にしか追加できません。",
  "creator.okOffer": "コード {code} を適用しました：価格はプランに表示されます。",
  "creator.ended": "コード {code} は終了しました。",
};
