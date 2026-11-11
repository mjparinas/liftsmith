import type { Message } from "@/lib/i18n";

// Text for keys starting "nav.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "nav.main": "Main",
  "nav.back.today": "Today",
  "nav.loading": "Loading",
  "nav.crash.title": "Something went wrong on this screen",
  "nav.crash.body": "Your workout and data are safe. Reload to carry on.",
  "nav.crash.reload": "Reload",
  "nav.crash.details": "Error details",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "nav.main": "Principal",
  "nav.back.today": "Hoy",
  "nav.loading": "Cargando",
  "nav.crash.title": "Algo salió mal en esta pantalla",
  "nav.crash.body": "Tu entrenamiento y tus datos están a salvo. Recarga para seguir.",
  "nav.crash.reload": "Recargar",
  "nav.crash.details": "Detalles del error",
};

export const fr: Partial<Record<Key, Message>> = {
  "nav.main": "Principale",
  "nav.back.today": "Aujourd’hui",
  "nav.loading": "Chargement",
  "nav.crash.title": "Un problème est survenu sur cet écran",
  "nav.crash.body": "Ta séance et tes données sont en sécurité. Recharge pour continuer.",
  "nav.crash.reload": "Recharger",
  "nav.crash.details": "Détails de l’erreur",
};

export const de: Partial<Record<Key, Message>> = {
  "nav.main": "Hauptmenü",
  "nav.back.today": "Heute",
  "nav.loading": "Wird geladen",
  "nav.crash.title": "Auf diesem Bildschirm ist etwas schiefgelaufen",
  "nav.crash.body": "Dein Training und deine Daten sind sicher. Lade neu, um weiterzumachen.",
  "nav.crash.reload": "Neu laden",
  "nav.crash.details": "Fehlerdetails",
};

export const it: Partial<Record<Key, Message>> = {
  "nav.main": "Principale",
  "nav.back.today": "Oggi",
  "nav.loading": "Caricamento",
  "nav.crash.title": "Qualcosa è andato storto in questa schermata",
  "nav.crash.body": "Il tuo allenamento e i tuoi dati sono al sicuro. Ricarica per continuare.",
  "nav.crash.reload": "Ricarica",
  "nav.crash.details": "Dettagli dell’errore",
};

export const ja: Partial<Record<Key, Message>> = {
  "nav.main": "メイン",
  "nav.back.today": "今日",
  "nav.loading": "読み込み中",
  "nav.crash.title": "この画面で問題が発生しました",
  "nav.crash.body": "ワークアウトとデータは安全です。再読み込みして続けてください。",
  "nav.crash.reload": "再読み込み",
  "nav.crash.details": "エラーの詳細",
};
