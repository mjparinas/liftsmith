import type { Message } from "@/lib/i18n";

// Text for keys starting "ghost.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "ghost.level": "level with your ghost",
  "ghost.ahead": "{time} ahead",
  "ghost.behind": "{time} behind",
  "ghost.lastSet": "Last time: {weight} {unit} × {reps}",
  "ghost.lastSetRest": "Last time: {weight} {unit} × {reps} after {rest} rest",
  "ghost.stopped": "Last time you stopped here",
  "ghost.bodyweight": "Bodyweight",
  "ghost.same": "Same as last time ({set})",
  "ghost.last": "Last time {set}",
  "ghost.use": "Use it",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "ghost.level": "a la par con tu fantasma",
  "ghost.ahead": "{time} por delante",
  "ghost.behind": "{time} por detrás",
  "ghost.lastSet": "La última vez: {weight} {unit} × {reps}",
  "ghost.lastSetRest": "La última vez: {weight} {unit} × {reps} tras {rest} de descanso",
  "ghost.stopped": "La última vez paraste aquí",
  "ghost.bodyweight": "Peso corporal",
  "ghost.same": "Igual que la última vez ({set})",
  "ghost.last": "La última vez {set}",
  "ghost.use": "Usarlo",
};

export const fr: Partial<Record<Key, Message>> = {
  "ghost.level": "à égalité avec votre fantôme",
  "ghost.ahead": "{time} d’avance",
  "ghost.behind": "{time} de retard",
  "ghost.lastSet": "La dernière fois : {weight} {unit} × {reps}",
  "ghost.lastSetRest": "La dernière fois : {weight} {unit} × {reps} après {rest} de repos",
  "ghost.stopped": "La dernière fois, vous vous êtes arrêté ici",
  "ghost.bodyweight": "Poids du corps",
  "ghost.same": "Comme la dernière fois ({set})",
  "ghost.last": "La dernière fois {set}",
  "ghost.use": "Reprendre",
};
