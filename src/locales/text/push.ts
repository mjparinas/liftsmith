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
};

export const fr: Partial<Record<Key, Message>> = {
  "push.follow": "{name} a commencé à te suivre.",
  "push.request": "{name} demande à te suivre.",
  "push.accept": "{name} a accepté ta demande d’abonnement.",
  "push.like": "{name} a aimé ta séance.",
  "push.comment": "{name} a commenté : « {text} »",
  "push.sent": "{name} t’a envoyé une séance : {workout}",
  "push.channel": "Amis",
};

export const de: Partial<Record<Key, Message>> = {
  "push.follow": "{name} folgt dir jetzt.",
  "push.request": "{name} möchte dir folgen.",
  "push.accept": "{name} hat deine Anfrage angenommen.",
  "push.like": "{name} gefällt dein Workout.",
  "push.comment": "{name} hat kommentiert: „{text}“",
  "push.sent": "{name} hat dir ein Workout geschickt: {workout}",
  "push.channel": "Freunde",
};

export const it: Partial<Record<Key, Message>> = {
  "push.follow": "{name} ha iniziato a seguirti.",
  "push.request": "{name} ha chiesto di seguirti.",
  "push.accept": "{name} ha accettato la tua richiesta.",
  "push.like": "A {name} piace il tuo allenamento.",
  "push.comment": "{name} ha commentato: «{text}»",
  "push.sent": "{name} ti ha inviato un allenamento: {workout}",
  "push.channel": "Amici",
};

export const ja: Partial<Record<Key, Message>> = {
  "push.follow": "{name} さんがあなたをフォローしました。",
  "push.request": "{name} さんからフォローリクエストが届きました。",
  "push.accept": "{name} さんがフォローリクエストを承認しました。",
  "push.like": "{name} さんがあなたのワークアウトにいいねしました。",
  "push.comment": "{name} さんがコメントしました：「{text}」",
  "push.sent": "{name} さんからワークアウトが届きました：{workout}",
  "push.channel": "友達",
};
