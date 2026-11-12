import type { Message } from "@/lib/i18n";

// Text for keys starting "push.", in every language: Friends push notifications, written on the server
// (src/server/push.ts reads this file directly, so keep every value a plain string) and the Android channel name.
// English is the source.

export const en = {
  "push.follow": "{name} started following you.",
  "push.request": "{name} asked to follow you.",
  "push.accept": "{name} accepted your follow request.",
  "push.like": "{name} liked your workout.",
  "push.comment": "{name} commented: “{text}”",
  "push.sent": "{name} sent you a workout: {workout}",
  "push.channel": "Friends",
  "push.challenge": "{name} challenged you: {workout}",
  "push.tag": "{name} tagged you as a training partner.",
  "push.mention": "{name} mentioned you: “{text}”",
  "push.reply": "{name} replied: “{text}”",
  "push.cheer": "{name} cheered you on {text}",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "push.follow": "{name} empezó a seguirte.",
  "push.request": "{name} pidió seguirte.",
  "push.accept": "{name} aceptó tu solicitud de seguimiento.",
  "push.like": "A {name} le gustó tu entrenamiento.",
  "push.comment": "{name} comentó: «{text}»",
  "push.sent": "{name} te envió un entrenamiento: {workout}",
  "push.channel": "Amigos",
  "push.challenge": "{name} te retó: {workout}",
  "push.tag": "{name} te etiquetó como compañero de entrenamiento.",
  "push.mention": "{name} te mencionó: «{text}»",
  "push.reply": "{name} respondió: «{text}»",
  "push.cheer": "{name} te anima {text}",
};

export const fr: Partial<Record<Key, Message>> = {
  "push.follow": "{name} a commencé à te suivre.",
  "push.request": "{name} demande à te suivre.",
  "push.accept": "{name} a accepté ta demande d’abonnement.",
  "push.like": "{name} a aimé ta séance.",
  "push.comment": "{name} a commenté : « {text} »",
  "push.sent": "{name} t’a envoyé une séance : {workout}",
  "push.channel": "Amis",
  "push.challenge": "{name} te lance un défi : {workout}",
  "push.tag": "{name} t’a identifié comme partenaire d’entraînement.",
  "push.mention": "{name} vous a mentionné : « {text} »",
  "push.reply": "{name} a répondu : « {text} »",
  "push.cheer": "{name} vous encourage {text}",
};

export const de: Partial<Record<Key, Message>> = {
  "push.follow": "{name} folgt dir jetzt.",
  "push.request": "{name} möchte dir folgen.",
  "push.accept": "{name} hat deine Anfrage angenommen.",
  "push.like": "{name} gefällt dein Workout.",
  "push.comment": "{name} hat kommentiert: „{text}“",
  "push.sent": "{name} hat dir ein Workout geschickt: {workout}",
  "push.channel": "Freunde",
  "push.challenge": "{name} fordert dich heraus: {workout}",
  "push.tag": "{name} hat dich als Trainingspartner markiert.",
  "push.mention": "{name} hat dich erwähnt: „{text}“",
  "push.reply": "{name} hat geantwortet: „{text}“",
  "push.cheer": "{name} feuert dich an {text}",
};

export const it: Partial<Record<Key, Message>> = {
  "push.follow": "{name} ha iniziato a seguirti.",
  "push.request": "{name} ha chiesto di seguirti.",
  "push.accept": "{name} ha accettato la tua richiesta.",
  "push.like": "A {name} piace il tuo allenamento.",
  "push.comment": "{name} ha commentato: «{text}»",
  "push.sent": "{name} ti ha inviato un allenamento: {workout}",
  "push.channel": "Amici",
  "push.challenge": "{name} ti ha sfidato: {workout}",
  "push.tag": "{name} ti ha taggato come compagno di allenamento.",
  "push.mention": "{name} ti ha menzionato: «{text}»",
  "push.reply": "{name} ha risposto: «{text}»",
  "push.cheer": "{name} fa il tifo per te {text}",
};

export const ja: Partial<Record<Key, Message>> = {
  "push.follow": "{name} さんがあなたをフォローしました。",
  "push.request": "{name} さんからフォローリクエストが届きました。",
  "push.accept": "{name} さんがフォローリクエストを承認しました。",
  "push.like": "{name} さんがあなたのワークアウトにいいねしました。",
  "push.comment": "{name} さんがコメントしました：「{text}」",
  "push.sent": "{name} さんからワークアウトが届きました：{workout}",
  "push.channel": "友達",
  "push.challenge": "{name}さんからチャレンジが届きました：{workout}",
  "push.tag": "{name}さんがあなたをトレーニング仲間としてタグ付けしました。",
  "push.mention": "{name}さんがあなたをメンションしました:「{text}」",
  "push.reply": "{name}さんが返信しました:「{text}」",
  "push.cheer": "{name}さんが応援しています {text}",
};
